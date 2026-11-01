import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, copyFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = fileURLToPath(new URL('../', import.meta.url));

test('authentication and role boundaries', { timeout: 30000 }, async (t) => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'bkquiz-auth-test-'));
  for (const file of ['users.json', 'quizzes.json']) {
    await copyFile(path.join(serverDir, 'src/data', file), path.join(dataDir, file));
  }
  const child = spawn(process.execPath, ['src/index.js'], {
    cwd: serverDir, env: { ...process.env, PORT: '0', DATA_DIR: dataDir, NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let errors = '';
  child.stderr.on('data', (chunk) => { errors += chunk; });
  try {
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server did not start: ' + errors)), 10000);
      child.once('error', (err) => { clearTimeout(timer); reject(err); });
      child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${errors}`)); });
      child.stdout.on('data', (chunk) => {
        const match = String(chunk).match(/localhost:(\d+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
    });
    async function request(url, method = 'GET', body, token) {
      const response = await fetch(`http://127.0.0.1:${port}${url}`, {
        method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      return { status: response.status, body: await response.json() };
    }
    let admin, user, other, quizId;
    await t.test('anonymous and malformed logins cannot access admin APIs', async () => {
      assert.equal((await request('/api/admin/users')).status, 401);
      assert.equal((await request('/api/auth/login', 'POST', {})).status, 401);
      assert.equal((await request('/api/auth/login', 'POST', { email: 'admin', password: 'wrong' })).status, 401);
    });
    await t.test('temporary admin login returns role, token, and no password hash', async () => {
      const response = await request('/api/auth/login', 'POST', { email: 'admin', password: 'admin123' });
      assert.equal(response.status, 200);
      admin = response.body;
      assert.equal(admin.role, 'admin');
      assert.ok(admin.token);
      assert.equal(admin.passwordHash, undefined);
      assert.equal((await request('/api/admin/users', 'GET', undefined, admin.token)).status, 200);
    });
    await t.test('registration ignores forged admin role and supports non-HCMUT accounts', async () => {
      const response = await request('/api/auth/register', 'POST', { name: 'User', email: 'ordinary@example.com', password: 'test1234', role: 'admin' });
      assert.equal(response.status, 201);
      user = response.body;
      assert.equal(user.role, 'user');
      other = (await request('/api/auth/register', 'POST', { name: 'Other', email: 'other', password: 'test1234' })).body;
      assert.equal((await request('/api/auth/me', 'GET', undefined, user.token)).body.role, 'user');
    });
    await t.test('ordinary users are rejected on all admin operations', async () => {
      for (const endpoint of ['overview', 'users', 'live-rooms', 'history']) {
        assert.equal((await request('/api/admin/' + endpoint, 'GET', undefined, user.token)).status, 403);
      }
      assert.equal((await request('/api/admin/users', 'POST', {}, user.token)).status, 403);
      assert.equal((await request(`/api/admin/users/${user.id}/role`, 'PATCH', { role: 'admin' }, user.token)).status, 403);
      assert.equal((await request(`/api/admin/users/${admin.id}`, 'DELETE', undefined, user.token)).status, 403);
    });
    await t.test('quiz ownership is assigned by the server, not the client', async () => {
      const response = await request('/api/quizzes', 'POST', { title: 'Owned quiz', userId: admin.id }, user.token);
      assert.equal(response.status, 201);
      quizId = response.body.id;
      assert.equal(response.body.userId, user.id);
      assert.equal((await request(`/api/quizzes/${quizId}`, 'PUT', { title: 'Mine' }, user.token)).status, 200);
      for (const method of ['GET', 'PUT', 'DELETE']) {
        assert.equal((await request(`/api/quizzes/${quizId}`, method, method === 'PUT' ? {} : undefined, other.token)).status, 403);
      }
      assert.deepEqual((await request(`/api/quizzes?userId=${user.id}`, 'GET', undefined, other.token)).body, []);
      assert.equal((await request(`/api/quizzes/${quizId}`, 'PUT', { title: 'Moderated' }, admin.token)).status, 200);
    });
    await t.test('PDF import validates answers, persists and keeps ownership', async () => {
      const question = { type: 'MULTIPLE_CHOICE', question: 'Pick two', timeLimit: 30, points: 1000,
        options: ['One','Two','Three','Four'].map((text,id)=>({id,text,isCorrect:id===1})) };
      const draft = { title: 'Imported quiz', userId: admin.id, questions: [question] };
      assert.equal((await request('/api/quizzes/import','POST',draft)).status,401);
      assert.equal((await request('/api/quizzes/import','POST',{...draft,questions:[]},user.token)).status,400);
      const saved = await request('/api/quizzes/import','POST',draft,user.token);
      assert.equal(saved.status,201);
      assert.equal(saved.body.userId,user.id);
      assert.equal((await request(`/api/quizzes/${saved.body.id}`,'GET',undefined,other.token)).status,403);
      assert.equal((await request(`/api/quizzes/${saved.body.id}`,'GET',undefined,user.token)).body.questions[0].options[1].isCorrect,true);
      const stored=JSON.parse(await readFile(path.join(dataDir,'quizzes.json'),'utf8'));
      assert.ok(stored.some(q=>q.id===saved.body.id));
    });
    await t.test('admin can create and change roles; sessions use the current server role', async () => {
      const created = await request('/api/admin/users', 'POST', { name: 'Second admin', email: 'admin2', password: 'test1234', role: 'admin' }, admin.token);
      assert.equal(created.status, 201);
      assert.equal(created.body.role, 'admin');
      assert.equal((await request(`/api/admin/users/${user.id}/role`, 'PATCH', { role: 'admin' }, admin.token)).status, 200);
      assert.equal((await request('/api/admin/overview', 'GET', undefined, user.token)).status, 200);
      assert.equal((await request(`/api/admin/users/${user.id}/role`, 'PATCH', { role: 'user' }, admin.token)).status, 200);
      assert.equal((await request('/api/admin/overview', 'GET', undefined, user.token)).status, 403);
      assert.equal((await request(`/api/admin/users/${admin.id}/role`, 'PATCH', { role: 'user' }, admin.token)).status, 400);
      assert.equal((await request(`/api/admin/users/${admin.id}`, 'DELETE', undefined, admin.token)).status, 400);
    });
    await t.test('logout and deletion revoke access, forged tokens fail', async () => {
      assert.equal((await request('/api/auth/logout', 'POST', {}, user.token)).status, 200);
      assert.equal((await request('/api/auth/me', 'GET', undefined, user.token)).status, 401);
      assert.equal((await request('/api/admin/overview', 'GET', undefined, 'forged-admin')).status, 401);
      assert.equal((await request(`/api/admin/users/${other.id}`, 'DELETE', undefined, admin.token)).status, 200);
      assert.equal((await request('/api/auth/me', 'GET', undefined, other.token)).status, 401);
    });
    await t.test('stored passwords are hashed and never returned by user listing', async () => {
      const stored = JSON.parse(await readFile(path.join(dataDir, 'users.json'), 'utf8'));
      assert.ok(stored.every((u) => !('password' in u) && u.passwordHash.startsWith('scrypt:')));
      const listed = (await request('/api/admin/users', 'GET', undefined, admin.token)).body;
      assert.ok(listed.every((u) => !('password' in u) && !('passwordHash' in u)));
    });
  } finally {
    const stopped = new Promise((resolve) => child.once('exit', resolve));
    if (child.exitCode === null) { child.kill(); await stopped; }
    assert.equal(path.dirname(path.resolve(dataDir)), path.resolve(tmpdir()));
    assert.ok(path.basename(dataDir).startsWith('bkquiz-auth-test-'));
    await rm(dataDir, { recursive: true, force: true });
  }
});
