-- ─────────────────────────────────────────────────────────────────
-- Appointment Approval Workflow Migration
-- Run this once in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────
-- Adds Manager-approval workflow columns to appointments table.
-- New status flow:
--   Applied → Confirmed → ChangeApplied → ChangeConfirmed
--   (existing 'Scheduled' rows remain valid and are shown as Confirmed)

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS requested_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_end_time   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_doctor_id  INTEGER,
  ADD COLUMN IF NOT EXISTS change_reason        TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_by         TEXT;

-- The status column was previously constrained to ('Scheduled','Cancelled','Completed').
-- Drop any old CHECK constraint and accept the new value set.
DO $$
DECLARE
  cons_name TEXT;
BEGIN
  SELECT conname INTO cons_name
  FROM pg_constraint
  WHERE conrelid = 'appointments'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';
  IF cons_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE appointments DROP CONSTRAINT %I', cons_name);
  END IF;
END $$;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('Applied','Confirmed','ChangeApplied','ChangeConfirmed','Cancelled','Completed','Scheduled'));

-- Index to speed up the Manager dashboard "pending applications" query.
CREATE INDEX IF NOT EXISTS idx_appointments_status_start
  ON appointments (status, start_time);
