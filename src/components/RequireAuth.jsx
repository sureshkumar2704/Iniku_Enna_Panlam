import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { isGuestModeEnabled } from '../utils/guestMode';
import { isLocalAuthEnabled } from '../utils/localAuth';

export default function RequireAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (isGuestModeEnabled() || isLocalAuthEnabled()) {
    return <Outlet />;
  }

  if (!isLoaded) {
    return (
      <div className="auth-page">
        <div className="auth-shell auth-shell--loading">
          <div className="auth-loading-card">Loading your workspace...</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
