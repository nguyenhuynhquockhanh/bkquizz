import React from "react";

export default function BKLogo({ className = "w-12 h-12", showText = false, textClassName = "text-gray-800" }) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Logo 3D Khối Lập Phương đặc trưng của ĐH Bách Khoa TP.HCM (HCMUT / MyBK) */}
      <svg
        className={className}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Khối Đỉnh (Top facet) */}
        <path d="M60 4 L88 20 L60 36 L32 20 Z" fill="#004b87" />
        {/* Khối Trên Trái */}
        <path d="M30 22 L58 38 L58 70 L30 54 Z" fill="#0072bc" />
        {/* Khối Trên Phải */}
        <path d="M90 22 L90 54 L62 70 L62 38 Z" fill="#005da6" />
        {/* Khối Dưới Trái */}
        <path d="M30 58 L58 74 L58 106 L30 90 Z" fill="#0096db" />
        {/* Khối Dưới Phải */}
        <path d="M62 74 L90 58 L90 90 L62 106 Z" fill="#0079c2" />
        {/* Khối Đáy (Bottom facet) */}
        <path d="M60 76 L88 92 L60 108 L32 92 Z" fill="#00386b" />

        {/* Khối Trắng Trung Tâm */}
        <polygon points="60,28 92,46 92,74 60,92 28,74 28,46" fill="#FFFFFF" />

        {/* Chữ BK TP.HCM ở giữa */}
        <text
          x="60"
          y="58"
          textAnchor="middle"
          fill="#00386b"
          fontSize="21"
          fontWeight="900"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          letterSpacing="0.5"
        >
          BK
        </text>
        <text
          x="60"
          y="73"
          textAnchor="middle"
          fill="#005da6"
          fontSize="9.5"
          fontWeight="800"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          letterSpacing="0.5"
        >
          TP.HCM
        </text>
      </svg>

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
