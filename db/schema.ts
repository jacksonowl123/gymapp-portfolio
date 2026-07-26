import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const fitnessProfiles = sqliteTable("fitness_profiles", {
  id: text("id").primaryKey(),
  goal: text("goal").notNull(),
  experience: text("experience").notNull(),
  days: integer("days").notNull(),
  equipment: text("equipment").notNull(),
  planName: text("plan_name").notNull(),
  planJson: text("plan_json").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workoutLogs = sqliteTable("workout_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: text("profile_id").notNull(),
  workoutName: text("workout_name").notNull(),
  duration: integer("duration").notNull(),
  exercisesCompleted: integer("exercises_completed").notNull(),
  totalExercises: integer("total_exercises").notNull(),
  performedAt: text("performed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workoutSets = sqliteTable("workout_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logId: integer("log_id").notNull(),
  exerciseName: text("exercise_name").notNull(),
  setNumber: integer("set_number").notNull().default(1),
  weight: real("weight").notNull(),
  reps: integer("reps").notNull(),
});
