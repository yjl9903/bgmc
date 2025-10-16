CREATE TABLE `calendars` (
	`id` integer PRIMARY KEY NOT NULL,
	`weekday` integer NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`onair_at` integer NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`bangumi` text NOT NULL,
	`keywords` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `bangumis`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_id` integer NOT NULL,
	`detail` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `bangumis` ADD `persons` text NOT NULL;--> statement-breakpoint
ALTER TABLE `bangumis` ADD `characters` text NOT NULL;--> statement-breakpoint
ALTER TABLE `bangumis` ADD `subjects` text NOT NULL;