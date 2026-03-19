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

## Quick Start (Local)

```bash
# Backend
cd backend
copy .env.example .env   # Edit with your ZeptoMail token
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → **Blueprint**
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml` and create the service
5. Fill in the environment variables when prompted:
   - `ZEPTOMAIL_TOKEN` — your ZeptoMail API token
   - `SENDER_EMAIL` — your verified domain email
   - `ADMIN_EMAIL` — your personal email for test mode

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ZEPTOMAIL_TOKEN` | ZeptoMail Send Mail Token | ✅ |
| `SENDER_EMAIL` | From address (your domain) | ✅ |
| `SENDER_NAME` | Display name | Optional |
| `ADMIN_EMAIL` | Test mode recipient | ✅ |
| `BATCH_SIZE` | Emails per batch (default: 50) | Optional |
| `BATCH_DELAY_SECONDS` | Delay between batches (default: 1.0) | Optional |
