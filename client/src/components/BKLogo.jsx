import React from "react";

export default function BKLogo({ className = "w-9 h-9", showText = false, textClassName = "text-white" }) {
  return (
    <div className="flex items-center gap-2 select-none">
      {/* Biểu tượng Bánh răng & Chữ BK chuẩn Bách Khoa TP.HCM */}
      <svg
        className={className}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="48" fill="#003875" stroke="#FDB913" strokeWidth="3" />
        {/* Răng cưa bánh răng kỹ thuật BK */}
        <g fill="#FDB913">
          <rect x="46" y="2" width="8" height="8" rx="1.5" />
          <rect x="46" y="90" width="8" height="8" rx="1.5" />
          <rect x="2" y="46" width="8" height="8" rx="1.5" />
          <rect x="90" y="46" width="8" height="8" rx="1.5" />
          <rect x="14" y="14" width="8" height="8" rx="1.5" transform="rotate(45 18 18)" />
          <rect x="78" y="14" width="8" height="8" rx="1.5" transform="rotate(45 82 18)" />
          <rect x="14" y="78" width="8" height="8" rx="1.5" transform="rotate(45 18 82)" />
          <rect x="78" y="78" width="8" height="8" rx="1.5" transform="rotate(45 82 82)" />
        </g>
        {/* Vòng tròn lõi */}
        <circle cx="50" cy="50" r="38" fill="#002855" stroke="#FFFFFF" strokeWidth="2" />
        {/* Tháp / Khối Kỹ Thuật BK */}
        <path
          d="M32 68 L32 32 L46 32 C52 32 56 36 56 41 C56 44 54 47 50 48 C55 49 58 53 58 58 C58 64 53 68 46 68 Z M39 45 L45 45 C48 45 50 43 50 41 C50 38 48 37 45 37 L39 37 Z M39 63 L46 63 C49 63 51 61 51 58 C51 55 49 53 46 53 L39 53 Z"
          fill="#FFFFFF"
        />
        <path
          d="M60 68 L60 32 L67 32 L67 47 L78 32 L87 32 L73 49 L88 68 L79 68 L67 52 L67 68 Z"
          fill="#FDB913"
        />
        {/* Nét chân đế */}
        <rect x="26" y="72" width="48" height="3" rx="1.5" fill="#FDB913" />
      </svg>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black tracking-tight text-white drop-shadow">
              BK<span className="text-[#FDB913]">Quiz</span>
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-[#034ea2] text-blue-100 font-extrabold uppercase border border-blue-400/30">
              HCMUT
            </span>
          </div>
          <span className={`text-[10px] font-bold tracking-wider uppercase opacity-90 ${textClassName}`}>
            Đại học Bách Khoa • ĐHQG-HCM
          </span>
        </div>
      )}
    </div>
  );
}
