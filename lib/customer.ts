import { customerSupabase } from './supabase-server';
import { verifiedCustomer } from './supabase-auth.mjs';
// Legacy customer cookies and editable user metadata never grant identity or Admin.
export async function customerUser() { return verifiedCustomer(await customerSupabase()); }
