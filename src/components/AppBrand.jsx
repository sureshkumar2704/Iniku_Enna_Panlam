import React from 'react';

export default function AppBrand({ compact = false }) {
  return (
    <div className={`app-brand ${compact ? 'app-brand--compact' : ''}`}>
      <span className="app-brand__icon">📅</span>
      <div className="app-brand__text">
        <h1 className="app-brand__title">Iniku Enna Panlam</h1>
        {!compact && <p className="app-brand__subtitle">Your daily progress tracker</p>}
      </div>
    </div>
  );
}