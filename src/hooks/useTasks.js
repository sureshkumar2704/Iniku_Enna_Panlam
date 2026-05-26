import { v4 as uuidv4 } from 'uuid';
import { deleteCollectionRecord, fetchCollectionRecord, fetchCollectionRecords, upsertCollectionRecord } from '../utils/apiClient';
import { createSupabaseClient } from '../utils/supabase/client';
import { isGuestModeEnabled } from '../utils/guestMode';

let guestBacklogItems = [];

const BACKLOG_STATUSES = new Set(['pending', 'completed', 'not_completed']);

function normalizeBacklogStatus(item = {}) {
  if (BACKLOG_STATUSES.has(item.status)) return item.status;
  return item.done ? 'completed' : 'pending';
}

function mapBacklogItem(item = {}) {
  const status = normalizeBacklogStatus(item);
  return {
    ...item,
    status,
    done: status === 'completed',
  };
}

function scopedId(userId, key) {
  return userId ? `${userId}::${key}` : key;
}

export async function getTasksForDate(dateKey, userId, clerkToken) {
  if (isGuestModeEnabled() || !userId) return [];
  try {
    const record = await fetchCollectionRecord('tasks', [scopedId(userId, dateKey), dateKey], clerkToken);
    return record?.items || [];
  } catch (error) {
    console.error("Failed to fetch tasks", error);
    return [];
  }
}

export async function saveTasksForDate(dateKey, tasks, userId, clerkToken) {
  if (isGuestModeEnabled() || !userId) return;
  const id = scopedId(userId, dateKey);
  try {
    await upsertCollectionRecord('tasks', [id, dateKey], { id, user_id: userId, dateKey, items: tasks }, clerkToken);
  } catch (error) {
    console.error("Failed to save tasks", error);
  }
}

export function createEmptyTask(overrides = {}) {
  return {
    id: uuidv4(),
    name: '',
    startTime: '',
    endTime: '',
    status: 'pending',
    topics: [],
    ...overrides,
  };
}

export async function cloneTasksFromDate(sourceDateKey, userId, clerkToken) {
  const tasks = await getTasksForDate(sourceDateKey, userId, clerkToken);
  return tasks.map((t) => ({
    ...t,
    id: uuidv4(),
    status: 'pending',
    startTime: '',
    endTime: '',
  }));
}

export async function getCompletionStats(dateKey, userId, clerkToken) {
  const tasks = await getTasksForDate(dateKey, userId, clerkToken);
  if (!tasks.length) return null;
  const done = tasks.filter((t) => t.status === 'done').length;
  return { done, total: tasks.length };
}

export async function getAllStats(userId, clerkToken) {
  if (isGuestModeEnabled() || !userId) return {};
  try {
    const all = clerkToken
      ? await (async () => {
          const supabase = createSupabaseClient(clerkToken);
          const { data, error } = await supabase.from('tasks').select('*');
          if (error) throw error;
          return data || [];
        })()
      : await fetchCollectionRecords('tasks', clerkToken);
    const statsMap = {};
    (all || []).forEach((record) => {
      if (record.user_id === userId && record.items && record.items.length > 0) {
        const done = record.items.filter((t) => t.status === 'done').length;
        statsMap[record.dateKey || record.id] = { done, total: record.items.length };
      }
    });
    return statsMap;
  } catch (error) {
    console.error("Failed to fetch all tasks", error);
  }
  return {};
}

export async function getBacklog(userId, clerkToken) {
  if (isGuestModeEnabled() || !userId) return guestBacklogItems.map(mapBacklogItem);
  try {
    let data = [];
    if (clerkToken) {
      const supabase = createSupabaseClient(clerkToken);
      const result = await supabase.from('backlog').select('*').eq('user_id', userId || '');
      if (result.error) throw result.error;
      data = result.data || [];
    } else {
      const all = await fetchCollectionRecords('backlog', clerkToken);
      data = (all || []).filter((item) => item.user_id === userId);
    }
    return (data || []).map(mapBacklogItem);
  } catch (e) { console.error(e); }
  return [];
}

export async function addToBacklog(text, userId, clerkToken) {
  if (isGuestModeEnabled() || !userId) {
    guestBacklogItems = [
      ...guestBacklogItems,
      { id: uuidv4(), user_id: null, text, status: 'pending', done: false, createdAt: new Date().toISOString() },
    ];
    return;
  }
  try {
    const item = { id: uuidv4(), user_id: userId, text, status: 'pending', done: false, createdAt: new Date().toISOString() };
    if (!clerkToken) {
      await upsertCollectionRecord('backlog', [item.id], item, clerkToken);
      return;
    }
    const supabase = createSupabaseClient(clerkToken);
    const { error } = await supabase.from('backlog').insert([item]);
    if (error) {
      const legacyItem = { id: item.id, user_id: item.user_id, text: item.text, done: item.done, createdAt: item.createdAt };
      const { error: legacyError } = await supabase.from('backlog').insert([legacyItem]);
      if (legacyError) throw legacyError;
    }
  } catch (e) { console.error(e); }
}

export async function updateBacklogItem(item, clerkToken) {
  const normalized = mapBacklogItem(item);

  if (isGuestModeEnabled()) {
    guestBacklogItems = guestBacklogItems.map((current) => (current.id === normalized.id ? { ...current, ...normalized } : current));
    return;
  }
  try {
    if (!clerkToken) {
      await upsertCollectionRecord('backlog', [normalized.id], normalized, clerkToken);
      return;
    }
    const supabase = createSupabaseClient(clerkToken);
    const { error } = await supabase.from('backlog').update(normalized).eq('id', normalized.id);
    if (error) {
      const legacyPayload = { ...normalized };
      delete legacyPayload.status;
      const { error: legacyError } = await supabase.from('backlog').update(legacyPayload).eq('id', normalized.id);
      if (legacyError) throw legacyError;
    }
  } catch (e) { console.error(e); }
}

export async function deleteBacklogItem(id, clerkToken) {
  if (isGuestModeEnabled()) {
    guestBacklogItems = guestBacklogItems.filter((item) => item.id !== id);
    return;
  }
  try {
    if (!clerkToken) {
      await deleteCollectionRecord('backlog', [id], clerkToken);
      return;
    }
    const supabase = createSupabaseClient(clerkToken);
    const { error } = await supabase.from('backlog').delete().eq('id', id);
    if (error) throw error;
  } catch (e) { console.error(e); }
}
