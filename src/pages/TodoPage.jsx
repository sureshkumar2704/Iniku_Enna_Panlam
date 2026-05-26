import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { getBacklog, addToBacklog, updateBacklogItem, deleteBacklogItem } from '../hooks/useTasks';
import useSupabaseToken from '../hooks/useSupabaseToken';

export default function TodoPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { token: supabaseToken, isReady: supabaseReady } = useSupabaseToken();
  const [items, setItems] = useState([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!supabaseReady) return;
    refresh();
  }, [userId, supabaseReady, supabaseToken]);

  async function refresh() {
    const data = await getBacklog(userId, supabaseToken);
    // Sort by creation date if available, or just newest first
    setItems(data.reverse());
  }

  async function handleAdd(e) {
    if ((e.key === 'Enter' || e.type === 'click') && input.trim()) {
      if (e.key === 'Enter') e.preventDefault();
      await addToBacklog(input.trim(), userId, supabaseToken);
      setInput('');
      refresh();
    }
  }

  async function toggleDone(item) {
    await updateBacklogItem({ ...item, done: !item.done }, supabaseToken);
    refresh();
  }

  async function handleDelete(id) {
    if (window.confirm('Delete this task?')) {
      await deleteBacklogItem(id, supabaseToken);
      refresh();
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditValue(item.text);
  }

  async function saveEdit(item) {
    if (editValue.trim() && editValue !== item.text) {
      await updateBacklogItem({ ...item, text: editValue.trim() }, supabaseToken);
    }
    setEditingId(null);
    refresh();
  }

  async function clearCompleted() {
    const completed = items.filter(i => i.done);
    if (completed.length === 0) return;
    if (window.confirm(`Clear ${completed.length} completed tasks?`)) {
      await Promise.all(completed.map(item => deleteBacklogItem(item.id, supabaseToken)));
      refresh();
    }
  }

  return (
    <div className="page todo-page">
      <header className="day-header">
        <button className="btn btn-secondary day-back-btn" onClick={() => navigate('/')}>
          ← Back to Calendar
        </button>
        <div className="day-title-wrap">
          <h2 className="day-title">Global To-Do List</h2>
          <p className="day-subtitle">Deadline-free pending tasks</p>
        </div>
        <button className="btn btn-ghost" onClick={clearCompleted} style={{ color: 'var(--color-fail)' }}>
          🧹 Clear Completed
        </button>
      </header>

      <main className="todo-main">
        <div className="todo-card">
          <div className="todo-input-section">
            <div className="todo-input-group">
              <input
                type="text"
                className="todo-main-input"
                placeholder="What needs to be done?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleAdd}
                autoFocus
              />
              <button className="btn btn-primary todo-add-btn" onClick={handleAdd}>
                Add Task
              </button>
            </div>
          </div>

          <div className="todo-list-container">
            {items.length === 0 ? (
              <div className="todo-empty">
                <div className="todo-empty-icon">✨</div>
                <p>Your backlog is empty. Add a new task above!</p>
              </div>
            ) : (
              <div className="todo-list">
                {items.map(item => (
                  <div key={item.id} className={`todo-item ${item.done ? 'todo-item--done' : ''}`}>
                    <button 
                      className={`todo-check ${item.done ? 'todo-check--done' : ''}`}
                      onClick={() => toggleDone(item)}
                    >
                      {item.done ? '✓' : '○'}
                    </button>

                    {editingId === item.id ? (
                      <input
                        className="todo-edit-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(item)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(item)}
                        autoFocus
                      />
                    ) : (
                      <span className="todo-text" onDoubleClick={() => startEdit(item)}>
                        {item.text}
                      </span>
                    )}

                    <div className="todo-actions">
                      <button className="todo-btn todo-btn--edit" onClick={() => startEdit(item)}>✏️</button>
                      <button className="todo-btn todo-btn--del" onClick={() => handleDelete(item.id)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {items.length > 0 && (
            <div className="todo-footer">
              <span>{items.filter(i => !i.done).length} tasks remaining</span>
              <span className="todo-hint">Double-click text to edit</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
