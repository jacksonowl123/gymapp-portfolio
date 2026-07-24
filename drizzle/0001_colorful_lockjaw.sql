CREATE TABLE `workout_sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`log_id` integer NOT NULL,
	`exercise_name` text NOT NULL,
	`weight` real NOT NULL,
	`reps` integer NOT NULL
);
