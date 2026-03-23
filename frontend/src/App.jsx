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

export default function App() {
  const [coords, setCoords] = useState({ x_percent: 50, y_percent: 50 });
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState('#000000');
  const [textAlign, setTextAlign] = useState('center');
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const [restoredTemplateUrl, setRestoredTemplateUrl] = useState(null);
  const [restoredTemplateInfo, setRestoredTemplateInfo] = useState(null);
  const [recipientCount, setRecipientCount] = useState(0);
  const [lastSentCount, setLastSentCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('app_password'));

  // On mount: check if backend already has data (survives refresh)
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchStatus()
      .then((data) => {
        if (data.template_loaded) {
          setRestoredTemplateUrl(getTemplateImageUrl());
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
        // Backend not available yet or 401, ignore here since API handler handles 401
      });
  }, [isAuthenticated]);

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

  if (!isAuthenticated) {
    return (
      <Login onLogin={(pwd) => {
        localStorage.setItem('app_password', pwd);
        setIsAuthenticated(true);
      }} />
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#030712]">
      {/* Animated Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-brand-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob z-0 pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000 z-0 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] left-[20%] w-[45rem] h-[45rem] bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000 z-0 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
          {/* Header */}
        <div className="text-center space-y-2 py-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-brand-400 via-purple-400 to-blue-400 bg-clip-text text-transparent uppercase">
            CERTIFY HUB
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Upload your template, position the name, preview, and send thousands of personalized certificates — all in memory, zero disk I/O.
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
          <StepBadge number={4} label="Send" active={csvUploaded} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
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
              restoredTemplateUrl={restoredTemplateUrl}
              restoredTemplateInfo={restoredTemplateInfo}
            />
            <CsvUploader
              onUploaded={(data) => setCsvUploaded(true)}
              restoredCount={recipientCount}
            />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <PreviewPanel coords={coords} fontSize={fontSize} fontColor={fontColor} textAlign={textAlign} />
            <CampaignControls
              coords={coords}
              fontSize={fontSize}
              fontColor={fontColor}
              textAlign={textAlign}
              isRunning={isRunning}
              onRunningChange={setIsRunning}
              lastStatus={lastStatus}
              lastSentCount={lastSentCount}
            />
          </div>
        </div>

        {/* Progress bar — full width */}
        <ProgressBar isRunning={isRunning} />

        {/* Campaign History Analytics */}
        <CampaignHistory />

        {/* Footer */}
        <footer className="text-center py-6 text-gray-600 text-sm border-t border-gray-800/50">
          <p>CERTIFY HUB — Certificate-as-a-Service • Zero-Disk • Smart Batching • Real-Time Progress</p>
          <p className="mt-2 text-brand-400 font-semibold tracking-wide">Made by Pankaj</p>
        </footer>
        </main>
      </div>
    </div>
  );
}

function StepBadge({ number, label, active }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
      active
        ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
        : 'bg-gray-800/40 text-gray-600 border border-gray-800/50'
    }`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        active ? 'bg-brand-500 text-white' : 'bg-gray-700 text-gray-500'
      }`}>
        {number}
      </span>
      {label}
    </div>
  );
}

function Connector() {
  return <div className="w-6 h-px bg-gray-700 hidden sm:block" />;
}
