import { useState } from 'react';
import { fetchPreviews } from '../lib/api';

export default function PreviewPanel({ coords, fontSize, fontColor, textAlign, isBold, fontFamily }) {
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const handlePreview = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPreviews({
        x_percent: coords.x_percent,
        y_percent: coords.y_percent,
        font_size: fontSize,
        font_color: fontColor,
        text_align: textAlign,
        is_bold: isBold,
        font_family: fontFamily,
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
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview
        </h2>
        <button
          onClick={handlePreview}
          disabled={loading}
          className="btn-secondary text-sm flex items-center gap-2"
          id="preview-random-btn"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Preview Random 5
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm">{error}</div>
      )}

      {previews.length > 0 && (
        <div className="space-y-4">
          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {previews.map((p, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  i === selectedIdx
                    ? 'border-brand-500 shadow-lg shadow-brand-500/20 scale-105'
                    : 'border-gray-700/50 hover:border-gray-600 opacity-70 hover:opacity-100'
                }`}
                id={`preview-thumb-${i}`}
              >
                <img
                  src={`data:image/jpeg;base64,${p.image_base64}`}
                  alt={p.name}
                  className="w-24 h-16 object-cover"
                />
              </button>
            ))}
          </div>

          {/* Selected preview */}
          <div className="rounded-xl overflow-hidden border border-gray-700/50">
            <img
              src={`data:image/jpeg;base64,${previews[selectedIdx].image_base64}`}
              alt={previews[selectedIdx].name}
              className="w-full h-auto"
            />
          </div>
          <p className="text-center text-gray-400 text-sm">
            <span className="font-semibold text-white">{previews[selectedIdx].name}</span>
            <span className="text-gray-600 mx-2">•</span>
            {selectedIdx + 1} of {previews.length}
          </p>
        </div>
      )}

      {previews.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-600">
          <p>Upload a CSV and template, then click "Preview Random 5" to see how names will appear</p>
        </div>
      )}
    </div>
  );
}
