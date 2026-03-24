CREATE TABLE `feature_limits` (
	`user_id` text PRIMARY KEY NOT NULL,
	`is_premium` integer DEFAULT false NOT NULL,
	`custom_palaces` integer DEFAULT 0 NOT NULL,
	`custom_lessons_per_palace` integer DEFAULT 0 NOT NULL,
	`custom_locations_per_palace` integer DEFAULT 0 NOT NULL,
	`custom_words_per_lesson` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_synced_at` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `mission_ui_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_synced_at` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`key` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`metric_type` text NOT NULL,
	`period` text NOT NULL,
	`current_value` integer DEFAULT 0 NOT NULL,
	`target_value` integer DEFAULT 0 NOT NULL,
	`reward_xp` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_completed` integer DEFAULT false NOT NULL,
	`progress_percent` integer DEFAULT 0 NOT NULL,
	`generated_at_utc` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_synced_at` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_palaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`locations_count` integer DEFAULT 0 NOT NULL,
	`thumbnail` text NOT NULL,
	`is_locked` integer DEFAULT false NOT NULL,
	`unlocked_at` text DEFAULT CURRENT_TIMESTAMP,
	`level` integer DEFAULT 1 NOT NULL,
	`is_premium` integer DEFAULT false NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_synced_at` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_palaces`("id", "name", "description", "locations_count", "thumbnail", "is_locked", "unlocked_at", "level", "is_premium", "is_custom", "created_by", "created_at", "updated_at", "last_synced_at", "is_deleted", "deleted_at") SELECT "id", "name", "description", "locations_count", "thumbnail", "is_locked", "unlocked_at", "level", "is_premium", "is_custom", "created_by", "created_at", "updated_at", "last_synced_at", "is_deleted", "deleted_at" FROM `palaces`;--> statement-breakpoint
DROP TABLE `palaces`;--> statement-breakpoint
ALTER TABLE `__new_palaces` RENAME TO `palaces`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `badges` ADD `icon` text;--> statement-breakpoint
ALTER TABLE `badges` ADD `condition_type` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `badges` ADD `condition_value` integer DEFAULT 0 NOT NULL;