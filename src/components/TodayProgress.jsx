import React, { useState, useEffect } from 'react';
import ClockPicker from './ClockPicker';
import { todayKey } from '../utils/dateUtils';
import { getCompletionStats } from '../hooks/useTasks';

async function saveSession(dateKey, data, userId) {
  const id = `${userId || 'public'}::${dateKey}`;
  try {
    const checkRes = await fetch(`/api/sessions/${id}`);
    if (checkRes.ok) {
      await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId, dateKey, ...data }),
      });
    } else {
      await fetch(`/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId, dateKey, ...data }),
      });
    }
  } catch {}
}

function calcDuration(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return { hours: Math.floor(mins / 60), mins: mins % 60, total: mins };
}

function fmt12(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ap}`;
}

export default function TodayProgress({ userId }) {
  const dateKey = todayKey();
  const [session, setSession] = useState({ startTime: '', endTime: '' });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/sessions/${userId || 'public'}::${dateKey}`)
      .then(res => res.ok ? res.json() : { startTime: '', endTime: '' })
      .then(data => { if (active) setSession({ startTime: data.startTime || '', endTime: data.endTime || '' }); })
      .catch(() => { if (active) setSession({ startTime: '', endTime: '' }); });

    getCompletionStats(dateKey, userId).then(data => { if (active) setStats(data); });
    
    // refresh stats every 10s in case day page updates
    const id = setInterval(() => {
      getCompletionStats(dateKey, userId).then(data => { if (active) setStats(data); });
    }, 10000);
    return () => { active = false; clearInterval(id); };
  }, [dateKey, userId]);

  function update(field, val) {
    const next = { ...session, [field]: val };
    setSession(next);
    saveSession(dateKey, next, userId);
  }

  const duration = calcDuration(session.startTime, session.endTime);
  const taskPct = stats ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="tp-card">
      {/* Header */}
      <div className="tp-header">
        <span className="tp-icon">⚡</span>
        <div>
          <h2 className="tp-title">Today's Progress</h2>
          <p className="tp-sub">Track your focused study session</p>
        </div>
      </div>

      {/* Time pickers row */}
      <div className="tp-times">
        <ClockPicker
          label="Start Time"
          value={session.startTime}
          onChange={(v) => update('startTime', v)}
          placeholder="Set start"
        />

        <div className="tp-arrow">→</div>

        <ClockPicker
          label="End Time"
          value={session.endTime}
          onChange={(v) => update('endTime', v)}
          placeholder="Set end"
        />

        {/* Duration — shown "ahead of the times" = prominently after */}
        {duration ? (
          <div className="tp-duration">
            <span className="tp-duration-icon">⏱</span>
            <div>
              <p className="tp-duration-value">
                {duration.hours > 0 && <span>{duration.hours}<em>h</em> </span>}
                <span>{duration.mins}<em>m</em></span>
              </p>
              <p className="tp-duration-label">focused</p>
            </div>
          </div>
        ) : (
          <div className="tp-duration tp-duration--empty">
            <span className="tp-duration-icon">⏱</span>
            <p className="tp-duration-hint">Set both times<br/>to see duration</p>
          </div>
        )}
      </div>

      {/* Time display strip */}
      {(session.startTime || session.endTime) && (
        <div className="tp-strip">
          {session.startTime && (
            <span className="tp-strip-item tp-strip-item--start">
              <span className="tp-strip-dot" /> {fmt12(session.startTime)}
            </span>
          )}
          {duration && (
            <span className="tp-strip-bar" style={{ flex: duration.total }}>
              <span className="tp-strip-fill" />
              <span className="tp-strip-dur-label">{duration.hours > 0 ? `${duration.hours}h ` : ''}{duration.mins}m</span>
            </span>
          )}
          {session.endTime && (
            <span className="tp-strip-item tp-strip-item--end">
              {fmt12(session.endTime)} <span className="tp-strip-dot" />
            </span>
          )}
        </div>
      )}

      {/* Task stats */}
      {stats && (
        <div className="tp-tasks">
          <div className="tp-tasks-header">
            <span className="tp-tasks-label">Tasks Today</span>
            <span className="tp-tasks-count">{stats.done} / {stats.total} done</span>
          </div>
          <div className="tp-tasks-bar">
            <div className="tp-tasks-fill" style={{ width: `${taskPct}%` }} />
          </div>
        </div>
      )}

      {!stats && (
        <p className="tp-no-tasks">No tasks logged today yet — click a date to add some!</p>
      )}
    </div>
  );
}
