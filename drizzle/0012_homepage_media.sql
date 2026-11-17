-- Homepage content managed in Admin: hero slideshow media and the playlist wall.
CREATE TABLE IF NOT EXISTS hero_media (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  file_size INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS playlist_items (
  id TEXT PRIMARY KEY,
  image TEXT NOT NULL,
  song TEXT NOT NULL DEFAULT '',
  artist TEXT NOT NULL DEFAULT '',
  producer TEXT NOT NULL DEFAULT '',
  plugin TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
-- Start from what the homepage showed before (photos in public/playlist and the test tutorial video).
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-1','/playlist/photo-1.jpg','','','','','',1,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-2','/playlist/photo-2.jpg','','','','','',2,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-3','/playlist/photo-3.jpg','','','','','',3,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-4','/playlist/photo-4.jpg','','','','','',4,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-5','/playlist/photo-5.jpg','','','','','',5,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-6','/playlist/photo-6.jpg','','','','','',6,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-7','/playlist/photo-7.jpg','','','','','',7,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-8','/playlist/photo-8.jpg','','','','','',8,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-9','/playlist/photo-9.jpg','','','','','',9,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-10','/playlist/photo-10.jpg','','','','','',10,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-11','/playlist/photo-11.jpg','','','','','',11,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-12','/playlist/photo-12.jpg','','','','','',12,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES ('seed-photo-13','/playlist/photo-13.jpg','','','','','',13,1,'2026-11-17T00:00:00.000Z');
INSERT OR IGNORE INTO settings (key,value) VALUES ('featured_video_id','YEorsfZe4vU');
INSERT OR IGNORE INTO settings (key,value) VALUES ('featured_video_title','How to use MLAM Voice MIDI');
