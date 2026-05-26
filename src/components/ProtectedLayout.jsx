import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import AppBrand from './AppBrand';
import useSupabaseToken from '../hooks/useSupabaseToken';
import { deriveAccountCredentials } from '../utils/accountCredentials';
import { upsertUserProfile } from '../utils/profileStore';

export default function ProtectedLayout() {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const { token, isReady, isSignedIn } = useSupabaseToken();

  React.useEffect(() => {
    let active = true;

    async function syncProfile() {
      if (!isLoaded || !isReady || !isSignedIn || !user || !token) return;

      try {
        await upsertUserProfile(user, token, deriveAccountCredentials(user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || ''));
      } catch (err) {
        if (active) {
          console.error('Profile sync failed', err);
        }
      }
    }

    syncProfile();

    return () => {
      active = false;
    };
  }, [isLoaded, isReady, isSignedIn, token, user]);

  const avatarUrl = user?.imageUrl || user?.profileImageUrl || '';

  return (
    <div className="protected-layout">
      <header className="protected-header">
        <AppBrand compact />
        <div className="protected-layout__actions">
          <Link to="/profile" className="protected-header__avatarLink" aria-label="Open profile">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="protected-header__avatar" />
            ) : (
              <span className="protected-header__avatarFallback">{(user?.firstName || user?.username || 'U').slice(0, 1).toUpperCase()}</span>
            )}
          </Link>
          <button type="button" className="protected-header__signout" onClick={() => signOut({ redirectUrl: '/sign-in' })}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M10 17v2a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v2" />
              <path d="M15 12H3" />
              <path d="m6 9-3 3 3 3" />
            </svg>
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}