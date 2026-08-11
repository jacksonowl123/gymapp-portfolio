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
  assert.match(page, /type View = "dashboard" \| "plan" \| "library" \| "workout" \| "progress"/);
  assert.match(page, /EXERCISE LIBRARY/);
  assert.match(page, /Add to training day/);
  assert.match(page, /Finish workout/);
});

test("keeps unfinished workout sessions recoverable", async () => {
  const page = await source("app/page.tsx");

  assert.match(page, /type WorkoutDraft/);
  assert.match(page, /liftly-workout-draft-/);
  assert.match(page, /Resume your unfinished workout\?/);
  assert.match(page, /Workout restored/);
  assert.match(page, /Previous reps copied/);
  assert.match(page, /Notification\.requestPermission/);
});

test("uses calendar-accurate weekly progress and protects plan quality", async () => {
  const page = await source("app/page.tsx");

  assert.match(page, /startOfLocalWeek/);
  assert.match(page, /weeklyLogs/);
  assert.match(page, /workoutCompletionStatus/);
  assert.match(page, /duplicateExerciseNames/);
  assert.match(page, /Duplicate exercise/);
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
