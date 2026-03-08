
Instructions for OpenClaw agents

When running inside this repository:

1. Check if docker-compose.yml exists.
2. If database not reachable:
   run: docker compose up -d

3. Verify connection using:
   DATABASE_URL

4. If Prisma schema exists:
   run migrations:
   npx prisma migrate dev

5. If Next.js project detected:
   start dev server:
   npm run dev

If any command fails:
- retry max 2 times
- if docker not installed, notify user
