import { useState, useEffect } from 'react';
import { fetchSettings, updateSettings } from '../lib/api';

export default function Settings() {
  const [senderName, setSenderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      setSenderName(data.sender_name);
    } catch {
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
      setMessage({ type: 'success', text: 'Settings saved.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-line border-t-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-content-primary">Settings</h2>
        <p className="text-sm text-content-muted mt-1">Configure email identity and application behavior.</p>
      </div>

      <div className="glass-card p-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label-text">Sender name</label>
            <p className="text-xs text-content-muted mb-2">Appears in the "From" field of all emails.</p>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Certificate Service"
              className="input-field"
              required
            />
          </div>

          {message.text && (
            <div className={`text-sm px-3 py-2 rounded-lg border ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving && (
              <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="glass-card p-4 border-l-2 border-l-brand-500">
        <p className="text-sm text-content-secondary">
          The sender name persists across server restarts and overrides the environment variable default. Make sure it matches your verified domain in ZeptoMail.
        </p>
      </div>
    </div>
  );
}
