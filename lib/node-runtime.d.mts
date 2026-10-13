export type Statement = { bind(...values: (string | number | null)[]): Statement; first<T = Record<string, unknown>>(): Promise<T | null>; all<T = Record<string, unknown>>(): Promise<{ results: T[] }>; run(): Promise<{ meta: { changes: number } }> };
export type LocalDatabase = { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<unknown[]> };
export type LocalObject = { size: number; writeHttpMetadata(headers: Headers): void };
export type LocalBucket = { put(key: string, input: ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType: string }; customMetadata?: Record<string, string> }): Promise<void>; head(key: string): Promise<LocalObject | null>; get(key: string, options?: { range: { offset: number; length: number } }): Promise<(LocalObject & { body: ReadableStream<Uint8Array> }) | null>; delete(key: string): Promise<void> };
export const localDatabase: LocalDatabase;
export const bucket: LocalBucket;
export function dataDirectory(): string;
export function migrate(): void;
export function rawDatabase(): import('node:sqlite').DatabaseSync;
