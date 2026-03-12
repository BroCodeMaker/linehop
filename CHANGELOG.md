# Changelog

## [1.0.2] - 2026-03-13
### Fixed
- SECURITY: Added authentication to 9 unprotected API routes (status, call-next, reset-test, add-manual, walk-in, call, seat, skip, call-again)
- Fixed maxPartySize validation: join route now checks restaurant settings (not hardcoded max 20)
- Fixed maxQueueSize validation: join route now rejects when queue is full

### Security
- All admin API endpoints now require session cookie authentication
- /reset-test can no longer be called without auth (previously allowed anyone to clear queue)

## [1.0.0] - 2026-03-12
### Added
- v1.0.0 displayed in dashboard
- Configurable estimated wait time from Settings (minutes × position)
- "Vă rugăm să intrați" indicator instead of green dot
- "Închide lista" toggle button (without clearing queue)
- Fix: refresh highlight bug
- Landing page publică (română)
- Multi-restaurant support
- Dashboard navigation / Settings
- Settings saved in DB, max 50 in queue
- 21 integration tests (vitest) — 21/21 passed
- WhatsApp real via Twilio sandbox
- History page with pagination and date filter
- Fix avgWaitMinutes: walk-ins excluded from calculation
