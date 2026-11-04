import type { LocalBucket } from './node-runtime.mjs';
export type R2Configuration = { accountId: string; accessKeyId: string; secretAccessKey: string; bucket: string; endpoint: string };
export function r2Configuration(source?: Record<string, string | undefined>): R2Configuration | null;
export function createR2Bucket(config: R2Configuration): LocalBucket;
export function signV4(input: { method: string; path: string; query?: string; headers: Record<string, string>; payloadHash: string; accessKeyId: string; secretAccessKey: string; region?: string; service?: string }): string;
