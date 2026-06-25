import {
  apiFetch,
  getToken,
  setToken,
  clearToken,
  setUnauthorizedHandler,
  subscribeLoading,
  isLoading,
} from "./api/apiClient";
import { showToast } from "./components/Toast";

const roleSeed = "Admin";
const statusLabelMap = {
  menunggu: "Menunggu",
  "dalam-pengiriman": "Dalam Pengiriman",
  selesai: "Selesai",
};
const clone = (value) => JSON.parse(JSON.stringify(value));
const normalizePermintaanEntry = (entry) => ({
  ...entry,
  tanggal_permintaan: entry.tanggal_permintaan ?? entry.tanggal_input ?? "",
  tanggal_input: entry.tanggal_input ?? entry.tanggal_permintaan ?? "",
});
const normalizePermintaanList = (items) => items.map(normalizePermintaanEntry);
const getNextId = (items, prefix) => {
  const existingIds = new Set(items.map((item) => String(item.id)));
  let nextNumber =
    items.reduce((maxValue, item) => {
      const numericId = Number(String(item.id).replace(/\D/g, ""));
      return Number.isNaN(numericId) ? maxValue : Math.max(maxValue, numericId);
    }, 0) + 1;

  let candidate = `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  while (existingIds.has(candidate)) {
    nextNumber += 1;
    candidate = `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  }

  return candidate;
};

// switera_session_v2 replaces the old switera_state_v1 domain blob: the
// server is now the source of truth for all DOMAIN collections (Phase 9
// hydrated in-memory cache decision). Only the session (active user) and
// the tema UI preference — never a backend concern — are persisted here.
const SESSION_STORAGE_KEY = "switera_session_v2";

const loadPersistedSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistedSession = loadPersistedSession();

const getSystemPreferredTema = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }

  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
};

const state = {
  userAktif: persistedSession?.userAktif ?? null,
  roleAktif: persistedSession?.userAktif?.role ?? roleSeed,
  tema: persistedSession?.tema ?? getSystemPreferredTema(),
  isLoading: false,
  lastError: null,
  // DOMAIN collections are no longer seeded client-side — the server is the
  // source of truth. They start empty and are filled by store.hydrate()
  // (introduced here, fully wired in 09-05) and by each domain's own
  // mutators (09-02..09-05) writing the server's authoritative response.
  daftarKota: [],
  stokTbs: 0,
  permintaan: [],
  keputusan: [],
  riwayatKeputusan: [],
  notifikasi: [],
  activityLog: [],
};

const persistState = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ userAktif: state.userAktif, tema: state.tema })
    );
  } catch {
    // localStorage unavailable (private mode/quota) — continue without persistence
  }
};

const listeners = new Set();

const notify = () => {
  persistState();
  const snapshot = store.getState();
  listeners.forEach((listener) => listener(snapshot));
};

// Any in-flight apiFetch call updates the exposed isLoading boolean through
// the EXISTING subscribe/notify contract — no new wiring required on any
// page (FE-02 loading/error UX decision).
subscribeLoading(() => {
  state.isLoading = isLoading();
  notify();
});

// A 401 from ANY request clears the session and forces re-login. App.jsx's
// existing `!snapshot.userAktif` effect already redirects to /login — no
// App.jsx change needed (T-09-401).
setUnauthorizedHandler(() => {
  state.userAktif = null;
  try {
    window.localStorage.removeItem("switera_user");
  } catch {
    // localStorage unavailable (private mode/quota) — continue without persistence
  }
  clearToken();
  notify();
});

// Shared error-to-UX path for auth/domain mutators (FE-02): catches a
// thrown apiFetch error, records it on the cache, surfaces a Toast, then
// re-throws so the calling page's existing try/catch can still map
// field-level errors exactly as in v1.0.
const runMutation = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    state.lastError = error.message;
    showToast({ type: "error", message: error.message });
    notify();
    throw error;
  }
};

const updateCollection = (key, updater) => {
  const nextValue = updater(clone(state[key]));
  state[key] =
    key === "permintaan" ? normalizePermintaanList(nextValue) : nextValue;
  notify();
  return clone(state[key]);
};

const updateValue = (key, value) => {
  state[key] = value;
  notify();
  return clone(state[key]);
};

const pushNotifikasi = (notif) => {
  const notifikasiBaru = {
    id: notif.id ?? getNextId(state.notifikasi, "NTF"),
    judul: notif.judul,
    pesan: notif.pesan,
    tipe: notif.tipe ?? "info",
    dibaca: notif.dibaca ?? false,
    waktu: notif.waktu ?? new Date().toISOString(),
  };

  state.notifikasi = [notifikasiBaru, ...state.notifikasi];
  return notifikasiBaru;
};

const pushActivity = (aktor, role, aksi) => {
  const activityBaru = {
    id: getNextId(state.activityLog, "LOG"),
    aktor,
    role,
    aksi,
    waktu: new Date().toISOString(),
  };

  state.activityLog = [activityBaru, ...state.activityLog];
  return activityBaru;
};

const recordActivity = (aksi) => {
  const aktor = state.userAktif?.nama ?? "Tidak diketahui";
  const role = state.userAktif?.role ?? state.roleAktif;
  return pushActivity(aktor, role, aksi);
};

export const store = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getState() {
    return clone(state);
  },

  getUserAktif() {
    return state.userAktif ? clone(state.userAktif) : null;
  },

  setUserAktif(user) {
    // Server-side login activity logging is the backend's job now
    // (Phase 8 LOGIC-03 scope is domain mutations, not auth) — no
    // client-side pushActivity here, to avoid fabricating a duplicate or
    // out-of-band activity-log entry.
    state.userAktif = user ? clone(user) : null;
    if (user?.role) {
      state.roleAktif = user.role;
    }
    notify();
    return store.getUserAktif();
  },

  async login(username, password) {
    return runMutation(async () => {
      const resp = await apiFetch("/auth/login", {
        method: "POST",
        body: { username, password },
        auth: false,
      });
      setToken(resp.token);
      store.setUserAktif(resp.user);
      return store.getUserAktif();
    });
  },

  async register({ nama, username, password, role }) {
    return runMutation(async () => {
      const resp = await apiFetch("/auth/register", {
        method: "POST",
        body: { nama, username, password, role },
        auth: false,
      });
      return resp.user;
    });
  },

  // Deprecated: login now goes through store.login() against the real
  // server (Phase 9). cariAkun's plaintext in-memory match is gone — this
  // shim exists so any missed caller fails loudly instead of silently
  // matching against an empty/stale client-side account list.
  cariAkun() {
    throw new Error(
      "store.cariAkun() tidak lagi tersedia — gunakan store.login(username, password)."
    );
  },

  // Deprecated: registration now goes through store.register() against the
  // real server, which also owns id generation. Kept as a loud shim so any
  // missed caller fails instead of silently no-op'ing.
  tambahAkun() {
    throw new Error(
      "store.tambahAkun() tidak lagi tersedia — gunakan store.register({ nama, username, password, role })."
    );
  },

  getNextAkunId() {
    throw new Error(
      "store.getNextAkunId() tidak lagi tersedia — id akun kini dibuat oleh server."
    );
  },

  logout() {
    clearToken();
    try {
      window.localStorage.removeItem("switera_user");
    } catch {
      // localStorage unavailable (private mode/quota) — continue without persistence
    }
    state.userAktif = null;
    notify();
    return store.getState();
  },

  // Bootstrap hydration entry point (introduced here, fully wired in
  // 09-05): once reads are synchronous against the cache, the cache must
  // be filled from the server before/at the moment an authenticated page
  // renders. 09-01 only introduces the symbol so App.jsx wiring + later
  // plans' collection fetches have a stable hook to extend; it
  // intentionally fetches nothing yet beyond what 09-02..09-05 add.
  async hydrate() {
    notify();
  },

  getPermintaan() {
    return clone(state.permintaan);
  },

  getDaftarKota() {
    return clone(state.daftarKota);
  },

  getKapasitasKota(namaKota) {
    return state.daftarKota.find((kota) => kota.nama === namaKota)?.kapasitas ?? null;
  },

  getKotaReferenceCounts(nama) {
    const permintaanCount = state.permintaan.filter((item) => item.kota === nama).length;
    const keputusanCount = state.keputusan.filter((item) => item.kota_tujuan === nama).length;
    return { permintaanCount, keputusanCount };
  },

  tambahKota({ nama, kapasitas }) {
    if (state.daftarKota.some((kota) => kota.nama === nama)) {
      throw new Error("Kota dengan nama tersebut sudah ada.");
    }

    state.daftarKota = [...state.daftarKota, { nama, kapasitas: Number(kapasitas) || 0 }];
    recordActivity(`Menambahkan kota ${nama} ke daftar kota`);
    notify();
    return clone(state.daftarKota);
  },

  updateKota(namaLama, { nama, kapasitas }) {
    const namaBaru = nama.trim();

    if (
      namaBaru !== namaLama &&
      state.daftarKota.some((kota) => kota.nama === namaBaru)
    ) {
      throw new Error("Kota dengan nama tersebut sudah ada.");
    }

    state.daftarKota = state.daftarKota.map((kota) =>
      kota.nama === namaLama ? { nama: namaBaru, kapasitas: Number(kapasitas) || 0 } : kota
    );

    if (namaBaru !== namaLama) {
      state.permintaan = state.permintaan.map((item) =>
        item.kota === namaLama ? { ...item, kota: namaBaru } : item
      );
      state.keputusan = state.keputusan.map((item) =>
        item.kota_tujuan === namaLama ? { ...item, kota_tujuan: namaBaru } : item
      );
      state.riwayatKeputusan = state.riwayatKeputusan.map((item) =>
        item.kota_tujuan === namaLama ? { ...item, kota_tujuan: namaBaru } : item
      );
    }

    recordActivity(`Memperbarui data kota ${namaLama}`);
    notify();
    return clone(state.daftarKota);
  },

  hapusKota(nama) {
    const { permintaanCount, keputusanCount } = store.getKotaReferenceCounts(nama);

    if (permintaanCount > 0 || keputusanCount > 0) {
      throw new Error(
        `Kota ${nama} tidak bisa dihapus karena masih digunakan oleh ${permintaanCount} permintaan dan ${keputusanCount} keputusan distribusi.`
      );
    }

    state.daftarKota = state.daftarKota.filter((kota) => kota.nama !== nama);
    recordActivity(`Menghapus kota ${nama} dari daftar kota`);
    notify();
    return clone(state.daftarKota);
  },

  getStokTbs() {
    return state.stokTbs;
  },

  setStokTbs(value) {
    const numericValue = Number(value) || 0;
    state.stokTbs = numericValue;
    recordActivity(`Memperbarui stok TBS tersedia menjadi ${numericValue} ton`);
    notify();
    return state.stokTbs;
  },

  getRoleAktif() {
    return state.roleAktif;
  },

  setRoleAktif(role) {
    return updateValue("roleAktif", role);
  },

  getTema() {
    return state.tema;
  },

  setTema(tema) {
    return updateValue("tema", tema);
  },

  toggleTema() {
    return updateValue("tema", state.tema === "dark" ? "light" : "dark");
  },

  hasPermintaanDuplikat({ kota, tanggalPermintaan, excludeId }) {
    return state.permintaan.some(
      (item) =>
        item.kota === kota &&
        item.tanggal_permintaan === tanggalPermintaan &&
        item.id !== excludeId
    );
  },

  addPermintaan(entry) {
    const riwayatSebelumnya = state.permintaan.filter((item) => item.kota === entry.kota);

    const hasil = updateCollection("permintaan", (items) => [
      ...items,
      {
        ...clone(entry),
        id: entry.id ?? getNextId(items, "PMT"),
      },
    ]);

    pushNotifikasi({
      judul: "Data permintaan baru",
      pesan: `Data permintaan ${entry.jumlah_permintaan} ton untuk kota ${entry.kota} berhasil ditambahkan.`,
      tipe: "info",
    });

    if (riwayatSebelumnya.length > 0) {
      const rataRataSebelumnya =
        riwayatSebelumnya.reduce((total, item) => total + (Number(item.jumlah_permintaan) || 0), 0) /
        riwayatSebelumnya.length;
      const nilaiBaru = Number(entry.jumlah_permintaan) || 0;
      const batasAnomali = rataRataSebelumnya * 1.5;

      if (rataRataSebelumnya > 0 && nilaiBaru > batasAnomali) {
        pushNotifikasi({
          judul: "Anomali permintaan terdeteksi",
          pesan: `Permintaan kota ${entry.kota} (${nilaiBaru} ton) melebihi rata-rata historisnya (${Math.round(rataRataSebelumnya)} ton) lebih dari 50%.`,
          tipe: "warning",
        });
      }
    }

    recordActivity(`Menambahkan data permintaan kota ${entry.kota}`);
    notify();

    return hasil;
  },

  updatePermintaan(id, updates) {
    const hasil = updateCollection("permintaan", (items) =>
      items.map((item) =>
        item.id === id ? { ...item, ...clone(updates) } : item
      )
    );

    recordActivity(`Mengubah data permintaan kota ${updates.kota ?? id}`);
    notify();

    return hasil;
  },

  removePermintaan(id) {
    const item = state.permintaan.find((entry) => entry.id === id);
    const hasil = updateCollection("permintaan", (items) =>
      items.filter((entry) => entry.id !== id)
    );

    recordActivity(`Menghapus data permintaan kota ${item?.kota ?? id}`);
    notify();

    return hasil;
  },

  getKeputusan() {
    return clone(state.keputusan);
  },

  getRiwayatKeputusan() {
    return clone(state.riwayatKeputusan);
  },

  addKeputusan(entry) {
    const keputusanBaru = {
      ...clone(entry),
      id: entry.id ?? getNextId(state.riwayatKeputusan, "KPT"),
      [`waktu_${entry.status ?? "menunggu"}`]: new Date().toISOString(),
    };

    state.keputusan = [...state.keputusan, keputusanBaru];
    state.riwayatKeputusan = [...state.riwayatKeputusan, keputusanBaru];
    pushNotifikasi({
      judul: "Keputusan distribusi baru",
      pesan: `Keputusan distribusi baru tersedia untuk kota ${keputusanBaru.kota_tujuan}.`,
      tipe: "info",
    });
    recordActivity(`Menyimpan keputusan distribusi kota ${keputusanBaru.kota_tujuan}`);
    notify();
    return clone(keputusanBaru);
  },

  updateKeputusan(id, updates) {
    const normalizedUpdates = clone(updates);
    const existing = state.keputusan.find((item) => item.id === id);
    const statusBerubah =
      Object.prototype.hasOwnProperty.call(normalizedUpdates, "status") &&
      existing &&
      existing.status !== normalizedUpdates.status;

    if (statusBerubah) {
      normalizedUpdates[`waktu_${normalizedUpdates.status}`] = new Date().toISOString();
    }

    state.keputusan = state.keputusan.map((item) =>
      item.id === id ? { ...item, ...normalizedUpdates } : item
    );
    state.riwayatKeputusan = state.riwayatKeputusan.map((item) =>
      item.id === id ? { ...item, ...normalizedUpdates } : item
    );

    if (statusBerubah) {
      const labelStatus =
        statusLabelMap[normalizedUpdates.status] ?? normalizedUpdates.status;

      pushNotifikasi({
        judul: "Status distribusi diperbarui",
        pesan: `Status distribusi ke ${existing.kota_tujuan} telah diperbarui menjadi ${labelStatus}.`,
        tipe: "success",
      });
      recordActivity(
        `Memperbarui status distribusi kota ${existing.kota_tujuan} menjadi ${labelStatus}`
      );
    }

    notify();
    return clone(state.keputusan);
  },

  removeKeputusan(id) {
    const item = state.keputusan.find((entry) => entry.id === id);
    const waktuDibatalkan = new Date().toISOString();

    state.riwayatKeputusan = state.riwayatKeputusan.map((entry) =>
      entry.id === id ? { ...entry, status: "dibatalkan", waktu_dibatalkan: waktuDibatalkan } : entry
    );
    state.keputusan = state.keputusan.filter((entry) => entry.id !== id);
    recordActivity(`Membatalkan keputusan distribusi kota ${item?.kota_tujuan ?? id}`);
    notify();
    return clone(state.keputusan);
  },

  restoreKeputusan(item) {
    state.keputusan = [...state.keputusan, clone(item)];
    state.riwayatKeputusan = state.riwayatKeputusan.map((entry) =>
      entry.id === item.id ? clone(item) : entry
    );
    recordActivity(`Mengembalikan keputusan distribusi kota ${item.kota_tujuan}`);
    notify();
    return clone(state.keputusan);
  },

  getNotifikasi() {
    return clone(state.notifikasi);
  },

  tambahNotifikasi(notif) {
    const notifikasiBaru = pushNotifikasi(notif);
    notify();
    return clone(notifikasiBaru);
  },

  tandaiDibaca(id) {
    state.notifikasi = state.notifikasi.map((item) =>
      item.id === id ? { ...item, dibaca: true } : item
    );
    notify();
    return clone(state.notifikasi);
  },

  tandaiSemuaDibaca() {
    state.notifikasi = state.notifikasi.map((item) => ({
      ...item,
      dibaca: true,
    }));
    notify();
    return clone(state.notifikasi);
  },

  getActivityLog() {
    return clone(state.activityLog);
  },

  catatAktivitas(aktor, role, aksi) {
    const activityBaru = pushActivity(aktor, role, aksi);
    notify();
    return clone(activityBaru);
  },

  // Deprecated: v1.0's "reset demo data" reset the client-side seed
  // collections back to their JSON defaults. The server is now the source
  // of truth for all domain data (Phase 9), so there is no client-side seed
  // to reset to — this shim fails loudly rather than silently no-op'ing.
  // Out of scope for 09-01 (auth-only plan) to redesign Layout.jsx's reset
  // affordance; tracked for a later domain plan to either wire a real
  // server-side reset endpoint or remove the UI control.
  reset() {
    throw new Error(
      "store.reset() tidak lagi tersedia — data kini bersumber dari server, tidak ada seed klien untuk direset."
    );
  },
};

export default store;
