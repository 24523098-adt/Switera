# Switera

Switera adalah aplikasi web untuk mengelola distribusi stok TBS (Tandan Buah Segar / kelapa sawit) ke berbagai kota — mulai dari pencatatan permintaan, keputusan distribusi berbasis ranking, pelacakan status pengiriman, pelaporan, hingga riwayat aktivitas. Mendukung multi-pengguna secara bersamaan dengan tiga peran yang berbeda, dan setiap perubahan data langsung tersinkron ke semua pengguna yang sedang login tanpa perlu memuat ulang halaman.

## Peran Pengguna

| Peran | Akses Utama |
|---|---|
| **Admin** | Kelola kota & kapasitas, atur stok TBS, input & kelola data permintaan, lihat riwayat aktivitas |
| **Manajer Distribusi** | Analisis & ranking kota, buat dan kelola keputusan distribusi, lihat laporan |
| **Tim Logistik** | Perbarui status pengiriman (menunggu → dalam pengiriman → selesai), lihat laporan |

## Fitur Utama

- **Autentikasi** — login berbasis JWT dengan password ter-hash (bcrypt); pemilihan peran saat login divalidasi terhadap akun, bukan sekadar tampilan
- **Manajemen Kota** — tambah/edit/hapus kota dan kapasitas, atur stok TBS, dengan cascade-rename dan pencegahan hapus data yang masih dipakai
- **Input & Manajemen Data Permintaan** — catat dan kelola data permintaan TBS per kota, dengan deteksi duplikat dan deteksi anomali (lonjakan permintaan di luar kewajaran)
- **Analisis & Ranking** — ranking kota otomatis berbasis volume permintaan dan kapasitas, dengan visualisasi grafik
- **Keputusan Distribusi** — rekomendasi tujuan distribusi berbasis data, dengan penguncian optimistik agar dua persetujuan bersamaan terhadap keputusan yang sama tidak pernah menghasilkan alokasi ganda
- **Status Distribusi** — pelacakan status pengiriman lengkap dengan data armada dan estimasi tiba (ETA)
- **Laporan** — konten dan ekspor CSV yang berbeda sesuai peran
- **Riwayat Aktivitas & Notifikasi** — log otomatis setiap aksi penting, dibuat di sisi server pada saat aksi terjadi
- **Sinkronisasi multi-klien** — perubahan data oleh satu pengguna otomatis terlihat oleh pengguna lain yang sedang login dalam hitungan detik

## Arsitektur

| Bagian | Teknologi |
|---|---|
| Frontend | React 18, Vite 7, Chart.js, Leaflet |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL via Prisma ORM |
| Autentikasi | JWT (jsonwebtoken) + bcrypt |
| Validasi | Zod |

Frontend dan backend berjalan sebagai dua proses terpisah yang berkomunikasi lewat REST API.

## Menjalankan Secara Lokal

### Prasyarat

- Node.js dan npm
- Docker (untuk menjalankan PostgreSQL secara lokal)

### 1. Database

```bash
docker compose up -d
```

### 2. Backend

```bash
cd server
npm install
```

Buat `server/.env` berisi:

```
DATABASE_URL="postgresql://switera:switera_dev_password@localhost:5432/switera"
JWT_SECRET="ganti-dengan-random-string-yang-panjang"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

```bash
npm run prisma:migrate
npm run db:seed
npm run dev
```

Backend berjalan di `http://localhost:4000`.

### 3. Frontend

Di terminal baru, dari root proyek:

```bash
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

## Akun Demo

| Peran | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Manajer Distribusi | `manajer` | `manajer123` |
| Tim Logistik | `logistik` | `logistik123` |

Atau buat akun baru lewat halaman Daftar.

## REST API

| Resource | Endpoint |
|---|---|
| Autentikasi | `POST /auth/login`, `POST /auth/register` |
| Kota & Stok | `GET/POST/PUT/DELETE /kota`, `GET/PUT /stok-tbs` |
| Permintaan | `GET/POST/PUT/DELETE /permintaan` |
| Keputusan Distribusi | `GET/POST/PUT/DELETE /keputusan`, `GET /riwayat-keputusan` |
| Ranking & KPI | `GET /rekomendasi-distribusi`, `GET /kpi` |
| Notifikasi | `GET /notifikasi`, `PUT /notifikasi/:id/baca` |
| Riwayat Aktivitas | `GET /activity-log` |

Seluruh endpoint mutasi memerlukan token JWT (header `Authorization: Bearer <token>`) dan menerapkan otorisasi berbasis peran di sisi server.

## Struktur Proyek

```
src/                  # Frontend (React)
  pages/              # Satu komponen per halaman/route
  components/         # Komponen UI bersama (Tombol, Card, Modal, Tabel, Toast, dll.)
  store.js            # State management terpusat (pub/sub) yang berkomunikasi dengan API
  api/                # Klien HTTP ke backend
  utils/              # Logika bisnis murni (ranking, forecast, format, csv)

server/               # Backend (Express)
  src/
    routes/           # Endpoint REST per domain
    services/         # Logika bisnis & akses database
    middleware/        # Autentikasi, otorisasi, validasi
  prisma/
    schema.prisma     # Skema database
    seed.js           # Data awal
```

## Skrip

| Lokasi | Skrip | Fungsi |
|---|---|---|
| root | `npm run dev` | Menjalankan dev server frontend (Vite) |
| root | `npm run build` | Build produksi frontend ke `dist/` |
| `server/` | `npm run dev` | Menjalankan backend dengan auto-restart |
| `server/` | `npm run prisma:migrate` | Menjalankan migrasi database |
| `server/` | `npm run db:seed` | Mengisi database dengan data awal |
| `server/` | `npm run prisma:studio` | GUI untuk melihat/mengedit data database |
