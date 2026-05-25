import React from 'react';
import ClockPicker from './ClockPicker';
import TopicsList from './TopicsList';

const STATUS_CONFIG = {
  pending: { icon: '○', label: 'Pending', next: 'done' },
  done: { icon: '✓', label: 'Done', next: 'not_done' },
  not_done: { icon: '✗', label: 'Not Done', next: 'pending' },
};

export default function TaskRow({ task, index, onChange, onDelete }) {
  function handleChange(field, value) {
    onChange(task.id, field, value);
  }

  function cycleStatus() {
    const next = STATUS_CONFIG[task.status]?.next || 'done';
    handleChange('status', next);
  }

  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;

  const isEditable = task.status === 'pending';

  return (
    <div className={`task-row task-row--${task.status}`}>
      {/* Row number */}
      <span className="task-num">{index + 1}</span>

      {/* Status toggle */}
      <button
        className={`task-status-btn task-status-btn--${task.status}`}
        onClick={cycleStatus}
        title={`Status: ${statusCfg.label} — Click to cycle`}
        aria-label="Toggle task status"
      >
        {statusCfg.icon}
      </button>

      {/* Task name */}
      <input
        type="text"
        className="task-input task-input--name task-input--small"
        placeholder="Task name…"
        value={task.name}
        onChange={(e) => handleChange('name', e.target.value)}
        aria-label="Task name"
      />

      {/* Start time */}
      <div className="task-time-group">
        <ClockPicker
          value={task.startTime}
          onChange={(v) => handleChange('startTime', v)}
          placeholder="Set start"
          label=""
          disabled={!isEditable}
        />
      </div>

      {/* End time */}
      <div className="task-time-group">
        <ClockPicker
          value={task.endTime}
          onChange={(v) => handleChange('endTime', v)}
          placeholder="Set end"
          label=""
          disabled={!isEditable}
        />
      </div>

      {/* Topics learned */}
      <TopicsList
        topics={task.topics}
        onChange={(v) => handleChange('topics', v)}
        disabled={!isEditable}
      />

      {/* Delete */}
      <button
        className="task-delete-btn"
        onClick={() => onDelete(task.id)}
        title="Delete task"
        aria-label="Delete task"
      >
        🗑
      </button>
    </div>
  );
}
