CREATE TABLE `body_weight_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` text NOT NULL,
	`client_id` text,
	`weight` real NOT NULL,
	`recorded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `body_weight_logs_profile_date_idx` ON `body_weight_logs` (`profile_id`,`recorded_at`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `body_weight_logs_client_id_unique` ON `body_weight_logs` (`client_id`);--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `client_id` text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `workout_logs_profile_date_idx` ON `workout_logs` (`profile_id`,`performed_at`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `workout_logs_client_id_unique` ON `workout_logs` (`client_id`);
