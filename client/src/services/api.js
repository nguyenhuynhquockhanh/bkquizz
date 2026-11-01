const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
export const getToken = () => sessionStorage.getItem('bkquiz_token');
export const setToken = (token) => token ? sessionStorage.setItem('bkquiz_token', token) : sessionStorage.removeItem('bkquiz_token');
export async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await window.fetch(url, { ...options, headers });
  if (response.status === 401 && !url.endsWith('/auth/login')) {
    setToken(null);
    window.dispatchEvent(new Event('bkquiz:logged-out'));
  }
  return response;
}
export async function downloadReport(pin) {
  const response = await apiFetch(`${backendUrl}/api/reports/${pin}/export`);
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Không tải được báo cáo.');
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `BKQuiz_${pin}.xlsx`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
