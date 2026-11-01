import path from 'node:path';

export function httpPolicy({ production = false } = {}) {
  return (req, res, next) => {
    // Azure terminates TLS before Express. Do not trust client-supplied forwarded headers.
    // Browsers only accept HSTS over HTTPS; HTTPS Only remains enabled at Azure.
    if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  };
}

export function staticCacheHeaders(res, filePath) {
  const filename = path.basename(filePath);
  const inAssets = path.basename(path.dirname(filePath)) === 'assets';
  // Only Vite's fingerprinted assets are immutable; public images keep stable URLs.
  const fingerprinted = inAssets && /-[\w-]{8,}\.[\w]+$/.test(filename);
  res.setHeader('Cache-Control', fingerprinted
    ? 'public, max-age=31536000, immutable'
    : filename.endsWith('.html') ? 'no-cache' : 'public, max-age=3600');
}
