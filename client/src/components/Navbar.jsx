import React from "react";
import { PlusCircle, LogOut, BookOpen, LogIn } from "lucide-react";
import BKLogo from "./BKLogo";

export default function Navbar({ currentView, setView, currentUser, onOpenLogin, onLogout }) {
  return (
    <header className="bg-[#00224a] border-b-2 border-[#001736] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo Bách Khoa TP.HCM */}
        <div
          onClick={() => setView("home")}
          className="cursor-pointer select-none group transition-transform hover:scale-[1.01]"
        >
          <BKLogo showText={true} />
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setView("home")}
            className={`px-3.5 py-2 rounded-lg font-black text-xs uppercase tracking-wider btn-kahoot-3d ${
              currentView === "home"
                ? "bg-white text-[#002855] shadow-[0_4px_0_#cccccc]"
                : "bg-[#003875] text-white hover:bg-[#004899] shadow-[0_4px_0_#001a38]"
            }`}
          >
            Vào chơi (PIN)
          </button>

          {currentUser ? (
            <>
              <button
                onClick={() => setView("my-quizzes")}
                className={`px-3.5 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1.5 btn-kahoot-3d ${
                  currentView === "my-quizzes"
                    ? "bg-white text-[#002855] shadow-[0_4px_0_#cccccc]"
                    : "bg-[#0052cc] text-white shadow-[0_4px_0_#00388b] hover:bg-[#0c62e2]"
                }`}
              >
                <BookOpen className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Bộ đề của tôi</span>
                <span className="sm:hidden">Bộ đề</span>
              </button>

              <button
                onClick={() => setView("editor")}
                className={`px-3.5 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1.5 btn-kahoot-3d ${
                  currentView === "editor"
                    ? "bg-white text-[#002855] shadow-[0_4px_0_#cccccc]"
                    : "btn-kahoot-green"
                }`}
              >
                <PlusCircle className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Tạo Đề Mới</span>
                <span className="sm:hidden">Tạo đề</span>
              </button>

              {/* Tên người dùng & Đăng xuất */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                <span className="hidden md:inline font-bold text-xs text-blue-200">
                  {currentUser.name}
                </span>

                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-2 rounded-lg bg-black/20 hover:bg-black/40 text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1.5 btn-bk-gold"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
