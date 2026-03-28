CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_synced_at` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
DROP TABLE `level_configs`;--> statement-breakpoint
DROP TABLE `mission_ui_configs`;--> statement-breakpoint
DROP TABLE `xp_configs`;