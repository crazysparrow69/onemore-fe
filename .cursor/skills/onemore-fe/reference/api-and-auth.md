# API and auth reference

Read when touching `src/shared/api`, queries/mutations, auth, `vercel.json`, the Vite proxy, or any flow that talks to the backend. Spec: "5. Архитектура" (`Нужен ли API Gateway`, `Ключевые потоки`, `Как запускать локально`).

## How requests reach the backend (no gateway)
Browser -> Vercel (same domain) -> `vercel.json` rewrites by path prefix -> public Cloud Run service. Same origin, so no CORS.

| Path prefix | Service | MVP phase |
|---|---|---|
| `/api/me`, `/api/exercises`, `/api/templates`, `/api/schedule`, `/api/workouts` | core-service | 1, 3-5, 7 |
| `/api/body`, `/api/goals`, `/api/weight`, `/api/nutrition` | nutrition-service | 6 |
| `/api/ai` | ai-service | v0.2, do not add |

- Prefixes are by domain: moving a domain to another service changes only `vercel.json` and the Vite proxy, never app code.
- `/internal/*` is backend-to-backend only. Never call it and never add it to rewrites.
- Locally the Vite dev server proxies `/api` to `API_URL` (core-service). The browser still calls relative `/api/...`. core-service keeps the `/api` prefix, so nothing is stripped. Keep the proxy and `vercel.json` on the same paths.
- Each service exposes `GET /health` (no DB, returns `version`). The web may call it only for the app-open warm-up (rule 15).

## Contract
- Source of truth: `apps/<service>/openapi.json` in `onemore-be` (generated from Zod, committed, checked by `oasdiff` in backend CI). Today core-service serves only `GET /health`; every other endpoint must exist there before the web uses it.
- Types are duplicated by hand into the feature's `api/` folder. Name them after the OpenAPI schema so drift is easy to spot. Zod schemas for forms are duplicated the same way (`model/`).
- API changes are backward compatible only (expand -> contract). Deploy order on a contract change: backend first, then web. The web must tolerate unknown extra response fields.
- Drift between hand-written types and the backend is caught by the Playwright e2e run against the backend in docker compose (`e2e-full.yml`).
- Error responses use one shared error shape from backend `packages/nest-common` (not implemented yet). The API client parses it once into one typed error; features never parse raw responses.

## Shared API client (`src/shared/api`)
- One thin wrapper over an axios instance: base path `/api`, JSON in/out, `Authorization: Bearer <JWT>` from the Neon Auth SDK on every call, typed error on non-2xx.
- On 401: get a fresh token from the SDK and retry once; if still 401, go to the sign-in flow. 403 is shown as an error, not retried.
- `GET` params serialized into the query string (arrays as repeated params unless `openapi.json` says otherwise).
- Mutations that create records carry a client-generated UUIDv7 id. Retries reuse the same id and body.
- No retries for non-idempotent requests without a client id. TanStack Query retry stays at its default for queries only.

## Auth (Neon Auth = managed Better Auth)
- Sign-in and sign-up by email + password, and sign-in by Google, through `@neon/neon-js` (`createAuthClient` from `@neon/neon-js/auth`, vanilla adapter with `credentials: 'include'`). The SDK talks to Neon Auth directly. The web has no sign-in or sign-up API of its own. The SDK owns the session cookie. The 15-minute JWT comes from the client's `token()` call (`GET /token`), not from `session.token` (that value is the opaque session id).
- The backend verifies the JWT via JWKS and takes `userId` from `sub`. A user token with the wrong `aud` is 401. The web never sends a user id to identify itself and never decodes the JWT for authorization decisions.
- `GET /api/me` returns `email` and `name` from the JWT and `role`, `language`, `timeZone` from `core.users`. There is no onboarding flag and no units column yet. The first `GET` that answers 404 `USER_NOT_FOUND` is followed by one `PUT /api/me` with language `en` and the browser time zone.
- Route guard: no session goes to `/sign-in`; a session on `/sign-in` or `/sign-up` goes to `/`. Google returns to `/auth/callback`.
- First request after idle can take 2-4 s (Cloud Run cold start + Neon wake). Show a loading state, never a timeout error below ~10 s.

## Key flows
- **Record a workout:** draft in Zustand `persist` -> one `GET` for "last time" hints (all exercise ids in the query) -> sets logged locally -> "Finish" -> one `POST /api/workouts` with workout + exercises + sets, ids pre-generated -> on 2xx clear draft and invalidate workout/calendar queries.
- **Calendar:** core (plan + fact) and nutrition (calories) queried in parallel. Nutrition error -> render without calories plus a small inline notice.
- **Onboarding:** core: account + training profile; nutrition: body + goal. Each step idempotent (PUT-like). Set "onboarding done" in core last. A reload mid-way resumes, it never duplicates.
- **Templates:** a workout started from a template copies the template exercises into the draft; later template edits never change a started or saved workout.
