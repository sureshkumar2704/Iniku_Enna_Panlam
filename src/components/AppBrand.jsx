import React from 'react';

export default function AppBrand({ compact = false }) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={`app-brand ${compact ? 'app-brand--compact' : ''}`}>
      {!imgError ? (
        <img
          src="public/login-signup.png"
          alt="Iniku Enna Panlam"
          className="app-brand__image"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="app-brand__icon">📅</span>
      )}

      <div className="app-brand__text">
        <h1 className="app-brand__title">Iniku Enna Panlam</h1>
        {!compact && <p className="app-brand__subtitle">Your daily progress tracker</p>}
      </div>
    </div>
  );
}