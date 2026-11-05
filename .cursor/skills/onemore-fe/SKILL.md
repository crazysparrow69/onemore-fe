---
name: onemore-fe
description: Core rules for the onemore web app (React + Vite SPA/PWA on Vercel, mobile-first workout and nutrition tracker; backend lives in the separate onemore-be repo). Use for EVERY request in the onemore-fe repository - planning, coding, review, debugging, UI, tests, CI, Vercel config, questions. Defines the stack, hard rules, scope, and the planner/implementer workflow.
---

# onemore web

Web app of a workout + nutrition diary for gym-goers. Pet project, budget $0-2/month, goal: learn real-world practices.
Mobile-first SPA installed as a PWA. Users: me and friends first.
The backend is a SEPARATE repo `onemore-be` (NestJS services on Cloud Run). Never add backend code here and never import anything from it.

Chat language: Russian. Code, comments, identifiers, commit messages, docs, i18n keys: English.

## 0. Which role are you in?

- **Planner** (Plan mode, or the user asks to plan / design / analyze / review): follow section 6.
- **Implementer** (the user says "implement", gives a plan, or asks for a code change): follow section 7.
- Unclear -> if the task touches more than ~3 files, adds a screen, a dependency, or touches any hard rule from section 3, act as Planner first and ask the user to confirm.

## 1. Stack (decided, do not re-debate)

| Area | Choice |
|---|---|
| Runtime / tooling | Node 24 (`.nvmrc`), pnpm 10.26.2 (`packageManager`), TypeScript strict `~6.0` (typescript-eslint does not support 7.x yet), Vite |
| App type | SPA + PWA via `vite-plugin-pwa`. NOT Next.js, NOT SSR |
| Routing | TanStack Router |
| Server data | TanStack Query (cache, optimistic updates, parallel requests) |
| Client state | Zustand with `persist`, ONLY for the in-progress workout draft (and small UI prefs if a plan says so) |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) |
| UI | Tailwind + shadcn/ui |
| Dates | date-fns |
| i18n | react-i18next, from day one |
| Auth | Neon Auth SDK `@neondatabase/auth` (email + Google) |
| Tests | Vitest + jsdom + Testing Library (unit), Playwright (e2e "record a workout" in a mobile viewport) |
| Lint | ESLint flat config + type-aware typescript-eslint (`no-floating-promises` on), Prettier |
| Errors | Sentry (EU region), from phase 8 |
| Hosting | Vercel Hobby: preview per PR, prod from `main`; `vercel.json` rewrites `/api/*` to Cloud Run |

Do NOT add a dependency that is not in this table or the plan. If one seems necessary, stop and ask. Undecided items (analytics, router style, UUIDv7 lib, API mocking) are listed in [reference/scope-and-status.md](reference/scope-and-status.md).

## 2. Scope

- MVP = v0.1: auth, onboarding + account settings, exercise catalog + private exercises, workout recording + templates, weekly schedule + month calendar, nutrition diary with daily target.
- NOT in MVP (do not build or scaffold): AI, progress charts, food database / barcode / photo, social, trainers, payments, landing page, full offline mode, GDPR export, Cloudinary uploads, React Native.

Feature-level detail, roadmap, phases, open questions: [reference/scope-and-status.md](reference/scope-and-status.md).

## 3. Hard rules (violating any of these is a bug)

**API and contracts**
1. Call the API only through the shared client in `src/shared/api` using relative `/api/...` paths. Never hardcode a Cloud Run URL, never call `fetch` from a component or feature directly, no CORS setup. Paths are by domain, not by service (table in [reference/api-and-auth.md](reference/api-and-auth.md)).
2. Never import from `onemore-be`. Request/response types and Zod form schemas are written by hand from the backend's committed `openapi.json`. Never invent an endpoint, field, query param, or status code: if the backend does not have it, stop and say it is a backend task first (deploy order: backend, then web).
3. `GET` requests carry parameters only in the query string. Never send `userId`/`ownerId` from the client to identify the current user: the backend takes it from the JWT.

**Auth / security / privacy**
4. Tokens come only from the Neon Auth SDK, which refreshes them. Never store a JWT yourself (no `localStorage`, no Zustand), never put it in a URL, never log it.
5. Env is one Zod schema in `src/shared/lib/env.ts`: every variable required, no `.default()`, keys match the committed `.env.example`. `PORT` is the Vite dev and preview port only (not `VITE_`, never imported by app code). Public client values are `VITE_*`, read only inside this module from `import.meta.env`. No secrets, API keys with write access, or connection strings in the web repo or Vercel env.
6. Never send tokens, passwords, emails, or diary/food/body contents to logs, Sentry, or analytics. Sentry session replays mask all inputs and text.

**Data correctness**
7. The API speaks metric only: weight kg (up to 3 decimals), length cm, time seconds, distance meters. Convert kg<->lb only at display/input, only via `src/shared/lib/units`. Never store converted values.
8. Every day-scoped write sends `local_date` (YYYY-MM-DD in the user's account IANA time zone) plus a UTC timestamp. Never derive the local date from `toISOString()` or the device time zone silently.
9. Ids of new records are generated on the client as UUIDv7, so a retried POST is idempotent. Never regenerate an id on retry.

**Workout recording (core product flow, target <= 5 s per set)**
10. The whole in-progress workout lives in the Zustand `persist` draft and survives reload and offline. Logging a set makes no network request. On "Finish" exactly ONE `POST /api/workouts` sends the aggregate. Clear the draft only after a 2xx; on failure keep it and let the user retry.
11. "Last time" hints come from ONE `GET` with all exercise ids in the query, not one request per exercise.

**Resilience and cost**
12. Calendar = parallel requests to core and nutrition (TanStack Query). If nutrition fails, the calendar still renders without calories.
13. Onboarding writes profile to core and body + goal to nutrition with idempotent requests; the "onboarding done" flag is set LAST.
14. The service worker never caches `/api/*` responses (no offline API cache in MVP). Exercise images are WebP in `public/exercises/` served by the Vercel CDN, never from Cloud Run or a hotlinked third party.
15. No polling, no intervals, no background requests that keep backend services or Neon awake. The only exception is the warm-up: one parallel `GET /health` per service on app open (phase 8).

**UI**
16. Every user-visible string goes through react-i18next keys. No hardcoded copy in components, including `aria-label`, placeholders, and toasts.
17. Mobile-first: design for a ~375 px viewport first, tap targets >= 44 px, numeric inputs use `inputMode="decimal"` / `"numeric"`. Every async view has loading, empty, and error states.

Rule details and rationale: [reference/api-and-auth.md](reference/api-and-auth.md), [reference/frontend-patterns.md](reference/frontend-patterns.md), [reference/delivery.md](reference/delivery.md).

## 4. Conventions

- Layout: `src/app/` (router, providers, root layout), `src/features/<feature>/` (auth, onboarding, profile, exercises, workouts, calendar, nutrition), `src/shared/` (ui = shadcn, api, i18n, analytics, lib). Import direction: `app -> features -> shared`. `shared` never imports `features` or `app`; a feature uses another feature only through its `index.ts`.
- Server data lives only in TanStack Query. Never copy query data into Zustand or `useState`, never fetch in `useEffect`. Query keys come from one factory per feature.
- Forms: one Zod schema per form in the feature's `model/`, wired with `zodResolver`. Validation messages are i18n keys.
- TypeScript: no `any`, no non-null `!` and no `as` casts on API data; narrow with types or Zod. Do not disable lint rules inline to make code pass.
- Components: function components, named exports, one component per file, small and focused. shadcn primitives live in `src/shared/ui` and are composed, not forked per feature.
- Match the style of neighbouring code. No unrelated refactors, no drive-by renames.

Patterns with examples: [reference/frontend-patterns.md](reference/frontend-patterns.md).

## 5. Looking things up

**Spec.** Private and git-ignored: `specs/onemore-spec.md` (~1760 lines, Russian, shared with the backend). **Never read it whole.** The Grep tool hides it (`.gitignore`), so use the shell with `--no-ignore`:

```bash
rg --no-ignore -n "Vercel" specs/onemore-spec.md
rg --no-ignore -n "^#{1,3} " specs/onemore-spec.md      # outline
```

Then `Read` with `offset`/`limit`. Section map: [reference/scope-and-status.md](reference/scope-and-status.md).
This skill and its references are the distilled truth; open the spec only for a detail they lack. Later spec stages override earlier ones (5, 6 > 4 > 1, 3). Items marked 🟡 ОТКРЫТО / 🧪 ТЕСТ are NOT decided: ask.

**Backend contract.** The source of truth for the API is `apps/<service>/openapi.json` in the backend repo (locally usually `../onemore-be/`). Read it before writing any type, query, or mutation. If it is not reachable, ask the user to paste the relevant part. Do not guess.

## 6. Planner workflow

1. Restate the goal in 1-2 sentences and name the roadmap phase ([reference/scope-and-status.md](reference/scope-and-status.md)).
2. Read only the relevant spec sections, the existing code, and the backend `openapi.json` for every endpoint involved. Do not guess file contents or API shapes.
3. Check the plan against section 3 and MVP scope. If a requirement conflicts, say so and propose an alternative instead of silently bending the rule.
4. Make every design decision yourself (component split, state location, query keys, routes, i18n keys). The implementer is a faster model that follows the plan literally and must not have to decide anything.
5. Save the plan to `.planning/<slug>.md` (git-ignored) so the implementer chat can read it, using this template:

```markdown
# <title>
Phase: <n> · Spec refs: <headings>
## Goal
## Out of scope (do NOT touch)
## Decisions already made (do not revisit)
## API used (method, path, query/body type, response type, source openapi.json)
## Steps (ordered, each = one small verifiable change)
1. <exact file path> - <create|change> - <what> - props/signatures/types/Zod schema if non-trivial
## UI states (loading / empty / error / success, per screen)
## i18n keys to add (key -> English text)
## Tests to write (file, name, what each asserts)
## Verify (exact commands that must pass + manual check in a 375 px viewport)
## Risks / open questions for the user
```

6. Be concrete: exact paths, component names and props, hook signatures, query keys, route paths. Write contracts, not full implementations.
7. If the task settles something listed as open in [reference/scope-and-status.md](reference/scope-and-status.md), add a step to update this skill. Stop after the plan; do not implement unless asked.

## 7. Implementer workflow

1. If a plan exists (`.planning/*.md` or in chat), read it first and follow it literally. Scope = the files and steps in the plan.
2. If the plan is ambiguous, wrong, conflicts with section 3, or needs an API that `openapi.json` does not have: STOP and report. Do not improvise a design and do not weaken a hard rule.
3. Work step by step. After each step run the narrowest check (typecheck, the relevant test). Fix before moving on.
4. Write the tests listed in the plan together with the code. `shared/lib` helpers (units, dates), stores (workout draft), and form schemas always get unit tests.
5. Never add dependencies, files, routes, endpoints, or abstractions the plan does not mention. Add shadcn components only if the plan names them. No drive-by refactors.
6. Before saying "done": run the plan's Verify commands and report their real output (`pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, once they exist). Never claim success without running them. Commit messages are Conventional Commits; do not pass `--no-verify` unless the user asks.
7. Do not commit, push, or touch `specs/` or `.planning/` unless the user asks. Do not open a browser unless the user asks; instead say how to check the result.
8. Final message: what changed (file list), what was verified (commands + result), anything deviating from the plan or left open. Keep it short.
