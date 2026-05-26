import { createSupabaseClient } from './supabase/client';

function getClient(clerkToken) {
  return createSupabaseClient(clerkToken);
}

async function apiRequest(collection, method = 'GET', query = {}, body) {
  const url = new URL(`/api/${collection}`, window.location.origin);
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

  if (!response.ok) throw new Error(data?.error || data?.message || text || `${collection} request failed`);
  return data;
}

async function fetchCollectionRecord(collection, candidateIds, clerkToken) {
  if (!clerkToken) {
    for (const candidateId of candidateIds) {
      if (!candidateId) continue;
      const data = await apiRequest(collection, 'GET', { id: candidateId });
      const record = Array.isArray(data) ? data[0] : data;
      if (record) return record;
    }
    return null;
  }

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
  if (!clerkToken) {
    const existingRecord = await fetchCollectionRecord(collection, candidateIds, clerkToken);
    if (existingRecord?.id) {
      await apiRequest(collection, 'PATCH', { id: existingRecord.id }, record);
      return existingRecord.id;
    }

    const primaryId = candidateIds.find(Boolean) || record.id;
    await apiRequest(collection, 'POST', null, { ...record, id: primaryId });
    return primaryId;
  }

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
  if (!clerkToken) {
    const existingRecord = await fetchCollectionRecord(collection, candidateIds, clerkToken);
    if (existingRecord?.id) await apiRequest(collection, 'DELETE', { id: existingRecord.id });
    return;
  }

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

async function fetchCollectionRecords(collection, clerkToken) {
  if (!clerkToken) return apiRequest(collection, 'GET');

  const supabase = getClient(clerkToken);
  const { data, error } = await supabase.from(collection).select('*');
  if (error) throw error;
  return data || [];
}

export { deleteCollectionRecord, fetchCollectionRecord, fetchCollectionRecords, upsertCollectionRecord };
