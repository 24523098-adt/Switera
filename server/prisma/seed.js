import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const readJson = (relativePath) =>
  JSON.parse(readFileSync(path.join(__dirname, relativePath), "utf-8"));

const permintaanSeed = readJson("data/permintaan.json");
const keputusanSeed = readJson("data/keputusan.json");
const notifikasiSeed = readJson("data/notifikasi.json");
const activityLogSeed = readJson("data/activityLog.json");

// Inline seed constants, sourced from src/store.js lines 7-39 (not separate
// JSON files in the frontend — replicated here verbatim).
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

const prisma = new PrismaClient();

// cost factor 10: standard bcryptjs default, sufficient for school-project scale
const BCRYPT_COST_FACTOR = 10;

async function seedKota() {
  for (const kota of kotaSeed) {
    await prisma.kota.upsert({
      where: { nama: kota.nama },
      update: { kapasitas: kota.kapasitas },
      create: { nama: kota.nama, kapasitas: kota.kapasitas },
    });
  }
  console.log(`Seeded Kota: ${kotaSeed.length} rows`);
}

async function seedAkun() {
  for (const akun of akunSeed) {
    // Hash BEFORE any prisma.akun.create/upsert call — the hashed value is
    // what gets written to the password column, never the plaintext.
    const hashedPassword = await bcrypt.hash(akun.password, BCRYPT_COST_FACTOR);
    await prisma.akun.upsert({
      where: { id: akun.id },
      update: {
        nama: akun.nama,
        username: akun.username,
        password: hashedPassword,
        role: akun.role,
      },
      create: {
        id: akun.id,
        nama: akun.nama,
        username: akun.username,
        password: hashedPassword,
        role: akun.role,
      },
    });
  }
  console.log(`Seeded Akun: ${akunSeed.length} rows (passwords bcrypt-hashed)`);
}

async function seedPermintaan() {
  for (const entry of permintaanSeed) {
    const data = {
      kotaNama: entry.kota,
      tanggalPermintaan: entry.tanggal_permintaan,
      tanggalInput: entry.tanggal_input,
      jumlahPermintaan: entry.jumlah_permintaan,
      keterangan: entry.keterangan ?? null,
    };
    await prisma.permintaan.upsert({
      where: { id: entry.id },
      update: data,
      create: { id: entry.id, ...data },
    });
  }
  console.log(`Seeded Permintaan: ${permintaanSeed.length} rows`);
}

async function seedKeputusanAndRiwayat() {
  for (const entry of keputusanSeed) {
    const data = {
      kotaTujuanNama: entry.kota_tujuan,
      volumeTbs: entry.volume_tbs,
      tanggalKeputusan: entry.tanggal_keputusan,
      diputuskanOleh: entry.diputuskan_oleh,
      status: entry.status,
    };
    await prisma.keputusan.upsert({
      where: { id: entry.id },
      update: data,
      create: { id: entry.id, ...data },
    });
    // store.js seeds BOTH state.keputusan and state.riwayatKeputusan from the
    // same source file at startup — replicate that dual-write here.
    await prisma.riwayatKeputusan.upsert({
      where: { id: entry.id },
      update: data,
      create: { id: entry.id, ...data },
    });
  }
  console.log(
    `Seeded Keputusan: ${keputusanSeed.length} rows, RiwayatKeputusan: ${keputusanSeed.length} rows`
  );
}

async function seedNotifikasi() {
  for (const entry of notifikasiSeed) {
    const data = {
      judul: entry.judul,
      pesan: entry.pesan,
      tipe: entry.tipe,
      dibaca: entry.dibaca,
      waktu: new Date(entry.waktu),
    };
    await prisma.notifikasi.upsert({
      where: { id: entry.id },
      update: data,
      create: { id: entry.id, ...data },
    });
  }
  console.log(`Seeded Notifikasi: ${notifikasiSeed.length} rows`);
}

async function seedActivityLog() {
  if (activityLogSeed.length === 0) {
    console.log("Seeded ActivityLog: 0 rows (empty seed array, no-op)");
    return;
  }
  for (const entry of activityLogSeed) {
    const data = {
      aktor: entry.aktor,
      role: entry.role,
      aksi: entry.aksi,
      waktu: entry.waktu ? new Date(entry.waktu) : undefined,
    };
    await prisma.activityLog.upsert({
      where: { id: entry.id },
      update: data,
      create: { id: entry.id, ...data },
    });
  }
  console.log(`Seeded ActivityLog: ${activityLogSeed.length} rows`);
}

async function main() {
  // Kota first — required before Permintaan/Keputusan/RiwayatKeputusan due to FK constraints.
  await seedKota();
  await seedAkun();
  await seedPermintaan();
  await seedKeputusanAndRiwayat();
  await seedNotifikasi();
  await seedActivityLog();
}

main()
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
