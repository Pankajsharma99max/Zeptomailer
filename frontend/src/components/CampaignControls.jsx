import { useState, useEffect } from 'react';
import { submitCampaign, stopCampaign, getFailedCSVUrl, sendQuickTest, pauseCampaign, resumeCampaign } from '../lib/api';

const DEFAULT_PLAIN = 'Dear {{name}},\n\nPlease find your certificate of participation attached.\n\nBest regards,\nThe Team';

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1, #a855f7); padding:40px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:800; letter-spacing:-0.025em;">🎓 Your Certificate</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px; color:#1e293b; font-size:16px; line-height:1.8;">
              <p style="margin:0 0 24px; font-size:18px; font-weight:600;">Dear {{name}},</p>
              <p style="margin:0 0 20px;">Congratulations! Your hard work has paid off. Please find your <strong>official certificate of participation</strong> attached to this email.</p>
              <p style="margin:0 0 20px;">It was a pleasure having you with us, and we look forward to your future achievements.</p>
              <p style="margin:32px 0 0; color:#64748b; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                Best regards,<br/>
                <strong style="color: #4f46e5;">The Team</strong>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:24px 40px; text-align:center; color:#94a3b8; font-size:13px; border-top:1px solid #f1f5f9;">
              This is an automated delivery. Please do not reply directly to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export default function CampaignControls({ coords, fontSize, fontColor, textAlign, isBold, fontFamily, textEffect, placeholderPages, isRunning, onRunningChange, lastStatus, lastSentCount, userRole }) {
  const [subject, setSubject] = useState('Your Certificate');
  const [htmlMode, setHtmlMode] = useState(false);
  const [emailOnly, setEmailOnly] = useState(false);
  const [plainBody, setPlainBody] = useState(DEFAULT_PLAIN);
  const [htmlBody, setHtmlBody] = useState(DEFAULT_HTML);
  const [showPreview, setShowPreview] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [testingSingle, setTestingSingle] = useState(false);

  useEffect(() => {
    if (lastSentCount !== undefined && lastSentCount > 0) {
      setStartIndex(lastSentCount);
    }
  }, [lastSentCount]);

  const body = htmlMode ? htmlBody : plainBody;

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      // If no placeholder_pages configured, default all pages to true (name on every page)
      const pages = placeholderPages && placeholderPages.length > 0
        ? placeholderPages
        : [true];
      const res = await submitCampaign({
        x_percent: coords.x_percent,
        y_percent: coords.y_percent,
        font_size: fontSize,
        font_color: fontColor,
        text_align: textAlign,
        is_bold: isBold,
        font_family: fontFamily,
        text_effect: textEffect,
        email_subject: subject,
        email_body: body,
        is_html: htmlMode,
        test_mode: testMode,
        start_index: parseInt(startIndex) || 0,
        email_only: emailOnly,
        placeholder_pages: pages,
      });
      alert(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickTest = async () => {
    setError('');
    setTestingSingle(true);
    try {
      // If no placeholder_pages configured, default all pages to true (name on every page)
      const pages = placeholderPages && placeholderPages.length > 0
        ? placeholderPages
        : [true];
      const res = await sendQuickTest({
        x_percent: coords.x_percent,
        y_percent: coords.y_percent,
        font_size: fontSize,
        font_color: fontColor,
        text_align: textAlign,
        is_bold: isBold,
        font_family: fontFamily,
        text_effect: textEffect,
        email_subject: subject,
        email_body: body,
        is_html: htmlMode,
        test_mode: true,
        start_index: 0,
        email_only: emailOnly,
        placeholder_pages: pages,
      });
      setError(`✅ ${res.message}`);
      setTimeout(() => setError(''), 5000);
    } catch (err) {
      setError(`❌ Quick test failed: ${err.message}`);
    } finally {
      setTestingSingle(false);
    }
  };

  const handleStop = async () => {
    try {
      await stopCampaign();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePause = async () => {
    try {
      await pauseCampaign();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResume = async () => {
    try {
      await resumeCampaign();
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

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label-text mb-0">Email Body</label>
            <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-0.5">
              <button
                onClick={() => setHtmlMode(false)}
                disabled={isRunning}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                  !htmlMode ? 'bg-brand-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Plain Text
              </button>
              <button
                onClick={() => setHtmlMode(true)}
                disabled={isRunning}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                  htmlMode ? 'bg-brand-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                HTML
              </button>
            </div>
          </div>

          {!htmlMode ? (
            <textarea
              value={plainBody}
              onChange={(e) => setPlainBody(e.target.value)}
              rows={4}
              className="input-field resize-none"
              disabled={isRunning}
            />
          ) : (
            <div className="space-y-3">
              <textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                rows={8}
                className="input-field font-mono text-sm"
                disabled={isRunning}
              />
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-brand-400 font-medium flex items-center gap-1.5"
              >
                {showPreview ? 'Hide Preview' : 'Show Live Preview'}
              </button>
              {showPreview && (
                <div className="rounded-xl border border-gray-700/50 overflow-hidden bg-white">
                  <iframe srcDoc={htmlBody} className="w-full border-0 min-h-[300px]" sandbox="allow-same-origin allow-scripts" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-gray-800/40 rounded-xl p-4">
          <div>
            <p className="font-medium text-white">Start From Row</p>
            <p className="text-sm text-gray-500">0 = beginning</p>
          </div>
          <input
            type="number"
            min="0"
            value={startIndex}
            onChange={(e) => setStartIndex(e.target.value)}
            disabled={isRunning}
            className="w-24 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm"
          />
        </div>

        <div className="flex items-center justify-between bg-gray-800/40 rounded-xl p-4">
          <div>
            <p className="font-medium text-white">Newsletter Mode</p>
            <p className="text-sm text-gray-500">No PDF attachment</p>
          </div>
          <button
            onClick={() => setEmailOnly(!emailOnly)}
            disabled={isRunning}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${emailOnly ? 'bg-brand-500' : 'bg-gray-700'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${emailOnly ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between bg-gray-800/40 rounded-xl p-4">
          <div>
            <p className="font-medium text-white">Test Mode</p>
            <p className="text-sm text-gray-500">Sends to your email only</p>
          </div>
          <button
            onClick={() => setTestMode(!testMode)}
            disabled={isRunning}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${testMode ? 'bg-amber-500' : 'bg-gray-700'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${testMode ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {error && <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm">{error}</div>}

      <div className="flex flex-wrap items-center gap-3">
        {!isRunning ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2"
          >
            {submitting ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {userRole === 'worker' ? 'Submit for Admin Approval' : (testMode ? 'Start Test Send' : 'Start Campaign')}
          </button>
        ) : (
          <div className="flex gap-2">
            {lastStatus === 'paused' ? (
              <button onClick={handleResume} className="btn-secondary text-amber-400 border-amber-500/30 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resume Campaign
              </button>
            ) : (
              <button onClick={handlePause} className="btn-secondary text-amber-400 border-amber-500/30 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pause Campaign
              </button>
            )}
            <button onClick={handleStop} className="btn-danger flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Campaign
            </button>
          </div>
        )}

        {!isRunning && (
          <button
            onClick={handleQuickTest}
            disabled={testingSingle || submitting}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Quick Test
          </button>
        )}

        {showDownload && (
          <a href={getFailedCSVUrl()} download="Failed_Sends.csv" className="btn-secondary flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download Failed CSV
          </a>
        )}
      </div>
    </div>
  );
}
