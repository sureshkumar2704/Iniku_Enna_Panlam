const LOCAL_AUTH_KEY = 'iniku_supabase_profile_session';

export function getLocalAuthSession() {
  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalAuthSession(profile) {
  try {
    window.localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event('local-auth-change'));
  } catch {}
}

export function clearLocalAuthSession() {
  try {
    window.localStorage.removeItem(LOCAL_AUTH_KEY);
    window.dispatchEvent(new Event('local-auth-change'));
  } catch {}
}

export function isLocalAuthEnabled() {
  return Boolean(getLocalAuthSession()?.id);
}
