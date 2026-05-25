import { createClient } from '@supabase/supabase-js';

// Works for Vite (import.meta.env) and Next-style env names.
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase client missing URL or key. Set VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and publishable key.');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');
