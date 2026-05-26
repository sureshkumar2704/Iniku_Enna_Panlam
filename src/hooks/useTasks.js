import { v4 as uuidv4 } from 'uuid';
import { fetchCollectionRecord, upsertCollectionRecord } from '../utils/apiClient';
import { createSupabaseClient } from '../utils/supabase/client';
import { isGuestModeEnabled } from '../utils/guestMode';

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
    const supabase = createSupabaseClient(clerkToken);
    const { data: all, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
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
  if (isGuestModeEnabled() || !userId) return [];
  try {
    const supabase = createSupabaseClient(clerkToken);
    const { data, error } = await supabase.from('backlog').select('*').eq('user_id', userId || '');
    if (error) throw error;
    return data || [];
  } catch (e) { console.error(e); }
  return [];
}

export async function addToBacklog(text, userId, clerkToken) {
  if (isGuestModeEnabled() || !userId) return;
  try {
    const supabase = createSupabaseClient(clerkToken);
    const item = { id: uuidv4(), user_id: userId, text, done: false, createdAt: new Date().toISOString() };
    const { error } = await supabase.from('backlog').insert([item]);
    if (error) throw error;
  } catch (e) { console.error(e); }
}

export async function updateBacklogItem(item, clerkToken) {
  if (isGuestModeEnabled()) return;
  try {
    const supabase = createSupabaseClient(clerkToken);
    const { error } = await supabase.from('backlog').update(item).eq('id', item.id);
    if (error) throw error;
  } catch (e) { console.error(e); }
}

export async function deleteBacklogItem(id, clerkToken) {
  if (isGuestModeEnabled()) return;
  try {
    const supabase = createSupabaseClient(clerkToken);
    const { error } = await supabase.from('backlog').delete().eq('id', id);
    if (error) throw error;
  } catch (e) { console.error(e); }
}
