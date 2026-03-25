import { useState } from 'react';

export default function Navbar({ onLogout, username, role }) {
  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-gray-800/50 rounded-none backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/90 p-2 rounded-xl shadow-lg border border-white/20">
            <img src="/logo.svg" alt="Certify Hub Logo" className="h-10 sm:h-12 w-auto object-contain" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-white tracking-widest uppercase">CERTIFY HUB</h1>
            <p className="text-[10px] text-brand-400 font-bold tracking-widest uppercase mt-0.5">Certificate-as-a-Service</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-white text-sm font-bold">{username}</span>
            <span className="text-[10px] text-brand-400 uppercase font-black tracking-tighter">{role}</span>
          </div>
          
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all duration-300"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
