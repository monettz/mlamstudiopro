import { localDatabase, bucket } from './node-runtime.mjs';
// Server-only adapters; no platform-issued headers or remote Sites resources.
export const env = { DB: localDatabase, RELEASES: bucket };
