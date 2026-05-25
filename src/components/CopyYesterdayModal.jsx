import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function CopyYesterdayModal({ yesterdayTasks, onConfirm, onClose }) {
  const [selected, setSelected] = useState(
    yesterdayTasks.map((t) => ({ ...t, id: uuidv4(), status: 'pending', startTime: '', endTime: '', _selected: true }))
  );

  function toggleSelect(id) {
    setSelected((prev) =>
      prev.map((t) => (t.id === id ? { ...t, _selected: !t._selected } : t))
    );
  }

  function updateField(id, field, value) {
    setSelected((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  function handleConfirm() {
    onConfirm(selected.filter((t) => t._selected));
  }

  if (yesterdayTasks.length === 0) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Copy Yesterday's Tasks</h2>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
          <p className="modal-empty">No tasks found for yesterday.</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Copy Yesterday's Tasks</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <p className="modal-subtitle">Select and edit tasks to carry over to today.</p>

        <div className="modal-task-list">
          {selected.map((task) => (
            <div key={task.id} className={`modal-task-row ${task._selected ? 'modal-task-row--selected' : 'modal-task-row--dimmed'}`}>
              <label className="modal-checkbox-label">
                <input
                  type="checkbox"
                  checked={task._selected}
                  onChange={() => toggleSelect(task.id)}
                  className="modal-checkbox"
                />
                <span className="modal-checkbox-custom" />
              </label>
              <div className="modal-task-fields">
                <input
                  type="text"
                  className="modal-field modal-field--name"
                  value={task.name}
                  placeholder="Task name"
                  onChange={(e) => updateField(task.id, 'name', e.target.value)}
                  disabled={!task._selected}
                />
                <div className="modal-field-row">
                  <div className="modal-field-group">
                    <label className="modal-label">Topics (optional)</label>
                    <input
                      type="text"
                      className="modal-field"
                      value={task.topics}
                      placeholder="e.g. Hooks, API"
                      onChange={(e) => updateField(task.id, 'topics', e.target.value)}
                      disabled={!task._selected}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={selected.filter((t) => t._selected).length === 0}
          >
            Copy Selected ({selected.filter((t) => t._selected).length})
          </button>
        </div>
      </div>
    </div>
  );
}
