-- WAITLIST - Database Schema (Postgres) - v1
-- Notes: keep it simple. Add indexes for queue reads and expirations.

CREATE TABLE restaurants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  timezone         TEXT NOT NULL DEFAULT 'Europe/Bucharest',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE restaurant_users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  password_hash    TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'staff', -- 'admin' | 'staff'
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, email)
);

CREATE TABLE waitlist_entries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id         UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  public_token          TEXT NOT NULL UNIQUE, -- for guest status page
  party_size            INT  NOT NULL CHECK (party_size > 0),

  phone_e164            TEXT NOT NULL,
  guest_name            TEXT NULL,

  status                TEXT NOT NULL, -- WAITING/CALLED/CONFIRMED/SEATED/SKIPPED/EXPIRED/CANCELED

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  called_at             TIMESTAMPTZ NULL,
  confirmed_at          TIMESTAMPTZ NULL,
  seated_at             TIMESTAMPTZ NULL,
  skipped_at            TIMESTAMPTZ NULL,
  expired_at            TIMESTAMPTZ NULL,
  canceled_at           TIMESTAMPTZ NULL,

  confirm_deadline_at   TIMESTAMPTZ NULL,
  arrival_deadline_at   TIMESTAMPTZ NULL
);

CREATE INDEX idx_waitlist_queue
  ON waitlist_entries (restaurant_id, status, created_at);

CREATE INDEX idx_waitlist_expire_called
  ON waitlist_entries (status, confirm_deadline_at)
  WHERE status = 'CALLED';

CREATE INDEX idx_waitlist_expire_confirmed
  ON waitlist_entries (status, arrival_deadline_at)
  WHERE status = 'CONFIRMED';

CREATE TABLE notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  entry_id         UUID NOT NULL REFERENCES waitlist_entries(id) ON DELETE CASCADE,

  channel          TEXT NOT NULL, -- WHATSAPP / SMS (later)
  template         TEXT NOT NULL, -- TABLE_READY / CONFIRMED / EXPIRED
  to_phone_e164    TEXT NOT NULL,

  provider_message_id TEXT NULL,
  status           TEXT NOT NULL DEFAULT 'CREATED', -- CREATED/SENT/DELIVERED/FAILED
  error_code       TEXT NULL,
  error_message    TEXT NULL,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at          TIMESTAMPTZ NULL,
  delivered_at     TIMESTAMPTZ NULL
);

CREATE INDEX idx_notifications_entry
  ON notifications (entry_id, created_at DESC);

CREATE TABLE message_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id       UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  entry_id            UUID NULL REFERENCES waitlist_entries(id) ON DELETE SET NULL,

  channel             TEXT NOT NULL, -- WHATSAPP / SMS
  direction           TEXT NOT NULL, -- INBOUND / OUTBOUND
  provider_message_id TEXT NULL,

  from_phone_e164     TEXT NULL,
  to_phone_e164       TEXT NULL,

  body_text           TEXT NULL,
  raw_payload         JSONB NOT NULL,

  received_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_events_entry
  ON message_events (entry_id, received_at DESC);

