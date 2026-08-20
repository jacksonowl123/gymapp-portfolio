# Liftly

Liftly is a full-stack gym planner and lifting tracker. It lets people build a
weekly plan, log each set, use a rest timer, review strength and body-weight
progress, and generate an equipment-aware starting plan with AI Coach.

Live site: [liftly-gym.owljuan.chatgpt.site](https://liftly-gym.owljuan.chatgpt.site/)

## Product features

- seven-day training planner with editable exercises, sets, reps, KG and rest
- drag-and-drop exercise ordering with duplicate-exercise protection
- focused one-exercise-at-a-time workout logger and automatic rest timer
- resumable workout drafts, previous-performance recall and personal records
- progress ranges, volume, completion, estimated 1RM and body-weight tracking
- AI Coach recommendations for full gym, dumbbells-only or bodyweight training
- account-scoped D1 persistence with automatic migration from a device profile
- retry-safe offline write queue and installable PWA shell

## Technology

- React 19, Next.js 16 and Vinext
- Cloudflare Workers and D1
- Drizzle schema and SQL migrations
- OpenAI Sites hosting and account identity headers

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm test
npm run db:generate
```

`npm test` performs a production build and runs the Liftly source regression
suite. Generate a new Drizzle migration whenever `db/schema.ts` changes.

## Data model

- `fitness_profiles`: the current weekly plan and coach inputs
- `workout_logs`: session summary, note and retry-safe client identifier
- `workout_sets`: completed sets with weight and reps
- `body_weight_logs`: dated body-weight check-ins

Authenticated Sites requests are scoped with
`oai-authenticated-user-id`. Anonymous local development falls back to a
random device profile ID. Durable data is stored in D1; local storage is used
only for workout drafts, an offline cache and the pending sync queue.
