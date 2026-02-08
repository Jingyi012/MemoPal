ALTER TABLE `lessons` ADD `created_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `palaces` ADD `created_by` text REFERENCES users(id);