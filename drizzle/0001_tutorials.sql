CREATE TABLE `tutorials` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`r2_key` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`is_published` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
