const GUEST_MODE_KEY = 'iniku_guest_mode';

export function isGuestModeEnabled() {
  try {
    return window.localStorage.getItem(GUEST_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function enableGuestMode() {
  try {
    window.localStorage.setItem(GUEST_MODE_KEY, 'true');
  } catch {}
}

export function disableGuestMode() {
  try {
    window.localStorage.removeItem(GUEST_MODE_KEY);
  } catch {}
}
