const MENIT = 60 * 1000;
const JAM = 60 * MENIT;
const HARI = 24 * JAM;

export function formatWaktuRelatif(waktuIso) {
  const selisih = Date.now() - new Date(waktuIso).getTime();

  if (selisih < MENIT) {
    return "Baru saja";
  }

  if (selisih < JAM) {
    return `${Math.floor(selisih / MENIT)} menit lalu`;
  }

  if (selisih < HARI) {
    return `${Math.floor(selisih / JAM)} jam lalu`;
  }

  return `${Math.floor(selisih / HARI)} hari lalu`;
}

export default formatWaktuRelatif;
