# WaitList App - Deployment Reference Card

**Keep this handy during deployment!**

---

## 1️⃣ NEON DATABASE (2 minutes)

```
1. Open: https://console.neon.tech/signup
2. Sign in with GitHub (recommended)
3. Click "Create project"
4. Name: waitlist-app-prod
5. Copy the connection string:
   postgresql://username:password@host.neon.tech/dbname
6. Save it somewhere safe!
```

**Test Connection:**
```bash
psql "postgresql://your-connection-string"
\dt  # list tables (should be empty initially)
```

---

## 2️⃣ VERCEL DEPLOYMENT (3 minutes)

### Option A: Via Vercel Dashboard
```
1. Open: https://vercel.com/new
2. Select GitHub → BroCodeMaker/waitlist-app
3. Click "Import"
4. Go to "Environment Variables"
5. Add variables (see below)
6. Click "Deploy"
7. Wait ~5 min for green checkmark
```

### Option B: Via Vercel CLI
```bash
# Install CLI
npm install -g vercel

# Deploy
cd /Users/mariusaiagent/projects/WaitListApp
vercel --prod

# Follow prompts, set env vars when asked
```

---

## 3️⃣ ENVIRONMENT VARIABLES (Required)

Set these in Vercel dashboard (Settings → Environment Variables):

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host.neon.tech/dbname` | From Neon step 1 |
| `NEXTAUTH_SECRET` | `$(openssl rand -base64 32)` | Generate fresh random key |
| `NEXTAUTH_URL` | `https://myapp.vercel.app` | Your deployment URL |
| `WHATSAPP_PROVIDER` | `mock` | Start with mock for testing |
| `ADMIN_PASSWORD` | `SomeSecurePassword123!` | For `/app/login` |

---

## 4️⃣ GENERATE SECRETS

### NEXTAUTH_SECRET
```bash
# macOS / Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Max 256}))
```

Copy the output and paste into Vercel env vars.

---

## 5️⃣ VERIFY DEPLOYMENT

After Vercel shows green checkmark:

```bash
# Replace with your actual domain
DOMAIN="https://myapp.vercel.app"

# Test 1: Health check
curl $DOMAIN/api/health
# Expected: 200 OK

# Test 2: Try to join queue
curl -X POST $DOMAIN/api/public/restaurants/test/join \
  -H "Content-Type: application/json" \
  -d '{"partySize":2,"phone":"1234567890"}'
# Expected: { "success": true, "publicToken": "..." }

# Test 3: Check admin login page
curl $DOMAIN/app/login
# Expected: HTML with login form
```

---

## 6️⃣ ADMIN LOGIN

1. Navigate to: `https://myapp.vercel.app/app/login`
2. Username: `admin`
3. Password: (the one you set in ADMIN_PASSWORD env var)
4. Click "Sign In"
5. Should see admin dashboard with queue

---

## 7️⃣ DATABASE MIGRATIONS (if needed)

If data is missing after deploy:

```bash
# Locally run migrations
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Or in Vercel, connect SSH and run:
npm install
npx prisma migrate deploy
```

---

## 8️⃣ ENABLE REAL WHATSAPP (Optional)

Only do this if you want real SMS/WhatsApp messages:

1. **Get Twilio Account:**
   - Go to https://www.twilio.com/console
   - Create account and get API token

2. **Configure Twilio:**
   - Go to Programmable Messaging → WhatsApp
   - Set up WhatsApp sandbox
   - Copy "Phone Number ID"

3. **Set Vercel Env Vars:**
   - `WHATSAPP_PROVIDER` = `twilio`
   - `WHATSAPP_API_TOKEN` = your Twilio token
   - `WHATSAPP_PHONE_NUMBER_ID` = your phone ID

4. **Redeploy:**
   - Push any change to GitHub, OR
   - Trigger manual redeploy in Vercel dashboard

---

## 9️⃣ AUTOMATIC TIMEOUTS

The app automatically expires old entries every 5 minutes (configured in `vercel.json`).

**Manual trigger (for testing):**
```bash
curl https://myapp.vercel.app/api/internal/expire
# Response: { "expired": 0, "total": 5 }
```

---

## 🔟 MONITOR & DEBUG

### View Live Logs
```
Vercel Dashboard → Your Project → Deployments → [Latest] → Logs
```

### Check Database
```
Neon Console → SQL Editor → Run queries
Example: SELECT * FROM Entry LIMIT 10;
```

### Rollback if Broken
```
Vercel Dashboard → Deployments → [Previous Working Version] → Redeploy
```

---

## ⚡ QUICK FIXES

### "Database Connection Error"
- [ ] Check DATABASE_URL in Vercel env vars
- [ ] Verify connection string is correct
- [ ] Test locally: `psql "your-connection-string"`

### "Authentication Failed"
- [ ] Check NEXTAUTH_SECRET is set (non-empty)
- [ ] Check NEXTAUTH_URL matches your domain
- [ ] Clear browser cookies and try again

### "WhatsApp Not Working"
- [ ] Check WHATSAPP_PROVIDER is "mock" or "twilio"
- [ ] If twilio: verify API token is valid
- [ ] Check Vercel logs for errors

### "502 Bad Gateway"
- [ ] Check Vercel deployment logs
- [ ] Verify all env vars are set
- [ ] Check database is accessible
- [ ] Try rebuilding: Redeploy in Vercel

---

## 📊 WHAT'S INCLUDED

✅ Restaurant queue system  
✅ 7-state status machine  
✅ Auto-expiry (120s + 300s timeouts)  
✅ Admin dashboard  
✅ Guest status page  
✅ WhatsApp integration (mock + real)  
✅ REST API + webhooks  
✅ PostgreSQL database  
✅ Fully scalable (Vercel + Neon)  

---

## 🎯 NEXT STEPS

1. **Today:** Deploy using this guide
2. **Tomorrow:** Test with real users
3. **This Week:** Monitor performance, collect feedback
4. **Next Phase:** Add Phase 4 features (reservations, analytics, etc)

---

## 📞 NEED HELP?

| Issue | See File |
|-------|----------|
| Full setup | `DEPLOYMENT.md` |
| 5-min deploy | `DEPLOY_QUICK.md` |
| Architecture | `PRODUCTION_READY.md` |
| Phase 3 details | `outputs/phase3_*.md` |
| System design | `SYSTEM_ARCHITECTURE.md` |

---

**Good luck! You've got this! 🚀**
