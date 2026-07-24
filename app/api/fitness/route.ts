import { env } from "cloudflare:workers";

type FitnessEnv = {
  DB?: D1Database;
};

function database() {
  const db = (env as FitnessEnv).DB;
  if (!db) {
    throw new Error("Training storage is not available yet.");
  }
  return db;
}

async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS fitness_profiles (
        id TEXT PRIMARY KEY NOT NULL,
        goal TEXT NOT NULL,
        experience TEXT NOT NULL,
        days INTEGER NOT NULL,
        equipment TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        plan_json TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id TEXT NOT NULL,
        workout_name TEXT NOT NULL,
        duration INTEGER NOT NULL,
        exercises_completed INTEGER NOT NULL,
        total_exercises INTEGER NOT NULL,
        performed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS workout_logs_profile_date_idx
      ON workout_logs (profile_id, performed_at)
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS workout_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER NOT NULL,
        exercise_name TEXT NOT NULL,
        weight REAL NOT NULL,
        reps INTEGER NOT NULL,
        FOREIGN KEY (log_id) REFERENCES workout_logs(id) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS workout_sets_log_idx
      ON workout_sets (log_id)
    `),
  ]);
}

function validProfileId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{16,80}$/.test(value);
}

function safeText(value: unknown, maxLength = 80) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET(request: Request) {
  const profileId = new URL(request.url).searchParams.get("profileId");
  if (!validProfileId(profileId)) {
    return Response.json({ error: "A valid profile is required." }, { status: 400 });
  }

  try {
    const db = database();
    await ensureSchema(db);
    const [profileResult, logsResult, setsResult] = await db.batch([
      db.prepare(`
        SELECT
          id, goal, experience, days, equipment,
          plan_name AS planName, plan_json AS planJson, updated_at AS updatedAt
        FROM fitness_profiles
        WHERE id = ?
      `).bind(profileId),
      db.prepare(`
        SELECT
          id, workout_name AS workoutName, duration,
          exercises_completed AS exercisesCompleted,
          total_exercises AS totalExercises,
          performed_at AS performedAt
        FROM workout_logs
        WHERE profile_id = ?
        ORDER BY performed_at DESC, id DESC
        LIMIT 20
      `).bind(profileId),
      db.prepare(`
        SELECT
          workout_sets.log_id AS logId,
          workout_sets.exercise_name AS exerciseName,
          workout_sets.weight,
          workout_sets.reps
        FROM workout_sets
        INNER JOIN workout_logs ON workout_logs.id = workout_sets.log_id
        WHERE workout_logs.profile_id = ?
        ORDER BY workout_logs.performed_at DESC, workout_sets.id ASC
      `).bind(profileId),
    ]);

    const setsByLog = new Map<number, Array<Record<string, unknown>>>();
    for (const set of setsResult.results as Array<Record<string, unknown>>) {
      const logId = Number(set.logId);
      const current = setsByLog.get(logId) ?? [];
      current.push({
        exerciseName: set.exerciseName,
        weight: Number(set.weight),
        reps: Number(set.reps),
      });
      setsByLog.set(logId, current);
    }

    return Response.json({
      profile: profileResult.results[0] ?? null,
      logs: (logsResult.results as Array<Record<string, unknown>>).map((log) => ({
        ...log,
        sets: setsByLog.get(Number(log.id)) ?? [],
      })),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not load training data." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    if (!validProfileId(payload.profileId)) {
      return Response.json({ error: "A valid profile is required." }, { status: 400 });
    }

    const db = database();
    await ensureSchema(db);

    if (payload.action === "save-plan") {
      const profile = payload.profile as Record<string, unknown> | undefined;
      const plan = payload.plan as Record<string, unknown> | undefined;
      const goal = safeText(profile?.goal);
      const experience = safeText(profile?.experience);
      const equipment = safeText(profile?.equipment);
      const days = Number(profile?.days);
      const planName = safeText(plan?.name);
      const planJson = JSON.stringify(plan ?? {});

      if (!goal || !experience || !equipment || !planName || !Number.isInteger(days) || days < 1 || days > 7 || planJson.length > 30000) {
        return Response.json({ error: "The training plan is invalid." }, { status: 400 });
      }

      await db.prepare(`
        INSERT INTO fitness_profiles
          (id, goal, experience, days, equipment, plan_name, plan_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          goal = excluded.goal,
          experience = excluded.experience,
          days = excluded.days,
          equipment = excluded.equipment,
          plan_name = excluded.plan_name,
          plan_json = excluded.plan_json,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        payload.profileId,
        goal,
        experience,
        days,
        equipment,
        planName,
        planJson,
      ).run();

      return Response.json({ saved: true });
    }

    if (payload.action === "log-workout") {
      const workoutName = safeText(payload.workoutName);
      const duration = Number(payload.duration);
      const exercisesCompleted = Number(payload.exercisesCompleted);
      const totalExercises = Number(payload.totalExercises);
      const sets = Array.isArray(payload.sets)
        ? payload.sets.slice(0, 50).flatMap((value) => {
            const set = value as Record<string, unknown>;
            const exerciseName = safeText(set.exerciseName);
            const weight = Number(set.weight);
            const reps = Number(set.reps);
            if (
              !exerciseName ||
              !Number.isFinite(weight) ||
              weight <= 0 ||
              weight > 2000 ||
              !Number.isInteger(reps) ||
              reps < 1 ||
              reps > 1000
            ) {
              return [];
            }
            return [{ exerciseName, weight, reps }];
          })
        : [];

      if (
        !workoutName ||
        !Number.isInteger(duration) ||
        duration < 1 ||
        duration > 300 ||
        !Number.isInteger(exercisesCompleted) ||
        !Number.isInteger(totalExercises) ||
        exercisesCompleted < 1 ||
        exercisesCompleted > totalExercises ||
        totalExercises > 50
      ) {
        return Response.json({ error: "The workout log is invalid." }, { status: 400 });
      }

      const result = await db.prepare(`
        INSERT INTO workout_logs
          (profile_id, workout_name, duration, exercises_completed, total_exercises)
        VALUES (?, ?, ?, ?, ?)
        RETURNING
          id, workout_name AS workoutName, duration,
          exercises_completed AS exercisesCompleted,
          total_exercises AS totalExercises,
          performed_at AS performedAt
      `).bind(
        payload.profileId,
        workoutName,
        duration,
        exercisesCompleted,
        totalExercises,
      ).first();

      if (!result) {
        throw new Error("The workout log could not be created.");
      }

      if (sets.length) {
        await db.batch(
          sets.map((set) =>
            db.prepare(`
              INSERT INTO workout_sets (log_id, exercise_name, weight, reps)
              VALUES (?, ?, ?, ?)
            `).bind(result.id, set.exerciseName, set.weight, set.reps),
          ),
        );
      }

      return Response.json({ log: { ...result, sets } }, { status: 201 });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save training data." },
      { status: 500 },
    );
  }
}
