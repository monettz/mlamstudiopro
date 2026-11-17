import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// lib/homepage-media.ts has no imports, so it can be transpiled and run alone.
const exports = {};
const source = readFileSync(new URL('../lib/homepage-media.ts', import.meta.url), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, URL, DataView });
const { mp4DurationMs, webmDurationMs, videoDurationMs, heroVideoTooLong, youtubeId, playlistImage, playlistLink, playlistCaption } = exports;

const bytes = (...parts) => Uint8Array.from(parts.flat());
const u32 = value => [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
const ascii = text => [...text].map(char => char.charCodeAt(0));

// Minimal MP4: ftyp, then a movie header (version 0 or 1) somewhere later in the file.
function mp4(timescale, duration, version = 0, padding = 64) {
  const header = version === 1
    ? [1, 0, 0, 0, ...u32(0), ...u32(0), ...u32(0), ...u32(0), ...u32(timescale), ...u32(0), ...u32(duration)]
    : [0, 0, 0, 0, ...u32(0), ...u32(0), ...u32(timescale), ...u32(duration)];
  return bytes(u32(24), ascii('ftypisom'), new Array(12).fill(0), new Array(padding).fill(0), u32(8 + header.length + 80), ascii('mvhd'), header, new Array(80).fill(0));
}
// Minimal WebM Segment Info: TimecodeScale and a float Duration.
function webm(ticks, scale = 1_000_000, width = 8) {
  const duration = new Uint8Array(width); const view = new DataView(duration.buffer);
  if (width === 8) view.setFloat64(0, ticks); else view.setFloat32(0, ticks);
  return bytes([0x1a, 0x45, 0xdf, 0xa3], ascii('webm'), [0x2a, 0xd7, 0xb1, 0x84], u32(scale), [0x44, 0x89, 0x80 | width], [...duration]);
}

test('MP4 length is read from the movie header, wherever it sits', () => {
  assert.equal(mp4DurationMs(mp4(1000, 4000)), 4000);
  assert.equal(mp4DurationMs(mp4(90000, 540000, 0, 5000)), 6000);
  assert.equal(mp4DurationMs(mp4(600, 5400, 1)), 9000);
  assert.equal(mp4DurationMs(bytes(u32(24), ascii('ftypisom'), new Array(40).fill(0))), null);
  assert.equal(mp4DurationMs(mp4(0, 4000)), null);
});

test('WebM length is read from Duration and TimecodeScale', () => {
  assert.equal(webmDurationMs(webm(5000)), 5000);
  assert.equal(webmDurationMs(webm(5000, 1_000_000, 4)), 5000);
  assert.equal(webmDurationMs(webm(500, 10_000_000)), 5000);
  assert.equal(webmDurationMs(bytes([0x1a, 0x45, 0xdf, 0xa3], ascii('webm'))), null);
  assert.equal(videoDurationMs(webm(3000), 'video/webm'), 3000);
  assert.equal(videoDurationMs(mp4(1000, 3000), 'video/mp4'), 3000);
});

test('hero videos: 6 seconds allowed (with a tiny encoder margin), longer refused', () => {
  assert.equal(heroVideoTooLong(6000), false);
  assert.equal(heroVideoTooLong(6100), false);
  assert.equal(heroVideoTooLong(6400), true);
  assert.equal(heroVideoTooLong(9000), true);
});

test('YouTube ids come from ids and the usual link shapes; other sites are refused', () => {
  for (const value of ['YEorsfZe4vU', 'https://www.youtube.com/watch?v=YEorsfZe4vU', 'youtube.com/watch?v=YEorsfZe4vU&t=10', 'https://youtu.be/YEorsfZe4vU', 'https://www.youtube.com/shorts/YEorsfZe4vU', 'https://m.youtube.com/embed/YEorsfZe4vU']) {
    assert.equal(youtubeId(value), 'YEorsfZe4vU', value);
  }
  assert.equal(youtubeId(''), '');
  assert.equal(youtubeId('   '), '');
  for (const value of ['https://vimeo.com/123', 'https://evil.example/watch?v=YEorsfZe4vU', 'not a link', 42, null]) assert.equal(youtubeId(value), null, String(value));
});

test('playlist photos and links only accept safe addresses', () => {
  assert.equal(playlistImage('/playlist/photo-1.jpg'), '/playlist/photo-1.jpg');
  assert.equal(playlistImage('/api/product-images/abc.jpg'), '/api/product-images/abc.jpg');
  assert.equal(playlistImage('https://cdn.example/cover.webp'), 'https://cdn.example/cover.webp');
  for (const value of ['', '//evil.example/x.jpg', 'http://plain.example/x.jpg', '/../secret', 'javascript:alert(1)', 7]) assert.equal(playlistImage(value), null, String(value));
  assert.equal(playlistLink(''), '');
  assert.equal(playlistLink('https://open.spotify.com/track/1'), 'https://open.spotify.com/track/1');
  assert.equal(playlistLink('javascript:alert(1)'), null);
  assert.deepEqual(JSON.parse(JSON.stringify(playlistCaption({ song: '  Hit   Song ', artist: 'A'.repeat(300), extra: 'x' }))), { song: 'Hit Song', artist: 'A'.repeat(120), producer: '', plugin: '' });
});

test('homepage tables exist in both databases and are locked away from the public Supabase API', () => {
  const sqlite = readFileSync(new URL('../drizzle/0012_homepage_media.sql', import.meta.url), 'utf8');
  const postgres = readFileSync(new URL('../migrations/postgres/0002_homepage_media.sql', import.meta.url), 'utf8');
  for (const table of ['hero_media', 'playlist_items']) { assert.ok(sqlite.includes(`CREATE TABLE IF NOT EXISTS ${table}`)); assert.ok(postgres.includes(`CREATE TABLE IF NOT EXISTS ${table}`)); }
  assert.ok(postgres.includes("ARRAY['hero_media','playlist_items']") && postgres.includes('ENABLE ROW LEVEL SECURITY') && postgres.includes('FROM anon'));
  assert.ok(sqlite.includes("featured_video_id") && postgres.includes("featured_video_id"));
});
