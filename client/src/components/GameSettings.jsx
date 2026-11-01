import { useState } from 'react';
import Modal from './Modal';

export default function GameSettings({ settings, onSave, onClose }) {
  const [draft, setDraft] = useState(settings);
  const options = [
    ['randomizeQuestions', 'Đảo thứ tự câu hỏi'],
    ['randomizeAnswers', 'Đảo thứ tự đáp án'],
    ['showQuestionsOnPlayerScreen', 'Hiện câu hỏi trên máy người chơi'],
    ['speedScoring', 'Trả lời nhanh được nhiều điểm hơn'],
    ['streakBonus', 'Thưởng chuỗi trả lời đúng'],
    ['powerUps', 'Bật trợ giúp 50:50 và nhân đôi điểm']
  ];
  return <Modal title="Cài đặt trò chơi" onClose={onClose}>
    <p className="text-sm text-gray-500 mb-4">Áp dụng cho lượt chơi này. Bộ câu hỏi gốc vẫn giữ nguyên.</p>
    <div className="space-y-1">
      {options.map(([key, label]) => <label key={key} className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 cursor-pointer">
        <span>{label}</span><input type="checkbox" checked={!!draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.checked })} className="w-5 h-5 shrink-0 accent-[#0275b8]" />
      </label>)}
      <label className="block pt-4 font-bold">Thời gian mỗi câu
        <select value={draft.timeLimit || 0} onChange={e => setDraft({ ...draft, timeLimit: Number(e.target.value) })} className="w-full p-3 border border-gray-300 rounded-lg mt-2 font-normal">
          <option value={0}>Theo cài đặt từng câu</option>
          {[10,15,20,30,60,120,240].map(n => <option key={n} value={n}>{n} giây</option>)}
        </select>
      </label>
    </div>
    <p className="text-sm text-gray-500 mt-3">Tắt điểm tốc độ để mỗi đáp án đúng nhận đủ điểm của câu hỏi.</p>
    <button onClick={() => onSave(draft)} className="w-full mt-5 py-3 bg-[#0275b8] text-white font-bold rounded-lg">Lưu cài đặt</button>
  </Modal>;
}
