import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = 'https://api.clerk.com/v1/users';

function buildGeneratedPassword(username) {
  const currentYear = new Date().getFullYear();
  return `${String(username || 'account').toLowerCase()}_${currentYear}.`;
}

function pickEmail(user) {
  const addresses = Array.isArray(user?.email_addresses) ? user.email_addresses : [];
  return (
    user?.primary_email_address?.email_address ||
    addresses.find((address) => address?.id === user?.primary_email_address_id)?.email_address ||
    addresses[0]?.email_address ||
    ''
  );
}

function buildProfile(user) {
  const email = pickEmail(user);
  const username = String(user?.username || email.split('@')[0] || 'account').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'account';
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const fullName = user?.full_name || [firstName, lastName].filter(Boolean).join(' ').trim();
  const imageUrl = user?.image_url || user?.profile_image_url || '';
  const provider = Array.isArray(user?.external_accounts) && user.external_accounts[0] ? user.external_accounts[0].provider : '';

  return {
    id: user.id,
    user_id: user.id,
    email,
    username,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    image_url: imageUrl,
    provider,
    generated_password: buildGeneratedPassword(username),
    generated_from_email: email,
    updated_at: new Date().toISOString(),
  };
}

async function listClerkUsers() {
  const users = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const url = new URL(CLERK_API_URL);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Clerk users fetch failed (${response.status}): ${text}`);
    }

    const page = await response.json();
    if (!Array.isArray(page) || page.length === 0) break;

    users.push(...page);
    if (page.length < limit) break;
    offset += limit;
  }

  return users;
}

async function upsertProfiles(records) {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error } = await supabase.from('user_profiles').upsert(records, { onConflict: 'id' });
  if (error) throw error;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !CLERK_SECRET_KEY) {
    throw new Error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or CLERK_SECRET_KEY.');
  }

  const users = await listClerkUsers();
  const records = users.map(buildProfile);
  if (records.length > 0) {
    await upsertProfiles(records);
  }

  console.log(`Backfilled ${records.length} profiles.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
