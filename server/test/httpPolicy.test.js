import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { httpPolicy, staticCacheHeaders } from '../src/httpPolicy.js';

test('HTTP policy separates private API, HTML, versioned assets and public images', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'bkquiz-http-'));
  await mkdir(path.join(dir, 'assets'));
  for (const [file, content] of Object.entries({ 'index.html': '<h1>BKQuiz</h1>', 'assets/index-1234abcd.js': 'export default 1', 'logo.svg': '<svg/>' })) {
    await writeFile(path.join(dir, file), content);
  }
  const app = express();
  app.use(httpPolicy({ production: true }));
  app.use(express.json());
  app.post('/api/auth/login', (_req, res) => res.json({ token: 'test-token' }));
  app.use('/api', (_req, res) => res.sendStatus(401));
  app.use(express.static(dir, { setHeaders: staticCacheHeaders }));
  app.get('/admin', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(dir, 'index.html'));
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const request = (url, options = {}) => new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path: url, ...options }, res => {
      res.resume(); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
    });
    req.on('error', reject); req.end();
  });
  try {
    for (const route of ['/', '/admin']) {
      const r = await request(route);
      assert.equal(r.headers['cache-control'], 'no-cache');
      assert.equal(r.headers['strict-transport-security'], 'max-age=31536000');
    }
    const asset = await request('/assets/index-1234abcd.js');
    assert.equal(asset.headers['cache-control'], 'public, max-age=31536000, immutable');
    assert.equal((await request('/assets/index-1234abcd.js', { headers: { 'If-None-Match': asset.headers.etag } })).status, 304);
    assert.equal((await request('/logo.svg')).headers['cache-control'], 'public, max-age=3600');
    for (const [url, method] of [['/api/auth/login', 'POST'], ['/api/auth/me', 'GET'], ['/api/missing', 'GET']]) {
      assert.equal((await request(url, { method })).headers['cache-control'], 'no-store');
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    assert.equal(path.dirname(dir), tmpdir());
    assert.ok(path.basename(dir).startsWith('bkquiz-http-'));
    await rm(dir, { recursive: true, force: true });
  }
});

test('local development does not advertise HSTS', () => {
  const headers = {};
  httpPolicy()({ path: '/' }, { setHeader: (key, value) => { headers[key] = value; } }, () => {});
  assert.equal(headers['Strict-Transport-Security'], undefined);
});
