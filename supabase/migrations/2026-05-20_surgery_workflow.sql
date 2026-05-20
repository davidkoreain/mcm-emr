-- ─────────────────────────────────────────────────────────────────
-- Surgery Workflow Extension
-- Run this once in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────
-- Extends the existing surgeries table with clinical metadata and
-- adds child tables for team composition, supply/equipment requests,
-- pre/intra/post checklists, post-op outcome, and bed movement trace.

-- 1) Extend the existing surgeries table with planning + outcome columns.
ALTER TABLE surgeries
  ADD COLUMN IF NOT EXISTS priority         TEXT,
  ADD COLUMN IF NOT EXISTS operation_site   TEXT,
  ADD COLUMN IF NOT EXISTS technique        TEXT,
  ADD COLUMN IF NOT EXISTS description      TEXT,
  ADD COLUMN IF NOT EXISTS appointment_id   BIGINT,
  ADD COLUMN IF NOT EXISTS outcome_summary  TEXT,
  ADD COLUMN IF NOT EXISTS outcome_findings TEXT,
  ADD COLUMN IF NOT EXISTS post_op_plan     TEXT,
  ADD COLUMN IF NOT EXISTS complications    TEXT,
  ADD COLUMN IF NOT EXISTS outcome_recorded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outcome_recorded_by TEXT;

CREATE INDEX IF NOT EXISTS idx_surgeries_status_start
  ON surgeries (status, start_time);

-- 2) Surgical team members assigned to a surgery.
CREATE TABLE IF NOT EXISTS surgery_team (
  id           BIGSERIAL PRIMARY KEY,
  surgery_id   BIGINT  NOT NULL REFERENCES surgeries(id) ON DELETE CASCADE,
  staff_id     INTEGER NOT NULL,
  staff_name   TEXT    NOT NULL,
  role         TEXT    NOT NULL,   -- Main Surgeon / Assistant Surgeon / Anesthesiologist / Scrub Nurse / Circulating Nurse / Other
  department   TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surgery_team_surgery ON surgery_team (surgery_id);
CREATE INDEX IF NOT EXISTS idx_surgery_team_staff   ON surgery_team (staff_id);

-- 3) Supplies & drugs requested for a surgery (from Pharmacy / Inventory).
CREATE TABLE IF NOT EXISTS surgery_supplies (
  id           BIGSERIAL PRIMARY KEY,
  surgery_id   BIGINT  NOT NULL REFERENCES surgeries(id) ON DELETE CASCADE,
  item_name    TEXT    NOT NULL,
  category     TEXT    NOT NULL DEFAULT 'Supply',  -- Drug / Supply / Consumable
  source       TEXT,                                -- Pharmacy DB / Inventory DB
  drug_id      INTEGER,
  quantity     NUMERIC NOT NULL DEFAULT 1,
  unit         TEXT,
  status       TEXT    NOT NULL DEFAULT 'Requested', -- Requested / Prepared / Issued / Returned / Cancelled
  requested_by TEXT,
  prepared_by  TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surgery_supplies_surgery ON surgery_supplies (surgery_id);
CREATE INDEX IF NOT EXISTS idx_surgery_supplies_status  ON surgery_supplies (status);

-- 4) Equipment / assets allocated to a surgery.
CREATE TABLE IF NOT EXISTS surgery_equipment (
  id           BIGSERIAL PRIMARY KEY,
  surgery_id   BIGINT NOT NULL REFERENCES surgeries(id) ON DELETE CASCADE,
  asset_id     TEXT   NOT NULL,
  asset_name   TEXT   NOT NULL,
  status       TEXT   NOT NULL DEFAULT 'Requested', -- Requested / Allocated / In Use / Returned
  requested_by TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surgery_equipment_surgery ON surgery_equipment (surgery_id);

-- 5) Pre/Intra/Post-op checklist items.
CREATE TABLE IF NOT EXISTS surgery_checklist (
  id           BIGSERIAL PRIMARY KEY,
  surgery_id   BIGINT NOT NULL REFERENCES surgeries(id) ON DELETE CASCADE,
  phase        TEXT   NOT NULL,    -- PreOp / IntraOp / PostOp
  label        TEXT   NOT NULL,
  is_done      BOOLEAN NOT NULL DEFAULT FALSE,
  done_by      TEXT,
  done_at      TIMESTAMPTZ,
  notes        TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surgery_checklist_surgery_phase
  ON surgery_checklist (surgery_id, phase, sort_order);

-- 6) Bed movement trace tied to a surgery (Pre-op → OT → Post-op).
CREATE TABLE IF NOT EXISTS surgery_bed_trace (
  id           BIGSERIAL PRIMARY KEY,
  surgery_id   BIGINT NOT NULL REFERENCES surgeries(id) ON DELETE CASCADE,
  patient_mrn  TEXT   NOT NULL,
  stage        TEXT   NOT NULL,    -- PreOp / OT / PostOp
  location     TEXT   NOT NULL,    -- e.g. "Ward-B / Bed 4" or "OT 1" or "PACU / Bed 2"
  entered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exited_at    TIMESTAMPTZ,
  recorded_by  TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surgery_bed_trace_surgery
  ON surgery_bed_trace (surgery_id, entered_at);
CREATE INDEX IF NOT EXISTS idx_surgery_bed_trace_patient
  ON surgery_bed_trace (patient_mrn, entered_at);

-- 7) Permissive RLS to stay consistent with existing tables.
ALTER TABLE surgery_team        ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgery_supplies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgery_equipment   ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgery_checklist   ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgery_bed_trace   ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'surgery_team','surgery_supplies','surgery_equipment',
    'surgery_checklist','surgery_bed_trace'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public read %1$s"  ON %1$I',  t);
    EXECUTE format('DROP POLICY IF EXISTS "public write %1$s" ON %1$I',  t);
    EXECUTE format('CREATE POLICY "public read %1$s"  ON %1$I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "public write %1$s" ON %1$I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
