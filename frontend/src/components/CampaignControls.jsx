import { useState } from 'react';
import { startCampaign, stopCampaign, getFailedCSVUrl } from '../lib/api';

const DEFAULT_PLAIN = 'Dear participant,\n\nPlease find your certificate of participation attached.\n\nBest regards,\nThe Team';

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4c6ef5, #7c3aed); padding:32px 40px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">🎓 Your Certificate</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px; color:#374151; font-size:16px; line-height:1.7;">
              <p style="margin:0 0 16px;">Dear Participant,</p>
              <p style="margin:0 0 16px;">Congratulations! Please find your <strong>certificate of participation</strong> attached to this email.</p>
              <p style="margin:0 0 16px;">We hope you enjoyed the experience and look forward to seeing you again.</p>
              <p style="margin:24px 0 0; color:#6b7280;">Best regards,<br/><strong>The Team</strong></p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb; padding:20px 40px; text-align:center; color:#9ca3af; font-size:12px; border-top:1px solid #e5e7eb;">
              This is an automated email. Please do not reply.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export default function CampaignControls({ coords, fontSize, fontColor, textAlign, isRunning, onRunningChange, lastStatus }) {
  const [subject, setSubject] = useState('Your Certificate');
  const [htmlMode, setHtmlMode] = useState(false);
  const [plainBody, setPlainBody] = useState(DEFAULT_PLAIN);
  const [htmlBody, setHtmlBody] = useState(DEFAULT_HTML);
  const [showPreview, setShowPreview] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const body = htmlMode ? htmlBody : plainBody;

  const handleStart = async () => {
    setError('');
    setStarting(true);
    try {
      await startCampaign({
        x_percent: coords.x_percent,
        y_percent: coords.y_percent,
        font_size: fontSize,
        font_color: fontColor,
        text_align: textAlign,
        email_subject: subject,
        email_body: body,
        is_html: htmlMode,
        test_mode: testMode,
      });
      onRunningChange(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    try {
      await stopCampaign();
    } catch (err) {
      setError(err.message);
    }
  };

  const showDownload = lastStatus && ['completed', 'stopped', 'error'].includes(lastStatus);

  return (
    <div className="glass-card p-6 space-y-5">
      <h2 className="section-title">
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        Campaign Settings
      </h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="email-subject" className="label-text">Email Subject</label>
          <input
            id="email-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input-field"
            placeholder="Your Certificate"
            disabled={isRunning}
          />
        </div>

        {/* Email Body with HTML/Plain toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label-text mb-0">Email Body</label>
            <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-0.5">
              <button
                onClick={() => setHtmlMode(false)}
                disabled={isRunning}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                  !htmlMode
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                id="plain-text-tab"
              >
                Plain Text
              </button>
              <button
                onClick={() => setHtmlMode(true)}
                disabled={isRunning}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                  htmlMode
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                id="html-tab"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                HTML
              </button>
            </div>
          </div>

          {!htmlMode ? (
            <textarea
              id="email-body-plain"
              value={plainBody}
              onChange={(e) => setPlainBody(e.target.value)}
              rows={4}
              className="input-field resize-none"
              placeholder="Email body text..."
              disabled={isRunning}
            />
          ) : (
            <div className="space-y-3">
              <textarea
                id="email-body-html"
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                rows={8}
                className="input-field resize-y font-mono text-sm leading-relaxed"
                style={{ tabSize: 2 }}
                placeholder="<html>...</html>"
                disabled={isRunning}
                spellCheck={false}
              />
              {/* Preview toggle */}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1.5 transition-colors"
                id="toggle-html-preview"
              >
                <svg className={`w-4 h-4 transition-transform duration-200 ${showPreview ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                {showPreview ? 'Hide Preview' : 'Show Live Preview'}
              </button>
              {showPreview && (
                <div className="rounded-xl border border-gray-700/50 overflow-hidden">
                  <div className="bg-gray-800/40 px-4 py-2 text-xs text-gray-500 font-medium border-b border-gray-700/50 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Email Preview
                  </div>
                  <div className="bg-white rounded-b-xl">
                    <iframe
                      srcDoc={htmlBody}
                      title="HTML Email Preview"
                      className="w-full border-0 rounded-b-xl"
                      style={{ minHeight: '300px', maxHeight: '500px' }}
                      sandbox="allow-same-origin"
                      id="html-preview-frame"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Mode Toggle */}
        <div className="flex items-center justify-between bg-gray-800/40 rounded-xl p-4">
          <div>
            <p className="font-medium text-white">Test Mode</p>
            <p className="text-sm text-gray-500">
              Only sends to your admin email address
            </p>
          </div>
          <button
            onClick={() => setTestMode(!testMode)}
            disabled={isRunning}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              testMode ? 'bg-amber-500' : 'bg-gray-700'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            id="test-mode-toggle"
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
              testMode ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'
            }`} />
          </button>
        </div>
        {testMode && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>All certificates will be sent to your admin email only – recipients will NOT receive emails.</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm">{error}</div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={starting}
            className="btn-primary flex items-center gap-2"
            id="start-campaign-btn"
          >
            {starting ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {testMode ? 'Start Test Send' : 'Start Campaign'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="btn-danger flex items-center gap-2"
            id="stop-campaign-btn"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop Campaign
          </button>
        )}

        {showDownload && (
          <a
            href={getFailedCSVUrl()}
            download="Failed_Sends.csv"
            className="btn-secondary flex items-center gap-2 text-sm"
            id="download-failed-csv-btn"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Failed CSV
          </a>
        )}
      </div>
    </div>
  );
}
