# Delivery reference (tooling, CI, Vercel, env, monitoring)

Read when touching `package.json` scripts, lint/format config, git hooks, GitHub Actions, `vercel.json`, env vars, Sentry, Dependabot, or anything that deploys. Spec: "6. DevOps План" (web parts) and "4. Решить Tech Stack" (Vercel).

## Tooling (mirror onemore-be where it applies)
- Pin versions: `.nvmrc` = `24`, `packageManager` = `pnpm@10.x` (same as backend), `engines.node >= 24`.
- Root scripts: `dev`, `build` (`tsc -b && vite build` or equivalent), `preview`, `lint`, `format:check`, `typecheck` (`tsc --noEmit`), `test` (Vitest), `test:e2e` (Playwright).
- Git hooks like the backend: husky + lint-staged (ESLint `--fix` + Prettier on staged files, then typecheck) on pre-commit; commitlint with Conventional Commits on commit-msg; lint, format:check, typecheck, test on pre-push.
- Repo is public. Default branch `main`: PR only, required check `ci-ok`, squash merge, no force push.

## CI on pull request (GitHub Actions, `.github/workflows/ci.yml`)
Jobs: `lint` (ESLint + Prettier `--check`) · `typecheck` · `test` (Vitest) · `build` (`vite build`) · `ci-ok` (aggregator, the ONLY required check; a skipped required check blocks merges forever).
- Run on every PR without path filters.
- No secrets on `pull_request`; never use `pull_request_target`.
- `e2e-full.yml` (manual / before release / after API client changes): checks out `onemore-be`, runs `docker compose --profile full up`, then Playwright "record a workout" in a mobile viewport against it.
- `dependabot.yml`: npm (grouped, weekly) and github-actions.

## Vercel Hobby
- Git integration: preview deployment per PR, production from `main`. No `vercel` CLI deploys from CI.
- Limits: 100 GB traffic / month, 1M CDN requests, 100 deploys / day, 100 MB static per CLI deploy. Over the limit the project is paused, no bill.
- Non-commercial use only. Paid features need Pro or other hosting: raise it before building anything paid.
- `vercel.json`: SPA fallback to `index.html` for client routes, plus `/api/*` rewrites by domain prefix to the Cloud Run URLs (table in api-and-auth.md). Do not rewrite `/internal/*`.
- Previews call the prod API (only prod and local exist): enable Deployment Protection on previews.
- Rollback: Vercel Instant Rollback, then revert or fix in `main` right away.
- Deploy order on contract changes: backend first, then web.

## Env
- One Zod schema in `src/shared/lib/env.ts`. Every variable is required: no `.default()`. A missing or invalid value throws `Invalid environment: ...` and Vite does not start. A test checks that `.env.example` keys equal the schema keys.
- `PORT` (currently `3000`) is the dev server and `vite preview` port. It is not a `VITE_` variable and is not in the client bundle. `vite.config.ts` loads `.env*` via `loadEnv` and lets the real environment win.
- Public client values, when they appear (Neon Auth URL, Sentry DSN, app version), are `VITE_*` in the same schema. App code reads them only through this module (`import.meta.env`), never directly.
- Local: copy `.env.example` to `.env` (git-ignored; `.env.local` overrides it). CI sets `PORT` in the workflow. Vercel project env: public `VITE_*` only.

## Monitoring (phase 8)
- Sentry Developer plan, organization created in the EU region (cannot be changed later). Frontend only.
- `release` = git SHA; session replay masks all inputs and text; no diary/body/food content or tokens in breadcrumbs or extra data.
- Free tier: 5 000 errors, 50 replays / month; over the limit events are dropped, no bill.

## Performance budget
- Cold backend + Neon wake can make the first request 2-4 s: skeletons and loading states, never blank screens.
- Keep the initial bundle small: route-level code splitting via the router; exercise images lazy-loaded WebP.
