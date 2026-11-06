import type { LocalDatabase } from './node-runtime.mjs';
export const db: LocalDatabase;
export function databaseBackend(): 'postgres' | 'sqlite';
export function migrateDatabase(): Promise<void>;
export function closeDatabase(): Promise<void>;
