import React, { useState, useEffect } from "react";
import { ArrowRight, Flame, Zap, FileSpreadsheet, BookOpen, LogIn, Monitor } from "lucide-react";
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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#002855] via-[#00336e] to-[#001d40] flex flex-col justify-between py-8 px-4 sm:px-6">
      {/* 1. MÀN HÌNH NHẬP PIN THI ĐẤU CHUẨN BÁCH KHOA */}
      <div className="w-full max-w-sm mx-auto my-auto flex flex-col items-center">
        {/* BK Emblem & Header */}
        <div className="mb-6 flex flex-col items-center text-center select-none">
          <BKLogo className="w-16 h-16 mb-2 drop-shadow-md" />
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow">
            BK<span className="text-[#FDB913]">Quiz</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-200 mt-1">
            Hệ thống Trắc nghiệm Tương tác • ĐH Bách Khoa TP.HCM
          </p>
        </div>

        <div className="w-full bg-white rounded-xl p-6 shadow-2xl border-b-4 border-gray-300">
          {errorMsg && (
            <div className="mb-4 p-2.5 rounded bg-red-100 border border-red-300 text-red-700 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          {step === "PIN" ? (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Nhập mã PIN phòng thi"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  autoFocus
                  className="w-full h-12 bg-white border-2 border-gray-300 rounded-lg font-black text-center text-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0052cc] transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-lg font-black text-base uppercase tracking-wider btn-bk-primary"
              >
                Tham gia ngay
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinFinal} className="space-y-4">
              <div className="text-center text-xs font-black uppercase text-gray-500 mb-1">
                MÃ PIN: <span className="text-[#002855] font-extrabold text-sm">{pin}</span>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Nhập họ tên / Biệt danh / MSSV"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={25}
                  autoFocus
                  className="w-full h-12 bg-white border-2 border-gray-300 rounded-lg font-black text-center text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0052cc] transition-colors"
                />
              </div>

              {/* Chọn Avatar */}
              <div>
                <div className="text-xs font-bold text-gray-500 mb-2 text-center">
                  Chọn biểu tượng đại diện:
                </div>
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center transition-all ${
                        selectedAvatar === av
                          ? "bg-[#002855] text-white scale-110 shadow-md ring-2 ring-[#fdb913]"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("PIN")}
                  className="w-1/3 h-12 rounded-lg font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Đổi PIN
                </button>
                <button
                  type="submit"
                  className="w-2/3 h-12 rounded-lg font-black text-base uppercase tracking-wider btn-kahoot-green"
                >
                  Bắt đầu vào!
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Thông tin đăng nhập / Trạng thái */}
        {currentUser ? (
          <div className="mt-4 text-center space-y-2">
            <p className="text-xs font-bold text-blue-200">
              Giảng viên / Quản trị: <span className="text-[#FDB913] font-black">{currentUser.name}</span>
            </p>
            <button
              onClick={onOpenMyQuizzes}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-[#002855] font-black text-xs uppercase tracking-wider hover:bg-gray-100 shadow"
            >
              <BookOpen className="w-4 h-4 text-[#0052cc]" />
              Quản lý ngân hàng đề thi
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="mt-5 text-center bg-black/25 p-3.5 rounded-xl border border-white/10 max-w-xs">
            <p className="text-xs text-blue-200 font-bold mb-2">
              Dành cho Giảng viên / Sinh viên tạo và quản lý ngân hàng câu hỏi
            </p>
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-bk-gold text-xs uppercase tracking-wider"
            >
              <LogIn className="w-3.5 h-3.5" />
              Đăng nhập quản lý
            </button>
          </div>
        )}
      </div>

      {/* 2. BANNER GIỚI THIỆU TÍNH NĂNG Ở ĐÁY */}
      <div className="max-w-4xl mx-auto w-full mt-8 grid grid-cols-1 sm:grid-cols-4 gap-3 text-left">
        <div className="bg-[#001d40] border border-[#003875] rounded-lg p-3 flex items-center gap-3">
          <Monitor className="w-6 h-6 text-[#47bfff] shrink-0" />
          <div className="text-xs">
            <span className="font-black text-white block">Hiển thị câu hỏi</span>
            <span className="text-blue-200">Đọc câu hỏi ngay trên điện thoại</span>
          </div>
        </div>

        <div className="bg-[#001d40] border border-[#003875] rounded-lg p-3 flex items-center gap-3">
          <Flame className="w-6 h-6 text-[#ffa602] shrink-0" />
          <div className="text-xs">
            <span className="font-black text-white block">Streak Combo 🔥</span>
            <span className="text-blue-200">Đúng liên tiếp cộng thêm điểm</span>
          </div>
        </div>

        <div className="bg-[#001d40] border border-[#003875] rounded-lg p-3 flex items-center gap-3">
          <Zap className="w-6 h-6 text-[#fdb913] shrink-0" />
          <div className="text-xs">
            <span className="font-black text-white block">Thẻ Trợ Giúp</span>
            <span className="text-blue-200">50:50 & x2 Điểm</span>
          </div>
        </div>

        <div className="bg-[#001d40] border border-[#003875] rounded-lg p-3 flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-[#26890c] shrink-0" />
          <div className="text-xs">
            <span className="font-black text-white block">Xuất File Excel</span>
            <span className="text-blue-200">Báo cáo điểm số & thống kê</span>
          </div>
        </div>
      </div>
    </div>
  );
}
