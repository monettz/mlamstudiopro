export const COOKIE_NAME: string;
export function passwordHash(password: string): string;
export function passwordHashAsync(password: string): Promise<string>;
export function verifyPassword(password: string, encoded: string): Promise<boolean>;
export function digestToken(token: string): string;
export function configuredAdmin(): { id: string; email: string } | null;
export function sessionUser(token: string): { id: string; email: string } | null;
export function revokeSession(token: string | undefined): void;
export function loginAdmin(email: unknown, password: unknown): Promise<{ status: number; error?: string; token?: string; retryAfter?: number }>;
