import { createSupabaseClient } from './supabase/client';

function getClient(clerkToken) {
  return createSupabaseClient(clerkToken);
}

async function fetchCollectionRecord(collection, candidateIds, clerkToken) {
  const supabase = getClient(clerkToken);
  for (const candidateId of candidateIds) {
    if (!candidateId) continue;
    try {
      const { data, error } = await supabase.from(collection).select('*').eq('id', candidateId).limit(1).maybeSingle();
      if (error) continue;
      if (data) return data;
    } catch (err) {
      console.error('Supabase fetch error', err);
      continue;
    }
  }

  return null;
}

async function upsertCollectionRecord(collection, candidateIds, record, clerkToken) {
  const supabase = getClient(clerkToken);
  const existingRecord = await fetchCollectionRecord(collection, candidateIds, clerkToken);
  try {
    if (existingRecord?.id) {
      const { error } = await supabase.from(collection).update(record).eq('id', existingRecord.id);
      if (error) throw error;
      return existingRecord.id;
    }

    const primaryId = candidateIds.find(Boolean) || record.id;
    const toInsert = { ...record, id: primaryId };
    const { error } = await supabase.from(collection).insert([toInsert]);
    if (error) throw error;
    return primaryId;
  } catch (err) {
    console.error('Supabase upsert error', err);
    throw err;
  }
}

async function deleteCollectionRecord(collection, candidateIds, clerkToken) {
  const supabase = getClient(clerkToken);
  const existingRecord = await fetchCollectionRecord(collection, candidateIds, clerkToken);
  if (!existingRecord?.id) return;
  try {
    const { error } = await supabase.from(collection).delete().eq('id', existingRecord.id);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase delete error', err);
  }
}

export { deleteCollectionRecord, fetchCollectionRecord, upsertCollectionRecord };