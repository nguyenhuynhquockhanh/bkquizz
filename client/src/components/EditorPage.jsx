import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import QuizEditor from './QuizEditor';

export default function EditorPage({ quizId, currentUser, onBack, onSaved }) {
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!quizId) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await apiFetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/quizzes/${encodeURIComponent(quizId)}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Không tải được quiz.');
        if (!controller.signal.aborted) setLoaded(data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      }
    }
    load();
    return () => controller.abort();
  }, [quizId]);
  if (error) return <div className="p-8 text-center space-y-4"><p role="alert">{error}</p><button onClick={onBack} className="btn-bk-gold px-4 py-2 rounded-lg">Về bộ đề</button></div>;
  if (quizId && !loaded) return <p className="p-8 text-center" role="status">Đang tải quiz…</p>;
  return <QuizEditor currentUser={currentUser} editQuizData={loaded} onBack={onBack} onSaved={onSaved} />;
}
