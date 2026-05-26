import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { getLocalAuthSession } from '../utils/localAuth';

export default function useCurrentUser() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [localProfile, setLocalProfile] = useState(() => getLocalAuthSession());

  useEffect(() => {
    function syncLocalProfile() {
      setLocalProfile(getLocalAuthSession());
    }

    window.addEventListener('local-auth-change', syncLocalProfile);
    window.addEventListener('storage', syncLocalProfile);
    return () => {
      window.removeEventListener('local-auth-change', syncLocalProfile);
      window.removeEventListener('storage', syncLocalProfile);
    };
  }, []);

  if (localProfile?.id) {
    return {
      authType: 'supabase-profile',
      isLoaded: true,
      isSignedIn: true,
      userId: localProfile.user_id || localProfile.id,
      profile: localProfile,
      clerkUser: null,
    };
  }

  return {
    authType: 'clerk',
    isLoaded,
    isSignedIn,
    userId,
    profile: null,
    clerkUser: user,
  };
}
