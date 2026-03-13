# Changelog

## [1.2.2] - 2026-03-13
### Added
- Orange highlight (border + background) for WAITING entries that have been waiting more than 30 minutes
- "🕐 Asteptare lunga" badge displayed on long-wait WAITING entries in dashboard

## [1.2.1] - 2026-03-13
### Added
- Note field ('Notă (opțional)') on public join form — saved to entry notes
- Settings: 'Folosește media calculată automat' checkbox for estimated table time
  - When enabled, customer wait estimates use the dynamically calculated avg turnover from SEATED entries
  - Manual input is disabled/grayed out when auto-calc is active

## [1.2.0] - 2026-03-13
### Changed
- Rebrand to LineHop (from WaitListApp)
- Landing page complete overhaul: new hero, benefits section, contact section

## [1.1.1] - 2026-03-13
### Fixed
- fix(ui): client page text improvements and timer fix
  - Change 1: "Ești primul în listă\nTe anunțăm când masa este gata" for position=1
  - Change 2: Join page estimated wait label → "Timp estimat"
  - Change 3: WAITING state now shows "Nu este nevoie să aștepți la intrare / Te anunțăm pe WhatsApp"
  - Change 4: Estimated wait timer hidden from WAITING status; countdown only for CALLED/CONFIRMED
  - Change 5: Party size display with 👥 emoji and full "persoane" word
  - Change 6: CALLED state shows "📱 WhatsApp trimis" indicator

## [1.1.0] - 2026-03-13
### Added
- **Undo actions**: Undo Seated, Undo Skipped, Re-call for recent entries (last 30 min visible in dashboard)
- **Fix**: Skip button now also works for WAITING entries (previously only CALLED/CONFIRMED)
- **New API routes**: POST undo-seated, undo-skipped, re-call (all authenticated)
- **Notes field**: Optional notes on manual add and walk-in entries (e.g. "high chair needed", "terrace preference")
- **Notes display**: Notes shown in dashboard entry cards (italic, gray)
- **Avg table turnover**: Dashboard "Avg turnover" stat (join → seated, walk-ins excluded)
- **Estimated table time**: Settings page — manual estimate field with dynamically calculated value shown alongside
- **Statistics page**: New tab in nav with metrics filterable by today/week/month/all-time
  - Guests joined, confirmed, no-shows, avg wait time
  - Groups called from list, added manually, walk-ins
  - Groups seated, total people seated

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
