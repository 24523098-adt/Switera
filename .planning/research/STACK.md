# Stack Research

**Domain:** Node.js + Express + PostgreSQL (Prisma) backend for an existing client-only React/Vite SPA — JWT/bcrypt auth, multi-user real-time sync
**Researched:** 2026-06-24
**Confidence:** MEDIUM-HIGH (all package versions cross-verified directly against the live npm registry; architectural/best-practice claims corroborated across 2+ independent web sources each)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Express | ^5.2.1 | HTTP server / REST API framework | Current stable (Dec 2025), requires Node 18+ (non-issue here). Native async/await error forwarding to error-handling middleware removes most `try/catch` boilerplate in route handlers — fits the codebase's existing "narrow try/catch only where needed" error-handling convention. Minimal, unopinionated, the de facto standard for small Node APIs — no reason to reach for a heavier framework. |
| Prisma ORM | **^6.19.2** (pin to 6.x — see warning below) | ORM + migrations for PostgreSQL | Type-safe(ish) query builder, declarative schema (`schema.prisma`), and `prisma migrate` give a single relational source of truth that matches the existing kota/permintaan/keputusan/akun domain model exactly. **Do not install "latest" (7.x) — see "What NOT to Use."** |
| PostgreSQL | 16.x or 17.x (any current major) | Relational database | Already the constraint set in PROJECT.md. Free, runs locally via the official Windows installer or Docker, has solid relational fit for this domain (cities, requests, decisions, accounts all have clear foreign-key relationships) — no NoSQL flexibility is needed here. |
| `pg` (node-postgres) | ^8.22.0 | PostgreSQL driver | Required as the underlying driver when using Prisma's driver-adapter mode (`@prisma/adapter-pg`), and useful directly if any raw SQL is ever needed. Industry-standard, zero-drama. |
| jsonwebtoken | ^9.0.3 | JWT signing/verification for session auth | Simplest, most widely used JWT library for Node; replaces the current plaintext `localStorage` "session" with a real signed, expiring token. No reason to reach for a heavier auth framework (Passport, etc.) at this scope — a handful of routes need `verify`/`sign`, nothing more. |
| bcryptjs | ^3.0.3 | Password hashing | **Recommended over native `bcrypt`** for this project — see Supporting Libraries / Alternatives. Pure JS, zero native compilation step, so it installs cleanly on the Windows dev machine (and CI, if ever added) without requiring Visual Studio Build Tools / node-gyp. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@prisma/client` | ^6.19.2 (match Prisma CLI version exactly) | Generated query client | Always — this is what application code imports (`import { PrismaClient } from "@prisma/client"`) to run queries. Keep in lockstep with the `prisma` CLI devDependency version. |
| `cors` | ^2.8.6 | Cross-Origin Resource Sharing middleware | Needed once the frontend (port 5173) and backend (e.g. port 3001) are separate origins in dev. In production (if ever single-origin/reverse-proxied) it can be tightened or dropped, but for this milestone's local dev setup it's required day one — add narrowly (`origin: "http://localhost:5173"`), not a wildcard `*`. |
| `dotenv` | ^17.4.2 | Load `DATABASE_URL`, `JWT_SECRET`, `PORT` from `.env` | Use for the backend's own config loading. (Node 20.6+ has a native `--env-file` flag / `process.loadEnvFile()`, but `dotenv` remains the more portable, zero-surprise choice for a small project and is what Prisma's own tooling/docs assume — see "Alternatives Considered.") |
| `concurrently` | ^10.0.3 (devDependency) | Run frontend (`vite`) and backend (`node`/`nodemon`) dev servers from a single `npm run dev` | Add one root script: `"dev": "concurrently \"npm:dev:client\" \"npm:dev:server\""`. Keeps the existing one-command dev workflow the project already relies on. |
| `nodemon` | ^3.1.14 (devDependency) | Auto-restart the Express server on file changes | Mirrors the hot-reload feel Vite already gives the frontend; without it every backend edit requires a manual restart, which would feel like a regression in DX. |
| `cookie-parser` | latest (^1.4.7) | Parse `httpOnly` cookies for refresh-token flow | Only needed if you adopt the refresh-token-in-httpOnly-cookie pattern recommended below (access token in memory/response body, refresh token in an httpOnly cookie). If you instead keep JWTs in `localStorage`/memory only (simpler, slightly weaker XSS posture), this can be skipped. |
| `express-rate-limit` | latest (^7.x) | Basic brute-force protection on `/login` | Small addition, meaningfully closes the gap left by removing the current plaintext-but-harmless auth — a real backend with real passwords should not allow unlimited login attempts. Cheap to add, high value for a "production quality" demo. |

### Real-Time Sync: Polling vs Socket.io (decision-critical)

| Approach | Library | Verdict for this project |
|----------|---------|---------------------------|
| **Short-interval polling** | none (plain `fetch`/`setInterval`, or a small custom hook) | **Recommended.** See analysis below. |
| WebSocket push | `socket.io` ^4.8.3 + `socket.io-client` ^4.8.3 | Viable, but adds operational complexity not justified at this scale. Keep as an explicitly-deferred upgrade path. |

**Concrete tradeoff analysis for Switera's scale (handful of concurrent users, 3 roles, school project, no internet-scale concern):**

- **What "instant reflect" actually requires here:** the current UX contract is that *the user's own actions* reflect instantly (their own mutation re-renders immediately) — this is trivially preserved by updating local React state optimistically right after a successful API response, exactly as `store.js`'s pub/sub does today. The *harder* requirement, multi-user sync, is really about *other users'* changes becoming visible without a manual refresh — e.g. a Tim Logistik user sees a new `keputusan` an Admin just approved.
- **Polling is the right default here** because:
  1. **Scale fit:** with at most a few simultaneous browser tabs (not hundreds), a 3-5 second poll interval on a handful of small REST endpoints (`GET /permintaan`, `GET /keputusan`, etc.) is negligible load on a school-project Postgres instance — there is no scenario where this becomes a bottleneck.
  2. **Operational simplicity:** polling reuses the exact REST/JWT infrastructure already being built (same auth middleware, same Express routes, same error handling) — no second protocol, no separate connection-auth handshake, no reconnect/heartbeat logic to write and debug under a deadline.
  3. **Debuggability:** every poll is a normal, inspectable HTTP request in DevTools' Network tab — directly continuous with how the team will already be debugging the REST API. Socket.io's frames are harder to inspect and reason about for students/graders unfamiliar with WebSocket tooling.
  4. **Dev-proxy simplicity:** polling needs zero extra Vite config. Socket.io needs an additional `ws: true` proxy entry in `vite.config.js` and care that Express attaches Socket.io to the underlying `http.Server` (not the Express app object directly) — one more thing to get right and explain.
  5. **"Good enough" UX:** a 3-5s staleness window is imperceptible for this domain — TBS stock decisions and status updates are not a fast-twitch, sub-second collaboration scenario (it's not a chat app or collaborative cursor). Perceived "instant" for a human is anything under ~1s for *your own* action and a few seconds of eventual consistency for *others'* actions is normal and expected in apps like this (think: most admin dashboards).
  6. **Lower total new-concept surface for a school project on a deadline:** the team is already absorbing Express + Prisma + JWT + bcrypt as new concepts in this milestone. Adding Socket.io's pub/sub model, room/namespace concepts, and a second long-lived connection type increases the surface area to get right with limited payoff at this scale.
- **When Socket.io would become the right call instead:** if a future requirement demanded sub-second cross-user feedback (e.g., live "someone else is editing this request" indicators, a shared live map view with multiple cursors, or true server-push notifications independent of any polling cadence). None of the "Active" v2.0 requirements in PROJECT.md describe that need — they describe consistency, not live collaboration.
- **Recommended concrete implementation:** a small custom hook (e.g. `usePolling(fetchFn, intervalMs)`) wrapping `setInterval` + `fetch`, paused when the browser tab is hidden (`document.visibilitychange`) to avoid wasted requests, reused across pages that need "other users' changes" visibility (Dashboard, StatusDistribusi, KeputusanDistribusi). This is a thin addition, not a new architectural layer — it slots naturally next to the existing `store.js` subscribe pattern, which can keep being the *local* reactivity mechanism while polling supplies the *remote* freshness.
- **If polling is later found insufficient:** Socket.io is the correct upgrade path (not raw WebSocket or SSE) specifically because of its automatic reconnection and WS→long-polling fallback, which matters if the deployment ever sits behind a restrictive proxy — but this should be treated as a deferred, explicitly-revisited decision, not built speculatively now.

## Installation

```bash
# Backend runtime dependencies
npm install express cors dotenv jsonwebtoken bcryptjs cookie-parser express-rate-limit
npm install @prisma/client@6.19.2 @prisma/adapter-pg@6.19.2 pg

# Backend dev dependencies
npm install -D prisma@6.19.2 nodemon concurrently
```

```bash
# Initialize Prisma (creates prisma/schema.prisma + .env)
npx prisma@6.19.2 init --datasource-provider postgresql
```

**Pin the exact `prisma` CLI and `@prisma/client` versions to 6.19.2 in `package.json`** (no `^` caret) so a future `npm install` cannot silently pull 7.x and break the JS-only generator workflow described below.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Prisma 6.x (`prisma-client-js` generator) | Prisma 7.x (`prisma-client` generator) | Only if the project adopts TypeScript first. Prisma 7's new Rust-free generator is faster and has a smaller bundle, but **by design emits TypeScript-only output** — there is currently no supported way to get plain `.js` output from it. Until Prisma ships a JS-emitting equivalent (not committed as of this research), 7.x is not viable for this codebase's all-JS convention. |
| bcryptjs | `bcrypt` (native) | If raw hashing throughput becomes an actual bottleneck (it won't, at this user count) or if the team is comfortable installing Visual Studio Build Tools / `windows-build-tools` for native module compilation. Native `bcrypt` is ~3-4x faster but that gap is invisible below hundreds of logins/minute. |
| Polling (custom hook) | Socket.io ^4.8.3 | If a later requirement needs sub-second cross-user push (live collaboration, presence, notifications independent of polling cadence) — see analysis above. |
| Express 5.x | Fastify, Koa, NestJS | NestJS in particular is explicitly **not** recommended here — its DI container, decorators, and module system are significant new concepts disproportionate to a 4-5 resource REST API on a school-project timeline. Fastify/Koa are fine alternatives technically but offer no concrete advantage over Express for this scope, and Express has the largest body of tutorials/Stack Overflow coverage if the team gets stuck. |
| `dotenv` package | Node's native `--env-file` flag / `process.loadEnvFile()` (Node 20.6+) | Viable and slightly more "modern," but Prisma's own CLI and most ecosystem tooling/tutorials still assume a `.env` file read via `dotenv`-style conventions; using `dotenv` explicitly avoids edge cases where Prisma CLI commands run outside of a `node --env-file=...` invocation (e.g. `npx prisma migrate dev` directly) and don't see the native flag's env vars. |
| JWT in memory/response body + refresh token in httpOnly cookie | JWT in `localStorage` only | Simpler (no `cookie-parser` needed) but more exposed to XSS exfiltration of the long-lived token. Acceptable simplification *only* if you skip refresh tokens entirely and use a single short/medium-lived JWT (e.g. 2-4 hours) re-login on expiry — reasonable for a school project, but the httpOnly-cookie refresh pattern is the more "production quality" choice the project's stated goal (demo at production quality) leans toward. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| `prisma`/`@prisma/client` `^7` (or any unpinned `"latest"` Prisma install) | The new `prisma-client` generator in v7 emits TypeScript files only — there is no JS output mode. Installing "latest" today silently lands on 7.8.0 and breaks Prisma Client generation for this all-JS codebase. | Pin `prisma` and `@prisma/client` to `6.19.2` explicitly (no caret) until/unless the project adopts TypeScript. |
| native `bcrypt` on the team's Windows dev machines without confirming build tools are installed | Requires `node-gyp` + a C++ compiler at `npm install` time; a common source of "works on my machine" install failures on Windows, exactly this project's dev OS. | `bcryptjs` — pure JS, no compilation step, same `hash`/`compare` API shape. |
| NestJS (or other batteries-included Node framework) | Massive conceptual overhead (modules, providers, decorators, DI) for ~4-5 resource REST endpoints; would consume school-project time budget on framework ceremony instead of the actual domain logic. | Plain Express 5.x with a thin `routes/` + `controllers/` folder convention. |
| Building a custom WebSocket/Socket.io layer as the *first* multi-user sync mechanism | Disproportionate complexity (connection lifecycle, reconnection, auth-over-socket, room/namespace design) for a "few concurrent users, eventual consistency within seconds is fine" requirement. | Short-interval polling (3-5s) reusing the existing REST+JWT stack; revisit Socket.io only if a concrete sub-second requirement emerges. |
| Storing JWT secret or `DATABASE_URL` directly in source / committing `.env` | Plaintext credentials in git history; currently the project has *zero* `.env` usage (per CLAUDE.md), so this is a new risk surface being introduced for the first time. | `.env` + `dotenv`, with `.env` added to `.gitignore` immediately when the backend is scaffolded, and a `.env.example` committed instead. |
| Reusing the current plaintext string-match `cariAkun`-style auth pattern in the new backend | The entire point of this milestone is replacing plaintext auth; carrying the pattern into the backend (e.g. comparing raw passwords in a `WHERE` clause) defeats the purpose and stores live passwords in Postgres in cleartext. | `bcryptjs.hash()` on register, `bcryptjs.compare()` on login, store only the hash column. |

## Stack Patterns by Variant

**If the team wants to minimize new concepts this milestone (recommended given school-project timeline):**
- Use Express + Prisma 6.x + JWT (single access token, 2-4h expiry, no refresh-token rotation) + bcryptjs + polling.
- Skip `cookie-parser`/refresh-token cookies — store the JWT in memory/`localStorage` and require re-login on expiry. Document this as a deliberate, accepted tradeoff (mirrors how v1.0 documented its own accepted gaps in PROJECT.md).

**If the team wants the more "production quality" auth posture (matches the project's stated demo-quality bar):**
- Add `cookie-parser`, issue a short-lived (15m) access token in the JSON response body and a long-lived (7d) refresh token in an `httpOnly`, `sameSite=strict` cookie, with a `/auth/refresh` endpoint. Slightly more code, meaningfully better security story to describe/defend if asked.

**If PostgreSQL setup friction on Windows becomes a blocker:**
- Run Postgres via Docker (`docker run --name switera-db -e POSTGRES_PASSWORD=... -p 5432:5432 -d postgres:17`) instead of the native Windows installer — avoids Windows-service quirks and gives a disposable, resettable dev database, which pairs well with `prisma migrate reset` during active schema iteration.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `prisma@6.19.2` | `@prisma/client@6.19.2` | Keep these two in exact lockstep — Prisma explicitly requires matching CLI/client major.minor.patch versions; mismatches throw at `PrismaClient` instantiation. |
| `@prisma/adapter-pg@6.19.2` | `pg@^8.x` | Driver-adapter mode for Prisma 6 talks to Postgres through `pg` directly; confirm `pg` is listed as an explicit dependency (not just transitive) since Prisma's adapter expects you to construct and own the `pg.Pool`. |
| `express@^5.2.1` | Node.js `>=18` | Express 5 dropped support for Node <18; confirm the dev/runtime Node version satisfies this (any current LTS does). |
| `socket.io@^4.8.3` (if adopted later) | `socket.io-client@^4.8.3` | Server and client major.minor must match; also requires attaching to the raw `http.Server`, not the Express app instance, when wiring it in. |
| Vite `server.proxy` (`vite.config.js`) | Express listening on a distinct port (e.g. 3001) | Add `proxy: { "/api": "http://localhost:3001" }` (and `"/socket.io": { target: "ws://localhost:3001", ws: true }` only if Socket.io is adopted) — dev-only, has no effect on `vite build` output, so production serving strategy is a separate decision outside this milestone's scope. |

## Sources

- npm registry (`registry.npmjs.org`) — direct version verification for `express`, `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `jsonwebtoken`, `bcrypt`, `bcryptjs`, `socket.io`, `cors`, `dotenv`, `concurrently`, `nodemon`, including Prisma's `dist-tags` confirming `latest=7.8.0` vs the stable 6.x line ending at `6.19.2` — HIGH confidence (authoritative, live registry data)
- Prisma official docs/blog (`prisma.io/docs`, `prisma.io/blog/announcing-prisma-orm-7-0-0`) + community discussion (`github.com/prisma/prisma/discussions/27596`, `dev.to/manujdixit/how-to-upgrade-to-prisma-v7`) — corroborated the v7 TypeScript-only generator limitation across 3+ independent sources — MEDIUM-HIGH confidence
- Express.js official docs (`expressjs.com/en/api`) + Better Stack / community writeups on Express 5 features — MEDIUM confidence
- Socket.io official docs (`socket.io/docs/v4`) — MEDIUM confidence
- Vite official docs (`vite.dev/config/server-options`) + community guides on proxy/WebSocket config — MEDIUM confidence
- Community comparisons (Medium/DEV.to/CodeForGeek) on `bcrypt` vs `bcryptjs` native-binding tradeoffs — MEDIUM confidence (consistent across multiple independent sources)
- Node.js native `.env` support (`philna.sh`, `pawelgrzybek.com`, multiple DEV.to writeups) — MEDIUM confidence

---
*Stack research for: Switera v2.0 backend migration (Node.js + Express + PostgreSQL/Prisma + JWT/bcrypt + multi-user sync)*
*Researched: 2026-06-24*
