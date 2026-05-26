import { createSupabaseClient } from './supabase/client';

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
  if (!userId || !clerkToken) return null;

  const supabase = createSupabaseClient(clerkToken);
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;

  return buildStoredProfileRecord(data);
}

export async function upsertUserProfile(user, clerkToken, generatedCredentials = {}) {
  if (!user?.id || !clerkToken) return null;

  const supabase = createSupabaseClient(clerkToken);
  const record = buildProfileRecord(user, generatedCredentials);

  const { error } = await supabase.from('user_profiles').upsert([record], { onConflict: 'id' });
  if (error) throw error;

  return record;
}

export async function saveUserProfile(profileRecord, clerkToken) {
  if (!profileRecord?.id || !clerkToken) return null;

  const supabase = createSupabaseClient(clerkToken);
  const record = {
    ...buildStoredProfileRecord(profileRecord),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('user_profiles').upsert([record], { onConflict: 'id' });
  if (error) throw error;

  return record;
}
