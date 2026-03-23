import { useState } from 'react';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) {
      onLogin(password.trim());
    } else {
      setError('Password is required');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="relative z-10 max-w-md w-full glass-card p-10 space-y-8">
        <div className="text-center flex flex-col items-center">
          <div className="bg-white/10 p-4 rounded-2xl shadow-lg border border-white/20 mb-6 inline-block backdrop-blur-md">
            <img src="/logo.svg" alt="CERTIFY HUB Logo" className="h-20 w-auto object-contain" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-widest mt-2">CERTIFY HUB</h2>
          <p className="mt-2 text-sm text-brand-400 font-bold uppercase tracking-widest">Site Access Required</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              type="password"
              required
              className="appearance-none rounded-xl relative block w-full px-5 py-4 border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 sm:text-sm backdrop-blur-sm transition-all"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-rose-400 text-sm text-center font-medium bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">{error}</p>}
          <button
            type="submit"
            className="w-full btn-primary py-4 text-base tracking-wide"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
