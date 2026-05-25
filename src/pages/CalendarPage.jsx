import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarGrid from '../components/CalendarGrid';
import TodayProgress from '../components/TodayProgress';
import DestinationCountdown from '../components/DestinationCountdown';
import { MONTHS } from '../utils/dateUtils';

export default function CalendarPage() {
  const navigate = useNavigate();
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
          <div className="app-logo">
            <span className="app-logo-icon">📅</span>
            <div>
              <h1 className="app-title">Iniku Enna Panlam</h1>
              <p className="app-subtitle">Your daily progress tracker</p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/todos')}>
            🎯 Global To-Do
          </button>
        </div>
      </header>

      <main className="calendar-main">
        <div className="calendar-layout">

          {/* ── Destination Countdown ── */}
          <DestinationCountdown />

          {/* ── Today's Progress card ── */}
          <TodayProgress />



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

            <CalendarGrid year={year} month={month} />

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
