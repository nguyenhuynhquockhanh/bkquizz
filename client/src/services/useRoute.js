import { useCallback, useEffect, useState } from 'react';
import { readRoute, routeUrl } from './routes';

export function useRoute() {
  const [route, setRoute] = useState(() => readRoute(window.location.href));
  useEffect(() => {
    const restore = () => setRoute(readRoute(window.location.href));
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  const navigate = useCallback((next, replace = false) => {
    const url = routeUrl(next);
    if (url !== window.location.pathname + window.location.search) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
    }
    setRoute(readRoute(window.location.href));
  }, []);
  return [route, navigate];
}
