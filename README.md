# onemore-fe

Web app for a workout and nutrition tracker. React + Vite, deployed to Vercel (not set up yet).

The backend lives in a separate repository, `onemore-be`.

## Requirements

- Node.js 24 (see `.nvmrc`)
- pnpm 10.26.2 (`packageManager` in the root `package.json`)

TypeScript is pinned to 6.0 (`~6.0.3`). typescript-eslint does not support 7.x yet, and the type-aware lint rules need it.

## Commands

Run from the repository root:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm preview        # serves the production build
```

## Configuration

Every variable in `.env.example` is required and has no default. `vite.config.ts` checks them with Zod and exits with `Invalid environment: ...` if any is missing or invalid.

```bash
cp .env.example .env
```

`PORT` is the Vite dev and preview port (`3000`). It is not sent to the browser. A shell variable with the same name overrides `.env`. CI sets `PORT` in the workflow.

## Git hooks

`pnpm install` turns the hooks on (husky). They run locally; CI runs the same checks plus the production build.

- **pre-commit**: ESLint `--fix` and Prettier on staged files, then `pnpm typecheck`
- **commit-msg**: [Conventional Commits](https://www.conventionalcommits.org/), for example `chore: init web`
- **pre-push**: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`

`git commit --no-verify` and `git push --no-verify` skip the hooks. Use that only on purpose.

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push to any branch and on every pull request to `main` (a PR from a branch of this repo gets both runs):

- `lint`: ESLint and Prettier
- `typecheck`: `tsc -b`
- `test`: Vitest
- `build`: `tsc -b` and `vite build`
- `ci-ok`: aggregates the jobs above; this is the only check the `main` ruleset should require

The jobs use no secrets. `pull_request_target` is not used.

## Layout

```
src/app         root component
src/features    feature modules (added later)
src/shared      ui, api client, i18n, lib (added later)
src/test        Vitest setup
```
