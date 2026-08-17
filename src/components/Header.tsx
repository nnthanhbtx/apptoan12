import React from 'react';

export const Header: React.FC = () => {
  return (
    <div className="relative w-full py-3 px-4 flex flex-col items-center justify-center border-b border-[#1e2d4a]/80 bg-[#070e22]">
      {/* Top Left Logo */}
      <div className="absolute left-4 top-4 flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-cyan-400 drop-shadow">
          <path
            fill="currentColor"
            d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
            className="fill-amber-400"
          />
          <path
            fill="currentColor"
            d="M12 4L13.5 10.5L20 12L13.5 13.5L12 20L10.5 13.5L4 12L10.5 10.5L12 4Z"
            className="fill-cyan-300"
          />
        </svg>
        <span className="text-xs font-semibold text-slate-300 hidden sm:inline tracking-wider">
          Gemini
        </span>
      </div>

      {/* Main Center Titles */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-[#facc15] font-serif uppercase drop-shadow-[0_2px_8px_rgba(250,204,21,0.3)]">
          AI LÀ TRIỆU PHÚ TOÁN HỌC
        </h1>
        <p className="text-xs sm:text-sm font-semibold tracking-wide text-slate-300 mt-0.5 uppercase">
          ÔN THI TỐT NGHIỆP THPT MÔN TOÁN 2025
        </p>
      </div>
    </div>
  );
};
