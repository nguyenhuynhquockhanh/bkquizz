import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPassword(password, hash) {
  if (typeof password !== 'string' || password.length > 1024 || !hash) return false;
  const [algorithm, salt, digest] = hash.split(':');
  if (algorithm !== 'scrypt' || !salt || !/^[a-f0-9]{128}$/.test(digest || '')) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(digest, 'hex'));
}

export const publicUser = (user) => ({
  id: user.id, name: user.name, email: user.email,
  role: user.role === 'admin' ? 'admin' : 'user', createdAt: user.createdAt
});

export function createAuth(readUsers, saveUsers) {
  const sessions = new Map();
  const lifetime = 12 * 60 * 60 * 1000;
  // Preserve existing accounts while migrating old plaintext passwords.
  const users = readUsers();
  let changed = false;
  for (const user of users) {
    if (typeof user.password === 'string') {
      user.passwordHash = hashPassword(user.password);
      delete user.password;
      changed = true;
    }
    if (!['admin', 'user'].includes(user.role)) { user.role = 'user'; changed = true; }
  }
  if (changed) saveUsers(users);

  function resolve(token) {
    const session = sessions.get(token);
    if (!session) return null;
    if (session.expires <= Date.now()) { sessions.delete(token); return null; }
    return readUsers().find((u) => u.id === session.userId) || null;
  }
  function issue(user) {
    for (const [key, value] of sessions) if (value.expires <= Date.now()) sessions.delete(key);
    const token = randomBytes(32).toString('hex');
    sessions.set(token, { userId: user.id, expires: Date.now() + lifetime });
    return { ...publicUser(user), token };
  }
  function requireUser(req, res, next) {
    req.token = req.headers.authorization?.replace(/^Bearer /, '');
    req.user = resolve(req.token);
    if (!req.user) return res.status(401).json({ error: 'Vui lòng đăng nhập lại.' });
    next();
  }
  function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ quản trị viên được thực hiện thao tác này.' });
    next();
  }
  function createUser(body, role = 'user') {
    const { name, email, password } = body;
    if (typeof name !== 'string' || !name.trim() || name.length > 100 ||
        typeof email !== 'string' || !email.trim() || email.length > 254 ||
        typeof password !== 'string' || password.length < 6 || password.length > 1024) {
      return { error: 'Nhập tên, tài khoản và mật khẩu từ 6 đến 1024 ký tự.' };
    }
    const users = readUsers();
    const account = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === account)) return { error: 'Tài khoản đã tồn tại.' };
    const user = { id: randomUUID(), name: name.trim(), email: account,
      passwordHash: hashPassword(password), role, createdAt: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
    return { user };
  }
  return { resolve, issue, requireUser, requireAdmin, createUser,
    revoke: (token) => sessions.delete(token) };
}
