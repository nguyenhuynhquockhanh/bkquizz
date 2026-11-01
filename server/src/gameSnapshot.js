export function gameSnapshot(room, playerId = null) {
  const question = room.quiz.questions[room.currentQuestionIndex];
  const sorted = [...room.players.values()].sort((a, b) => b.score - a.score);
  const common = {
    status: room.status, paused: room.status === 'PAUSED',
    questionNumber: room.currentQuestionIndex + 1, totalQuestions: room.quiz.questions.length,
    remainingTime: room.questionRemainingTime, endedEarly: !!room.endedEarly
  };
  if (!playerId) return {
    ...common, players: [...room.players.values()], question,
    answeredCount: room.currentAnswers.size,
    stats: room.historyLogs.at(-1)?.stats || [], topPlayers: sorted.slice(0, 5),
    isLastQuestion: room.currentQuestionIndex >= room.quiz.questions.length - 1,
    podium: { first: sorted[0] || null, second: sorted[1] || null, third: sorted[2] || null }
  };
  const player = room.players.get(playerId);
  const answer = room.currentAnswers.get(playerId);
  const round = room.playerRoundState.get(playerId) || {};
  const accepting = ['QUESTION_ACTIVE', 'PAUSED'].includes(room.status);
  const show = room.showQuestionsOnPlayerScreen !== false;
  const resultReady = ['QUESTION_RESULT', 'LEADERBOARD', 'GAME_OVER'].includes(room.status);
  return {
    ...common,
    playerState: accepting ? (answer ? 'SUBMITTED' : 'PLAYING') :
      ({ LOBBY: 'LOBBY', QUESTION_INTRO: 'INTRO', QUESTION_RESULT: 'RESULT', LEADERBOARD: 'WAITING_NEXT', GAME_OVER: 'GAME_OVER' }[room.status]),
    questionType: question?.type || 'MULTIPLE_CHOICE',
    questionTitle: show ? question?.question || '' : '', imageUrl: show ? question?.imageUrl || '' : '',
    options: show ? question?.options.map(({ id, text }) => ({ id, text })) || [] : [],
    powerUps: player.powerUps, eliminatedOptions: round.eliminatedOptions || [],
    useDouble: !!round.useDouble,
    totalScore: accepting && answer ? player.score - answer.pointsEarned : player.score,
    streak: accepting && answer ? answer.previousStreak : player.streak,
    lastResult: resultReady ? { isCorrect: answer?.isCorrect || false, pointsEarned: answer?.pointsEarned || 0 } : null
  };
}
