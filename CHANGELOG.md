# CHANGELOG

## [Unreleased]

### Added
- **Public Landing Page**: New homepage (`/`) with Romanian hero section "Scapă de cozi. Intri când ți-e rândul.", 3-step explainer (Scanezi QR → Primești notificare → Vii când ești chemat), and CTA to `/app/login`.
- **Multi-restaurant Support**: `/app` index page lists all restaurants for the logged-in admin, with cards showing name, slug, and status. Admins can create new restaurants with name, slug (auto-generated from name, URL-safe), and optional address.
- **Restaurants API**: `GET /api/restaurants` returns restaurants for authenticated user; `POST /api/restaurants` creates a new restaurant with default settings.
- **Admin Navigation**: Shared `AdminNav` component added to dashboard and settings pages with tabs for Dashboard / Setări, plus back button to restaurant list.
- **Settings Improvements**: `maxQueueSize` capped at 50 (validated on frontend and API). Settings page uses `AdminNav` component. Fixed auth cookie check from `auth_token` → `session`.
- **Integration Tests**: 21 tests covering all key scenarios — guest joins, admin calls next, guest confirms, timers expire to NO_SHOW, max queue enforced, settings save/load, restaurant creation. Uses WHATSAPP_PROVIDER=mock. Test runner: vitest.

### Added
- **Edit Entry**: Hostess can now edit guestName, partySize and phoneE164 inline from the dashboard for any active entry (WAITING, CALLED, CONFIRMED, NO_SHOW states). Click ✏️ Edit button to expand inline form, save with Salvează.
- **Settings Panel**: Admin can configure confirmation timer, arrival timer, buffer visibility, max call-again, max party size, max queue size, and custom WhatsApp messages via /app/[restaurantId]/settings.
- **QR Code Generator**: Dashboard now has a 📱 QR Code button that shows a modal with the restaurant join QR code. Supports one-click PNG download for printing.
- **WhatsApp Real (Twilio)**: Replaced mock WhatsApp with real Twilio API. Messages sent via WhatsApp Sandbox (+1 415 523 8886). Guests receive real WhatsApp notifications when called.
