# LineHop

LineHop — QR-based restaurant waitlist management.
Clients join the waitlist by scanning a QR code and receive WhatsApp notifications when their table is ready.
Messaging in MVP: WhatsApp only.
Planned later: SMS fallback.

Recommended stack:
- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL

Main flows:
- Guest joins via QR
- Staff calls next
- Guest confirms via WhatsApp
- Entry expires if no confirmation or late arrival

This skeleton is intentionally minimal so OpenClaw + Claude Code can extend it safely.

## Versioning & Commit Convention

Format: `type(scope): description`

Types: feat | fix | chore | refactor | test | docs

Version bump rules:
- feat → MINOR bump (0.X.0)
- fix → PATCH bump (0.0.X)
- BREAKING CHANGE → MAJOR bump (X.0.0)

Always update:
1. src/lib/version.ts (APP_VERSION)
2. CHANGELOG.md (add entry)
3. package.json version field
