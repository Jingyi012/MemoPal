ALTER TABLE `xp_configs` RENAME COLUMN "xp_amount" TO "base_xp";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_review_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_progress_id` text NOT NULL,
	`review_round` integer NOT NULL,
	`due_date` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`completed_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_synced_at` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_progress_id`) REFERENCES `lesson_progress`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_review_schedules`("id", "user_id", "lesson_progress_id", "review_round", "due_date", "completed", "completed_date", "created_at", "updated_at", "last_synced_at", "is_deleted", "deleted_at") SELECT "id", "user_id", "lesson_progress_id", "review_round", "due_date", "completed", "completed_date", "created_at", "updated_at", "last_synced_at", "is_deleted", "deleted_at" FROM `review_schedules`;--> statement-breakpoint
DROP TABLE `review_schedules`;--> statement-breakpoint
ALTER TABLE `__new_review_schedules` RENAME TO `review_schedules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `xp_configs` ADD `variable_xp` integer DEFAULT 0 NOT NULL;