# DevOps Output — Phase 1
Date: 2026-03-08

## Runtime Validation

### Services
- PostgreSQL 16: ✅ running (brew services, localhost:5432)
- Next.js dev server: ✅ running on http://localhost:3000

### Database
- Migration applied: 20260308133332_init ✅
- Prisma Client generated ✅
- Seed data: Test Restaurant + admin user ✅

### Environment
- .env: ✅ present (DATABASE_URL, WHATSAPP_PROVIDER=mock)
- node: v25.6.1
- npm: 11.9.0
- next: 15.0.0

### Build
- Production build: ✅ success
- 14 routes compiled

## Start Commands
```bash
# Start postgres (if not running)
brew services start postgresql@16

# Start dev server
cd ~/projects/WaitListApp && npm run dev

# Run seed (idempotent)
npx ts-node --esm scripts/seed.ts

# Trigger expiry manually
curl http://localhost:3000/api/internal/expire
```

## Test URLs
- Join: http://localhost:3000/r/test
- Dashboard: http://localhost:3000/app/f3d8282f-7096-47ee-97e4-f81e252c7e9e/dashboard

## Phase 2 Prerequisites
- Real WhatsApp provider credentials (Meta Business API or Twilio)
- NGROK or public URL for webhook
- WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID env vars

DevOps: PASSED
