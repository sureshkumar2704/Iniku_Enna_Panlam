import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DAYS_OF_WEEK,
  MONTHS,
  getDaysInMonth,
  getFirstDayOfMonth,
  toDateKey,
  todayKey,
} from '../utils/dateUtils';
import { getAllStats } from '../hooks/useTasks';

export default function CalendarGrid({ year, month }) {
  const navigate = useNavigate();
  const today = todayKey();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const [statsMap, setStatsMap] = useState({});

  useEffect(() => {
    let active = true;
    getAllStats().then(data => {
      if (active) setStatsMap(data);
    });
    return () => { active = false; };
  }, [year, month]);

  // Build grid cells (blanks + days)
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function handleDayClick(day) {
    const dateKey = toDateKey(new Date(year, month, day));
    navigate(`/day/${dateKey}`);
  }

  return (
    <div className="calendar-grid">
      {/* Weekday headers */}
      {DAYS_OF_WEEK.map((d) => (
        <div key={d} className="calendar-weekday">{d}</div>
      ))}

      {/* Day cells */}
      {cells.map((day, idx) => {
        if (!day) return <div key={`blank-${idx}`} className="calendar-cell calendar-cell--blank" />;

        const dateKey = toDateKey(new Date(year, month, day));
        const isToday = dateKey === today;
        const stats = statsMap[dateKey];
        const hasTasks = !!stats;

        return (
          <button
            key={dateKey}
            id={`day-${dateKey}`}
            className={`calendar-cell ${isToday ? 'calendar-cell--today' : ''} ${hasTasks ? 'calendar-cell--has-tasks' : ''}`}
            onClick={() => handleDayClick(day)}
            aria-label={`${day} ${MONTHS[month]} ${year}`}
          >
            <span className="calendar-day-num">{day}</span>
            {hasTasks && stats && (
              <span className="calendar-day-badge">
                {stats.done}/{stats.total}
              </span>
            )}
            {hasTasks && !stats && (
              <span className="calendar-day-dot" />
            )}
          </button>
        );
      })}
    </div>
  );
}
