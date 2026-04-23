import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OverlayEditor from './components/OverlayEditor';
import CsvUploader from './components/CsvUploader';
import CampaignControls from './components/CampaignControls';
import PreviewPanel from './components/PreviewPanel';
import ProgressBar from './components/ProgressBar';
import { fetchStatus, getTemplateImageUrl, fetchProgress } from './lib/api';
import CampaignHistory from './components/CampaignHistory';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import Settings from './components/Settings';

export default function App() {
  const [coords, setCoords] = useState({ x_percent: 50, y_percent: 50 });
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState('#000000');
  const [textAlign, setTextAlign] = useState('center');
  const [isBold, setIsBold] = useState(false);
  const [fontFamily, setFontFamily] = useState('Roboto');
  const [textEffect, setTextEffect] = useState('none');
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const [restoredTemplateUrl, setRestoredTemplateUrl] = useState(null);
  const [restoredTemplateInfo, setRestoredTemplateInfo] = useState(null);
  const [placeholderPages, setPlaceholderPages] = useState([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [lastSentCount, setLastSentCount] = useState(0);
  
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');
    const username = localStorage.getItem('user_name');
    return token ? { token, role, username } : null;
  });

  const [view, setView] = useState('campaign'); // 'campaign', 'admin', or 'settings'

  // On mount: check if backend already has data (survives refresh)
// ... (rest of useEffects)
  useEffect(() => {
    if (!user) return;
    fetchStatus()
      .then((data) => {
        if (data.template_loaded) {
          const count = data.template_count || 1;
          const urls = [];
          for (let i = 0; i < count; i++) {
            urls.push(getTemplateImageUrl(i));
          }
          setRestoredTemplateUrl(urls);
          setRestoredTemplateInfo({
            width: data.template_width,
            height: data.template_height,
          });
        }
        if (data.csv_loaded && data.recipient_count > 0) {
          setCsvUploaded(true);
          setRecipientCount(data.recipient_count);
          if (data.last_sent_count) {
             setLastSentCount(data.last_sent_count);
          }
        }
      })
      .catch((err) => {
        // Backend handle 401 via api.js
      });
  }, [user]);

  // Poll progress to detect campaign end
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(async () => {
      try {
        const data = await fetchProgress();
        if (['completed', 'stopped', 'error'].includes(data.status)) {
          setIsRunning(false);
          setLastStatus(data.status);
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleLogin = (loginData) => {
    localStorage.setItem('auth_token', loginData.access_token);
    localStorage.setItem('user_role', loginData.user.role);
    localStorage.setItem('user_name', loginData.user.username);
    setUser({
      token: loginData.access_token,
      role: loginData.user.role,
      username: loginData.user.username
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#030712]">
      {/* Animated Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-brand-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob z-0 pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000 z-0 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] left-[20%] w-[45rem] h-[45rem] bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000 z-0 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar onLogout={handleLogout} username={user.username} role={user.role} />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
          {/* View Switcher for Admin */}
          {user.role === 'admin' && (
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => setView('campaign')}
                className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
                  view === 'campaign' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-white/5 text-gray-500 hover:text-gray-300'
                }`}
              >
                Campaigns
              </button>
              <button
                onClick={() => setView('admin')}
                className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
                  view === 'admin' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-white/5 text-gray-500 hover:text-gray-300'
                }`}
              >
                Admin Panel
              </button>
              <button
                onClick={() => setView('settings')}
                className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
                  view === 'settings' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-white/5 text-gray-500 hover:text-gray-300'
                }`}
              >
                Settings
              </button>
            </div>
          )}

          {view === 'admin' && user.role === 'admin' ? (
            <AdminDashboard user={user} setView={setView} />
          ) : view === 'settings' && user.role === 'admin' ? (
            <Settings />
          ) : (
            <>
              {/* Campaign View */}
              <div className="text-center space-y-2 py-4">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-brand-400 via-purple-400 to-blue-400 bg-clip-text text-transparent uppercase">
                  CERTIFY HUB
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
                  Logged in as <span className="text-brand-400 font-bold">{user.username}</span> ({user.role})
                </p>
              </div>

              {/* Step indicators */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <StepBadge number={1} label="Template" active={true} />
                <Connector />
                <StepBadge number={2} label="Recipients" active={csvUploaded} />
                <Connector />
                <StepBadge number={3} label="Preview" active={csvUploaded} />
                <Connector />
                <StepBadge number={4} label={user.role === 'admin' ? 'Send' : 'Approval'} active={csvUploaded} />
              </div>

              {/* Main grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <OverlayEditor
                    coords={coords}
                    onCoordsChange={setCoords}
                    fontSize={fontSize}
                    onFontSizeChange={setFontSize}
                    fontColor={fontColor}
                    onFontColorChange={setFontColor}
                    textAlign={textAlign}
                    onTextAlignChange={setTextAlign}
                    isBold={isBold}
                    onIsBoldChange={setIsBold}
                    fontFamily={fontFamily}
                    onFontFamilyChange={setFontFamily}
                    textEffect={textEffect}
                    onTextEffectChange={setTextEffect}
                    restoredTemplateUrl={restoredTemplateUrl}
                    restoredTemplateInfo={restoredTemplateInfo}
                    placeholderPages={placeholderPages}
                    onPlaceholderPagesChange={setPlaceholderPages}
                  />
                  <CsvUploader
                    onUploaded={() => { setCsvUploaded(true); setRecipientCount(prev => prev || 1); }}
                    restoredCount={recipientCount}
                  />
                </div>

                <div className="space-y-6">
                  <PreviewPanel 
                    coords={coords} 
                    fontSize={fontSize} 
                    fontColor={fontColor} 
                    textAlign={textAlign}
                    isBold={isBold}
                    fontFamily={fontFamily}
                    textEffect={textEffect}
                  />
                  <CampaignControls
                    coords={coords}
                    fontSize={fontSize}
                    fontColor={fontColor}
                    textAlign={textAlign}
                    isBold={isBold}
                    fontFamily={fontFamily}
                    textEffect={textEffect}
                    placeholderPages={placeholderPages}
                    isRunning={isRunning}
                    onRunningChange={setIsRunning}
                    lastStatus={lastStatus}
                    lastSentCount={lastSentCount}
                    userRole={user.role}
                  />
                </div>
              </div>

              <ProgressBar isRunning={isRunning} />
              <CampaignHistory />
            </>
          )}

          {/* Footer */}
          <footer className="text-center py-12 text-gray-600 text-xs border-t border-gray-800/50">
            <p>CERTIFY HUB — Role Based Access Control • Centralized Management • Smart Throttling</p>
            <p className="mt-2 text-brand-400 font-semibold tracking-wide">Made by Pankaj</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function StepBadge({ number, label, active }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
      active
        ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
        : 'bg-gray-800/40 text-gray-600 border border-gray-800/50'
    }`}>
      <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
        active ? 'bg-brand-500 text-white' : 'bg-gray-700 text-gray-500'
      }`}>
        {number}
      </span>
      {label}
    </div>
  );
}

function Connector() {
  return <div className="w-4 sm:w-6 h-px bg-gray-700 hidden sm:block" />;
}
