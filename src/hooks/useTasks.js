import { v4 as uuidv4 } from 'uuid';

export async function getTasksForDate(dateKey) {
  try {
    const res = await fetch(`/api/tasks/${dateKey}`);
    if (res.ok) {
      const data = await res.json();
      return data.items || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch tasks", error);
    return [];
  }
}

export async function saveTasksForDate(dateKey, tasks) {
  try {
    const checkRes = await fetch(`/api/tasks/${dateKey}`);
    if (checkRes.ok) {
      await fetch(`/api/tasks/${dateKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dateKey, items: tasks }),
      });
    } else {
      await fetch(`/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dateKey, items: tasks }),
      });
    }
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

export async function cloneTasksFromDate(sourceDateKey) {
  const tasks = await getTasksForDate(sourceDateKey);
  return tasks.map((t) => ({
    ...t,
    id: uuidv4(),
    status: 'pending',
    startTime: '',
    endTime: '',
  }));
}

export async function getCompletionStats(dateKey) {
  const tasks = await getTasksForDate(dateKey);
  if (!tasks.length) return null;
  const done = tasks.filter((t) => t.status === 'done').length;
  return { done, total: tasks.length };
}

export async function getAllStats() {
  try {
    const res = await fetch(`/api/tasks`);
    if (res.ok) {
      const all = await res.json();
      const statsMap = {};
      all.forEach(record => {
        if (record.items && record.items.length > 0) {
          const done = record.items.filter(t => t.status === 'done').length;
          statsMap[record.id] = { done, total: record.items.length };
        }
      });
      return statsMap;
    }
  } catch (error) {
    console.error("Failed to fetch all tasks", error);
  }
  return {};
}

export async function getBacklog() {
  try {
    const res = await fetch('/api/backlog');
    if (res.ok) return await res.json();
  } catch (e) { console.error(e); }
  return [];
}

export async function addToBacklog(text) {
  try {
    await fetch('/api/backlog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: uuidv4(), text, done: false, createdAt: new Date().toISOString() }),
    });
  } catch (e) { console.error(e); }
}

export async function updateBacklogItem(item) {
  try {
    await fetch(`/api/backlog/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
  } catch (e) { console.error(e); }
}

export async function deleteBacklogItem(id) {
  try {
    await fetch(`/api/backlog/${id}`, { method: 'DELETE' });
  } catch (e) { console.error(e); }
}
