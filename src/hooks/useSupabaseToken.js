import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { isLocalAuthEnabled } from '../utils/localAuth';

export default function useSupabaseToken() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    if (!isLoaded) {
      return undefined;
    }

    if (isLocalAuthEnabled()) {
      setToken(null);
      setIsReady(true);
      return undefined;
    }

    if (!isSignedIn) {
      setToken(null);
      setIsReady(true);
      return undefined;
    }

    setIsReady(false);
    getToken({ template: 'supabase' })
      .then((nextToken) => {
        if (!active) return;
        setToken(nextToken || null);
        setIsReady(true);
      })
      .catch(() => {
        if (!active) return;
        setToken(null);
        setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, [getToken, isLoaded, isSignedIn]);

  return { token, isReady, isSignedIn };
}
