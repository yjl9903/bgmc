PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_calendars` (
	`id` integer PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`weekday` integer,
	`is_active` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_calendars`("id", "platform", "weekday", "is_active") SELECT "id", "platform", "weekday", "is_active" FROM `calendars`;--> statement-breakpoint
DROP TABLE `calendars`;--> statement-breakpoint
ALTER TABLE `__new_calendars` RENAME TO `calendars`;--> statement-breakpoint
PRAGMA foreign_keys=ON;