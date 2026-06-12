import { useEffect, useState, useRef } from 'react';
import { fetchProgress, createProgressSocket } from '../lib/api';

export default function ProgressBar({ isRunning }) {
  const [progress, setProgress] = useState(null);
  const wsRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return;

    let wsConnected = false;

    try {
      const ws = createProgressSocket();
      wsRef.current = ws;

      ws.onopen = () => { wsConnected = true; };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setProgress(data);
        } catch { /* ignore */ }
      };

      ws.onerror = () => {
        if (!wsConnected) startPolling();
      };

      ws.onclose = () => { wsRef.current = null; };
    } catch {
      startPolling();
    }

    function startPolling() {
      pollRef.current = setInterval(async () => {
        try {
          const data = await fetchProgress();
          setProgress(data);
          if (['completed', 'stopped', 'error'].includes(data.status)) {
            clearInterval(pollRef.current);
          }
        } catch { /* ignore */ }
      }, 1000);
    }

    return () => {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
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

  const barColor = {
    running: 'bg-brand-600',
    completed: 'bg-emerald-500',
    stopped: 'bg-amber-500',
    error: 'bg-red-500',
    idle: 'bg-surface-elevated',
  };

  const statusLabel = {
    running: 'Sending',
    completed: 'Completed',
    stopped: 'Stopped',
    error: 'Error',
    idle: 'Idle',
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Progress</h2>
        <span className={`badge ${
          progress.status === 'running' ? 'badge-info' :
          progress.status === 'completed' ? 'badge-success' :
          progress.status === 'error' ? 'badge-danger' : 'badge-warning'
        }`}>
          {statusLabel[progress.status] || progress.status}
        </span>
      </div>

      <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor[progress.status] || barColor.idle} ${
            progress.status === 'running' ? 'progress-striped' : ''
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat value={progress.sent} label="Sent" color="text-emerald-600 dark:text-emerald-400" />
        <Stat value={progress.failed} label="Failed" color="text-red-600 dark:text-red-400" />
        <Stat value={progress.total} label="Total" color="text-content-muted" />
        <Stat value={formatTime(progress.estimated_seconds_remaining)} label="ETA" color="text-brand-600 dark:text-brand-400" />
      </div>

      <div className="flex items-center justify-between text-xs text-content-muted">
        <span>
          Batch {progress.current_batch} of {progress.total_batches}
          {progress.current_name && progress.status === 'running' && (
            <span className="ml-1.5 text-content-muted">· {progress.current_name}</span>
          )}
        </span>
        <span>{percent}%</span>
      </div>
    </div>
  );
}

function Stat({ value, label, color }) {
  return (
    <div className="text-center">
      <p className="text-xl font-semibold text-content-primary">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className={`text-xs ${color}`}>{label}</p>
    </div>
  );
}
