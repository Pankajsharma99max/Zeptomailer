import { useState } from 'react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-gray-800/50 rounded-none">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/90 p-1.5 rounded-lg shadow-lg">
            <img src="/logo.png" alt="Certify Hub Logo" className="h-10 w-auto object-contain" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-white tracking-tight">CertFlow</h1>
            <p className="text-xs text-gray-500 font-medium">Certificate-as-a-Service</p>
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
