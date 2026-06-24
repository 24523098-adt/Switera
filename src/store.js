import permintaanSeed from "./data/permintaan.json";
import keputusanSeed from "./data/keputusan.json";
import notifikasiSeed from "./data/notifikasi.json";
import activityLogSeed from "./data/activityLog.json";

const roleSeed = "Admin";
const akunSeed = [
  {
    id: "U001",
    nama: "Budi Santoso",
    username: "manajer",
    password: "manajer123",
    role: "Manajer Distribusi",
  },
  {
    id: "U002",
    nama: "Rina Wati",
    username: "logistik",
    password: "logistik123",
    role: "Tim Logistik",
  },
  {
    id: "U003",
    nama: "Administrator",
    username: "admin",
    password: "admin123",
    role: "Admin",
  },
];
const kotaSeed = [
  { nama: "Pekanbaru", kapasitas: 320 },
  { nama: "Medan", kapasitas: 280 },
  { nama: "Palembang", kapasitas: 220 },
  { nama: "Jambi", kapasitas: 190 },
  { nama: "Padang", kapasitas: 170 },
  { nama: "Dumai", kapasitas: 150 },
  { nama: "Bengkalis", kapasitas: 110 },
  { nama: "Rokan Hilir", kapasitas: 140 },
];
const stokTbsSeed = 150;
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
  const nextNumber =
    items.reduce((maxValue, item) => {
      const numericId = Number(String(item.id).replace(/\D/g, ""));
      return Number.isNaN(numericId) ? maxValue : Math.max(maxValue, numericId);
    }, 0) + 1;

  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
};

const STORAGE_KEY = "switera_state_v1";

const loadPersisted = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persisted = loadPersisted();

const isLegacyDaftarKota = (value) =>
  !Array.isArray(value) || value.some((item) => typeof item === "string");

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
  userAktif: persisted?.userAktif ?? null,
  daftarAkun: persisted?.daftarAkun ?? clone(akunSeed),
  roleAktif: persisted?.roleAktif ?? roleSeed,
  tema: persisted?.tema ?? getSystemPreferredTema(),
  daftarKota: isLegacyDaftarKota(persisted?.daftarKota) ? clone(kotaSeed) : persisted.daftarKota,
  stokTbs: typeof persisted?.stokTbs === "number" ? persisted.stokTbs : stokTbsSeed,
  permintaan: persisted?.permintaan ?? normalizePermintaanList(clone(permintaanSeed)),
  keputusan: persisted?.keputusan ?? clone(keputusanSeed),
  riwayatKeputusan: persisted?.riwayatKeputusan ?? clone(keputusanSeed),
  notifikasi: persisted?.notifikasi ?? clone(notifikasiSeed),
  activityLog: persisted?.activityLog ?? clone(activityLogSeed),
};

const persistState = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    state.userAktif = user ? clone(user) : null;
    if (user?.role) {
      state.roleAktif = user.role;
    }
    if (state.userAktif) {
      pushActivity(state.userAktif.nama, state.userAktif.role, "Login ke sistem");
    }
    notify();
    return store.getUserAktif();
  },

  getDaftarAkun() {
    return clone(state.daftarAkun);
  },

  tambahAkun(akun) {
    const akunBaru = clone(akun);
    state.daftarAkun = [...state.daftarAkun, akunBaru];
    notify();
    return clone(akunBaru);
  },

  getNextAkunId() {
    return getNextId(state.daftarAkun, "U");
  },

  cariAkun(username, password, role) {
    const normalizedUsername = String(username).trim();
    const akunDitemukan = state.daftarAkun.find(
      (akun) =>
        akun.username === normalizedUsername &&
        akun.password === password &&
        akun.role === role
    );

    return akunDitemukan ? clone(akunDitemukan) : null;
  },

  logout() {
    const userSebelum = state.userAktif;
    state.userAktif = null;
    if (userSebelum) {
      pushActivity(userSebelum.nama, userSebelum.role, "Logout dari sistem");
    }
    notify();
    return store.getState();
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

  reset() {
    state.permintaan = normalizePermintaanList(clone(permintaanSeed));
    state.keputusan = clone(keputusanSeed);
    state.riwayatKeputusan = clone(keputusanSeed);
    state.notifikasi = clone(notifikasiSeed);
    state.activityLog = clone(activityLogSeed);
    notify();
    return store.getState();
  },
};

export default store;
