import { useState } from 'react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-gray-800/50 rounded-none">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/90 p-2 rounded-xl shadow-lg border border-white/20">
            <img src="/logo.svg" alt="Certify Hub Logo" className="h-12 sm:h-14 w-auto object-contain" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black text-white tracking-widest uppercase">CERTIFY HUB</h1>
            <p className="text-xs text-brand-400 font-bold tracking-widest uppercase mt-0.5">Certificate-as-a-Service</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge-success">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
            System Ready
          </span>
        </div>
      </div>
    </nav>
  );
}
