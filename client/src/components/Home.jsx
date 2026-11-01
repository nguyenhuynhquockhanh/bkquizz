import React, { useState, useEffect } from "react";
import { FileSpreadsheet, BookOpen, LogIn, Monitor, ShieldCheck, User } from "lucide-react";
import BKLogo from "./BKLogo";

const AVATARS = ["🐱", "🐶", "🦊", "🦁", "🐼", "🚀", "🦄", "⚡", "🎓", "⚙️"];

export default function Home({ onJoinGame, onOpenMyQuizzes, onOpenLogin, currentUser }) {
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState(currentUser?.name || "");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [step, setStep] = useState("PIN");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (currentUser?.name) {
      setNickname(currentUser.name);
    }
  }, [currentUser]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get("pin");
    if (pinParam) {
      setPin(pinParam);
      setStep("NICKNAME");
    }
  }, []);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg("Vui lòng nhập mã PIN phòng thi!");
      return;
    }
    setErrorMsg("");
    setStep("NICKNAME");
  };

  const handleJoinFinal = (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg("Vui lòng nhập họ tên hoặc biệt danh của bạn!");
      return;
    }
    setErrorMsg("");
    onJoinGame({ pin: pin.trim(), nickname: nickname.trim(), avatar: selectedAvatar });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#ffffff] flex flex-col justify-between py-10 px-4 sm:px-6">
      {/* KHỐI TRUNG TÂM CHUẨN MYBK (mybk.hcmut.edu.vn) */}
      <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center">
        {/* Logo 3D Khối Lập Phương Bách Khoa TP.HCM */}
        <div className="mb-6 flex flex-col items-center text-center">
          <BKLogo className="w-24 h-24 mb-3 drop-shadow-sm" />
          <h1 className="text-2xl sm:text-3xl font-black text-[#002855] tracking-tight">
            BK<span className="text-[#0275b8]">Quiz</span> • HCMUT
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Hệ thống Trắc nghiệm Tương tác Trực tuyến ĐH Bách Khoa TP.HCM
          </p>
        </div>

        {/* 2 Khối Lựa Chọn Vàng Chuẩn Giao Diện MyBK nếu chưa nhập PIN */}
        <div className="w-full bg-[#f8f9fa] rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          {step === "PIN" ? (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 text-center">
                  Nhập mã PIN phòng thi để tham gia
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 123456"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  autoFocus
                  className="w-full h-12 bg-white border border-gray-300 rounded-lg font-black text-center text-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#0275b8] focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="submit"
                  className="h-14 rounded-xl bg-[#f5c542] hover:bg-[#ffcf4d] text-[#002855] font-black text-xs uppercase flex flex-col items-center justify-center gap-1 shadow-sm transition-all hover:shadow"
                >
                  <User className="w-5 h-5 text-[#002855]" />
                  <span>Vào thi ngay (PIN)</span>
                </button>

                {currentUser ? (
                  <button
                    type="button"
                    onClick={onOpenMyQuizzes}
                    className="h-14 rounded-xl bg-[#0275b8] hover:bg-[#02629b] text-white font-black text-xs uppercase flex flex-col items-center justify-center gap-1 shadow-sm transition-all hover:shadow"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Bộ đề của tôi</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="h-14 rounded-xl bg-[#f5c542] hover:bg-[#ffcf4d] text-[#002855] font-black text-xs uppercase flex flex-col items-center justify-center gap-1 shadow-sm transition-all hover:shadow"
                  >
                    <LogIn className="w-5 h-5 text-[#002855]" />
                    <span>Tài khoản HCMUT</span>
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoinFinal} className="space-y-4">
              <div className="text-center text-xs font-bold text-gray-500 mb-1">
                PHÒNG THI MÃ PIN: <span className="text-[#0275b8] font-black text-base">{pin}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Họ và tên hoặc Mã số sinh viên (MSSV):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A - 2110001"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={25}
                  autoFocus
                  className="w-full h-11 bg-white border border-gray-300 rounded-lg font-bold text-center text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0275b8] focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Chọn Avatar */}
              <div>
                <div className="text-xs font-bold text-gray-500 mb-2 text-center">
                  Biểu tượng đại diện thí sinh:
                </div>
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-9 h-9 text-base rounded-lg flex items-center justify-center transition-all ${
                        selectedAvatar === av
                          ? "bg-[#0275b8] text-white scale-110 shadow-sm ring-2 ring-blue-300"
                          : "bg-white border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("PIN")}
                  className="w-1/3 h-11 rounded-lg font-bold text-xs text-gray-600 bg-gray-200 hover:bg-gray-300"
                >
                  Đổi PIN
                </button>
                <button
                  type="submit"
                  className="w-2/3 h-11 rounded-lg font-black text-xs uppercase tracking-wider bg-[#0275b8] hover:bg-[#02629b] text-white shadow-sm"
                >
                  Bắt đầu vào thi
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Trạng thái đăng nhập */}
        {currentUser ? (
          <div className="mt-4 text-center text-xs text-gray-600">
            Đang đăng nhập: <strong className="text-[#002855]">{currentUser.name}</strong> ({currentUser.email})
          </div>
        ) : (
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-500">
              Cổng dịch vụ xác thực tập trung CAS • Đại học Bách Khoa TP.HCM
            </span>
          </div>
        )}
      </div>

      {/* 3 THẺ GIỚI THIỆU TÍNH NĂNG Ở ĐÁY (CHUẨN LMS THÔNG BÁO) */}
      <div className="max-w-4xl mx-auto w-full mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left border-t border-gray-200 pt-6">
        <div className="p-3.5 rounded-xl border border-gray-200 bg-[#f8f9fa] flex items-center gap-3">
          <Monitor className="w-5 h-5 text-[#0275b8] shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-[#002855] block">Đồng Bộ Màn Hình Thí Sinh</span>
            <span className="text-gray-500 text-[11px]">Đọc câu hỏi và đáp án trực tiếp trên máy</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-gray-200 bg-[#f8f9fa] flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-[#002855] block">Bảo Mật HTTPS (Port 443)</span>
            <span className="text-gray-500 text-[11px]">Mã hóa SSL/TLS trên Azure Web Apps</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-gray-200 bg-[#f8f9fa] flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-[#d89e00] shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-[#002855] block">Báo Cáo Điểm Excel (.xlsx)</span>
            <span className="text-gray-500 text-[11px]">Thống kê bảng điểm và tỉ lệ đúng/sai</span>
          </div>
        </div>
      </div>
    </div>
  );
}
