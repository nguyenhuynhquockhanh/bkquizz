import test from 'node:test';
import assert from 'node:assert/strict';
import { readRoute, routeUrl } from '../../client/src/services/routes.js';

test('reloadable routes retain section and quiz id, with safe fallback for invalid tabs', () => {
  for (const route of [
    { view:'admin',tab:'users',quizId:null },
    { view:'my-quizzes',tab:'history',quizId:null },
    { view:'editor',tab:undefined,quizId:'quiz a&b' }
  ]) assert.deepEqual(readRoute(routeUrl(route)), route);
  assert.equal(readRoute('/admin?tab=invalid').tab,'overview');
  assert.equal(readRoute('/unknown').view,'home');
  assert.equal(readRoute('/admin/').view,'admin');
  assert.equal(readRoute('/?pin=123456').view,'home');
});
