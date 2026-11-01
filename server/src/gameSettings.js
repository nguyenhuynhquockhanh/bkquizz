export const defaultSettings = {
  randomizeQuestions: false,
  randomizeAnswers: false,
  showQuestionsOnPlayerScreen: true,
  speedScoring: true,
  streakBonus: false,
  powerUps: true,
  timeLimit: 0
};
export function normalizeSettings(input = {}, previous = defaultSettings) {
  const result = { ...previous };
  for (const key of Object.keys(defaultSettings)) {
    if (key === 'timeLimit') {
      if ([0, 10, 15, 20, 30, 60, 120, 240].includes(input[key])) result[key] = input[key];
    } else if (typeof input[key] === 'boolean') result[key] = input[key];
  }
  return result;
}
export function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
