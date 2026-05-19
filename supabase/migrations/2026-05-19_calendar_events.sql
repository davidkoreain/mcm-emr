-- ─────────────────────────────────────────────────────────────────
-- Calendar Events (Personal doctor schedule items)
-- Run this once in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────
-- Stores non-patient items on the doctor's Flow Board calendar:
-- consultations (진료), seminars (세미나), meetings (회의),
-- trainings (교육), events (행사), etc.

CREATE TABLE IF NOT EXISTS calendar_events (
  id          BIGSERIAL PRIMARY KEY,
  doctor_id   INTEGER NOT NULL,
  category    TEXT    NOT NULL,
  title       TEXT    NOT NULL,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  location    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_doctor_start
  ON calendar_events (doctor_id, start_time);

-- Permissive RLS (consistent with existing app_settings pattern).
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read calendar_events"  ON calendar_events;
DROP POLICY IF EXISTS "public write calendar_events" ON calendar_events;

CREATE POLICY "public read calendar_events"
  ON calendar_events FOR SELECT USING (true);

CREATE POLICY "public write calendar_events"
  ON calendar_events FOR ALL USING (true) WITH CHECK (true);
