import { useEffect, useState, useRef } from 'react';

export default function ProgressBar({ isRunning }) {
  const [progress, setProgress] = useState(null);
  const wsRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return;

    // Try WebSocket first, fall back to polling
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    let wsConnected = false;

    try {
      const ws = new WebSocket(`${protocol}//${host}/ws/progress`);
      wsRef.current = ws;

      ws.onopen = () => {
        wsConnected = true;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setProgress(data);
        } catch (e) { /* ignore */ }
      };

      ws.onerror = () => {
        // Fall back to polling
        if (!wsConnected) startPolling();
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    } catch {
      startPolling();
    }

    function startPolling() {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch('/api/campaign/progress');
          const data = await res.json();
          setProgress(data);
          if (['completed', 'stopped', 'error'].includes(data.status)) {
            clearInterval(pollRef.current);
          }
        } catch { /* ignore */ }
      }, 1000);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isRunning]);

  if (!progress) return null;

  const percent = progress.total > 0
    ? Math.round(((progress.sent + progress.failed) / progress.total) * 100)
    : 0;

  const formatTime = (seconds) => {
    if (seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const statusColors = {
    running: 'from-brand-500 to-blue-500',
    completed: 'from-emerald-500 to-green-500',
    stopped: 'from-amber-500 to-yellow-500',
    error: 'from-rose-500 to-red-500',
    idle: 'from-gray-500 to-gray-600',
  };

  const statusLabels = {
    running: 'Sending',
    completed: 'Completed',
    stopped: 'Stopped',
    error: 'Error',
    idle: 'Idle',
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Campaign Progress
        </h2>
        <span className={`badge ${
          progress.status === 'running' ? 'badge-info' :
          progress.status === 'completed' ? 'badge-success' :
          progress.status === 'error' ? 'badge-danger' : 'badge-warning'
        }`}>
          {progress.status === 'running' && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mr-2 animate-pulse"></span>
          )}
          {statusLabels[progress.status] || progress.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${statusColors[progress.status] || statusColors.idle} transition-all duration-500 ease-out ${
              progress.status === 'running' ? 'progress-striped' : ''
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-md">{percent}%</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800/40 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{progress.sent.toLocaleString()}</p>
          <p className="text-xs text-emerald-400 font-medium">Sent</p>
        </div>
        <div className="bg-gray-800/40 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{progress.failed.toLocaleString()}</p>
          <p className="text-xs text-rose-400 font-medium">Failed</p>
        </div>
        <div className="bg-gray-800/40 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{progress.total.toLocaleString()}</p>
          <p className="text-xs text-gray-400 font-medium">Total</p>
        </div>
        <div className="bg-gray-800/40 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{formatTime(progress.estimated_seconds_remaining)}</p>
          <p className="text-xs text-brand-400 font-medium">ETA</p>
        </div>
      </div>

      {/* Status line */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          Batch {progress.current_batch} of {progress.total_batches}
          {progress.current_name && progress.status === 'running' && (
            <span className="text-gray-500 ml-2">• Processing: {progress.current_name}</span>
          )}
        </span>
        <span>
          Sent {progress.sent.toLocaleString()} of {progress.total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
