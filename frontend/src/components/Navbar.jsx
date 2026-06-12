export default function Navbar({ onLogout, username, role, theme, onCycleTheme }) {
  return (
    <nav className="sticky top-0 z-50 bg-surface-card border-b border-line">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-content-primary">CertFlow</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onCycleTheme}
            className="p-2 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-hover transition-colors"
            title={`Theme: ${theme}`}
          >
            {theme === 'light' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            )}
            {theme === 'dark' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            )}
            {theme === 'system' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="font-medium text-content-secondary">{username}</span>
            <span className="badge-info uppercase tracking-wide">{role}</span>
          </div>

          <button
            onClick={onLogout}
            className="text-sm font-medium text-content-muted hover:text-content-primary transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
