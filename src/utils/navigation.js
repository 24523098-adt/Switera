export const roleOptions = [
  "Admin",
  "Manajer Distribusi",
  "Tim Logistik",
];

export const menuByRole = {
  Admin: [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "manajemen-akun", label: "Manajemen Akun", icon: "user" },
    { key: "riwayat-aktivitas", label: "Riwayat Aktivitas", icon: "report" },
  ],
  "Manajer Distribusi": [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "input-data", label: "Input Data", icon: "input" },
    { key: "manajemen-data", label: "Manajemen Data", icon: "database" },
    { key: "manajemen-kota", label: "Manajemen Kota", icon: "city" },
    { key: "analisis-ranking", label: "Analisis & Ranking", icon: "chart" },
    {
      key: "keputusan-distribusi",
      label: "Keputusan Distribusi",
      icon: "decision",
    },
    { key: "laporan", label: "Laporan", icon: "report" },
  ],
  "Tim Logistik": [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    {
      key: "status-distribusi",
      label: "Status Distribusi",
      icon: "truck",
    },
    { key: "laporan", label: "Laporan", icon: "report" },
  ],
};

export const getDefaultMenuByRole = (role) =>
  menuByRole[role]?.[0]?.key ?? "dashboard";
