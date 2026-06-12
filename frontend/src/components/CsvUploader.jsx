import { useState, useRef } from 'react';
import { uploadCSV } from '../lib/api';

export default function CsvUploader({ onUploaded, restoredCount }) {
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      const data = await uploadCSV(file);
      setResult(data);
      onUploaded?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const showRestored = !result && restoredCount > 0;

  return (
    <div className="glass-card p-5 space-y-4">
      <h2 className="section-title">Recipients</h2>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${dragOver
            ? 'border-brand-500 bg-brand-500/5'
            : 'border-line hover:border-content-muted'
          }`}
      >
        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-surface-elevated flex items-center justify-center">
          <svg className="w-5 h-5 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-content-secondary text-sm">
          {isUploading ? 'Uploading...' : showRestored ? 'Drop CSV to replace' : 'Drop CSV file or click to browse'}
        </p>
        <p className="text-content-muted text-xs mt-1">Requires "name" and "email" columns</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
      </div>

      {isUploading && (
        <div className="flex items-center gap-2 text-brand-400 text-sm">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Parsing...
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-sm">{error}</div>
      )}

      {showRestored && (
        <div className="flex items-center gap-2">
          <span className="badge-success">{restoredCount.toLocaleString()} recipients</span>
          <span className="text-xs text-content-muted">from previous session</span>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="badge-success">{result.count.toLocaleString()} recipients</span>
            <span className="text-xs text-content-muted">ready</span>
          </div>
          <div className="bg-surface-input rounded-lg p-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-content-muted text-left text-xs">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                </tr>
              </thead>
              <tbody className="text-content-secondary">
                {result.sample.map((r, i) => (
                  <tr key={i} className="border-t border-line-light">
                    <td className="py-1.5 pr-4 text-sm">{r.name}</td>
                    <td className="py-1.5 text-sm text-content-muted">{r.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.count > 5 && (
              <p className="text-content-muted text-xs mt-2 text-center">
                Showing 5 of {result.count.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
