import { useState, useEffect } from 'react';
import { fetchHistory, clearHistory } from '../lib/api';

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
    // Poll to keep table updated
    const interval = setInterval(loadHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading && history.length === 0) {
    return <div className="text-gray-500 animate-pulse text-sm text-center py-4">Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="glass-card p-10 mt-8 w-full animate-fade-in flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-300">No Campaign History</h3>
        <p className="text-gray-500 max-w-sm">Your past campaigns and analytics will appear here once you start sending certificates.</p>
      </div>
    );
  }

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to delete all campaign history? This cannot be undone.")) {
      try {
        await clearHistory();
        setHistory([]);
      } catch (err) {
        console.error("Failed to clear history:", err);
      }
    }
  };

  const totalSent = history.reduce((sum, r) => sum + (r.total_sent || 0), 0);
  const totalFailed = history.reduce((sum, r) => sum + (r.total_failed || 0), 0);
  const totalEmails = totalSent + totalFailed;
  const successRate = totalEmails > 0 ? Math.round((totalSent / totalEmails) * 100) : 0;

  return (
    <div className="glass-card p-6 space-y-6 mt-8 w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="section-title">
          <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Campaign Analytics
        </h2>
        {history.length > 0 && (
          <button 
            onClick={handleClearHistory}
            className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 rounded-lg transition-colors border border-rose-500/20 flex items-center gap-1.5 font-semibold tracking-wide"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear History
          </button>
        )}
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col relative overflow-hidden group hover:border-brand-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
          </div>
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Sent</span>
          <span className="text-4xl font-black text-white mt-2">{totalSent}</span>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          </div>
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Failed</span>
          <span className="text-4xl font-black text-white mt-2">{totalFailed}</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Lifetime Success Rate</span>
            <div className="text-3xl font-black text-white mt-2">{successRate}%</div>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 mt-4 overflow-hidden border border-gray-700/50">
            <div className="bg-gradient-to-r from-brand-500 to-emerald-400 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${successRate}%` }}></div>
          </div>
        </div>
      </div>
      
      {/* History Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 text-gray-400 font-semibold border-b border-white/10">
            <tr>
              <th className="px-5 py-4">Completed On</th>
              <th className="px-5 py-4">Subject line</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 w-48 text-right">Delivery Ratio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300 font-medium">
            {history.map((record) => {
              const rowTotal = record.total_sent + record.total_failed;
              const rowSuccessRate = rowTotal > 0 ? (record.total_sent / rowTotal) * 100 : 0;
              return (
                <tr className="hover:bg-white/5 transition-colors" key={record.id}>
                  <td className="px-5 py-4">
                    {new Date(record.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 truncate max-w-[200px]" title={record.subject}>
                    {record.subject}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      record.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      record.status === 'error' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {record.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5 items-end">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400">{record.total_sent} sent</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-rose-400">{record.total_failed} failed</span>
                      </div>
                      <div className="w-full max-w-[140px] bg-gray-800 rounded-full h-1.5 overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${rowSuccessRate}%` }}></div>
                        <div className="bg-rose-500 h-full flex-1"></div>
                      </div>
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
