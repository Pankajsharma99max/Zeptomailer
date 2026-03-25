import { useState, useEffect } from 'react';
import { fetchSettings, updateSettings } from '../lib/api';

export default function Settings() {
  const [senderName, setSenderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      setSenderName(data.sender_name);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updateSettings({ sender_name: senderName });
      setMessage({ type: 'success', text: 'Settings updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">System Settings</h2>
          <p className="text-gray-400 mt-1">Configure global application behavior and email identity.</p>
        </div>
      </div>

      <div className="glass-card p-8 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest">
              Email Sender Name
            </label>
            <p className="text-xs text-gray-500 mb-2">This name will appear in the "From" field of all certificate emails.</p>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. CertFlow Service"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium"
              required
            />
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl border ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            } text-sm font-medium animate-slide-up`}>
              {message.text}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-8 py-3 rounded-xl font-bold uppercase tracking-wider disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-brand-500">
          <h3 className="text-lg font-bold text-white mb-2">Identity & Branding</h3>
          <p className="text-sm text-gray-400">
            Updating the sender name affects all subsequent campaigns immediately. Ensure it matches your organization's verified domain settings in ZeptoMail.
          </p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-brand-500">
          <h3 className="text-lg font-bold text-white mb-2">Global Persistence</h3>
          <p className="text-sm text-gray-400">
            These settings are stored in the system database and persist across server restarts, overriding initial environment variable defaults.
          </p>
        </div>
      </div>
    </div>
  );
}
