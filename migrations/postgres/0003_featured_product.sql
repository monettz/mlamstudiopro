-- Featured Release: each product can have its own YouTube video and short
-- featured text; settings.featured_product_id names the one product shown.
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_id TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_title TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_text TEXT NOT NULL DEFAULT '';
INSERT INTO settings (key,value) VALUES ('featured_product_id','voice-midi') ON CONFLICT (key) DO NOTHING;
-- Keep what the homepage showed: Voice MIDI with its video and text.
UPDATE products SET
  video_id = COALESCE((SELECT value FROM settings WHERE key='featured_video_id'), ''),
  video_title = COALESCE((SELECT value FROM settings WHERE key='featured_video_title'), ''),
  featured_text = 'Our flagship voice-to-MIDI instrument. Hum, sing or play a melody and watch it land in your DAW as clean, editable notes.'
WHERE id = 'voice-midi' AND video_id = '' AND featured_text = '';
