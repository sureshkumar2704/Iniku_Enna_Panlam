async function fetchCollectionRecord(collection, candidateIds) {
  for (const candidateId of candidateIds) {
    if (!candidateId) continue;

    const response = await fetch(`/api/${collection}?id=${encodeURIComponent(candidateId)}`);
    if (!response.ok) continue;

    const records = await response.json();
    if (Array.isArray(records) && records.length > 0) {
      return records[0];
    }
  }

  return null;
}

async function upsertCollectionRecord(collection, candidateIds, record) {
  const existingRecord = await fetchCollectionRecord(collection, candidateIds);
  if (existingRecord?.id) {
    await fetch(`/api/${collection}/${encodeURIComponent(existingRecord.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...record, id: existingRecord.id }),
    });
    return existingRecord.id;
  }

  const primaryId = candidateIds.find(Boolean);
  await fetch(`/api/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...record, id: primaryId }),
  });
  return primaryId;
}

async function deleteCollectionRecord(collection, candidateIds) {
  const existingRecord = await fetchCollectionRecord(collection, candidateIds);
  if (!existingRecord?.id) return;

  await fetch(`/api/${collection}/${encodeURIComponent(existingRecord.id)}`, { method: 'DELETE' });
}

export { deleteCollectionRecord, fetchCollectionRecord, upsertCollectionRecord };