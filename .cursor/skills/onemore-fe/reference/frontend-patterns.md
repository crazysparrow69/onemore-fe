# Frontend patterns reference

Read when creating or changing features, components, state, forms, i18n, units, dates, PWA, or unit tests.

## Repository layout (spec "Репозиторий web")
```
public/exercises/        WebP images from free-exercise-db
src/app/                 router, providers, root layout
src/features/<feature>/  auth, onboarding, profile, exercises, workouts, calendar, nutrition
src/shared/ui/           shadcn/ui primitives
src/shared/api/          API client, error type
src/shared/i18n/         i18next setup, locale JSON files
src/shared/analytics/    (when analytics is decided)
src/shared/lib/          units, dates, ids, small pure helpers
src/test/                Vitest setup (cleanup after each test)
e2e/                     Playwright: "record a workout"
vercel.json  .env.example  .github/workflows/
```

Default inside a feature (the plan may simplify it for a small feature):
```
features/workouts/
  api/          query + mutation hooks, query key factory, request/response types
  components/   feature components
  model/        Zod form schemas, pure feature logic, store (workout draft)
  index.ts      the only public entry for other features and app/
```
Import direction `app -> features -> shared`. Use the `@/` alias for `src/`.

## State: where does it live?
| Data | Place |
|---|---|
| Anything from the API | TanStack Query cache only |
| In-progress workout draft | Zustand `persist` store in `features/workouts/model` |
| Form input | React Hook Form |
| URL-worthy state (selected date, month, tab, search) | router search params |
| Ephemeral UI (open dialog) | local `useState` |

```tsx
// BAD: server data copied into state, fetched in an effect
const [exercises, setExercises] = useState<Exercise[]>([]);
useEffect(() => { api.get('/exercises').then(setExercises); }, []);

// GOOD: query hook from the feature's api/
const { data, isPending, isError, refetch } = useExercises({ search });
```

## Queries and mutations
- One query key factory per feature: `exerciseKeys.list(params)`, `exerciseKeys.detail(id)`.
- After a mutation, invalidate the exact keys it affects (finishing a workout: workouts + calendar + last-time hints).
- Optimistic updates only where the plan says so (e.g. food entries); always roll back on error.
- Do not use `enabled: false` + manual `refetch` to emulate imperative fetching; use a mutation or a search param.

## Workout draft store
- Shape is defined in the plan; it holds ids, exercise refs, sets in metric units, comments, `startedAt` (UTC), `local_date`.
- Store version + `migrate` in `persist` whenever the shape changes, so an old draft on a phone does not crash the app.
- Actions are synchronous and pure; no network calls inside the store. Sending lives in the finish mutation.
- Rest timer derives from timestamps (`Date.now() - restStartedAt`), not from a counter, so it survives backgrounding and reload.

## Units and dates (`src/shared/lib`)
- `units`: `kgToLb`, `lbToKg` (1 lb = 0.45359237 kg), formatting per account unit. Inputs in lb are converted to kg before they reach the API; stored kg keeps 3 decimals so 45 lb round-trips to 45.
- `dates`: `localDate(instant, timeZone)` -> `YYYY-MM-DD` via `Intl.DateTimeFormat('en-CA', { timeZone })` (no extra dependency). The account time zone comes from `GET /api/me`; on onboarding it is prefilled from `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- Calendar math (month grid, week start) via date-fns on `local_date` strings, never on UTC instants.
- These helpers are pure and covered by table-driven Vitest tests.

## Forms
```tsx
const schema = z.object({ weightKg: z.number().positive().max(9999) });
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
```
- Messages are i18n keys (`t('validation.positive')`), never English literals.
- Numeric fields: `inputMode="decimal"`, accept both `,` and `.` as decimal separator.
- Submit button disabled while pending; server errors shown inline.

## i18n
- Locale files are JSON, one per language: `src/shared/i18n/locales/<lang>.json`. Key types come from `typeof` the imported `en.json` in `i18next.d.ts`. No comments or logic in locale files.
- Keys are namespaced by feature: `workouts.finish.button`, `common.retry`, `validation.required`.
- English (`en.json`) is the base locale: key types come from it, and missing keys fall back to it. The default active language is Ukrainian (`uk`): `index.html` `lang` and the i18next `lng` option are `uk`.
- Every new key is added to every locale file in the same change.
- Dates and numbers formatted through `Intl` with the active language, not string concatenation.

## UI
- Mobile-first Tailwind (base styles = phone, `sm:`/`md:` add up). Thumb-reachable primary actions, sticky bottom bar for the workout screen.
- Logging a set must take <= 5 s: prefilled from "last time", +/- steppers, one tap to confirm, no confirm dialogs.
- Use shadcn primitives from `src/shared/ui`; customize via props/variants, do not copy them into features.
- Accessibility: labels on inputs, focus visible, dialogs from shadcn (focus trap built in).

## PWA
- `vite-plugin-pwa`: installable manifest, icons, app-shell precache. `/api/*` is never cached (NetworkOnly). Full offline mode is v1.0.
- On a new service worker version, show a "reload to update" prompt; never reload while a workout draft is being edited.

## Tests
- Vitest + jsdom + Testing Library: component tests in `src/**/*.test.tsx` (import `describe`/`it`/`expect` from `vitest`; globals are off). Setup in `src/test/setup.ts` calls `cleanup` after each test. Also cover `shared/lib` (units, dates, ids), the workout draft store, Zod schemas, and query key factories when non-trivial.
- Do not test user-visible copy. No assertion of a translated string, heading, button label, placeholder, or toast text, and no test whose only job is that a sentence is on screen. Wording lives in the locale JSON and can change without a behavior change. Assert behavior: a request was made, the route changed, a control is `aria-invalid`, a status region appeared or disappeared, an internal error string is not shown. Locate controls by role, input type, or `autocomplete`, not by the translated label.
- Playwright: "record a workout" in a mobile viewport, run before releases and after API client changes, not on every PR.
- API mocking (MSW) is NOT decided: ask before adding.

## Anti-patterns (reject in review)
`any` / `as` on API data · `fetch`/`axios` outside `shared/api` · data fetching in `useEffect` · server data in Zustand · hardcoded user-visible strings · tests that assert UI copy or translation strings · lb or local units sent to the API · `new Date().toISOString().slice(0, 10)` as a local date · one request per exercise for hints · polling · inline `eslint-disable` · new dependency not in the plan.
