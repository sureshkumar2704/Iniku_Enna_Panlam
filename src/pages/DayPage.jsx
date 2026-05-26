import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import TaskList from '../components/TaskList';
import CopyYesterdayModal from '../components/CopyYesterdayModal';
import {
  formatFullDate,
  fromDateKey,
  getYesterdayKey,
  todayKey,
  toDateKey,
} from '../utils/dateUtils';
import {
  getTasksForDate,
  saveTasksForDate,
  createEmptyTask,
  cloneTasksFromDate,
} from '../hooks/useTasks';
import useSupabaseToken from '../hooks/useSupabaseToken';
import { isGuestModeEnabled } from '../utils/guestMode';

export default function DayPage() {
  const { dateKey } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { token: supabaseToken, isReady: supabaseReady } = useSupabaseToken();
  const [tasks, setTasks] = useState([]);
  const [yesterdayTasks, setYesterdayTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const date = fromDateKey(dateKey);
  const isToday = dateKey === todayKey();
  const yesterdayKey = getYesterdayKey(dateKey);

  // Load tasks on mount / dateKey change
  useEffect(() => {
    let active = true;
    if (isGuestModeEnabled()) {
      setTasks([]);
      setYesterdayTasks([]);
      setIsLoaded(true);
      return () => { active = false; };
    }

    if (!userId || !supabaseReady) return () => { active = false; };
    setIsLoaded(false);
    Promise.all([
      getTasksForDate(dateKey, userId, supabaseToken),
      cloneTasksFromDate(yesterdayKey, userId, supabaseToken)
    ]).then(([t, yt]) => {
      if (active) {
        setTasks(t);
        setYesterdayTasks(yt);
        setIsLoaded(true);
      }
    });
    return () => { active = false; };
  }, [dateKey, yesterdayKey, userId, supabaseReady, supabaseToken]);

  // Auto-save whenever tasks change
  useEffect(() => {
    if (!isLoaded) return;
    saveTasksForDate(dateKey, tasks, userId, supabaseToken);
    flashSaved();
  }, [tasks, dateKey, isLoaded, userId, supabaseToken]);

  function flashSaved() {
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 1500);
  }

  function addTask() {
    setTasks((prev) => [...prev, createEmptyTask()]);
  }

  function handleChange(id, field, value) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  function handleDelete(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleCopyConfirm(copiedTasks) {
    setTasks((prev) => {
      // Avoid duplicating identical names if already present
      const existingNames = new Set(prev.map((t) => t.name.trim()));
      const fresh = copiedTasks.filter((t) => !existingNames.has(t.name.trim()));
      return [...prev, ...fresh];
    });
    setShowModal(false);
  }

  function goToPrevDay() {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    navigate(`/day/${toDateKey(d)}`);
  }

  function goToNextDay() {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    navigate(`/day/${toDateKey(d)}`);
  }

  const done = tasks.filter((t) => t.status === 'done').length;
  const notDone = tasks.filter((t) => t.status === 'not_done').length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const progressPct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="page day-page">
      {/* Header */}
      <header className="day-header">
        <button className="day-back-btn" onClick={() => navigate('/')} aria-label="Back to calendar">
          ← Calendar
        </button>

        <div className="day-header-center">
          <div className="day-date-display">
            {isToday && <span className="day-today-badge">TODAY</span>}
            <div className="day-date-nav">
              <button className="day-nav-arrow" onClick={goToPrevDay} aria-label="Previous day">‹</button>
              <h1 className="day-date-title">{formatFullDate(date)}</h1>
              <button className="day-nav-arrow" onClick={goToNextDay} aria-label="Next day">›</button>
            </div>
          </div>

          {/* Progress bar */}
          {tasks.length > 0 && (
            <div className="day-progress-section">
              <div className="day-progress-bar-wrap">
                <div
                  className="day-progress-bar-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="day-stats">
                <span className="stat stat--done">✓ {done} done</span>
                <span className="stat stat--not-done">✗ {notDone} skipped</span>
                <span className="stat stat--pending">○ {pending} pending</span>
              </div>
            </div>
          )}
        </div>

        <div className="day-header-right">
          {savedIndicator && <span className="save-indicator">✓ Saved</span>}
        </div>
      </header>

      {/* Action bar */}
      <div className="day-action-bar">
        <button
          id="add-task-btn"
          className="btn btn-primary day-action-btn day-action-btn--add"
          onClick={addTask}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Add Task
        </button>
        <button
          id="copy-yesterday-btn"
          className="btn btn-secondary day-action-btn day-action-btn--copy"
          onClick={() => setShowModal(true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M8 8h10v10H8z" />
            <path d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            <path d="M11 13h4" />
            <path d="M13 11v4" />
          </svg>
          Copy Yesterday
        </button>
      </div>

      {/* Task list */}
      <main className="day-main">
        <TaskList
          tasks={tasks}
          onChange={handleChange}
          onDelete={handleDelete}
        />

        {tasks.length > 0 && (
          <div className="day-add-row">
            <button className="btn btn-ghost" onClick={addTask}>+ Add another task</button>
          </div>
        )}
      </main>

      {/* Copy yesterday modal */}
      {showModal && (
        <CopyYesterdayModal
          yesterdayTasks={yesterdayTasks}
          onConfirm={handleCopyConfirm}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
