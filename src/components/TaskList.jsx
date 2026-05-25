import React from 'react';
import TaskRow from './TaskRow';

export default function TaskList({ tasks, onChange, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="task-list-empty">
        <div className="task-list-empty-icon">📋</div>
        <p>No tasks yet. Add one below or copy from yesterday!</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {/* Header row */}
      <div className="task-list-header">
        <span className="task-list-header-num">#</span>
        <span className="task-list-header-status">Status</span>
        <span className="task-list-header-name">Task</span>
        <span className="task-list-header-time">Start</span>
        <span className="task-list-header-time">End</span>
        <span className="task-list-header-topics">Topics Learned</span>
        <span className="task-list-header-del" />
      </div>

      {/* Task rows */}
      {tasks.map((task, idx) => (
        <TaskRow
          key={task.id}
          task={task}
          index={idx}
          onChange={onChange}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
