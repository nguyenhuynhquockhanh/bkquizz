import test from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../src/gameManager.js';

function fixture(t) {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const events = [];
  const game = new GameManager({ to: target => ({ emit: (event, data) => events.push({target,event,data}) }) });
  const quiz = { title: 'Test', questions: [0,1,2].map(id => ({ id, question: `Question ${id}`, timeLimit: 30, points: 1000,
    options: [0,1,2,3].map(id => ({ id, text: `Option ${id}`, isCorrect: id === 2 })) })) };
  const room = game.createRoom('host', quiz);
  game.addPlayer(room.pin, 'player', 'Player', '🐱');
  return {game, room, quiz, events};
}
test('settings apply to an isolated round, reindex answers, and lock after start', t => {
  const {game, room, quiz} = fixture(t);
  game.updateSettings(room.pin, { randomizeQuestions: true, randomizeAnswers: true, timeLimit: 60, speedScoring: false, powerUps: true });
  game.startQuiz(room.pin);
  assert.equal(quiz.questions[0].timeLimit,30);
  assert.ok(room.quiz.questions.every(q=>q.timeLimit===60 && q.options.find(o=>o.isCorrect).text==='Option 2'));
  assert.deepEqual(room.quiz.questions[0].options.map(o=>o.id),[0,1,2,3]);
  game.updateSettings(room.pin, {timeLimit:10});assert.equal(room.settings.timeLimit,60);
  t.mock.timers.tick(3000);
  assert.equal(room.status,'QUESTION_ACTIVE');
  assert.equal(room.players.get('p_player').powerUps.doublePoints,1);
});
test('pause freezes timer, rejects answers and excludes pause from speed scoring', t => {
  const {game, room} = fixture(t);game.startQuiz(room.pin);t.mock.timers.tick(3000);
  t.mock.timers.tick(2000);game.pauseGame(room.pin);
  const remaining=room.questionRemainingTime;t.mock.timers.tick(10000);
  game.submitAnswer('player',2);assert.equal(room.currentAnswers.size,0);assert.equal(room.questionRemainingTime,remaining);
  game.resumeGame(room.pin);game.submitAnswer('player',2);
  assert.equal(room.currentAnswers.get('p_player').pointsEarned,967);
  assert.equal(room.historyLogs.length,1);
});
test('ending early preserves partial scores once and stops timers and transitions', t => {
  const {game, room, events} = fixture(t);game.addPlayer(room.pin,'second','Second');
  game.updateSettings(room.pin,{speedScoring:false});game.startQuiz(room.pin);t.mock.timers.tick(3000);
  game.submitAnswer('player',2);game.pauseGame(room.pin);game.stopGame(room.pin);
  assert.equal(room.status,'GAME_OVER');assert.equal(room.players.get('p_player').score,1000);assert.equal(room.historyLogs.length,1);
  game.stopGame(room.pin);game.nextQuestion(room.pin);game.showLeaderboard(room.pin);t.mock.timers.tick(60000);
  assert.equal(room.status,'GAME_OVER');assert.equal(room.historyLogs.length,1);
  assert.equal(events.filter(e=>e.event==='game_over').length,1);
  assert.equal(events.find(e=>e.event==='game_over').data.endedEarly,true);
  assert.ok(game.exportExcelReport(room.pin).length>0);
});
test('intro can end early and host disconnect closes waiting rooms', t => {
  const {game,room,events}=fixture(t);game.startQuiz(room.pin);game.stopGame(room.pin);t.mock.timers.tick(5000);
  assert.equal(room.status,'GAME_OVER');assert.equal(room.historyLogs.length,0);
  assert.equal(events.filter(e=>e.event==='question_start_player').length,0);
  const second=game.createRoom('other-host',room.quiz);game.addPlayer(second.pin,'other-player','Other');game.removePlayer('other-host');
  assert.equal(game.getRoom(second.pin),undefined);assert.equal(game.playerSocketMap.has('other-player'),false);
});
test('disabled assists cannot award points and invalid transitions are ignored', t => {
  const {game,room,events}=fixture(t);game.nextQuestion(room.pin);assert.equal(room.status,'LOBBY');
  game.startQuiz(room.pin);t.mock.timers.tick(3000);
  game.useFiftyFifty('player');assert.equal(events.filter(e=>e.event==='fifty_fifty_result').length,0);
  game.submitAnswer('player',99);assert.equal(room.currentAnswers.size,0);
  game.submitAnswer('player',2,true);assert.equal(room.players.get('p_player').score,1000);
  game.endCurrentQuestion(room);assert.equal(room.historyLogs.length,1);
  const playerPayload=events.find(e=>e.event==='question_start_player').data;
  assert.ok(playerPayload.options.every(o=>!('isCorrect' in o)));
});
