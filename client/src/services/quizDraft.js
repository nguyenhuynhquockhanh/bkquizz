export const draftKey = (userId, quizId) => `bkquiz_draft:${userId}:${quizId || 'new'}`;
export function readDraft(key) {
  try {
    const draft = JSON.parse(sessionStorage.getItem(key));
    return draft?.version === 1 && Array.isArray(draft.questions) && draft.questions.length &&
      draft.questions.every(q => Array.isArray(q.options) && q.options.length >= 2) ? draft : null;
  } catch { return null; }
}
