import React, { useState } from "react";
import { X, Lock, Mail, User, LogIn, UserPlus } from "lucide-react";
import BKLogo from "./BKLogo";

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

  const handleQuickFill = () => {
    setEmail("demo@kahoot.com");
    setPassword("password123");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Thao tác thất bại!");
      } else {
        onLoginSuccess(data);
        onClose();
      }
    } catch (_err) {
      setErrorMsg("Không thể kết nối đến server backend!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-gray-900 relative border-b-8 border-gray-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="flex justify-center mb-2">
            <BKLogo className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            {isRegister ? "Đăng ký Tài khoản BKQuiz" : "Đăng nhập Cổng BKQuiz"}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {isRegister
              ? "Tạo tài khoản Giảng viên / Sinh viên để quản lý ngân hàng câu hỏi"
              : "Đăng nhập để khởi tạo phòng thi và quản lý bộ đề của bạn"}
          </p>
        </div>

        {/* Nút bấm điền nhanh tài khoản demo */}
        {!isRegister && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs flex items-center justify-between">
            <div>
              <span className="font-black text-[#002855] block">Tài khoản dùng thử có sẵn:</span>
              <span className="text-gray-600">demo@kahoot.com / password123</span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="py-1 px-3 rounded bg-[#0052cc] text-white font-bold hover:bg-[#00388b] text-xs"
            >
              Điền nhanh
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded bg-red-100 border border-red-300 text-red-700 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1">
                Họ và Tên của bạn
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg font-bold text-sm text-gray-900 focus:outline-none focus:border-[#0052cc]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1">
              Email đăng nhập
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                placeholder="email@hcmut.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg font-bold text-sm text-gray-900 focus:outline-none focus:border-[#0052cc]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg font-bold text-sm text-gray-900 focus:outline-none focus:border-[#0052cc]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-lg font-black text-sm uppercase tracking-wider btn-bk-primary flex items-center justify-center gap-2"
          >
            {isRegister ? <UserPlus className="w-4 h-4 stroke-[3]" /> : <LogIn className="w-4 h-4 stroke-[3]" />}
            {loading ? "Đang xử lý..." : isRegister ? "Đăng ký tài khoản" : "Đăng nhập ngay"}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg("");
            }}
            className="text-xs font-bold text-[#0052cc] hover:underline"
          >
            {isRegister
              ? "Đã có tài khoản? Bấm vào đây để Đăng nhập"
              : "Chưa có tài khoản? Bấm vào đây để Đăng ký"}
          </button>
        </div>
      </div>
    </div>
  );
}
