import jwt from "jsonwebtoken";

const PLACEHOLDER_SECRET = "replace-with-a-long-random-secret";

/**
 * Reads JWT_SECRET from the environment, throwing a clear error if it is
 * missing or still the committed placeholder value. Never hardcode the
 * secret here — it must only ever come from process.env (see T-07-SECRET).
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET tidak ditemukan di environment.");
  }

  if (secret === PLACEHOLDER_SECRET) {
    throw new Error("JWT_SECRET masih menggunakan nilai placeholder, harap ganti dengan secret acak.");
  }

  return secret;
}

/**
 * Signs a JWT for the given payload (expects { id, username, role }).
 * Always uses HS256. Expiry defaults to 1 hour but is configurable via the
 * options argument so the login route can issue a longer-lived token when the
 * user opts into "Ingat Saya" (see authRoutes.js) — the token's expiry, not
 * where it is stored, is what actually governs how long the session lasts.
 */
export function signToken(payload, { expiresIn = "1h" } = {}) {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn,
  });
}

/**
 * Verifies and decodes a JWT, pinning the accepted algorithm to HS256 so a
 * token with alg "none" or any other algorithm is rejected (defends against
 * algorithm-confusion attacks, see T-07-ALG). Throws if the token is
 * invalid, expired, tampered with, or signed with a different secret.
 */
export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });
}
