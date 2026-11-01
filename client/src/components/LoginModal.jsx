import { useState } from 'react';
import { X } from 'lucide-react';
import BKLogo from './BKLogo';
import { apiFetch } from '../services/api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isRegister ? 'register' : 'login';
      const response = await apiFetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/auth/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Không thể đăng nhập.'); return; }
      setPassword('');
      onLoginSuccess(data);
      onClose();
    } catch { setError('Không thể kết nối máy chủ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="login-title" className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-[#002060] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BKLogo className="w-10 h-10" />
            <h2 id="login-title" className="text-white font-bold text-lg">{isRegister ? 'Đăng ký BKQuiz' : 'Đăng nhập BKQuiz'}</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="text-white p-1"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Dùng tài khoản BKQuiz của bạn. Không yêu cầu email HCMUT.</p>
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded">{error}</p>}
          {isRegister && <div>
            <label htmlFor="login-name" className="block text-sm font-semibold mb-1">Họ và tên</label>
            <input id="login-name" autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg p-2" />
          </div>}
          <div>
            <label htmlFor="login-account" className="block text-sm font-semibold mb-1">Tên đăng nhập hoặc email</label>
            <input id="login-account" type="text" autoComplete="username" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold mb-1">Mật khẩu</label>
            <input id="login-password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 6 : undefined} maxLength={1024} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg p-2" />
          </div>
          <button disabled={loading} className="w-full bg-[#0275b8] text-white font-bold p-2.5 rounded-lg disabled:opacity-50">{loading ? 'Đang xử lý…' : isRegister ? 'Đăng ký' : 'Đăng nhập'}</button>
          <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-sm text-[#0275b8] hover:underline">{isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</button>
        </form>
      </section>
    </div>
  );
}
