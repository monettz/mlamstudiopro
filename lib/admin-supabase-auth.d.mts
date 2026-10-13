import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthOutcome } from './supabase-auth.mjs';
export function configuredAdminEmail(env?:NodeJS.ProcessEnv):string|null;
export function isAuthorizedAdmin(user:unknown,allowedEmail:unknown):boolean;
export function supabaseAdminPasswordLogin(client:SupabaseClient|null,input:unknown,allowedEmail?:unknown):Promise<AuthOutcome>;
