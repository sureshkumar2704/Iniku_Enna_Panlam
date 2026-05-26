const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.warn('Netlify function _supabaseProxy: missing SUPABASE URL or service role key in env');
}

async function supabaseRequest(collection, method, query, body) {
  const url = new URL(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${collection}`);
  if (query) url.search = new URLSearchParams(query).toString();

  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url.toString(), opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  return { status: res.status, data };
}

module.exports = { supabaseRequest };
