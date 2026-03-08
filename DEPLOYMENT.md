# WaitList App - Deployment Guide

## Overview
This guide covers deploying the WaitList app to production using:
- **Backend & Frontend:** Vercel
- **Database:** Neon PostgreSQL
- **Messaging:** Twilio WhatsApp API (optional, mock mode available)

## Phase 3 Status
✅ Phase 3 Complete:
- Full state machine (7 states)
- Timeout handlers (confirm + arrival windows)
- Seat/Skip/Cancel operations
- Real-time guest status page
- All tests passing

---

## Step 1: Set Up Neon PostgreSQL

### 1.1 Create Neon Project
1. Go to https://console.neon.tech
2. Sign up / Log in with GitHub (recommended)
3. Click "Create a project"
4. Name it: `waitlist-app-prod`
5. Select region closest to your users
6. Click "Create project"

### 1.2 Get Connection String
1. Click on the project
2. Go to "Connection details"
3. Copy the connection string (PostgreSQL format)
4. It should look like: `postgresql://username:password@host.neon.tech/dbname`

### 1.3 Create Database Schema
Option A: Automatic (via Prisma migrate)
```bash
DATABASE_URL="your-neon-connection-string" npx prisma migrate deploy
```

Option B: Manual
1. In Neon console, go to "SQL Editor"
2. Run the queries from `DATABASE_SCHEMA.sql`

---

## Step 2: Deploy to Vercel

### 2.1 Connect Repository
1. Go to https://vercel.com
2. Sign up / Log in
3. Click "Import Project"
4. Select GitHub → BroCodeMaker/waitlist-app
5. Click "Import"

### 2.2 Set Environment Variables
1. Go to project settings → Environment Variables
2. Add the following:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your Neon connection string | From step 1.2 |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` | Keep secret! |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Your deployment URL |
| `WHATSAPP_PROVIDER` | `mock` or `twilio` | Start with `mock` for testing |
| `WHATSAPP_API_TOKEN` | (if using Twilio) | Optional for Phase 3 |

### 2.3 Deploy
1. Click "Deploy"
2. Wait ~5 minutes for build to complete
3. Get your URL: `https://your-project-name.vercel.app`

### 2.4 Verify Deployment
```bash
# Test the API
curl https://your-domain.vercel.app/api/health

# Test guest join
curl -X POST https://your-domain.vercel.app/api/public/restaurants/test/join \
  -H "Content-Type: application/json" \
  -d '{"partySize":2,"phone":"1234567890"}'
```

---

## Step 3: Admin Authentication

For Phase 3, we use simple admin auth:

### 3.1 Admin Login
1. Navigate to `/app/login`
2. Enter username: `admin`
3. Password stored in environment (set `ADMIN_PASSWORD` env var)

### 3.2 Create Admin Account
Set in Vercel environment variables:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=generate-a-strong-password
```

---

## Step 4: WhatsApp Integration (Optional)

### 4.1 Using Twilio
1. Go to https://www.twilio.com
2. Sign up and create an account
3. Get your API token and WhatsApp sandbox number
4. Set Vercel env vars:
   - `WHATSAPP_PROVIDER` = `twilio`
   - `WHATSAPP_API_TOKEN` = your token
   - `WHATSAPP_PHONE_NUMBER_ID` = your WhatsApp number

### 4.2 Using Mock Mode (Testing)
```
WHATSAPP_PROVIDER=mock
```
This logs all messages to console (no real SMS/WhatsApp sent).

### 4.3 Webhook Configuration
When using real Twilio:
1. In Twilio console, go to WhatsApp integration
2. Set webhook URL to: `https://your-domain.vercel.app/api/webhooks/whatsapp`
3. Set verify token to match `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

---

## Step 5: Automatic Expiry Scheduler

Phase 3 includes entry timeout handling. To automatically expire old entries:

### 5.1 Using Vercel Crons
Configured in `vercel.json`:
```json
"crons": [
  {
    "path": "/api/internal/expire",
    "schedule": "*/5 * * * *"
  }
]
```
This calls the expiry endpoint every 5 minutes.

### 5.2 Alternative: External Cron Service
Use services like:
- **EasyCron:** https://www.easycron.com
- **Cron-job.org:** https://cron-job.org
- **AWS EventBridge**

Call this URL every 5 minutes:
```
POST https://your-domain.vercel.app/api/internal/expire
```

---

## Step 6: Monitoring & Debugging

### 6.1 View Logs
In Vercel dashboard:
1. Go to your project
2. Click "Deployments" → latest deployment
3. Click "Logs" for real-time logs

### 6.2 Database Admin
Neon provides a console:
1. Go to Neon console
2. Click "SQL Editor"
3. Query your database directly

### 6.3 Test Endpoints
```bash
# Health check
curl https://your-domain.vercel.app/api/health

# List restaurants
curl https://your-domain.vercel.app/api/restaurants

# Trigger expiry manually (for testing)
curl -X GET https://your-domain.vercel.app/api/internal/expire
```

---

## Troubleshooting

### Database Connection Failed
- ✅ Check `DATABASE_URL` in Vercel env vars
- ✅ Verify Neon connection string format
- ✅ Ensure IP whitelist (Neon allows all IPs by default)

### WhatsApp Messages Not Sending
- ✅ Check `WHATSAPP_PROVIDER` is set to `twilio`
- ✅ Verify `WHATSAPP_API_TOKEN` is correct
- ✅ Ensure webhook URL is configured in Twilio

### Authentication Not Working
- ✅ Check `NEXTAUTH_SECRET` is set (non-empty)
- ✅ Verify `NEXTAUTH_URL` matches your domain
- ✅ Clear browser cookies and try again

### 502 Bad Gateway on Vercel
- ✅ Check build logs for errors
- ✅ Verify all required env vars are set
- ✅ Ensure database connection works

---

## Rollback Plan

If something breaks:

1. **Vercel Rollback:**
   - Go to Deployments → Previous version
   - Click "Redeploy" next to working version

2. **Database Rollback:**
   - Neon keeps backup: Neon Console → Backups
   - Restore from latest backup

3. **Code Rollback:**
   - Push a fix to GitHub main branch
   - Vercel auto-deploys

---

## Next: Phase 4

After verifying Phase 3 in production:

- **Services Layer:** Modularize business logic
- **Reservations:** Multi-day reservation system
- **ETA Calculation:** Predict wait times
- **Advanced Analytics:** Track trends
- **Mobile App:** React Native client

---

## Support

Questions? Review:
- `/README_FIRST.md` - Quick start
- `/SYSTEM_ARCHITECTURE.md` - Architecture overview
- `/outputs/phase3_*.md` - Phase 3 implementation details
