import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("ships the Liftly product shell and exercise library", async () => {
  const [page, layout] = await Promise.all([
    source("app/page.tsx"),
    source("app/layout.tsx"),
  ]);

  assert.match(layout, /Liftly — Your Adaptive Training Plan/);
  assert.match(page, /type View = "dashboard" \| "plan" \| "library" \| "workout" \| "progress" \| "coach"/);
  assert.match(page, /EXERCISE LIBRARY/);
  assert.match(page, /Add to training day/);
  assert.match(page, /Finish workout/);
  assert.match(page, /Build a plan that fits your week/);
});

test("keeps unfinished workout sessions recoverable", async () => {
  const page = await source("app/page.tsx");

  assert.match(page, /type WorkoutDraft/);
  assert.match(page, /liftly-workout-draft-/);
  assert.match(page, /Resume your unfinished workout\?/);
  assert.match(page, /Workout restored/);
  assert.match(page, /MAX_DRAFT_IDLE_SECONDS/);
  assert.match(page, /inactive time was not added/);
  assert.match(page, /Previous reps copied/);
  assert.match(page, /NotificationClass\.requestPermission/);
  assert.match(page, /const \[isOnline, setIsOnline\] = useState\(true\)/);
  assert.match(page, /setIsOnline\(navigator\.onLine\)/);
});

test("uses calendar-accurate weekly progress and protects plan quality", async () => {
  const [page, styles] = await Promise.all([
    source("app/page.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(page, /startOfLocalWeek/);
  assert.match(page, /weeklyLogs/);
  assert.match(page, /workoutCompletionStatus/);
  assert.match(page, /duplicateExerciseNames/);
  assert.match(page, /Duplicate exercise/);
  assert.match(page, /disabled={saving \|\| hasPlanDuplicates}/);
  assert.match(page, /Remove duplicates/);
  assert.match(styles, /\.setLoggerRow > \.doneControl/);
  assert.match(styles, /\.loggerRow > \.doneControl/);
});

test("supports supersets and drop sets in My Plan and workout logging", async () => {
  const [page, styles] = await Promise.all([
    source("app/page.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(page, /type SetTechnique = "straight" \| "superset" \| "drop-set"/);
  assert.match(page, /Superset with next/);
  assert.match(page, /Drop set/);
  assert.match(page, /dropSetStages/);
  assert.match(page, /Final-set drop sequence/);
  assert.match(page, /Superset order/);
  assert.match(page, /Final-set drops/);
  assert.match(page, /workoutTechniqueMeta/);
  assert.match(page, /without resting/);
  assert.match(styles, /\.techniqueCue\.drop-set/);
  assert.match(styles, /\.exerciseEditRow\.supersetLead/);
  assert.match(styles, /\.dropSetLoggerRow/);
  assert.match(styles, /\.supersetSequence/);
  assert.match(page, /const supersetLeadExercise = supersetPartner/);
  assert.match(styles, /\.dropSetSequence[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.addDropStage[\s\S]*?grid-column: 1 \/ -1/);
});

test("keeps the expanded plan editor contained on laptop and tablet widths", async () => {
  const styles = await source("app/globals.css");

  assert.match(styles, /@media \(max-width: 1500px\)[\s\S]*?\.planWorkspace[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.exerciseEditRow[\s\S]*?grid-template-columns: 44px minmax\(90px, 1fr\) 60px 64px/);
  assert.match(styles, /\.duplicateExerciseWarning[\s\S]*?flex-wrap: wrap/);
});

test("supports iPad Air and iPhone Pro Max safe responsive layouts", async () => {
  const [page, layout, styles] = await Promise.all([
    source("app/page.tsx"),
    source("app/layout.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(layout, /width: "device-width"/);
  assert.match(layout, /viewportFit: "cover"/);
  assert.match(styles, /@media \(max-width: 1100px\)[\s\S]*?\.sidebar[\s\S]*?display: none/);
  assert.match(styles, /\.mobileNav[\s\S]*?safe-area-inset-bottom/);
  assert.match(styles, /@media \(min-width: 901px\) and \(max-width: 1100px\)/);
  assert.match(styles, /\.appPage button,[\s\S]*?min-height: 44px/);
  assert.match(styles, /\.appPage button,[\s\S]*?min-width: 44px/);
  assert.match(styles, /\.confirmModal > div button,[\s\S]*?min-height: 44px/);
  assert.match(styles, /\.appPage:has\(\.planSaveAction\)[\s\S]*?padding-bottom/);
  assert.match(page, /className={`mobileAccount\$\{account\.signedIn/);
  assert.match(page, /account\.signedIn \? "Sync active" : "Sign in to sync"/);
  assert.match(styles, /@media \(max-width: 1100px\)[\s\S]*?\.mobileAccount[\s\S]*?display: flex/);
});

test("persists workout notes in D1 with a migration", async () => {
  const [route, schema, migration] = await Promise.all([
    source("app/api/fitness/route.ts"),
    source("db/schema.ts"),
    source("drizzle/0003_smiling_leper_queen.sql"),
  ]);

  assert.match(schema, /note: text\("note"\)\.notNull\(\)\.default\(""\)/);
  assert.match(route, /ALTER TABLE workout_logs ADD COLUMN note/);
  assert.match(route, /safeText\(payload\.note, 500\)/);
  assert.match(migration, /ALTER TABLE `workout_logs` ADD `note` text DEFAULT '' NOT NULL/);
});

test("syncs account-scoped training data with retry-safe offline writes", async () => {
  const [page, route, schema, migration] = await Promise.all([
    source("app/page.tsx"),
    source("app/api/fitness/route.ts"),
    source("db/schema.ts"),
    source("drizzle/0004_overjoyed_legion.sql"),
  ]);

  assert.match(route, /oai-authenticated-user-id/);
  assert.match(route, /accountProfileId/);
  assert.match(route, /body_weight_logs/);
  assert.match(route, /client_id/);
  assert.match(schema, /bodyWeightLogs/);
  assert.match(migration, /CREATE TABLE `body_weight_logs`/);
  assert.match(page, /liftly-sync-queue-/);
  assert.match(page, /Offline changes synced/);
});

test("ships an installable shell and a focused one-exercise workout flow", async () => {
  const [page, layout, manifest, worker, packageJson, assetVersioner] = await Promise.all([
    source("app/page.tsx"),
    source("app/layout.tsx"),
    source("public/manifest.webmanifest"),
    source("public/sw.js"),
    source("package.json"),
    source("scripts/version-static-assets.mjs"),
  ]);

  assert.match(layout, /manifest: "\/manifest.webmanifest"/);
  assert.match(manifest, /"display": "standalone"/);
  assert.match(manifest, /liftly-icon-512\.png/);
  assert.match(worker, /liftly-shell-v2/);
  assert.match(worker, /fetch\(request, \{ cache: "no-cache" \}\)/);
  assert.match(packageJson, /version-static-assets\.mjs/);
  assert.match(assetVersioner, /createHash\("sha256"\)/);
  assert.match(assetVersioner, /\?v=\$\{version\}/);
  assert.match(page, /serviceWorker\.register\("\/sw\.js"\)/);
  assert.match(page, /activeWorkoutExercise/);
  assert.match(page, /Change session/);
  assert.match(page, /Exercise \{activeWorkoutExercise \+ 1\} of/);
});
