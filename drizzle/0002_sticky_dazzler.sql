CREATE TABLE `demo_releases` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`version` text NOT NULL,
	`r2_key` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`is_active` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
