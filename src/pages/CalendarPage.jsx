import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarGrid from '../components/CalendarGrid';
import TodayProgress from '../components/TodayProgress';
import DestinationCountdown from '../components/DestinationCountdown';
import useCurrentUser from '../hooks/useCurrentUser';
import { MONTHS } from '../utils/dateUtils';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { userId } = useCurrentUser();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function goToToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  return (
    <div className="page calendar-page">
      {/* App header */}
      <header className="app-header">
        <div className="app-header-inner">
          <button className="calendar-backlog-btn" onClick={() => navigate('/todos')}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M8 6h12" />
              <path d="M8 12h12" />
              <path d="M8 18h12" />
              <path d="M4 6h.01" />
              <path d="M4 12h.01" />
              <path d="M4 18h.01" />
            </svg>
            Task Backlog
          </button>
        </div>
      </header>

      <main className="calendar-main">
        <div className="calendar-layout">

          {/* ── Destination Countdown ── */}
          <DestinationCountdown userId={userId} />

          {/* ── Today's Progress card ── */}
          <TodayProgress userId={userId} />



          {/* ── Calendar ── */}
          <div className="calendar-container">
            <div className="calendar-nav">
              <button className="calendar-nav-btn" onClick={prevMonth} aria-label="Previous month">‹</button>
              <div className="calendar-month-title">
                <h2>{MONTHS[month]}</h2>
                <span className="calendar-year">{year}</span>
              </div>
              <button className="calendar-nav-btn" onClick={nextMonth} aria-label="Next month">›</button>
            </div>

            <button className="btn btn-ghost calendar-today-btn" onClick={goToToday}>Today</button>

            <CalendarGrid year={year} month={month} userId={userId} />

            <div className="calendar-legend">
              <div className="legend-item"><span className="legend-dot legend-dot--today" /><span>Today</span></div>
              <div className="legend-item"><span className="legend-dot legend-dot--tasks" /><span>Has tasks</span></div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
