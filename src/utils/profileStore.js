import { createSupabaseClient } from './supabase/client';

async function profileApiRequest(method, query = {}, body) {
  const url = new URL('/api/user_profiles', window.location.origin);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  const response = await fetch(url.pathname + url.search, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) throw new Error(data?.error || data?.message || text || 'Profile request failed');
  return data;
}

export function buildProfileRecord(user, generatedCredentials = {}) {
  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
  const username = user?.username || generatedCredentials.username || '';
  const password = generatedCredentials.password || user?.unsafeMetadata?.generatedPassword || '';

  return {
    id: user?.id,
    user_id: user?.id,
    email,
    username,
    full_name: user?.fullName || '',
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    image_url: user?.imageUrl || user?.profileImageUrl || '',
    provider: user?.externalAccounts?.[0]?.provider || '',
    generated_password: password,
    generated_from_email: email,
    updated_at: new Date().toISOString(),
  };
}

export function buildStoredProfileRecord(record) {
  if (!record) return null;

  return {
    id: record.id,
    user_id: record.user_id || record.id,
    email: record.email || '',
    username: record.username || '',
    full_name: record.full_name || '',
    first_name: record.first_name || '',
    last_name: record.last_name || '',
    image_url: record.image_url || '',
    provider: record.provider || '',
    generated_password: record.generated_password || '',
    generated_from_email: record.generated_from_email || '',
    updated_at: record.updated_at || null,
  };
}

export async function fetchUserProfile(userId, clerkToken) {
  if (!userId) return null;

  if (!clerkToken) {
    const data = await profileApiRequest('GET', { id: userId });
    return buildStoredProfileRecord(Array.isArray(data) ? data[0] : data);
  }

  const supabase = createSupabaseClient(clerkToken);
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;

  return buildStoredProfileRecord(data);
}

export async function upsertUserProfile(user, clerkToken, generatedCredentials = {}) {
  if (!user?.id) return null;

  const record = buildProfileRecord(user, generatedCredentials);
  if (!clerkToken) {
    await profileApiRequest('POST', null, record);
    return record;
  }

  const supabase = createSupabaseClient(clerkToken);

  const { error } = await supabase.from('user_profiles').upsert([record], { onConflict: 'id' });
  if (error) throw error;

  return record;
}

export async function saveUserProfile(profileRecord, clerkToken) {
  if (!profileRecord?.id) return null;

  const record = {
    ...buildStoredProfileRecord(profileRecord),
    updated_at: new Date().toISOString(),
  };

  if (!clerkToken) {
    await profileApiRequest('PATCH', { id: record.id }, record);
    return record;
  }

  const supabase = createSupabaseClient(clerkToken);

  const { error } = await supabase.from('user_profiles').upsert([record], { onConflict: 'id' });
  if (error) throw error;

  return record;
}
