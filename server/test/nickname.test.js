import test from 'node:test';
import assert from 'node:assert/strict';
import { readNickname, rememberNickname } from '../../client/src/services/nickname.js';

test('nickname cookie handles Vietnamese, malformed values, HTTPS flags and deletion', t => {
  const nickname = 'Khánh; BK 🐱';
  assert.equal(readNickname(`other=value; bkquiz_nickname=${encodeURIComponent(nickname)}`), nickname);
  assert.equal(readNickname('bkquiz_nickname=%E0%A4%A'), '');
  assert.equal(readNickname('other=value'), '');
  const oldDocument = globalThis.document, oldWindow = globalThis.window;
  t.after(() => {
    if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument;
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow;
  });
  globalThis.document = { cookie: '' };
  globalThis.window = { location: { protocol: 'https:' } };
  rememberNickname(nickname);
  assert.ok(document.cookie.startsWith(`bkquiz_nickname=${encodeURIComponent(nickname)};`));
  assert.match(document.cookie, /Max-Age=2592000; Path=\/; SameSite=Lax; Secure$/);
  rememberNickname('', false);
  assert.match(document.cookie, /^bkquiz_nickname=; Max-Age=0;/);
  window.location.protocol = 'http:';
  rememberNickname('Local');
  assert.ok(!document.cookie.includes('Secure'));
});
