# CHANGELOG

## [Unreleased]

### Added
- **Edit Entry**: Hostess can now edit guestName, partySize and phoneE164 inline from the dashboard for any active entry (WAITING, CALLED, CONFIRMED, NO_SHOW states). Click ✏️ Edit button to expand inline form, save with Salvează.
- **Settings Panel**: Admin can configure confirmation timer, arrival timer, buffer visibility, max call-again, max party size, max queue size, and custom WhatsApp messages via /app/[restaurantId]/settings.
- **QR Code Generator**: Dashboard now has a 📱 QR Code button that shows a modal with the restaurant join QR code. Supports one-click PNG download for printing.
- **WhatsApp Real (Twilio)**: Replaced mock WhatsApp with real Twilio API. Messages sent via WhatsApp Sandbox (+1 415 523 8886). Guests receive real WhatsApp notifications when called.
