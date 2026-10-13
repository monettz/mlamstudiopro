-- Keep original product copy and all owner media/prices unchanged.
ALTER TABLE products ADD COLUMN description_translations TEXT NOT NULL DEFAULT '{}';
