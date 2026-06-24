# Switera

Switera adalah aplikasi web (SPA) untuk mengelola distribusi stok TBS (Tandan Buah Segar / kelapa sawit) ke berbagai kota — mulai dari pencatatan permintaan, keputusan distribusi berbasis ranking, pelacakan status pengiriman, pelaporan, hingga riwayat aktivitas. Dibangun sebagai tugas mata kuliah Pengembangan Sistem Informasi, dengan standar kualitas setara produk produksi: fitur lengkap, validasi yang benar, UI konsisten, dan kode yang rapi.

> **Catatan:** Aplikasi ini **client-only** — tidak ada backend/database sungguhan. Semua data disimpan di `localStorage` browser melalui store terpusat (`src/store.js`). Backend nyata direncanakan dibangun pada milestone berikutnya.

## Fitur Utama

- **Tiga role pengguna** dengan menu dan tampilan dashboard yang berbeda: **Admin**, **Manajer Distribusi**, **Tim Logistik**
- **Manajemen Kota** (Admin) — tambah/edit/hapus kota dan kapasitas, atur stok TBS, dengan cascade-rename dan block-delete agar tidak ada data menggantung
- **Input & Manajemen Data** (Admin) — catat dan kelola data permintaan TBS per kota
- **Analisis & Ranking** (Manajer) — ranking kota otomatis berbasis data permintaan, dengan grafik
- **Keputusan Distribusi** (Manajer) — rekomendasi tujuan distribusi berbasis data, dengan guard anti-duplikat keputusan aktif
- **Status Distribusi** (Tim Logistik) — pelacakan status pengiriman (menunggu → dalam pengiriman → selesai) dengan validasi armada/ETA
- **Laporan** — konten dan ekspor CSV yang berbeda sesuai role (Manajer melihat data keputusan/ranking, Tim Logistik melihat data status/pengiriman)
- **Riwayat Aktivitas** — log seluruh aksi penting di aplikasi
- **Dashboard** — ringkasan metrik dan aksi cepat, berbeda tampilan untuk setiap role

## Tech Stack

- [React 18](https://react.dev/) + [Vite 7](https://vitejs.dev/) — UI dan dev server
- [Chart.js](https://www.chartjs.org/) via `react-chartjs-2` — grafik dashboard/analisis
- [Leaflet](https://leafletjs.com/) — peta geografis distribusi
- `window.localStorage` — persistensi data (tidak ada backend)
- Routing manual via `window.history.pushState` (tanpa React Router)

Tidak ada test runner, linter, atau type-checker yang dikonfigurasi — proyek ini JavaScript murni (`.jsx`, bukan TypeScript).

## Menjalankan Secara Lokal

Prasyarat: Node.js dan npm.

```bash
npm install
npm run dev
```

Dev server berjalan di `http://localhost:5173` (dapat diakses dari semua interface jaringan).

Untuk build produksi:

```bash
npm run build
```

Hasil build statis akan ada di folder `dist/`, siap untuk hosting statis apa pun.

## Login Demo

Karena tidak ada backend, gunakan salah satu akun seed berikut untuk mencoba aplikasi:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Manajer Distribusi | `manajer` | `manajer123` |
| Tim Logistik | `logistik` | `logistik123` |

Atau buat akun baru lewat halaman Daftar — data akun tersimpan di `localStorage` browser Anda.

## Struktur Proyek

```
src/
  pages/        # Satu komponen per halaman/route (Dashboard, Laporan, ManajemenKota, dll.)
  components/   # Komponen UI bersama (Tombol, Card, Modal, Tabel, Toast, dll.)
  store.js      # Single source of truth — pengganti backend (pub/sub + localStorage)
  utils/        # Logika bisnis murni (ranking, forecast, format, csv) — tanpa dependensi React
  data/         # Data seed JSON awal
  tokens.css    # Design tokens (warna, spacing, tipografi)
```

## Skrip

| Skrip | Fungsi |
|-------|--------|
| `npm run dev` | Menjalankan dev server Vite |
| `npm run build` | Build produksi ke `dist/` |

## Batasan Lingkup (Out of Scope)

- Backend/database/API sungguhan — direncanakan sebagai milestone selanjutnya
- Autentikasi nyata (password hash, sesi server) — saat ini plaintext, cocok untuk demo single-browser
- Dukungan multi-user/sesi bersamaan
