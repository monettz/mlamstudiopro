-- "How it works" steps and the Specs list on each product page, edited in Admin.
ALTER TABLE products ADD COLUMN IF NOT EXISTS page_steps TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS page_specs TEXT NOT NULL DEFAULT '[]';
