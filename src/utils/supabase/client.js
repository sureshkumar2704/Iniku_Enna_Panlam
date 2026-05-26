import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : undefined;
const SUPABASE_ANON_KEY = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase client missing URL or key. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export function createSupabaseClient(clerkToken) {
  const options = clerkToken
    ? {
        global: {
          headers: {
            Authorization: `Bearer ${clerkToken}`,
          },
        },
      }
    : undefined;

  return createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '', options);
}

export const supabase = createSupabaseClient();
