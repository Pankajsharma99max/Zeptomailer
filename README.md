# CertFlow — Certificate-as-a-Service

High-performance certificate generation and email delivery platform.
Upload templates, position names with WYSIWYG editor, preview, and send thousands of personalized certificates.

## Features
- 🎨 **WYSIWYG Template Editor** — drag name placeholder with alignment control
- 📧 **Smart Batching** — 50 emails/batch with 1s rate limiter
- ⚡ **Zero-Disk Processing** — all PDFs generated in-memory via Pillow + ReportLab
- 📊 **Real-Time Progress** — WebSocket + polling progress bar
- 🧪 **Test Mode** — send only to admin email
- 📥 **Error Handling** — download Failed_Sends.csv after campaign

## Quick Start (Local, Windows)

The repo ships with a ready production build (`backend/static`) and a Python venv (`backend/.venv`).

1. Edit `backend/.env` — set `ZEPTOMAIL_TOKEN`, `SENDER_EMAIL`, `ADMIN_EMAIL`, `APP_PASSWORD`.
2. Double-click **`start.bat`** — serves the app (UI + API) at http://localhost:8000.
3. Log in with username = `ADMIN_EMAIL`, password = `APP_PASSWORD`.

After changing frontend code, run **`rebuild-frontend.bat`** to refresh `backend/static`.
For hot-reload development, use **`start-dev.bat`** (backend :8000 + Vite :5173).

### Manual setup (first time on a new machine)

```bash
# Backend
cd backend
copy .env.example .env   # Edit with your ZeptoMail token
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt

# Frontend
cd frontend
npm install
npm run build            # or `npm run dev` for development
```

## Deploy to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → **Blueprint**
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml` and create the service
5. Fill in the environment variables when prompted:
   - `ZEPTOMAIL_TOKEN` — your ZeptoMail API token
   - `SENDER_EMAIL` — your verified domain email
   - `ADMIN_EMAIL` — your personal email for test mode
   - `APP_PASSWORD` — password to restrict access to the site

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ZEPTOMAIL_TOKEN` | ZeptoMail Send Mail Token | ✅ |
| `SENDER_EMAIL` | From address (your domain) | ✅ |
| `SENDER_NAME` | Display name | Optional |
| `ADMIN_EMAIL` | Test mode recipient | ✅ |
| `APP_PASSWORD` | Access password for the entire application | Optional but recommended |
| `BATCH_SIZE` | Emails per batch (default: 50) | Optional |
| `BATCH_DELAY_SECONDS` | Delay between batches (default: 1.0) | Optional |
