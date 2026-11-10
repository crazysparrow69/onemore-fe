# Scope, roadmap, status, spec map

Read when planning a task, deciding if something is in scope, or locating a spec section.

## Product
Diary of workouts and nutrition for gym-goers; AI (later) sees both and suggests changes. Mobile-first web, installable PWA. 10-20 h/week, ~3 months to MVP.
MVP is done when: I log all workouts + nutrition for 4 weeks; >= 3 friends use it weekly; logging one set takes <= 5 s.
Frontend learning goal: the PWA installs on a phone and the workout draft survives a reload.

## MVP (v0.1) screens and features
- **Auth:** sign-in / sign-up by email and Google (Neon Auth).
- **Onboarding:** sex, birth date, height, activity, experience, equipment, limitations, goal (lose / maintain / gain / recomp) + weekly rate, units kg/lb. Writes to core and nutrition (see api-and-auth.md).
- **Profile / settings:** language, units, IANA time zone, training profile; weight log with dates (history, not a profile field).
- **Exercises:** catalog from free-exercise-db (list, search, card with description, technique, muscles, photo); private exercises (name, description, type, primary/secondary muscles). Types: weight x reps, bodyweight x reps, time, distance + time. Set inputs depend on the type.
- **Workouts:** record from scratch or from a template; sets, weight, reps, comments; "last time" hint per exercise; rest timer; local draft; templates CRUD.
- **Schedule + calendar:** weekly schedule from templates, planned day; month calendar showing plan vs fact and calories.
- **Nutrition:** daily kcal + macros target (computed by the backend), entries (name, amount, kcal, macros, meal), remaining for the day, autosuggest from own history. Manual entry only, NO food database.

## Not in MVP (do not build or scaffold)
AI (any `/api/ai` UI), progress charts, food DB / barcode / photo recognition, social / friends feed, trainers and payments, mobile app, wearables / Apple Health, public custom exercises, user image uploads (Cloudinary), landing page, full offline mode, GDPR export/delete UI, CSV import.

## Roadmap
v0.1 MVP -> v0.2 charts (est. 1RM, records, sets/muscle/week, weight trend) + weekly AI review + AI food-from-text; contracts move to an npm package (web consumes it via Dependabot) -> v0.3 AI coach (program generator, chat, food photo, Open Food Facts barcode from the browser, Cloudinary) -> v0.4 friends feed, program by link, coach read access -> v1.0 GDPR, offline, translations, landing, adaptive TDEE, CSV import. Later: React Native, trainer marketplace with billing.

## Implementation phases (spec section 7) and the web part of each
1 Skeleton: Vite + React repo, CI on PR, Vercel deploy (preview per PR, prod from `main`), `vercel.json` rewrite `/api/*` to core-service (checks `/health`).
2 Backend only (safe deploy, DB). Nothing in web.
3 Web base: routing, UI kit, i18n, PWA, analytics (if decided); sign-in via Neon Auth (email + Google); account settings (language, units, time zone, training profile).
4 Exercises: WebP images in `public/exercises/` (check size); catalog list, search, card; private exercises.
5 Workouts: record from scratch, local draft, single POST on finish, e2e "record a workout", last-time hints + rest timer, templates, workout from template.
6 Nutrition: body, goal, weight log; daily target; diary + remaining; autosuggest; full onboarding (profile + body + goal).
7 Schedule + month calendar (plan, fact, calories; works without nutrition).
8 Launch prep: Sentry in web, warm-up `/health` calls on app open, runbook for Vercel rollback.
9 Real-life MVP check. 10 v0.2+.

## Decided
- UI locales are English and Ukrainian. Ukrainian is the default; English is the fallback and the source of key types. The account `language` sent to `PUT /api/me` stays `en` until the backend language enum includes `uk`.

## Open / undecided (ask the user, do not assume)
- Analytics: PostHog EU is still the candidate, limits unchecked (🟡). Skipped in phase 3 by user decision. Do not add any analytics SDK until decided.
- TanStack Router: code-based routes (decided in phase 3). No generated route tree and no router Vite plugin.
- UUIDv7 generation: which library (or a small own helper). Decide when the first client id is needed.
- API mocking (MSW): not decided. Component tests use Vitest + jsdom + Testing Library.
- Vercel: rewrite to two Cloud Run services, `Authorization` passthrough and proxy timeout are 🧪 not tested yet; Hobby is non-commercial only (trainer subscriptions would need Pro or other hosting).
- free-exercise-db WebP total size vs the 100 MB Vercel CLI static limit: 🧪 not measured.
- Vercel Deployment Protection on previews (previews call the prod API): to be configured.

## Spec map (find with `rg --no-ignore -n "<text>" specs/onemore-spec.md`, then Read with offset/limit; line numbers approximate)
| Topic | Text to search | ~Line |
|---|---|---|
| Sentry, logging rules | `# \*\*📈 Логи и мониторинг` | 435-465 |
| Idea, MVP modules, out of scope, roadmap | `MVP: «я и друзья` / `Дорожная карта` | 635-690 |
| Data-model must-haves (units, history, visibility) | `Заложить в модель` | 687-695 |
| free-exercise-db, Open Food Facts browser limits | `free-exercise-db` | 697-728 |
| Learning goals (frontend row) | `Learning goals` | 730-745 |
| Frontend stack table, why not Next.js | `Фронтенд: React` | 1078-1091 |
| Vercel Hobby limits and risks | `Хостинг фронтенда: Vercel` | 1093-1108 |
| Images (exercise WebP, Cloudinary later) | `около 800 штук` | 1110-1123 |
| Repos, why web is separate, contract drift measures | `Репозитории` | 1228-1248 |
| No gateway, rewrites, calendar, onboarding, warm-up | `Нужен ли API Gateway` | 1341-1353 |
| Shared types are duplicated by hand | `Где хранить общие типы` | 1365-1372 |
| Local run, Vite proxy | `Как запускать локально` | 1374-1381 |
| Record-workout flow | `Запись тренировки` | 1385-1390 |
| Data model decisions | `Модель данных: основные` | 1402-1418 |
| Web repo layout | `Репозиторий web` | 1446-1449 |
| Web CI, Vercel, Playwright cadence | `### **web**` | 1581-1585 |
| Rollback (Vercel Instant Rollback), secrets in Vercel env | `Instant Rollback` / `Только публичные` | 1602-1627 |
| Development plan (phases 1-10) | `Каркас проекта` | 1690-1764 |
