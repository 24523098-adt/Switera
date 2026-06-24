-- CreateTable
CREATE TABLE "Akun" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Akun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kota" (
    "nama" TEXT NOT NULL,
    "kapasitas" INTEGER NOT NULL,

    CONSTRAINT "Kota_pkey" PRIMARY KEY ("nama")
);

-- CreateTable
CREATE TABLE "Permintaan" (
    "id" TEXT NOT NULL,
    "kotaNama" TEXT NOT NULL,
    "tanggalPermintaan" TEXT NOT NULL,
    "tanggalInput" TEXT NOT NULL,
    "jumlahPermintaan" DOUBLE PRECISION NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permintaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Keputusan" (
    "id" TEXT NOT NULL,
    "kotaTujuanNama" TEXT NOT NULL,
    "volumeTbs" DOUBLE PRECISION NOT NULL,
    "tanggalKeputusan" TEXT NOT NULL,
    "diputuskanOleh" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "waktuMenunggu" TIMESTAMP(3),
    "waktuDalamPengiriman" TIMESTAMP(3),
    "waktuSelesai" TIMESTAMP(3),
    "waktuDibatalkan" TIMESTAMP(3),

    CONSTRAINT "Keputusan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiwayatKeputusan" (
    "id" TEXT NOT NULL,
    "kotaTujuanNama" TEXT NOT NULL,
    "volumeTbs" DOUBLE PRECISION NOT NULL,
    "tanggalKeputusan" TEXT NOT NULL,
    "diputuskanOleh" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "waktuMenunggu" TIMESTAMP(3),
    "waktuDalamPengiriman" TIMESTAMP(3),
    "waktuSelesai" TIMESTAMP(3),
    "waktuDibatalkan" TIMESTAMP(3),

    CONSTRAINT "RiwayatKeputusan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "aktor" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "waktu" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifikasi" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "dibaca" BOOLEAN NOT NULL DEFAULT false,
    "waktu" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Akun_username_key" ON "Akun"("username");

-- CreateIndex
CREATE INDEX "Permintaan_kotaNama_idx" ON "Permintaan"("kotaNama");

-- CreateIndex
CREATE INDEX "Keputusan_kotaTujuanNama_idx" ON "Keputusan"("kotaTujuanNama");

-- CreateIndex
CREATE INDEX "RiwayatKeputusan_kotaTujuanNama_idx" ON "RiwayatKeputusan"("kotaTujuanNama");

-- AddForeignKey
ALTER TABLE "Permintaan" ADD CONSTRAINT "Permintaan_kotaNama_fkey" FOREIGN KEY ("kotaNama") REFERENCES "Kota"("nama") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keputusan" ADD CONSTRAINT "Keputusan_kotaTujuanNama_fkey" FOREIGN KEY ("kotaTujuanNama") REFERENCES "Kota"("nama") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatKeputusan" ADD CONSTRAINT "RiwayatKeputusan_kotaTujuanNama_fkey" FOREIGN KEY ("kotaTujuanNama") REFERENCES "Kota"("nama") ON DELETE RESTRICT ON UPDATE CASCADE;
