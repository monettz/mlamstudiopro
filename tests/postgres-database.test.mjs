import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPostgres, postgresUrl } from '../lib/postgres-database.mjs';

test('placeholders become numbered, except inside string literals', () => {
  assert.equal(toPostgres('SELECT * FROM products WHERE slug=? AND id<>?'), 'SELECT * FROM products WHERE slug=$1 AND id<>$2');
  assert.equal(toPostgres("SELECT ? AS a, 'why?' AS b, ?"), "SELECT $1 AS a, 'why?' AS b, $2");
});

test('INSERT OR IGNORE becomes ON CONFLICT DO NOTHING, before any RETURNING', () => {
  assert.equal(toPostgres('INSERT OR IGNORE INTO settings (key, value) VALUES (?,?)'), 'INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT DO NOTHING');
  assert.equal(toPostgres('INSERT OR IGNORE INTO t (a) VALUES (?) RETURNING a'), 'INSERT INTO t (a) VALUES ($1) ON CONFLICT DO NOTHING RETURNING a');
  assert.equal(toPostgres('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'), 'INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
});

test('only a postgresql:// DATABASE_URL selects Supabase', () => {
  assert.equal(postgresUrl({}), null);
  assert.equal(postgresUrl({ DATABASE_URL: '  ' }), null);
  assert.equal(postgresUrl({ DATABASE_URL: 'postgresql://u:p@host:5432/postgres' }), 'postgresql://u:p@host:5432/postgres');
  assert.throws(() => postgresUrl({ DATABASE_URL: 'https://project.supabase.co/rest/v1/' }), /postgresql:\/\//);
});
