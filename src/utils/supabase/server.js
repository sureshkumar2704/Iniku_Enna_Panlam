import { createClient } from '@supabase/supabase-js';

// Server-side helper - use a service role key for privileged operations.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.warn('Supabase server helper missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

export function createServerSupabase() {
  return createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', {
    // server environment - don't persist auth automatically
    auth: { persistSession: false },
  });
}
