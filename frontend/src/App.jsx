import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OverlayEditor from './components/OverlayEditor';
import CsvUploader from './components/CsvUploader';
import CampaignControls from './components/CampaignControls';
import PreviewPanel from './components/PreviewPanel';
import ProgressBar from './components/ProgressBar';

export default function App() {
  const [coords, setCoords] = useState({ x_percent: 50, y_percent: 50 });
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState('#000000');
  const [textAlign, setTextAlign] = useState('center');
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);

  // Poll progress to detect campaign end
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/campaign/progress');
        const data = await res.json();
        if (['completed', 'stopped', 'error'].includes(data.status)) {
          setIsRunning(false);
          setLastStatus(data.status);
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-brand-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Certificate Campaign Studio
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
            />
            <CsvUploader onUploaded={(data) => setCsvUploaded(true)} />
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
            />
          </div>
        </div>

        {/* Progress bar — full width */}
        <ProgressBar isRunning={isRunning} />

        {/* Footer */}
        <footer className="text-center py-6 text-gray-600 text-sm border-t border-gray-800/50">
          <p>CertFlow — Certificate-as-a-Service • Zero-Disk • Smart Batching • Real-Time Progress</p>
        </footer>
      </main>
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
