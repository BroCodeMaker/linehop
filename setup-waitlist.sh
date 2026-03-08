#!/bin/bash
set -e

echo "== Waitlist setup =="
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed."
  echo "Install Docker Desktop first, then rerun ./setup-waitlist.sh"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed."
  echo "Install Node.js 20+ first, then rerun ./setup-waitlist.sh"
  exit 1
fi

if [ ! -f ".env.local" ] && [ -f ".env.local.example" ]; then
  cp .env.local.example .env.local
  echo "Created .env.local from template"
fi

if [ ! -f ".env.openclaw" ] && [ -f ".env.openclaw.example" ]; then
  cp .env.openclaw.example .env.openclaw
  echo "Created .env.openclaw from template"
  echo "Fill OPENCLAW_ACCOUNT_EMAIL / OPENCLAW_ACCOUNT_PASSWORD / OPENCLAW_NOTIFY_WHATSAPP_TO before using real external account automation."
fi

docker compose up -d

if [ -f "package.json" ]; then
  npm install
fi

if [ -f "prisma/schema.prisma" ]; then
  npx prisma generate || true
  npx prisma migrate dev --name init || true
fi

echo ""
echo "Setup complete."
echo "Next:"
echo "1. Fill .env.openclaw with your real local secrets"
echo "2. Start the app with: npm run dev"
echo "3. Open OpenClaw in this repo"
echo "4. Paste ONE_SHOT_OPENCLAW_PROMPT.txt"
