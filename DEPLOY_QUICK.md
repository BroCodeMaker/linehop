# Quick Deploy in 5 Minutes

**TL;DR** - Get this app live with minimal setup.

## Prerequisites
- GitHub account (already have it)
- Vercel account (free: https://vercel.com/signup)
- Neon account (free: https://console.neon.tech/signup)

---

## 1. Set Up Database (2 min)

```bash
# 1. Go to https://console.neon.tech
# 2. Create project → name it "waitlist-app"
# 3. Copy the connection string
# 4. Keep it handy for next step
```

---

## 2. Deploy to Vercel (2 min)

```bash
# 1. Go to https://vercel.com/new
# 2. Click "Import Git Repository"
# 3. Paste: https://github.com/BroCodeMaker/waitlist-app
# 4. Click "Import"
```

---

## 3. Set Environment Variables (1 min)

In Vercel (Project Settings → Environment Variables), add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string |
| `NEXTAUTH_SECRET` | `$(openssl rand -base64 32)` |
| `NEXTAUTH_URL` | Your Vercel URL (e.g., `https://my-waitlist.vercel.app`) |
| `WHATSAPP_PROVIDER` | `mock` |

---

## 4. Deploy (1 min)

- Click "Deploy" in Vercel
- Wait for green checkmark
- Click your domain link

---

## 5. Test It Works

```bash
# Replace with your domain
DOMAIN="https://your-vercel-domain.vercel.app"

# Test 1: Health check
curl $DOMAIN/api/health

# Test 2: Join queue
curl -X POST $DOMAIN/api/public/restaurants/test/join \
  -H "Content-Type: application/json" \
  -d '{"partySize":2,"phone":"1234567890"}'

# Test 3: Check status
# Copy publicToken from response above, then:
curl $DOMAIN/api/public/entry/{publicToken}
```

---

## What's Deployed?

✅ **Full Phase 3 MVP:**
- Restaurant queue system
- 7-state status machine
- Auto-timeout handling (120s confirm, 300s arrival)
- Guest status page
- Admin dashboard
- WhatsApp webhook ready (mock mode)

---

## Next Steps

### To Enable WhatsApp (Real Messages)
1. Sign up at https://www.twilio.com
2. Create WhatsApp sandbox
3. Add to Vercel env vars:
   - `WHATSAPP_PROVIDER` = `twilio`
   - `WHATSAPP_API_TOKEN` = your token
4. Redeploy

### To Add Admin Users
Currently uses simple auth. To change:
- Edit `src/app/app/login/page.tsx`
- Change from mock auth to database-backed auth
- Add user management in admin panel

### To Monitor
- Vercel: Deployments → Recent → Logs
- Neon: SQL Editor to query database
- GitHub: PRs/commits auto-deploy

---

## Done! 🚀

Your app is live. Share the URL with users to test!

For detailed docs, see `DEPLOYMENT.md`.
