const key = 'bkquiz_play_session';
export function readPlaySession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(key));
    return value && ['host', 'player'].includes(value.role) && /^\d{6}$/.test(value.pin) &&
      /^[a-f0-9]{64}$/.test(value.resumeToken) ? value : null;
  } catch { return null; }
}
export function savePlaySession(value) {
  if (value) sessionStorage.setItem(key, JSON.stringify(value));
  else sessionStorage.removeItem(key);
}
