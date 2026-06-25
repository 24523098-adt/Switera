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
  // Optional read-only caches for the server-side ranking/KPI engine
  // (distribusiService.js, Phase 8 LOGIC-01). AnalisisRanking/Laporan/
  // Dashboard keep computing ranking client-side from the hydrated
  // permintaan/kota/stok cache via src/utils/distribusi.js (09-05 decision:
  // switching them onto these endpoints risks altering displayed numbers,
  // out of scope for a no-visual-change phase) — these fields exist for
  // optional future use only.
  rekomendasi: [],
  kpi: null,
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

  // Bootstrap hydration entry point (introduced as a no-op stub in 09-01,
  // completed here): App.jsx calls this on login / session-restore so
  // every page renders server data with no manual refresh (T-09-H-401: a
  // no-op without a token, since every apiFetch below would otherwise 401
  // and trip the unauthorized handler mid-bootstrap for no reason).
  async hydrate() {
    if (!getToken()) {
      return;
    }

    await Promise.all([
      store.loadKota(),
      store.loadStok(),
      store.loadPermintaan(),
      store.loadKeputusan(),
      store.loadRiwayatKeputusan(),
      store.loadNotifikasi(),
      store.loadActivityLog(),
    ]);
    notify();
  },

  getPermintaan() {
    return clone(state.permintaan);
  },

  // Bootstrap loader (called on InputData/ManajemenData mount; 09-05 will
  // also call this from store.hydrate()).
  async loadPermintaan() {
    const resp = await apiFetch("/permintaan");
    state.permintaan = normalizePermintaanList(resp);
    notify();
    return clone(state.permintaan);
  },

  // SYNCHRONOUS cache reads (Phase 9 hydrated-cache pattern) — unchanged
  // signatures so ManajemenKota's snapshot.daftarKota / snapshot.stokTbs
  // reads keep working with zero page change. Populated by loadKota() /
  // loadStok() below and by each mutator's server response.
  getDaftarKota() {
    return clone(state.daftarKota);
  },

  getKapasitasKota(namaKota) {
    return state.daftarKota.find((kota) => kota.nama === namaKota)?.kapasitas ?? null;
  },

  // Bootstrap loaders (called on ManajemenKota mount; 09-05 will also call
  // these from store.hydrate()).
  async loadKota() {
    const resp = await apiFetch("/kota");
    state.daftarKota = resp;
    notify();
    return clone(state.daftarKota);
  },

  async loadStok() {
    const resp = await apiFetch("/stok-tbs");
    state.stokTbs = resp.stokTbs;
    notify();
    return state.stokTbs;
  },

  async getKotaReferenceCounts(nama) {
    return apiFetch(`/kota/${encodeURIComponent(nama)}/references`);
  },

  async tambahKota({ nama, kapasitas }) {
    return runMutation(async () => {
      const resp = await apiFetch("/kota", {
        method: "POST",
        body: { nama, kapasitas: Number(kapasitas) || 0 },
      });
      state.daftarKota = resp;
      notify();
      return clone(state.daftarKota);
    });
  },

  async updateKota(namaLama, { nama, kapasitas }) {
    return runMutation(async () => {
      const resp = await apiFetch(`/kota/${encodeURIComponent(namaLama)}`, {
        method: "PUT",
        body: { nama: nama.trim(), kapasitas: Number(kapasitas) || 0 },
      });
      state.daftarKota = resp;
      notify();
      return clone(state.daftarKota);
    });
  },

  async hapusKota(nama) {
    return runMutation(async () => {
      const resp = await apiFetch(`/kota/${encodeURIComponent(nama)}`, {
        method: "DELETE",
      });
      state.daftarKota = resp;
      notify();
      return clone(state.daftarKota);
    });
  },

  getStokTbs() {
    return state.stokTbs;
  },

  async setStokTbs(value) {
    return runMutation(async () => {
      const resp = await apiFetch("/stok-tbs", {
        method: "PUT",
        body: { stokTbs: Number(value) || 0 },
      });
      state.stokTbs = resp.stokTbs;
      notify();
      return state.stokTbs;
    });
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

  async hasPermintaanDuplikat({ kota, tanggalPermintaan, excludeId }) {
    let qs = `?kota=${encodeURIComponent(kota)}&tanggal_permintaan=${encodeURIComponent(tanggalPermintaan)}`;
    if (excludeId) {
      qs += `&excludeId=${encodeURIComponent(excludeId)}`;
    }
    const resp = await apiFetch(`/permintaan/duplikat${qs}`);
    return resp.duplikat;
  },

  // Server owns the notification + anomaly-notification + activity-log side
  // effects for this mutation (permintaanService.addPermintaan, LOGIC-03) —
  // do NOT duplicate pushNotifikasi/recordActivity here.
  async addPermintaan(entry) {
    return runMutation(async () => {
      const resp = await apiFetch("/permintaan", {
        method: "POST",
        body: {
          kota: entry.kota,
          tanggal_permintaan: entry.tanggal_permintaan ?? entry.tanggal_input,
          tanggal_input: entry.tanggal_input ?? entry.tanggal_permintaan,
          jumlah_permintaan: Number(entry.jumlah_permintaan),
          keterangan: entry.keterangan,
        },
      });
      state.permintaan = normalizePermintaanList([...state.permintaan, resp]);
      notify();
      return clone(resp);
    });
  },

  async updatePermintaan(id, updates) {
    return runMutation(async () => {
      const resp = await apiFetch(`/permintaan/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: updates,
      });
      state.permintaan = normalizePermintaanList(
        state.permintaan.map((item) => (item.id === id ? resp : item))
      );
      notify();
      return clone(resp);
    });
  },

  async removePermintaan(id) {
    return runMutation(async () => {
      await apiFetch(`/permintaan/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      state.permintaan = state.permintaan.filter((entry) => entry.id !== id);
      notify();
      return clone(state.permintaan);
    });
  },

  // SYNCHRONOUS cache reads (Phase 9 hydrated-cache pattern) — unchanged
  // signatures so KeputusanDistribusi/StatusDistribusi/Dashboard's
  // snapshot.keputusan / snapshot.riwayatKeputusan reads, and Dashboard's
  // sync store.getKeputusan() handler call, keep working with zero page
  // change. Populated by loadKeputusan()/loadRiwayatKeputusan() below and by
  // each mutator's server response.
  getKeputusan() {
    return clone(state.keputusan);
  },

  getRiwayatKeputusan() {
    return clone(state.riwayatKeputusan);
  },

  // Bootstrap loaders (called on KeputusanDistribusi/StatusDistribusi/
  // Dashboard mount; 09-05 will also call these from store.hydrate()).
  async loadKeputusan() {
    const resp = await apiFetch("/keputusan");
    state.keputusan = resp;
    notify();
    return clone(state.keputusan);
  },

  async loadRiwayatKeputusan() {
    const resp = await apiFetch("/riwayat-keputusan");
    state.riwayatKeputusan = resp;
    notify();
    return clone(state.riwayatKeputusan);
  },

  // Optional read-only loaders for the server-side ranking/KPI engine
  // (distribusiService.js, Phase 8 LOGIC-01) — exposed for future use, NOT
  // wired into AnalisisRanking/Laporan/Dashboard in this plan (see the
  // `rekomendasi`/`kpi` cache-field comment above for the rationale).
  async loadRekomendasi() {
    const resp = await apiFetch("/rekomendasi-distribusi");
    state.rekomendasi = resp;
    notify();
    return clone(state.rekomendasi);
  },

  async loadKpi() {
    const resp = await apiFetch("/kpi");
    state.kpi = resp;
    notify();
    return clone(state.kpi);
  },

  // Server owns the notification + activity-log side effects for this
  // mutation (keputusanService.addKeputusan, LOGIC-03) — do NOT duplicate
  // pushNotifikasi/recordActivity here. POST /keputusan returns the single
  // created row (not a full list, unlike kota's POST/PUT/DELETE) — mirrors
  // permintaan's addPermintaan response shape (09-03), confirmed against
  // keputusanService.js's toApi(created) return.
  async addKeputusan(entry) {
    return runMutation(async () => {
      const resp = await apiFetch("/keputusan", {
        method: "POST",
        body: {
          kota_tujuan: entry.kota_tujuan,
          volume_tbs: Number(entry.volume_tbs),
          tanggal_keputusan: entry.tanggal_keputusan,
          diputuskan_oleh: entry.diputuskan_oleh,
          status: entry.status,
        },
      });
      state.keputusan = [...state.keputusan, resp];
      state.riwayatKeputusan = [...state.riwayatKeputusan, resp];
      notify();
      return clone(resp);
    });
  },

  // CRITICAL (LOGIC-02): the cache is ONLY written from the server's
  // confirmed response below — never optimistically before the await
  // resolves. On a 409 optimistic-lock conflict, apiFetch throws BEFORE
  // this function reaches the `state.keputusan = ...` line, so the losing
  // concurrent request's cache is left untouched and runMutation's catch
  // Toasts the server's Indonesian conflict message + re-throws for the
  // page to keep its modal open. A false success can never reach the UI.
  async updateKeputusan(id, updates) {
    return runMutation(async () => {
      const resp = await apiFetch(`/keputusan/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: updates,
      });
      state.keputusan = state.keputusan.map((item) => (item.id === id ? resp : item));
      state.riwayatKeputusan = state.riwayatKeputusan.map((item) =>
        item.id === id ? resp : item
      );
      notify();
      return clone(resp);
    });
  },

  // DELETE /keputusan/:id returns the single cancelled row (confirmed
  // against keputusanService.removeKeputusan's toApi(existing) return —
  // NOT a full list, unlike kota's DELETE). The server marks the matching
  // RiwayatKeputusan row "dibatalkan" server-side; refresh riwayat from the
  // server rather than guessing the shape client-side (T-09-D-STALE).
  async removeKeputusan(id) {
    return runMutation(async () => {
      await apiFetch(`/keputusan/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      state.keputusan = state.keputusan.filter((item) => item.id !== id);
      await store.loadRiwayatKeputusan();
      notify();
      return clone(state.keputusan);
    });
  },

  // POST /keputusan/:id/restore returns the single recreated row (confirmed
  // against keputusanService.restoreKeputusan's toApi(created) return —
  // NOT a full list). Body MUST include item.id matching the path, or the
  // route 400s. Refresh riwayat from the server afterward (T-09-D-STALE).
  async restoreKeputusan(item) {
    return runMutation(async () => {
      const resp = await apiFetch(`/keputusan/${encodeURIComponent(item.id)}/restore`, {
        method: "POST",
        body: item,
      });
      state.keputusan = [...state.keputusan, resp];
      await store.loadRiwayatKeputusan();
      notify();
      return clone(resp);
    });
  },

  // SYNCHRONOUS cache read (Phase 9 hydrated-cache pattern) — unchanged
  // signature so Layout.jsx's snapshot.notifikasi read keeps working with
  // zero page change. Populated by loadNotifikasi() below and by
  // tandaiDibaca/tandaiSemuaDibaca's server response.
  getNotifikasi() {
    return clone(state.notifikasi);
  },

  // Bootstrap loader (called from store.hydrate(); also self-loaded by
  // Layout.jsx's mount effect since Layout is always mounted for
  // authenticated pages).
  async loadNotifikasi() {
    const resp = await apiFetch("/notifikasi");
    state.notifikasi = resp;
    notify();
    return clone(state.notifikasi);
  },

  // No POST /notifikasi route exists server-side (notifikasiRoutes.js) —
  // notifications are an internal side effect of permintaan/keputusan
  // mutations (LOGIC-03), never a client-fabricated entry. Kept as a loud
  // shim so any missed caller fails instead of silently no-op'ing or
  // writing to a cache the server will just overwrite on the next load.
  tambahNotifikasi() {
    throw new Error(
      "store.tambahNotifikasi() tidak lagi tersedia — notifikasi dibuat oleh server sebagai efek samping mutasi, bukan oleh klien."
    );
  },

  // PUT /notifikasi/:id/baca returns the SINGLE updated row (confirmed
  // against notifikasiService.tandaiDibaca's prisma.notifikasi.update(...)
  // return — NOT a full list, unlike tandaiSemuaDibaca below which DOES
  // return the full refreshed list via getNotifikasi()). Merge the single
  // row into the existing cache rather than assigning resp to state.notifikasi.
  async tandaiDibaca(id) {
    return runMutation(async () => {
      const resp = await apiFetch(`/notifikasi/${encodeURIComponent(id)}/baca`, {
        method: "PUT",
      });
      state.notifikasi = state.notifikasi.map((item) => (item.id === id ? resp : item));
      notify();
      return clone(state.notifikasi);
    });
  },

  async tandaiSemuaDibaca() {
    return runMutation(async () => {
      const resp = await apiFetch("/notifikasi/baca-semua", {
        method: "PUT",
      });
      state.notifikasi = resp;
      notify();
      return clone(state.notifikasi);
    });
  },

  // SYNCHRONOUS cache read (Phase 9 hydrated-cache pattern) — unchanged
  // signature so RiwayatAktivitas.jsx's snapshot.activityLog read keeps
  // working with zero page change. Populated by loadActivityLog() below.
  getActivityLog() {
    return clone(state.activityLog);
  },

  // Bootstrap loader (called from store.hydrate() and RiwayatAktivitas.jsx's
  // mount effect). GET /activity-log is Admin-only server-side
  // (activityLogRoutes.js: requireRole("Admin")) — a non-Admin session
  // (e.g. during the global hydrate() bootstrap) gets a 403, which this
  // loader swallows quietly into an empty list rather than Toasting an
  // error, since the non-Admin user was never going to see this page
  // anyway (T-09-L-RBAC). Any OTHER error still goes through the normal
  // error path.
  async loadActivityLog() {
    try {
      const resp = await apiFetch("/activity-log");
      state.activityLog = resp;
      notify();
      return clone(state.activityLog);
    } catch (error) {
      if (error.status === 403 || /tidak memiliki izin/i.test(error.message ?? "")) {
        state.activityLog = [];
        notify();
        return clone(state.activityLog);
      }
      throw error;
    }
  },

  // No POST /activity-log route exists server-side (activityLogRoutes.js) —
  // activity-log entries are an internal side effect of permintaan/
  // keputusan/kota/stok mutations (LOGIC-03), never a client-fabricated
  // entry. Kept as a loud shim so any missed caller fails instead of
  // silently no-op'ing.
  catatAktivitas() {
    throw new Error(
      "store.catatAktivitas() tidak lagi tersedia — riwayat aktivitas dicatat oleh server sebagai efek samping mutasi, bukan oleh klien."
    );
  },

  // v1.0's "reset demo data" reset the client-side seed collections back to
  // their JSON defaults. The server is now the source of truth for all
  // domain data (Phase 9) — there is no client-side seed to reset to, so
  // this is repurposed as a "reload from server" affordance: it simply
  // re-runs the same hydrate() bootstrap, discarding nothing server-side
  // and pulling the current authoritative state back into the cache.
  async reset() {
    await store.hydrate();
  },
};

export default store;
