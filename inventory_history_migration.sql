-- ============================================================================
-- Inventory History Migration
-- Creates the inventory_history table to track every drug dispensing event.
-- Idempotent: safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_history (
  id BIGSERIAL PRIMARY KEY,
  dispensed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  drug_id BIGINT REFERENCES drugs(id) ON DELETE SET NULL,
  drug_name TEXT NOT NULL DEFAULT '',
  prescription_id BIGINT REFERENCES prescriptions(id) ON DELETE SET NULL,
  patient_mrn TEXT NOT NULL DEFAULT '',
  patient_name TEXT NOT NULL DEFAULT '',
  prescribed_by TEXT NOT NULL DEFAULT '',
  quantity_dispensed INTEGER NOT NULL DEFAULT 1,
  stock_before INTEGER NOT NULL DEFAULT 0,
  stock_after INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_history_date ON inventory_history(dispensed_date);
CREATE INDEX IF NOT EXISTS idx_inv_history_drug ON inventory_history(drug_id);
CREATE INDEX IF NOT EXISTS idx_inv_history_patient ON inventory_history(patient_mrn);
CREATE INDEX IF NOT EXISTS idx_inv_history_prescription ON inventory_history(prescription_id);

ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_inventory_history" ON inventory_history;
CREATE POLICY "allow_all_inventory_history" ON inventory_history FOR ALL USING (true) WITH CHECK (true);
