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
import { useTheme } from './lib/theme';

export default function App() {
  const [placeholders, setPlaceholders] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const [restoredTemplateUrl, setRestoredTemplateUrl] = useState(null);
  const [restoredTemplateInfo, setRestoredTemplateInfo] = useState(null);
  const [recipientCount, setRecipientCount] = useState(0);
  const [lastSentCount, setLastSentCount] = useState(0);

  const { theme, cycle } = useTheme();

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');
    const username = localStorage.getItem('user_name');
    return token ? { token, role, username } : null;
  });

  const [view, setView] = useState('campaign');

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
      .catch(() => {});
  }, [user]);

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
    return <Login onLogin={handleLogin} theme={theme} onCycleTheme={cycle} />;
  }

  const tabs = [
    { id: 'campaign', label: 'Campaigns' },
    ...(user.role === 'admin' ? [
      { id: 'admin', label: 'Admin' },
      { id: 'settings', label: 'Settings' },
    ] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-page">
      <Navbar onLogout={handleLogout} username={user.username} role={user.role} theme={theme} onCycleTheme={cycle} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        {tabs.length > 1 && (
          <div className="flex gap-1 mb-6 border-b border-line">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`px-4 py-2.5 text-sm font-semibold transition-colors relative ${
                  view === tab.id
                    ? 'text-content-primary'
                    : 'text-content-muted hover:text-content-secondary'
                }`}
              >
                {tab.label}
                {view === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600" />
                )}
              </button>
            ))}
          </div>
        )}

        {view === 'admin' && user.role === 'admin' ? (
          <AdminDashboard user={user} setView={setView} />
        ) : view === 'settings' && user.role === 'admin' ? (
          <Settings />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-1.5 text-sm">
              <Step number={1} label="Template" done={true} />
              <StepConnector />
              <Step number={2} label="Placeholders" done={placeholders.length > 0} />
              <StepConnector />
              <Step number={3} label="Recipients" done={csvUploaded} />
              <StepConnector />
              <Step number={4} label="Preview" done={csvUploaded && placeholders.length > 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <OverlayEditor
                  placeholders={placeholders}
                  onPlaceholdersChange={setPlaceholders}
                  csvHeaders={csvHeaders}
                  restoredTemplateUrl={restoredTemplateUrl}
                  restoredTemplateInfo={restoredTemplateInfo}
                />
                <CsvUploader
                  onUploaded={(data) => {
                    setCsvUploaded(true);
                    setRecipientCount(prev => prev || 1);
                    if (data.headers) setCsvHeaders(data.headers);
                  }}
                  restoredCount={recipientCount}
                />
              </div>

              <div className="space-y-6">
                <PreviewPanel
                  placeholders={placeholders}
                />
                <CampaignControls
                  placeholders={placeholders}
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
          </div>
        )}
      </main>
    </div>
  );
}

function Step({ number, label, done }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
      done
        ? 'text-brand-600 dark:text-brand-300 border-brand-500/40 bg-brand-500/10'
        : 'text-content-muted border-line bg-surface-card'
    }`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
        done ? 'bg-brand-600 text-white' : 'bg-surface-elevated text-content-muted'
      }`}>
        {number}
      </span>
      <span className="font-semibold">{label}</span>
    </div>
  );
}

function StepConnector() {
  return <div className="w-4 h-px bg-line hidden sm:block" />;
}
