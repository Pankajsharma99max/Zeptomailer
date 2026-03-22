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

  // Show restored state if we have a count from the server but no fresh result
  const showRestored = !result && restoredCount > 0;

  return (
    <div className="glass-card p-6 space-y-4">
      <h2 className="section-title">
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Recipient List
      </h2>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${dragOver
            ? 'border-emerald-400 bg-emerald-500/10'
            : 'border-gray-700 hover:border-emerald-500/50'
          }`}
        id="csv-drop-zone"
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-800/60 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-gray-400 font-medium">
          {isUploading ? 'Uploading...' : showRestored ? 'Drop CSV to replace, or click to browse' : 'Drop CSV file or click to browse'}
        </p>
        <p className="text-gray-600 text-sm mt-1">Must contain "name" and "email" columns</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
          id="csv-file-input"
        />
      </div>

      {isUploading && (
        <div className="flex items-center gap-3 text-emerald-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Parsing CSV...
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm">{error}</div>
      )}

      {/* Show restored recipient count */}
      {showRestored && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="badge-success">{restoredCount.toLocaleString()} recipients</span>
            <span className="text-sm text-gray-500">restored from previous session</span>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="badge-success">{result.count.toLocaleString()} recipients</span>
            <span className="text-sm text-gray-500">ready to send</span>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {result.sample.map((r, i) => (
                  <tr key={i} className="border-t border-gray-800/50">
                    <td className="py-2 pr-4">{r.name}</td>
                    <td className="py-2 text-gray-400">{r.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.count > 5 && (
              <p className="text-gray-600 text-xs mt-2 text-center">
                Showing first 5 of {result.count.toLocaleString()} recipients
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
