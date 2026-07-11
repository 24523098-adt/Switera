// Shared fetch wrapper for the entire frontend (Phase 9). This is the ONLY
// code path that talks to the Express API built in Phase 7/8 — every page
// and store mutator goes through apiFetch so the Authorization header,
// error normalization, and 401 handling are applied uniformly exactly once.
//
// API_BASE_URL defaults to the Phase 7/8 server's Express PORT default
// (http://localhost:4000, see server/src/index.js); VITE_API_BASE_URL
// allows overriding without a code change.
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:4000";

const TOKEN_KEY = "switera_token";

// The token lives in sessionStorage (per-tab), not localStorage: each browser
// tab keeps its own session, so different roles can be logged in side by side
// in separate tabs without overwriting each other's token. Trade-off: closing
// the tab ends the session ("Ingat Saya"/persistent login is intentionally
// gone). Access is guarded (private-mode/quota tolerant — failures degrade
// silently, never throw).
function getToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // sessionStorage unavailable (private mode/quota) — continue without persistence
  }
}

function clearToken() {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // sessionStorage unavailable (private mode/quota) — continue without persistence
  }
}

// Module-level in-flight request counter + subscriber list. apiClient never
// imports store.js (avoids an import cycle) — the store registers a
// subscriber via subscribeLoading() and derives its own isLoading boolean.
let inFlightCount = 0;
const loadingListeners = new Set();

function notifyLoadingListeners() {
  loadingListeners.forEach((listener) => listener(inFlightCount > 0));
}

function subscribeLoading(fn) {
  loadingListeners.add(fn);
  return () => loadingListeners.delete(fn);
}

function isLoading() {
  return inFlightCount > 0;
}

// Registered by store.js so a 401 anywhere can clear the session without
// apiClient importing store.js directly (avoids an import cycle).
let onUnauthorized = null;

function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function apiFetch(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = auth ? getToken() : null;

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  inFlightCount += 1;
  notifyLoadingListeners();

  try {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      const networkError = new Error("Tidak dapat terhubung ke server.");
      networkError.isNetworkError = true;
      throw networkError;
    }

    if (response.status === 401) {
      clearToken();
      if (typeof onUnauthorized === "function") {
        onUnauthorized();
      }

      let parsedBody = null;
      try {
        parsedBody = await response.json();
      } catch {
        // empty/non-JSON 401 body — fall back to the generic message below
      }

      throw new Error(parsedBody?.error ?? "Sesi berakhir. Silakan masuk kembali.");
    }

    if (!response.ok) {
      let parsedBody = null;
      try {
        parsedBody = await response.json();
      } catch {
        // empty/non-JSON error body — fall back to the generic message below
      }

      const error = new Error(parsedBody?.error ?? "Terjadi kesalahan pada server.");
      error.status = response.status;
      if (parsedBody?.fields) {
        error.fields = parsedBody.fields;
      }
      throw error;
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } finally {
    inFlightCount -= 1;
    notifyLoadingListeners();
  }
}

// ── Fungsi MIS (Management Information System) untuk Manajer Distribusi ──
// Pembungkus tipis di atas apiFetch. Semua endanya READ dan khusus peran
// Manajer Distribusi di backend. getKpi sengaja menunjuk /mis/kpi (KPI manajer
// baru), bukan /kpi lama yang tetap dipakai dashboard/laporan lain.
const getMisSituasiHariIni = () => apiFetch("/mis/situasi-hari-ini");
const getMisTindakanMendesak = () => apiFetch("/mis/tindakan-mendesak");
const getMisRekomendasiPrioritas = () => apiFetch("/mis/rekomendasi-prioritas");
const getMisKeputusanBerjalan = () => apiFetch("/mis/keputusan-berjalan");
const getMisProyeksiStok = () => apiFetch("/mis/proyeksi-stok");
const getKpi = () => apiFetch("/mis/kpi");
const getEfisiensiLogistik = () => apiFetch("/efisiensi-logistik");
const sinkronNotifikasiMis = () => apiFetch("/mis/sinkron-notifikasi", { method: "POST" });
const getTargetKpi = () => apiFetch("/mis/target-kpi");
const setTargetKpi = (body) => apiFetch("/mis/target-kpi", { method: "PUT", body });
const getRiwayatKpi = (hari = 30) => apiFetch(`/mis/riwayat-kpi?hari=${hari}`);
const buatBriefingHarian = () => apiFetch("/mis/briefing-harian", { method: "POST" });

export {
  apiFetch,
  getToken,
  setToken,
  clearToken,
  setUnauthorizedHandler,
  subscribeLoading,
  isLoading,
  getMisSituasiHariIni,
  getMisTindakanMendesak,
  getMisRekomendasiPrioritas,
  getMisKeputusanBerjalan,
  getMisProyeksiStok,
  getKpi,
  getEfisiensiLogistik,
  sinkronNotifikasiMis,
  getTargetKpi,
  setTargetKpi,
  getRiwayatKpi,
  buatBriefingHarian,
};
