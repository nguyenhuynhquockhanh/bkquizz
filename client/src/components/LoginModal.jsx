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

  const handleClear = () => {
    setName("");
    setEmail("");
    setPassword("");
    setErrorMsg("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      {/* Modal Cổng CAS Bách Khoa (sso.hcmut.edu.vn) */}
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full text-gray-900 relative overflow-hidden border border-gray-300">
        {/* Banner Xanh Đậm Chuẩn CAS HCMUT */}
        <div className="bg-[#002060] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BKLogo className="w-8 h-8" />
            <span className="text-white font-bold text-base sm:text-lg tracking-wide">
              Central Authentication Service (CAS)
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân Modal 2 Cột */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#fbfbfb]">
          {/* Cột Trái: Form Đăng Nhập */}
          <div>
            <h3 className="text-sm font-bold text-[#b30000] mb-3">
              {isRegister ? "Đăng ký tài khoản Giảng viên / Thí sinh" : "Enter your Username and Password"}
            </h3>

            {/* Tài khoản dùng thử có sẵn */}
            {!isRegister && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-[11px] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#002855] block">Tài khoản demo:</span>
                  <span className="text-gray-600">demo@kahoot.com / password123</span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-2 py-0.5 rounded bg-[#0275b8] text-white font-bold text-[10px]"
                >
                  Điền
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="mb-3 p-2 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Họ và Tên:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-[#0275b8]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email / Username:
                </label>
                <input
                  type="email"
                  required
                  placeholder="khanh.nguyenhuynh@hcmut.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-[#0275b8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password:
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-[#0275b8]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-[#0275b8] hover:bg-[#02629b] text-white font-bold text-xs rounded transition-colors shadow-sm"
                >
                  {loading ? "Đang xử lý..." : isRegister ? "Register" : "Login"}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="pt-2 text-left">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setErrorMsg("");
                  }}
                  className="text-xs text-[#0275b8] hover:underline font-semibold"
                >
                  {isRegister
                    ? "Đã có tài khoản? Chuyển sang Đăng nhập"
                    : "Chưa có tài khoản? Bấm vào đây để Đăng ký"}
                </button>
              </div>
            </form>
          </div>

          {/* Cột Phải: Hướng Dẫn & Thông Báo CAS */}
          <div className="space-y-3 text-xs text-gray-600 border-t md:border-t-0 md:border-l border-gray-200 md:pl-6 pt-4 md:pt-0">
            <div>
              <span className="font-bold text-[#b30000] block mb-1">Languages:</span>
              <span className="text-[#0275b8] font-bold">Vietnamese</span> | <span className="text-[#0275b8] font-bold">English</span>
            </div>

            <div>
              <span className="font-bold text-[#b30000] block mb-1">Please note:</span>
              <p className="text-[11px] leading-relaxed text-gray-600">
                The Login page enables single sign-on to multiple websites at HCMUT. This means that you only have to enter your user name and password once for websites that subscribe to the Login page.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <span className="font-bold text-[#b30000] block mb-1">Technical support:</span>
              <p className="text-[11px] text-gray-600">
                E-mail: <span className="text-[#0275b8]">support@hcmut.edu.vn</span><br />
                Tel: (84-8) 38647256 - 7204
              </p>
            </div>
          </div>
        </div>

        {/* Footer CAS Chuẩn */}
        <div className="px-6 py-2.5 bg-gray-100 border-t border-gray-200 text-center text-[10px] text-gray-500">
          Copyright © 2011 - 2026 Ho Chi Minh University of Technology. All rights reserved. • Powered by Jasig CAS / BKQuiz
        </div>
      </div>
    </div>
  );
}
