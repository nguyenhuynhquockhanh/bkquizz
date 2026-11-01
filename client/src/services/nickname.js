const COOKIE_NAME = 'bkquiz_nickname';
const MAX_AGE = 30 * 24 * 60 * 60;

export function readNickname(cookies = document.cookie) {
  const value = cookies.split(';').map(part => part.trim())
    .find(part => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  try { return value ? decodeURIComponent(value).trim().slice(0, 25) : ''; }
  catch { return ''; }
}

export function rememberNickname(nickname, remember = true) {
  const value = remember ? nickname.trim().slice(0, 25) : '';
  // This preference is readable by the form, never used for authentication.
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${value ? MAX_AGE : 0}; Path=/; SameSite=Lax${secure}`;
}
