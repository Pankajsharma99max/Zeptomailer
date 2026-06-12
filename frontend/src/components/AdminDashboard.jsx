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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [u, c] = await Promise.all([fetchUsers(), fetchPendingCampaigns()]);
      setUsers(u);
      setPendingCampaigns(c);
    } catch {
      setError('Failed to load data');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setLoading(true);
    setError('');
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
    if (!confirm('Delete this user?')) return;
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
    if (!confirm('Reject this campaign?')) return;
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
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-4">
          <h2 className="section-title">Users</h2>

          <form onSubmit={handleCreateUser} className="space-y-3 bg-surface-hover p-4 rounded-lg border border-line">
            <p className="text-xs font-medium text-content-muted uppercase tracking-wide">New user</p>
            <input
              type="text"
              placeholder="Username"
              className="input-field"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="flex gap-2">
              <select
                className="input-field flex-1"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>

          <div className="space-y-1.5">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-surface-hover rounded-lg">
                <div>
                  <p className="text-sm font-medium text-content-primary">{u.username}</p>
                  <p className="text-xs text-content-muted">{u.role}</p>
                </div>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="p-1.5 text-content-muted hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Delete user"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 space-y-4">
          <h2 className="section-title">Pending approval</h2>

          {pendingCampaigns.length === 0 ? (
            <p className="text-content-muted text-sm text-center py-6">No campaigns waiting for approval.</p>
          ) : (
            <div className="space-y-3">
              {pendingCampaigns.map(camp => (
                <div key={camp.id} className="p-4 bg-surface-hover rounded-lg border border-line space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-content-primary text-sm">{camp.config.email_subject}</p>
                      <p className="text-xs text-content-muted">
                        {new Date(camp.created_at * 1000).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                      camp.status === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                      camp.status === 'stopped' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                      'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    }`}>
                      {camp.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-surface-input p-2 rounded text-content-muted">
                      Recipients: <span className="text-content-primary">{camp.total_count}</span>
                    </div>
                    <div className="bg-surface-input p-2 rounded text-content-muted">
                      Mode: <span className="text-content-primary">{camp.config.email_only ? 'Email only' : 'Certificate'}</span>
                    </div>
                    {camp.successful_count > 0 && (
                      <div className="bg-surface-input p-2 rounded text-content-muted">
                        Sent: <span className="text-emerald-600 dark:text-emerald-400">{camp.successful_count}</span>
                      </div>
                    )}
                    {camp.failed_count > 0 && (
                      <div className="bg-surface-input p-2 rounded text-content-muted">
                        Failed: <span className="text-red-600 dark:text-red-400">{camp.failed_count}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(camp.id)}
                      disabled={approvingId === camp.id}
                      className="btn-primary flex-1 py-2 text-sm"
                    >
                      {approvingId === camp.id ? 'Starting...' : (['error', 'stopped'].includes(camp.status) ? 'Resume' : 'Approve')}
                    </button>
                    <button
                      onClick={() => handleReject(camp.id)}
                      disabled={approvingId === camp.id}
                      className="btn-secondary py-2 text-sm text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/10"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
