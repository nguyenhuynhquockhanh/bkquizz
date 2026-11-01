import React from "react";
import { PlusCircle, LogOut, BookOpen, LogIn, ShieldCheck } from "lucide-react";
import BKLogo from "./BKLogo";

export default function Navbar({ currentView, setView, currentUser, onOpenLogin, onLogout }) {
  return (
    <header className="bg-[#0275b8] border-b border-[#015d94] shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-16 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo Bách Khoa HCM */}
        <div
          onClick={() => setView("home")}
          className="cursor-pointer select-none group flex items-center gap-3"
        >
          <BKLogo className="w-9 h-9" showText={true} />
        </div>

        {/* Navigation Items (Chuẩn giao diện LMS Bách Khoa) */}
        <div className="nav-actions flex flex-wrap items-center gap-1 sm:gap-3">
          <button
            onClick={() => setView("home")}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
              currentView === "home"
                ? "bg-white text-[#0275b8] shadow-sm"
                : "text-white hover:bg-white/15"
            }`}
          >
            Tham gia ngay
          </button>

          {currentUser ? (
            <>
              <button
                onClick={() => setView("my-quizzes")}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  currentView === "my-quizzes"
                    ? "bg-white text-[#0275b8] shadow-sm"
                    : "text-white hover:bg-white/15"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bộ đề của tôi</span>
                <span className="sm:hidden">Bộ đề</span>
              </button>

              <button
                onClick={() => setView("editor")}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  currentView === "editor"
                    ? "bg-white text-[#0275b8] shadow-sm"
                    : "text-white hover:bg-white/15"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tạo quiz</span>
                <span className="sm:hidden">Tạo</span>
              </button>

              {currentUser.role === "admin" && (
              <button
                onClick={() => setView("admin")}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  currentView === "admin"
                    ? "bg-[#f5c542] text-[#002855] font-black shadow-sm"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quản trị</span>
                <span className="sm:hidden">Quản trị</span>
              </button>

              )}
              {/* Profile & Đăng xuất */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/30">
                <div className="hidden md:flex flex-col text-right leading-tight">
                  <span className="text-xs font-bold text-white">{currentUser.name}</span>
                  <span className="text-[10px] text-blue-100 opacity-80">{currentUser.email}</span>
                </div>

                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button onClick={onOpenLogin} className="px-4 py-1.5 rounded font-bold text-xs uppercase bg-[#f5c542] text-[#002855] hover:bg-[#ffcf4d] shadow-sm flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" />Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
