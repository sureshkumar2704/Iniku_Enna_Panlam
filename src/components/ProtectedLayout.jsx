import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import AppBrand from './AppBrand';
import useSupabaseToken from '../hooks/useSupabaseToken';
import useCurrentUser from '../hooks/useCurrentUser';
import { deriveAccountCredentials } from '../utils/accountCredentials';
import { upsertUserProfile } from '../utils/profileStore';
import { disableGuestMode, isGuestModeEnabled } from '../utils/guestMode';
import { clearLocalAuthSession } from '../utils/localAuth';
import { useNavigate } from 'react-router-dom';

export default function ProtectedLayout() {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const currentUser = useCurrentUser();
  const { token, isReady, isSignedIn } = useSupabaseToken();
  const isGuest = isGuestModeEnabled();

  React.useEffect(() => {
    let active = true;

    if (isSignedIn && isGuest) {
      disableGuestMode();
    }

    async function syncProfile() {
      if (currentUser.authType !== 'clerk' || isGuest || !isLoaded || !isReady || !isSignedIn || !user || !token) return;

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
  }, [currentUser.authType, isGuest, isLoaded, isReady, isSignedIn, token, user]);

  const avatarUrl = currentUser.profile?.image_url || user?.imageUrl || user?.profileImageUrl || '';
  const displayInitial = (currentUser.profile?.first_name || currentUser.profile?.username || user?.firstName || user?.username || 'U').slice(0, 1).toUpperCase();

  return (
    <div className="protected-layout">
      <header className="protected-header">
        <AppBrand compact />
        <div className="protected-layout__actions">
          {isGuest ? (
            <button
              type="button"
              className="protected-header__guestExit"
              onClick={() => {
                disableGuestMode();
                navigate('/sign-in');
              }}
            >
              Exit guest
            </button>
          ) : (
            <>
              <Link to="/profile" className="protected-header__avatarLink" aria-label="Open profile">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="protected-header__avatar" />
                ) : (
                  <span className="protected-header__avatarFallback">{displayInitial}</span>
                )}
              </Link>
              <button
                type="button"
                className="protected-header__signout"
                onClick={() => {
                  if (currentUser.authType === 'supabase-profile') {
                    clearLocalAuthSession();
                    navigate('/sign-in');
                    return;
                  }
                  signOut({ redirectUrl: '/sign-in' });
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M10 17v2a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v2" />
                  <path d="M15 12H3" />
                  <path d="m6 9-3 3 3 3" />
                </svg>
              </button>
            </>
          )}
        </div>
      </header>
      <Outlet />
    </div>
  );
}
