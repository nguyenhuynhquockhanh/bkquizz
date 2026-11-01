import React from "react";

export default function BKLogo({ className = "w-12 h-12", showText = false, textClassName = "text-gray-800" }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <img
        className={`object-contain shrink-0 ${className}`}
        src="/hcmut-logo.png"
        alt="Logo Đại học Bách Khoa TP.HCM"
        width={1208}
        height={1220}
      />

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-tight text-white">
              BK<span className="text-[#f5c542]">Quiz</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-bold uppercase tracking-wider">
              HCMUT
            </span>
          </div>
          <span className={`text-[11px] font-semibold tracking-wide opacity-90 ${textClassName}`}>
            Đại học Bách Khoa • ĐHQG-HCM
          </span>
        </div>
      )}
    </div>
  );
}
