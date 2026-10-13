export const INVALID_CREDENTIALS: string;
export const TOO_MANY_ATTEMPTS: string;
export function quotaKey(scope: string, subject: string): string;
export function takeQuota(scope: string, subject: string, maximum: number, windowMs: number, now?: number): { allowed: boolean; retryAfter: number };
export function resetQuota(scope: string, subject: string): void;
export function clientAddress(request: Request): string;
export function rateLimitedResponse(retryAfter: number): Response;
