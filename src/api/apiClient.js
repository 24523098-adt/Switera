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

// localStorage access is guarded the same way src/store.js guards it
// (private-mode/quota tolerant — failures degrade silently, never throw).
function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage unavailable (private mode/quota) — continue without persistence
  }
}

function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage unavailable (private mode/quota) — continue without persistence
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

export {
  apiFetch,
  getToken,
  setToken,
  clearToken,
  setUnauthorizedHandler,
  subscribeLoading,
  isLoading,
};
