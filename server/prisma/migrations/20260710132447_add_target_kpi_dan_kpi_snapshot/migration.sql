-- CreateTable
CREATE TABLE "TargetKpi" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "targetPemenuhan" INTEGER NOT NULL DEFAULT 80,
    "targetWaktuKirim" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "targetUtilisasi" INTEGER NOT NULL DEFAULT 70,
    "minHariPasokan" INTEGER NOT NULL DEFAULT 14,
    "maxHariEskalasi" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "TargetKpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshot" (
    "id" SERIAL NOT NULL,
    "tanggal" TEXT NOT NULL,
    "tingkatPemenuhan" INTEGER NOT NULL,
    "keputusanAktif" INTEGER NOT NULL,
    "rataWaktuPengiriman" DOUBLE PRECISION,
    "utilisasiKapasitas" INTEGER NOT NULL,
    "stokTbs" INTEGER NOT NULL,
    "totalPermintaanTon" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KpiSnapshot_tanggal_key" ON "KpiSnapshot"("tanggal");
