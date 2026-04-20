import { useState, useEffect } from 'react';
import { fetchUsers, createUser, deleteUser, fetchPendingCampaigns, approveCampaign, rejectCampaign } from '../lib/api';

export default function AdminDashboard({ user, setView }) {
  const [users, setUsers] = useState([]);
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('worker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [u, c] = await Promise.all([fetchUsers(), fetchPendingCampaigns()]);
      setUsers(u);
      setPendingCampaigns(c);
    } catch (err) {
      setError('Failed to load dashboard data');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setLoading(true);
    try {
      await createUser({ username: newUsername, password: newPassword, role: newRole });
      setNewUsername('');
      setNewPassword('');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApprove = async (campaignId) => {
    if (approvingId) return;
    setApprovingId(campaignId);
    try {
      await approveCampaign(campaignId);
      loadData();
      alert('Campaign approved and started!');
      if (setView) setView('campaign');
    } catch (err) {
      if (!err.message.includes('already running')) {
        setError(err.message);
      }
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (campaignId) => {
    if (!confirm('Are you sure you want to reject this campaign?')) return;
    setLoading(true);
    try {
      await rejectCampaign(campaignId);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <div className="glass-card p-6 space-y-6">
          <h2 className="section-title">
            <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            User Management
          </h2>
          
          <form onSubmit={handleCreateUser} className="space-y-4 bg-gray-800/20 p-4 rounded-xl border border-white/5">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Add New User</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Username"
                className="input-field py-2"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="input-field py-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <select
                className="input-field py-2 bg-gray-800"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2 text-sm">
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>

          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <p className="font-medium text-white">{u.username}</p>
                  <p className="text-xs text-brand-400 uppercase tracking-tighter">{u.role}</p>
                </div>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="p-2 text-gray-500 hover:text-rose-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Campaigns */}
        <div className="glass-card p-6 space-y-6">
          <h2 className="section-title">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending Approvals
          </h2>
          
          <div className="space-y-4">
            {pendingCampaigns.length === 0 ? (
              <p className="text-gray-500 text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">No campaigns awaiting approval</p>
            ) : (
              pendingCampaigns.map(camp => (
                <div key={camp.id} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white">{camp.config.email_subject}</p>
                      <p className="text-xs text-gray-400 italic">By User {camp.creator_id.split('-')[0]} • {new Date(camp.created_at * 1000).toLocaleString()}</p>
                    </div>                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${
                      camp.status === 'error' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                      camp.status === 'stopped' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {camp.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                    <div className="bg-black/20 p-2 rounded">Total Rows: <span className="text-white">{camp.total_count}</span></div>
                    <div className="bg-black/20 p-2 rounded">Processed: <span className="text-white">{camp.last_sent_count}</span></div>
                    <div className="bg-black/20 p-2 rounded">Sent: <span className="text-emerald-400 font-bold">{camp.successful_count}</span></div>
                    <div className="bg-black/20 p-2 rounded">Failed: <span className="text-rose-400 font-bold">{camp.failed_count}</span></div>
                    {camp.config.start_index > 0 && (
                      <div className="bg-amber-500/10 p-2 rounded col-span-2 border border-amber-500/20 text-amber-500">
                        Resuming from row: <span className="font-bold">{camp.config.start_index}</span>
                      </div>
                    )}
                    <div className="bg-black/20 p-2 rounded col-span-2">Mode: <span className="text-white">{camp.config.email_only ? 'Email Only' : 'Certificates'}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(camp.id)}
                      disabled={approvingId === camp.id || loading}
                      className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {approvingId === camp.id ? 'Starting...' : (['error', 'stopped'].includes(camp.status) ? 'Resume' : 'Approve')}
                    </button>
                    <button
                      onClick={() => handleReject(camp.id)}
                      disabled={approvingId === camp.id || loading}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg border border-rose-500/20 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {error && <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm text-center">{error}</div>}
    </div>
  );
}
