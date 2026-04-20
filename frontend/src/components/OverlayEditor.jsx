import { useState, useRef, useCallback, useEffect } from 'react';
import { uploadTemplate } from '../lib/api';

export default function OverlayEditor({ onCoordsChange, coords, fontSize, onFontSizeChange, fontColor, onFontColorChange, textAlign, onTextAlignChange, isBold, onIsBoldChange, fontFamily, onFontFamilyChange, restoredTemplateUrl, restoredTemplateInfo, placeholderPages, onPlaceholderPagesChange }) {
  const [templateUrls, setTemplateUrls] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [templateInfo, setTemplateInfo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Restore template from server on mount (if available)
  useEffect(() => {
    if (restoredTemplateUrl && Array.isArray(restoredTemplateUrl) && templateUrls.length === 0) {
      setTemplateUrls(restoredTemplateUrl);
      if (!placeholderPages || placeholderPages.length !== restoredTemplateUrl.length) {
        onPlaceholderPagesChange(restoredTemplateUrl.map(() => true));
      }
    }
    if (restoredTemplateInfo && !templateInfo) {
      setTemplateInfo(restoredTemplateInfo);
    }
  }, [restoredTemplateUrl, restoredTemplateInfo]);

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      const result = await uploadTemplate(files);
      const newUrls = Array.from(files).map((f) => URL.createObjectURL(f));
      setTemplateUrls(newUrls);
      setActiveIndex(0);
      onPlaceholderPagesChange(newUrls.map(() => true));
      setTemplateInfo(result);
      // Default position: center
      onCoordsChange({ x_percent: 50, y_percent: 50 });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const currentX = (coords.x_percent / 100) * rect.width;
    const currentY = (coords.y_percent / 100) * rect.height;

    dragOffset.current = {
      x: e.clientX - rect.left - currentX,
      y: e.clientY - rect.top - currentY,
    };
    setIsDragging(true);
  }, [coords]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.current.x;
    const y = e.clientY - rect.top - dragOffset.current.y;

    const x_percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const y_percent = Math.max(0, Math.min(100, (y / rect.height) * 100));

    onCoordsChange({ x_percent, y_percent });
  }, [isDragging, onCoordsChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title">
          <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Template Editor
        </h2>
        {templateInfo && (
          <span className="badge-info">{templateInfo.width}×{templateInfo.height}px</span>
        )}
      </div>

      {/* Upload area */}
      {templateUrls.length === 0 ? (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-gray-700 hover:border-brand-500/50 rounded-xl p-12 text-center transition-colors duration-300 group">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800/60 flex items-center justify-center group-hover:bg-brand-500/10 transition-colors">
              <svg className="w-8 h-8 text-gray-500 group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-gray-400 font-medium">Drop your certificate templates here</p>
            <p className="text-gray-600 text-sm mt-1">Select one or more JPG/PNG files</p>
          </div>
          <input type="file" accept=".jpg,.jpeg,.png" multiple onChange={handleFileChange} className="hidden" id="template-upload" />
        </label>
      ) : (
        <>
          {/* Page Selector */}
          {templateUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {templateUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    activeIndex === idx ? 'border-brand-500 opacity-100 shadow-md transform scale-105' : 'border-gray-700 opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={url} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded-tr">
                    Page {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Placeholder Toggle for current page */}
          <div className="flex items-center gap-3 bg-gray-800/40 p-3 rounded-lg border border-gray-700/50">
            <input
              type="checkbox"
              id="enable-placeholder"
              checked={placeholderPages[activeIndex] || false}
              onChange={(e) => {
                const newPages = [...placeholderPages];
                newPages[activeIndex] = e.target.checked;
                onPlaceholderPagesChange(newPages);
              }}
              className="w-4 h-4 text-brand-500 bg-gray-700 border-gray-600 rounded focus:ring-brand-500 cursor-pointer"
            />
            <label htmlFor="enable-placeholder" className="text-sm font-medium text-gray-300 cursor-pointer select-none">
              Draw Name Placeholder on Page {activeIndex + 1}
            </label>
          </div>

          {/* Template with draggable overlay */}
          <div
            ref={containerRef}
            className="relative rounded-xl overflow-hidden border border-gray-700/50 cursor-crosshair select-none"
            style={{ userSelect: 'none' }}
          >
            <img
              ref={imageRef}
              src={templateUrls[activeIndex]}
              alt="Certificate template"
              className="w-full h-auto block"
              draggable={false}
              onError={() => {
                setError('Failed to load template image. Your session may have expired. Please try uploading the template again or log out and back in.');
                setTemplateUrls([]);
              }}
            />
            {/* Draggable name overlay */}
            {placeholderPages[activeIndex] && (
              <div
                onMouseDown={handleMouseDown}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab px-4 py-2 
                rounded-lg border-2 border-dashed transition-all duration-100
                ${isDragging
                  ? 'border-brand-400 bg-brand-500/20 shadow-lg shadow-brand-500/30 cursor-grabbing scale-105'
                  : 'border-brand-500/60 bg-brand-500/10 hover:border-brand-400 hover:bg-brand-500/15'
                }`}
              style={{
                left: `${coords.x_percent}%`,
                top: `${coords.y_percent}%`,
                fontSize: templateInfo ? `${(fontSize * (containerRef.current?.getBoundingClientRect().width || 0)) / templateInfo.width}px` : `${fontSize * 0.4}px`,
                color: fontColor,
                fontWeight: isBold ? 'bold' : 'normal',
                fontFamily: fontFamily === 'Serif' ? 'serif' : fontFamily === 'Mono' ? 'monospace' : 'sans-serif',
                transform: textAlign === 'left' ? 'translateY(-50%)'
                  : textAlign === 'right' ? 'translate(-100%, -50%)'
                  : 'translate(-50%, -50%)',
              }}
            >
              <span className="font-semibold whitespace-nowrap select-none pointer-events-none">
                John Doe
              </span>
            </div>
            )}
            
            {placeholderPages[activeIndex] && (
              <>
                {/* Crosshair guides */}
                <div className="absolute left-0 right-0 border-t border-brand-500/20 pointer-events-none" style={{ top: `${coords.y_percent}%` }} />
                <div className="absolute top-0 bottom-0 border-l border-brand-500/20 pointer-events-none" style={{ left: `${coords.x_percent}%` }} />
              </>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="label-text">Font Size: {fontSize}px</label>
              <input
                type="range"
                min="10"
                max={templateInfo ? Math.round(templateInfo.width / 5) : 500}
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="w-full h-2 rounded-full bg-gray-700 appearance-none cursor-pointer accent-brand-500"
                id="font-size-slider"
              />
            </div>
            <div>
              <label className="label-text">Font Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => onFontColorChange(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                  id="font-color-picker"
                />
                <span className="text-sm text-gray-400 font-mono">{fontColor}</span>
              </div>
            </div>
            <div>
              <label className="label-text">Alignment</label>
              <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-0.5">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => onTextAlignChange(align)}
                    className={`flex-1 px-3 py-2 rounded-md transition-all duration-200 flex items-center justify-center ${
                      textAlign === align
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                    id={`align-${align}-btn`}
                    title={`Align ${align}`}
                  >
                    {align === 'left' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h12M3 18h16" />
                      </svg>
                    )}
                    {align === 'center' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M4 18h16" />
                      </svg>
                    )}
                    {align === 'right' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 12h12M5 18h16" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-text">Position</label>
              <p className="text-sm text-gray-400 font-mono">
                X: {coords.x_percent.toFixed(1)}% • Y: {coords.y_percent.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-800/50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onIsBoldChange(!isBold)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all ${
                  isBold ? 'bg-brand-500 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
                title="Bold"
              >
                B
              </button>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Bold Text</span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={fontFamily}
                onChange={(e) => onFontFamilyChange(e.target.value)}
                className="bg-gray-800 text-gray-300 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg border border-gray-700 focus:border-brand-500/50 outline-none cursor-pointer"
              >
                <option value="Roboto">Roboto (Sans)</option>
                <option value="Serif">Serif</option>
                <option value="Mono">Monospace</option>
              </select>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Font Family</span>
            </div>
          </div>

          {/* Change template button */}
          <label className="inline-block cursor-pointer mt-4">
            <span className="btn-secondary text-sm inline-block">Change Template(s)</span>
            <input type="file" multiple accept=".jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
          </label>
        </>
      )}

      {isUploading && (
        <div className="flex items-center gap-3 text-brand-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uploading template...
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
