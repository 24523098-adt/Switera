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
  "Pekanbaru",
  "Medan",
  "Palembang",
  "Jambi",
  "Padang",
  "Dumai",
  "Bengkalis",
  "Rokan Hilir",
];
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

const state = {
  userAktif: null,
  daftarAkun: clone(akunSeed),
  roleAktif: roleSeed,
  tema: "dark",
  daftarKota: clone(kotaSeed),
  permintaan: normalizePermintaanList(clone(permintaanSeed)),
  keputusan: clone(keputusanSeed),
  riwayatKeputusan: clone(keputusanSeed),
  notifikasi: clone(notifikasiSeed),
  activityLog: clone(activityLogSeed),
};

const listeners = new Set();

const notify = () => {
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

    state.riwayatKeputusan = state.riwayatKeputusan.map((entry) =>
      entry.id === id ? { ...entry, status: "dibatalkan" } : entry
    );
    state.keputusan = state.keputusan.filter((entry) => entry.id !== id);
    recordActivity(`Membatalkan keputusan distribusi kota ${item?.kota_tujuan ?? id}`);
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
