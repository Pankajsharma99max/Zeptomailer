import { useState } from 'react';
import { fetchPreviews } from '../lib/api';

export default function PreviewPanel({ placeholders }) {
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const handlePreview = async () => {
    if (placeholders.length === 0) {
      setError('Add at least one placeholder first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchPreviews({
        placeholders: placeholders,
        sample_count: 5,
      });
      setPreviews(data.previews);
      setSelectedIdx(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Preview</h2>
        <button
          onClick={handlePreview}
          disabled={loading}
          className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
        >
          {loading ? (
            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Generate
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-sm">{error}</div>
      )}

      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {previews.map((p, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  i === selectedIdx
                    ? 'border-brand-500'
                    : 'border-line opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={`data:image/jpeg;base64,${p.image_base64}`}
                  alt={p.name}
                  className="w-20 h-14 object-cover"
                />
              </button>
            ))}
          </div>

          <div className="rounded-lg overflow-hidden border border-line">
            <img
              src={`data:image/jpeg;base64,${previews[selectedIdx].image_base64}`}
              alt={previews[selectedIdx].name}
              className="w-full h-auto"
            />
          </div>
          <p className="text-center text-sm text-content-muted">
            <span className="text-content-secondary">{previews[selectedIdx].name}</span>
            <span className="mx-2 text-line">|</span>
            {selectedIdx + 1} of {previews.length}
          </p>
        </div>
      )}

      {previews.length === 0 && !loading && !error && (
        <p className="text-center py-6 text-content-muted text-sm">
          Upload a template and CSV, then click Generate to preview certificates.
        </p>
      )}
    </div>
  );
}
