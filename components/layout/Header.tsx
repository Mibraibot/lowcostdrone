import React from "react";

export default function Header() {
  return (
    <header className="w-full h-16 bg-slate-900 border-b border-slate-800 flex items-center px-6">
      {/* LEFT */}
      <div className="flex items-center gap-3 w-1/3">
        <div className="w-8 h-8 rounded bg-sky-500 flex items-center justify-center font-bold text-white">
          ✈️
        </div>
        <span className="text-white font-semibold text-lg">
          AeroGuard Monitoring System
        </span>
      </div>

      {/* CENTER */}
      <div className="w-1/3 text-center">
        {/* kosong dulu */}
      </div>

      {/* RIGHT */}
      <div className="w-1/3 flex items-center justify-end gap-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          <span className="text-sm text-green-400">System Online</span>
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white">
          👤
        </div>
      </div>
    </header>
  );
}
