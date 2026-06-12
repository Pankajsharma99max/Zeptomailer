import { useState, useRef, useCallback, useEffect } from 'react';
import { uploadTemplate } from '../lib/api';

export default function OverlayEditor({ onCoordsChange, coords, fontSize, onFontSizeChange, fontColor, onFontColorChange, textAlign, onTextAlignChange, isBold, onIsBoldChange, fontFamily, onFontFamilyChange, textEffect, onTextEffectChange, restoredTemplateUrl, restoredTemplateInfo, placeholderPages, onPlaceholderPagesChange }) {
  const [templateUrls, setTemplateUrls] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [templateInfo, setTemplateInfo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

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
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Template</h2>
        {templateInfo && (
          <span className="text-xs text-content-muted">{templateInfo.width} x {templateInfo.height}</span>
        )}
      </div>

      {templateUrls.length === 0 ? (
        <label className="block cursor-pointer">
          <div className="border border-dashed border-line hover:border-content-muted rounded-xl p-10 text-center transition-colors group">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-elevated flex items-center justify-center group-hover:bg-surface-hover transition-colors">
              <svg className="w-6 h-6 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-content-secondary text-sm font-medium">Upload certificate template</p>
            <p className="text-content-muted text-xs mt-1">JPG or PNG, one or multiple pages</p>
          </div>
          <input type="file" accept=".jpg,.jpeg,.png" multiple onChange={handleFileChange} className="hidden" />
        </label>
      ) : (
        <>
          {templateUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {templateUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    activeIndex === idx ? 'border-brand-500 opacity-100' : 'border-line opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={url} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 bg-black/70 text-white text-[10px] px-1 py-0.5">
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 bg-surface-hover p-2.5 rounded-lg">
            <input
              type="checkbox"
              id="enable-placeholder"
              checked={placeholderPages[activeIndex] || false}
              onChange={(e) => {
                const newPages = [...placeholderPages];
                newPages[activeIndex] = e.target.checked;
                onPlaceholderPagesChange(newPages);
              }}
              className="w-4 h-4 accent-brand-600 bg-surface-input border-line rounded focus:ring-brand-500 cursor-pointer"
            />
            <label htmlFor="enable-placeholder" className="text-sm text-content-secondary cursor-pointer select-none">
              Show name on page {activeIndex + 1}
            </label>
          </div>

          <div
            ref={containerRef}
            className="relative rounded-lg overflow-hidden border border-line cursor-crosshair select-none"
            style={{ userSelect: 'none' }}
          >
            <img
              ref={imageRef}
              src={templateUrls[activeIndex]}
              alt="Certificate template"
              className="w-full h-auto block"
              draggable={false}
              onError={() => {
                setError('Failed to load template image. Try re-uploading.');
                setTemplateUrls([]);
              }}
            />
            {placeholderPages[activeIndex] && (
              <div
                onMouseDown={handleMouseDown}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab px-3 py-1.5
                  rounded border-2 border-dashed transition-all duration-100
                  ${isDragging
                    ? 'border-brand-400 bg-brand-500/20 cursor-grabbing'
                    : 'border-brand-500/50 bg-brand-500/10 hover:border-brand-400'
                  }`}
                style={{
                  left: `${coords.x_percent}%`,
                  top: `${coords.y_percent}%`,
                  fontSize: templateInfo ? `${(fontSize * (containerRef.current?.getBoundingClientRect().width || 0)) / templateInfo.width}px` : `${fontSize * 0.4}px`,
                  color: fontColor,
                  fontWeight: isBold ? 'bold' : 'normal',
                  fontFamily: fontFamily === 'Serif' ? 'Cinzel, serif' :
                              fontFamily === 'Cinzel' ? 'Cinzel, serif' :
                              fontFamily === 'Playfair Display' ? '"Playfair Display", serif' :
                              fontFamily === 'Montserrat' ? 'Montserrat, sans-serif' :
                              fontFamily === 'Mono' ? 'monospace' : 'Roboto, sans-serif',
                  transform: textAlign === 'left' ? 'translateY(-50%)'
                    : textAlign === 'right' ? 'translate(-100%, -50%)'
                    : 'translate(-50%, -50%)',
                  textShadow: textEffect === 'shadow' ? '4px 4px 8px rgba(0,0,0,0.6)' :
                              textEffect === 'gold-glow' ? '0 0 10px rgba(212,175,55,0.8), 2px 2px 4px rgba(212,175,55,0.8)' : 'none',
                  WebkitTextStroke: textEffect === 'outline-white' ? '2px white' :
                                    textEffect === 'outline-black' ? '2px black' : 'none',
                }}
              >
                <span className="font-semibold whitespace-nowrap select-none pointer-events-none">
                  John Doe
                </span>
              </div>
            )}

            {placeholderPages[activeIndex] && (
              <>
                <div className="absolute left-0 right-0 border-t border-brand-500/15 pointer-events-none" style={{ top: `${coords.y_percent}%` }} />
                <div className="absolute top-0 bottom-0 border-l border-brand-500/15 pointer-events-none" style={{ left: `${coords.x_percent}%` }} />
              </>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label-text">Size: {fontSize}px</label>
              <input
                type="range"
                min="10"
                max={templateInfo ? Math.round(templateInfo.width / 5) : 500}
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full bg-surface-elevated appearance-none cursor-pointer accent-brand-500"
              />
            </div>
            <div>
              <label className="label-text">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => onFontColorChange(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-line cursor-pointer bg-transparent"
                />
                <span className="text-xs text-content-muted font-mono">{fontColor}</span>
              </div>
            </div>
            <div>
              <label className="label-text">Align</label>
              <div className="flex items-center gap-0.5 bg-surface-elevated rounded-lg p-0.5">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => onTextAlignChange(align)}
                    className={`flex-1 px-2 py-1.5 rounded-md transition-colors flex items-center justify-center ${
                      textAlign === align ? 'bg-surface-card text-content-primary' : 'text-content-muted hover:text-content-secondary'
                    }`}
                    title={`Align ${align}`}
                  >
                    {align === 'left' && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h12M3 18h16" />
                      </svg>
                    )}
                    {align === 'center' && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M4 18h16" />
                      </svg>
                    )}
                    {align === 'right' && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 12h12M5 18h16" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-text">Position</label>
              <p className="text-xs text-content-muted font-mono mt-1">
                {coords.x_percent.toFixed(1)}%, {coords.y_percent.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-3 border-t border-line">
            <button
              onClick={() => onIsBoldChange(!isBold)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                isBold ? 'bg-brand-600 text-white' : 'bg-surface-elevated text-content-muted hover:text-content-secondary'
              }`}
              title="Bold"
            >
              B
            </button>

            <select
              value={fontFamily}
              onChange={(e) => onFontFamilyChange(e.target.value)}
              className="bg-surface-elevated text-content-secondary text-xs px-3 py-2 rounded-lg border border-line focus:border-brand-500 outline-none cursor-pointer"
            >
              <option value="Roboto">Roboto</option>
              <option value="Cinzel">Cinzel</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Serif">Default Serif</option>
              <option value="Mono">Monospace</option>
            </select>

            <select
              value={textEffect}
              onChange={(e) => onTextEffectChange(e.target.value)}
              className="bg-surface-elevated text-content-secondary text-xs px-3 py-2 rounded-lg border border-line focus:border-brand-500 outline-none cursor-pointer"
            >
              <option value="none">No effect</option>
              <option value="shadow">Drop shadow</option>
              <option value="outline-white">White outline</option>
              <option value="outline-black">Black outline</option>
              <option value="gold-glow">Gold glow</option>
            </select>
          </div>

          <label className="inline-block cursor-pointer">
            <span className="text-sm text-content-muted hover:text-content-secondary transition-colors">Change template</span>
            <input type="file" multiple accept=".jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
          </label>
        </>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 text-brand-400 text-sm">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uploading...
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
