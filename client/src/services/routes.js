const paths = { home: '/', 'my-quizzes': '/my-quizzes', admin: '/admin', editor: '/editor' };
const tabs = { 'my-quizzes': ['quizzes', 'history'], admin: ['overview', 'quizzes', 'users', 'live', 'history'] };

export function readRoute(href) {
  const url = new URL(href, 'http://localhost');
  const pathname = url.pathname.replace(/\/$/, '') || '/';
  const view = Object.keys(paths).find(key => paths[key] === pathname) || 'home';
  const tab = tabs[view]?.includes(url.searchParams.get('tab')) ? url.searchParams.get('tab') : tabs[view]?.[0];
  return { view, tab, quizId: view === 'editor' ? url.searchParams.get('quiz') || null : null };
}

export function routeUrl({ view, tab, quizId }) {
  const query = new URLSearchParams();
  if (tabs[view]?.includes(tab) && tab !== tabs[view][0]) query.set('tab', tab);
  if (view === 'editor' && quizId) query.set('quiz', quizId);
  return (paths[view] || '/') + (query.size ? `?${query}` : '');
}
