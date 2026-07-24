CREATE TABLE `fitness_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`goal` text NOT NULL,
	`experience` text NOT NULL,
	`days` integer NOT NULL,
	`equipment` text NOT NULL,
	`plan_name` text NOT NULL,
	`plan_json` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workout_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` text NOT NULL,
	`workout_name` text NOT NULL,
	`duration` integer NOT NULL,
	`exercises_completed` integer NOT NULL,
	`total_exercises` integer NOT NULL,
	`performed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
