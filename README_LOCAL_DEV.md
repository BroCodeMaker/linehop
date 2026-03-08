
WAITLIST LOCAL DEV STACK

Purpose:
Run the Waitlist project locally with minimal setup so OpenClaw agents can use a working environment.

What this stack provides:
- PostgreSQL database via Docker
- Optional pgAdmin UI
- Environment file template
- Helper scripts to start and stop the stack

Prerequisites:
- Docker Desktop installed
- Node.js >= 20
- npm or pnpm

Quick start:

1. Start the database
   docker compose up -d

2. Copy env file
   cp .env.local.example .env.local

3. Install dependencies in the repo root
   npm install

4. Generate Prisma client
   npx prisma generate

5. Run migrations
   npx prisma migrate dev

6. Start the app
   npm run dev

Database access:
Postgres:
  host: localhost
  port: 5432
  user: postgres
  password: postgres
  db: waitlist

pgAdmin:
  http://localhost:5050
  email: admin@local.dev
  password: admin

Agents should:
- detect docker-compose.yml
- start services if not running
- reuse DATABASE_URL from env
