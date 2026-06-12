import { useState, useEffect } from 'react';
import { fetchHistory, clearHistory, deleteHistoryItem, approveCampaign, retryFailedCampaign } from '../lib/api';

export default function CampaignHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    const hasRunning = history.some(r => r.status === 'running');
    const interval = setInterval(loadHistory, hasRunning ? 3000 : 10000);
    return () => clearInterval(interval);
  }, [history.some?.(r => r.status === 'running')]);

  if (loading && history.length === 0) {
    return <div className="text-content-muted text-sm text-center py-4">Loading...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="glass-card p-8 text-center space-y-2">
        <p className="text-content-secondary font-medium">No campaign history</p>
        <p className="text-content-muted text-sm">Past campaigns will appear here.</p>
      </div>
    );
  }

  const handleClearHistory = async () => {
    if (window.confirm("Delete all campaign history? This cannot be undone.")) {
      try {
        await clearHistory();
        setHistory([]);
      } catch (err) {
        console.error("Failed to clear history:", err);
      }
    }
  };

  const handleDeleteRow = async (id) => {
    if (window.confirm("Delete this campaign record?")) {
      try {
        await deleteHistoryItem(id);
        setHistory(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        console.error("Failed to delete:", err);
      }
    }
  };

  const handleResume = async (id) => {
    try {
      await approveCampaign(id);
      loadHistory();
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleRetryFailed = async (id) => {
    if (window.confirm("Retry sending to failed recipients only?")) {
      try {
        await retryFailedCampaign(id);
        loadHistory();
      } catch (err) {
        console.error(err.message);
      }
    }
  };

  const totalSent = history.reduce((sum, r) => sum + (r.total_sent || 0), 0);
  const totalFailed = history.reduce((sum, r) => sum + (r.total_failed || 0), 0);
  const totalEmails = totalSent + totalFailed;
  const successRate = totalEmails > 0 ? Math.round((totalSent / totalEmails) * 100) : 0;

  return (
    <div className="glass-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title">History</h2>
        <button
          onClick={handleClearHistory}
          className="text-xs text-content-muted hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-hover rounded-lg p-4">
          <p className="text-2xl font-semibold text-content-primary">{totalSent.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Delivered</p>
        </div>
        <div className="bg-surface-hover rounded-lg p-4">
          <p className="text-2xl font-semibold text-content-primary">{totalFailed.toLocaleString()}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Failed</p>
        </div>
        <div className="bg-surface-hover rounded-lg p-4">
          <p className="text-2xl font-semibold text-content-primary">{successRate}%</p>
          <p className="text-xs text-content-muted mt-0.5">Success rate</p>
          <div className="w-full bg-surface-elevated rounded-full h-1 mt-2 overflow-hidden">
            <div className="bg-brand-600 h-1 rounded-full transition-all duration-700" style={{ width: `${successRate}%` }} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-hover text-content-muted text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Result</th>
              <th className="px-3 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-light text-content-secondary">
            {history.map((record) => {
              const rowTotal = record.total_sent + record.total_failed;
              const rowRate = rowTotal > 0 ? (record.total_sent / rowTotal) * 100 : 0;
              return (
                <tr className="hover:bg-surface-hover transition-colors" key={record.id}>
                  <td className="px-4 py-3 text-xs text-content-muted whitespace-nowrap">
                    {new Date(record.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="truncate block max-w-[180px]">{record.subject}</span>
                    {record.start_index > 0 && (
                      <span className="text-[10px] text-amber-500 dark:text-amber-400 mt-0.5 block">Resumed from row {record.start_index}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      record.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      record.status === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                      'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400">{record.total_sent}</span>
                      <span className="text-line">/</span>
                      <span className="text-red-600 dark:text-red-400">{record.total_failed}</span>
                    </div>
                    <div className="w-full max-w-[100px] bg-surface-elevated rounded-full h-1 mt-1 overflow-hidden flex ml-auto">
                      <div className="bg-emerald-500 h-full" style={{ width: `${rowRate}%` }} />
                      {record.total_failed > 0 && <div className="bg-red-500 h-full flex-1" />}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {['stopped', 'error'].includes(record.status) && (
                        <button onClick={() => handleResume(record.id)} className="p-1 text-content-muted hover:text-amber-500 dark:hover:text-amber-400 transition-colors" title="Resume">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                        </button>
                      )}
                      {record.total_failed > 0 && record.status !== 'running' && (
                        <button onClick={() => handleRetryFailed(record.id)} className="p-1 text-content-muted hover:text-brand-500 dark:hover:text-brand-400 transition-colors" title="Retry failed">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                      {record.status !== 'running' && (
                        <button onClick={() => handleDeleteRow(record.id)} className="p-1 text-content-muted hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
