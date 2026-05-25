import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getBacklog, addToBacklog, updateBacklogItem, deleteBacklogItem } from '../hooks/useTasks';

export default function BacklogList() {
  const { userId } = useAuth();
  const [items, setItems] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    refresh();
  }, [userId]);

  async function refresh() {
    const data = await getBacklog(userId);
    setItems(data);
  }

  async function handleAdd(e) {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      await addToBacklog(input.trim(), userId);
      setInput('');
      refresh();
    }
  }

  async function toggleDone(item) {
    await updateBacklogItem({ ...item, done: !item.done });
    refresh();
  }

  async function handleDelete(id) {
    await deleteBacklogItem(id);
    refresh();
  }

  return (
    <div className="backlog-container">
      <div className="backlog-header">
        <h3 className="backlog-title">
          <span className="backlog-icon">🎯</span>
          Pending Focus (No Deadline)
        </h3>
      </div>

      <div className="backlog-input-wrap">
        <input
          type="text"
          className="backlog-input"
          placeholder="New deadline-free task…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleAdd}
        />
      </div>

      <ul className="backlog-list">
        {items.length === 0 ? (
          <li className="backlog-empty">No pending tasks. Note something down!</li>
        ) : (
          items.map(item => (
            <li key={item.id} className={`backlog-item ${item.done ? 'backlog-item--done' : ''}`}>
              <button 
                className={`backlog-check ${item.done ? 'backlog-check--done' : ''}`}
                onClick={() => toggleDone(item)}
                aria-label="Toggle task"
              >
                {item.done ? '✓' : '○'}
              </button>
              <span className="backlog-text">{item.text}</span>
              <button 
                className="backlog-del" 
                onClick={() => handleDelete(item.id)}
                aria-label="Delete task"
              >
                🗑
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
