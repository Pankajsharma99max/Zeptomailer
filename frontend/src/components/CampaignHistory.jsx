import { useState, useEffect } from 'react';
import { fetchHistory } from '../lib/api';

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
    return null;
  }

  return (
    <div className="glass-card p-6 space-y-5 mt-8 w-full">
      <h2 className="section-title">
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Campaign Analytics & History
      </h2>
      
      <div className="overflow-x-auto rounded-xl border border-gray-800/50">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-800/40 text-gray-400 font-medium border-b border-gray-700">
            <tr>
              <th className="px-4 py-3">Completed On</th>
              <th className="px-4 py-3">Subject line</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Sent</th>
              <th className="px-4 py-3 text-right">Failed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50 text-gray-300">
            {history.map((record) => (
              <tr className="hover:bg-brand-500/5 transition-colors" key={record.id}>
                <td className="px-4 py-3">
                  {new Date(record.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 truncate max-w-xs" title={record.subject}>
                  {record.subject}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    record.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    record.status === 'error' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {record.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                  {record.total_sent}
                </td>
                <td className="px-4 py-3 text-right text-rose-400 font-medium">
                  {record.total_failed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
