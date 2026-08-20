import { env } from "cloudflare:workers";

type FitnessEnv = { DB?: D1Database };
type AccountIdentity = { id: string; displayName: string };

function database() {
  const db = (env as FitnessEnv).DB;
  if (!db) throw new Error("Training storage is not available yet.");
  return db;
}

async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS fitness_profiles (
      id TEXT PRIMARY KEY NOT NULL, goal TEXT NOT NULL, experience TEXT NOT NULL,
      days INTEGER NOT NULL, equipment TEXT NOT NULL, plan_name TEXT NOT NULL,
      plan_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS workout_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, profile_id TEXT NOT NULL, client_id TEXT,
      workout_name TEXT NOT NULL, duration INTEGER NOT NULL,
      exercises_completed INTEGER NOT NULL, total_exercises INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '', performed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS workout_logs_profile_date_idx
      ON workout_logs (profile_id, performed_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT, log_id INTEGER NOT NULL,
      exercise_name TEXT NOT NULL, set_number INTEGER NOT NULL DEFAULT 1,
      weight REAL NOT NULL, reps INTEGER NOT NULL,
      FOREIGN KEY (log_id) REFERENCES workout_logs(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS workout_sets_log_idx ON workout_sets (log_id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS body_weight_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, profile_id TEXT NOT NULL, client_id TEXT,
      weight REAL NOT NULL, recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS body_weight_logs_profile_date_idx
      ON body_weight_logs (profile_id, recorded_at)`),
  ]);

  const result = await db.prepare("PRAGMA table_info(workout_logs)").all();
  const columns = result.results as Array<Record<string, unknown>>;
  if (!columns.some((column) => column.name === "note")) {
    await db.prepare("ALTER TABLE workout_logs ADD COLUMN note TEXT NOT NULL DEFAULT ''").run();
  }
  if (!columns.some((column) => column.name === "client_id")) {
    await db.prepare("ALTER TABLE workout_logs ADD COLUMN client_id TEXT").run();
  }
  await db.batch([
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS workout_logs_client_id_unique
      ON workout_logs (client_id) WHERE client_id IS NOT NULL`),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS body_weight_logs_client_id_unique
      ON body_weight_logs (client_id) WHERE client_id IS NOT NULL`),
  ]);
}

function validProfileId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{16,80}$/.test(value);
}

function validClientId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{16,100}$/.test(value);
}

function safeText(value: unknown, maxLength = 80) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function decodedHeader(value: string | null) {
  if (!value) return "";
  try { return decodeURIComponent(value); } catch { return value; }
}

function accountIdentity(request: Request): AccountIdentity | null {
  const id = request.headers.get("oai-authenticated-user-id");
  if (!id) return null;
  const fullName = decodedHeader(request.headers.get("oai-authenticated-user-full-name"));
  const email = request.headers.get("oai-authenticated-user-email") ?? "";
  return { id, displayName: fullName || email.split("@")[0] || "Liftly member" };
}

async function accountProfileId(userId: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `account-${hex.slice(0, 48)}`;
}

async function resolveProfile(request: Request, claimedProfileId: unknown) {
  const account = accountIdentity(request);
  if (account) {
    return {
      account,
      profileId: await accountProfileId(account.id),
      legacyProfileId: validProfileId(claimedProfileId) ? claimedProfileId : null,
    };
  }
  if (!validProfileId(claimedProfileId)) throw new Error("A valid profile is required.");
  return { account: null, profileId: claimedProfileId, legacyProfileId: null };
}

async function migrateDeviceData(
  db: D1Database,
  legacyProfileId: string | null,
  accountProfile: string,
) {
  if (!legacyProfileId || legacyProfileId === accountProfile) return;
  await db.prepare(`INSERT INTO fitness_profiles
    (id, goal, experience, days, equipment, plan_name, plan_json, updated_at)
    SELECT ?, goal, experience, days, equipment, plan_name, plan_json, updated_at
    FROM fitness_profiles WHERE id = ? ON CONFLICT(id) DO NOTHING
  `).bind(accountProfile, legacyProfileId).run();
  await db.batch([
    db.prepare("UPDATE workout_logs SET profile_id = ? WHERE profile_id = ?")
      .bind(accountProfile, legacyProfileId),
    db.prepare("UPDATE body_weight_logs SET profile_id = ? WHERE profile_id = ?")
      .bind(accountProfile, legacyProfileId),
  ]);
}

async function workoutSetsForLog(db: D1Database, logId: number) {
  const result = await db.prepare(`SELECT exercise_name AS exerciseName,
    set_number AS setNumber, weight, reps FROM workout_sets
    WHERE log_id = ? ORDER BY id ASC`).bind(logId).all();
  return (result.results as Array<Record<string, unknown>>).map((set) => ({
    exerciseName: String(set.exerciseName), setNumber: Number(set.setNumber),
    weight: Number(set.weight), reps: Number(set.reps),
  }));
}

export async function GET(request: Request) {
  const claimedProfileId = new URL(request.url).searchParams.get("profileId");
  try {
    const db = database();
    await ensureSchema(db);
    const identity = await resolveProfile(request, claimedProfileId);
    await migrateDeviceData(db, identity.legacyProfileId, identity.profileId);

    const [profileResult, logsResult, setsResult, bodyWeightsResult] = await db.batch([
      db.prepare(`SELECT id, goal, experience, days, equipment,
        plan_name AS planName, plan_json AS planJson, updated_at AS updatedAt
        FROM fitness_profiles WHERE id = ?`).bind(identity.profileId),
      db.prepare(`SELECT id, workout_name AS workoutName, duration,
        exercises_completed AS exercisesCompleted, total_exercises AS totalExercises,
        note, performed_at AS performedAt FROM workout_logs WHERE profile_id = ?
        ORDER BY performed_at DESC, id DESC LIMIT 100`).bind(identity.profileId),
      db.prepare(`SELECT workout_sets.log_id AS logId,
        workout_sets.exercise_name AS exerciseName, workout_sets.set_number AS setNumber,
        workout_sets.weight, workout_sets.reps FROM workout_sets
        INNER JOIN workout_logs ON workout_logs.id = workout_sets.log_id
        WHERE workout_logs.profile_id = ?
        ORDER BY workout_logs.performed_at DESC, workout_sets.id ASC`).bind(identity.profileId),
      db.prepare(`SELECT id, weight, recorded_at AS recordedAt FROM body_weight_logs
        WHERE profile_id = ? ORDER BY recorded_at DESC, id DESC LIMIT 100`).bind(identity.profileId),
    ]);

    const setsByLog = new Map<number, Array<Record<string, unknown>>>();
    for (const set of setsResult.results as Array<Record<string, unknown>>) {
      const logId = Number(set.logId);
      const current = setsByLog.get(logId) ?? [];
      current.push({ exerciseName: set.exerciseName, setNumber: Number(set.setNumber),
        weight: Number(set.weight), reps: Number(set.reps) });
      setsByLog.set(logId, current);
    }

    return Response.json({
      account: { signedIn: Boolean(identity.account),
        displayName: identity.account?.displayName ?? "Device profile" },
      profileId: identity.profileId,
      profile: profileResult.results[0] ?? null,
      logs: (logsResult.results as Array<Record<string, unknown>>).map((log) => ({
        ...log, sets: setsByLog.get(Number(log.id)) ?? [],
      })),
      bodyWeights: (bodyWeightsResult.results as Array<Record<string, unknown>>).map((entry) => ({
        id: Number(entry.id), weight: Number(entry.weight), recordedAt: entry.recordedAt,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load training data.";
    return Response.json({ error: message },
      { status: message === "A valid profile is required." ? 400 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const db = database();
    await ensureSchema(db);
    const identity = await resolveProfile(request, payload.profileId);
    await migrateDeviceData(db, identity.legacyProfileId, identity.profileId);

    if (payload.action === "save-plan") {
      const profile = payload.profile as Record<string, unknown> | undefined;
      const plan = payload.plan as Record<string, unknown> | undefined;
      const goal = safeText(profile?.goal);
      const experience = safeText(profile?.experience);
      const equipment = safeText(profile?.equipment);
      const days = Number(profile?.days);
      const planName = safeText(plan?.name);
      const planJson = JSON.stringify(plan ?? {});
      if (!goal || !experience || !equipment || !planName || !Number.isInteger(days) ||
        days < 1 || days > 7 || planJson.length > 30000) {
        return Response.json({ error: "The training plan is invalid." }, { status: 400 });
      }
      await db.prepare(`INSERT INTO fitness_profiles
        (id, goal, experience, days, equipment, plan_name, plan_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET goal = excluded.goal,
          experience = excluded.experience, days = excluded.days,
          equipment = excluded.equipment, plan_name = excluded.plan_name,
          plan_json = excluded.plan_json, updated_at = CURRENT_TIMESTAMP
      `).bind(identity.profileId, goal, experience, days, equipment, planName, planJson).run();
      return Response.json({ saved: true, profileId: identity.profileId });
    }

    if (payload.action === "log-bodyweight") {
      const weight = Number(payload.weight);
      const clientId = validClientId(payload.clientId) ? payload.clientId : null;
      if (!Number.isFinite(weight) || weight < 25 || weight > 400 || !clientId) {
        return Response.json({ error: "Enter a body weight between 25 and 400 kg." }, { status: 400 });
      }
      const existing = await db.prepare(`SELECT id, weight, recorded_at AS recordedAt
        FROM body_weight_logs WHERE client_id = ?`).bind(clientId).first();
      if (existing) return Response.json({ bodyWeight: existing, alreadySaved: true });
      const bodyWeight = await db.prepare(`INSERT INTO body_weight_logs
        (profile_id, client_id, weight) VALUES (?, ?, ?)
        RETURNING id, weight, recorded_at AS recordedAt
      `).bind(identity.profileId, clientId, weight).first();
      return Response.json({ bodyWeight }, { status: 201 });
    }

    if (payload.action === "log-workout") {
      const workoutName = safeText(payload.workoutName);
      const clientId = validClientId(payload.clientId) ? payload.clientId : null;
      const duration = Number(payload.duration);
      const exercisesCompleted = Number(payload.exercisesCompleted);
      const totalExercises = Number(payload.totalExercises);
      const note = safeText(payload.note, 500);
      const sets = Array.isArray(payload.sets) ? payload.sets.slice(0, 100).flatMap((value) => {
        const set = value as Record<string, unknown>;
        const exerciseName = safeText(set.exerciseName);
        const setNumber = Number(set.setNumber);
        const weight = Number(set.weight);
        const reps = Number(set.reps);
        if (!exerciseName || !Number.isInteger(setNumber) || setNumber < 1 || setNumber > 20 ||
          !Number.isFinite(weight) || weight < 0 || weight > 2000 ||
          !Number.isInteger(reps) || reps < 1 || reps > 1000) return [];
        return [{ exerciseName, setNumber, weight, reps }];
      }) : [];

      if (!workoutName || !clientId || !Number.isInteger(duration) || duration < 1 ||
        duration > 300 || !Number.isInteger(exercisesCompleted) ||
        !Number.isInteger(totalExercises) || exercisesCompleted < 1 ||
        exercisesCompleted > totalExercises || totalExercises > 50) {
        return Response.json({ error: "The workout log is invalid." }, { status: 400 });
      }

      const existing = await db.prepare(`SELECT id, workout_name AS workoutName, duration,
        exercises_completed AS exercisesCompleted, total_exercises AS totalExercises,
        note, performed_at AS performedAt FROM workout_logs WHERE client_id = ?
      `).bind(clientId).first();
      if (existing) {
        return Response.json({ log: { ...existing,
          sets: await workoutSetsForLog(db, Number(existing.id)) },
          personalRecords: [], alreadySaved: true });
      }

      const bestResult = sets.length ? await db.prepare(`SELECT
        workout_sets.exercise_name AS exerciseName, MAX(workout_sets.weight) AS maxWeight
        FROM workout_sets INNER JOIN workout_logs ON workout_logs.id = workout_sets.log_id
        WHERE workout_logs.profile_id = ? GROUP BY workout_sets.exercise_name
      `).bind(identity.profileId).all() : { results: [] };
      const previousBests = new Map(
        (bestResult.results as Array<Record<string, unknown>>).map((best) =>
          [String(best.exerciseName).toLowerCase(), Number(best.maxWeight)]),
      );
      const personalRecords = Array.from(new Set(sets
        .filter((set) => set.weight > (previousBests.get(set.exerciseName.toLowerCase()) ?? 0))
        .map((set) => set.exerciseName)));

      const result = await db.prepare(`INSERT INTO workout_logs
        (profile_id, client_id, workout_name, duration, exercises_completed, total_exercises, note)
        VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, workout_name AS workoutName,
          duration, exercises_completed AS exercisesCompleted,
          total_exercises AS totalExercises, note, performed_at AS performedAt
      `).bind(identity.profileId, clientId, workoutName, duration, exercisesCompleted,
        totalExercises, note).first();
      if (!result) throw new Error("The workout log could not be created.");
      if (sets.length) {
        await db.batch(sets.map((set) => db.prepare(`INSERT INTO workout_sets
          (log_id, exercise_name, set_number, weight, reps) VALUES (?, ?, ?, ?, ?)
        `).bind(result.id, set.exerciseName, set.setNumber, set.weight, set.reps)));
      }
      return Response.json({ log: { ...result, sets }, personalRecords }, { status: 201 });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save training data.";
    return Response.json({ error: message },
      { status: message === "A valid profile is required." ? 400 : 500 });
  }
}
