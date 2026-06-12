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
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding:40px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Your Certificate</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px; color:#1e293b; font-size:16px; line-height:1.8;">
              <p style="margin:0 0 20px;">Dear <strong>{{name}}</strong>,</p>
              <p style="margin:0 0 20px;">Congratulations! Please find your official certificate of participation attached to this email.</p>
              <p style="margin:0 0 20px;">It was a pleasure having you with us, and we look forward to your future achievements.</p>
              <p style="margin:32px 0 0; color:#64748b; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                Best regards,<br/>
                <strong style="color: #4f46e5;">The Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc; padding:20px 40px; text-align:center; color:#94a3b8; font-size:13px; border-top:1px solid #f1f5f9;">
              This is an automated delivery. Please do not reply directly.
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
  const [success, setSuccess] = useState('');
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
    setSuccess('');
    setSubmitting(true);
    try {
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
      setSuccess(res.message);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickTest = async () => {
    setError('');
    setSuccess('');
    setTestingSingle(true);
    try {
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
      setSuccess(res.message);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(`Quick test failed: ${err.message}`);
    } finally {
      setTestingSingle(false);
    }
  };

  const handleStop = async () => {
    try { await stopCampaign(); } catch (err) { setError(err.message); }
  };

  const handlePause = async () => {
    try { await pauseCampaign(); } catch (err) { setError(err.message); }
  };

  const handleResume = async () => {
    try { await resumeCampaign(); } catch (err) { setError(err.message); }
  };

  const showDownload = lastStatus && ['completed', 'stopped', 'error'].includes(lastStatus);

  return (
    <div className="glass-card p-5 space-y-4">
      <h2 className="section-title">Campaign</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="email-subject" className="label-text">Subject</label>
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="label-text mb-0">Body</label>
            <div className="flex items-center gap-0.5 bg-surface-elevated rounded-lg p-0.5">
              <button
                onClick={() => setHtmlMode(false)}
                disabled={isRunning}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  !htmlMode ? 'bg-surface-card text-content-primary' : 'text-content-muted hover:text-content-secondary'
                }`}
              >
                Plain
              </button>
              <button
                onClick={() => setHtmlMode(true)}
                disabled={isRunning}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  htmlMode ? 'bg-surface-card text-content-primary' : 'text-content-muted hover:text-content-secondary'
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
              className="input-field resize-none text-sm"
              disabled={isRunning}
            />
          ) : (
            <div className="space-y-2">
              <textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                rows={6}
                className="input-field font-mono text-xs resize-none"
                disabled={isRunning}
              />
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                {showPreview ? 'Hide preview' : 'Show preview'}
              </button>
              {showPreview && (
                <div className="rounded-lg border border-line overflow-hidden bg-white">
                  <iframe srcDoc={htmlBody} className="w-full border-0 min-h-[200px]" sandbox="allow-same-origin allow-scripts" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-surface-hover rounded-lg p-3">
          <div>
            <p className="text-sm font-medium text-content-primary">Start from row</p>
            <p className="text-xs text-content-muted">0 = beginning</p>
          </div>
          <input
            type="number"
            min="0"
            value={startIndex}
            onChange={(e) => setStartIndex(e.target.value)}
            disabled={isRunning}
            className="w-20 bg-surface-input border border-line rounded-lg px-3 py-1.5 text-content-primary text-sm text-center"
          />
        </div>

        <Toggle
          label="Newsletter mode"
          description="Email only, no PDF"
          enabled={emailOnly}
          onChange={() => setEmailOnly(!emailOnly)}
          disabled={isRunning}
        />

        <Toggle
          label="Test mode"
          description="Sends to admin email only"
          enabled={testMode}
          onChange={() => setTestMode(!testMode)}
          disabled={isRunning}
          color="amber"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-sm">{error}</div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-emerald-600 dark:text-emerald-400 text-sm">{success}</div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!isRunning ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            )}
            {userRole === 'worker' ? 'Submit for approval' : (testMode ? 'Start test' : 'Start campaign')}
          </button>
        ) : (
          <div className="flex gap-2">
            {lastStatus === 'paused' ? (
              <button onClick={handleResume} className="btn-secondary flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
                Resume
              </button>
            ) : (
              <button onClick={handlePause} className="btn-secondary flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
                Pause
              </button>
            )}
            <button onClick={handleStop} className="btn-danger flex items-center gap-1.5">
              Stop
            </button>
          </div>
        )}

        {!isRunning && (
          <button
            onClick={handleQuickTest}
            disabled={testingSingle || submitting}
            className="btn-secondary flex items-center gap-1.5"
          >
            {testingSingle ? 'Sending...' : 'Quick test'}
          </button>
        )}

        {showDownload && (
          <a href={getFailedCSVUrl()} download="Failed_Sends.csv" className="btn-secondary text-sm flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Failed CSV
          </a>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, description, enabled, onChange, disabled, color = 'brand' }) {
  const bgColor = enabled
    ? (color === 'amber' ? 'bg-amber-500' : 'bg-brand-600')
    : 'bg-surface-elevated';

  return (
    <div className="flex items-center justify-between bg-surface-hover rounded-lg p-3">
      <div>
        <p className="text-sm font-medium text-content-primary">{label}</p>
        <p className="text-xs text-content-muted">{description}</p>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors ${bgColor}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
