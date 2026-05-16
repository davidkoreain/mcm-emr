-- ============================================================================
-- Pharmacy Phase 1 Migration
-- ----------------------------------------------------------------------------
-- This migration script is idempotent: it uses ADD COLUMN IF NOT EXISTS and
-- CREATE TABLE IF NOT EXISTS so it can be re-run safely.
--
-- Apply to: Supabase / PostgreSQL EMR project
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extend existing `drugs` table with rich pharmacy metadata
-- ----------------------------------------------------------------------------
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS brand_name TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS manufacturer TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS supplier_name TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS active_ingredient TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS route TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS indication TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS contraindications TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS side_effects TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS drug_interactions TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS storage_conditions TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS handling_precautions TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS controlled_substance BOOLEAN DEFAULT FALSE;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS prescription_required BOOLEAN DEFAULT TRUE;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 20;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER DEFAULT 100;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS batch_number TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS storage_location TEXT DEFAULT '';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

CREATE INDEX IF NOT EXISTS idx_drugs_category ON drugs(category);
CREATE INDEX IF NOT EXISTS idx_drugs_status ON drugs(status);
CREATE INDEX IF NOT EXISTS idx_drugs_expiry ON drugs(expiry_date);

-- ----------------------------------------------------------------------------
-- 2. drug_suppliers table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drug_suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  payment_terms TEXT DEFAULT '',
  lead_time_days INTEGER DEFAULT 7,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. Extend existing `prescriptions` table
-- ----------------------------------------------------------------------------
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS drug_id BIGINT REFERENCES drugs(id) ON DELETE SET NULL;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT '';
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS instructions TEXT DEFAULT '';
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS prescribed_by TEXT DEFAULT '';
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS dispensed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_prescriptions_drug ON prescriptions(drug_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_mrn);

-- ----------------------------------------------------------------------------
-- 4. medication_schedules table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medication_schedules (
  id BIGSERIAL PRIMARY KEY,
  prescription_id BIGINT REFERENCES prescriptions(id) ON DELETE CASCADE,
  patient_mrn TEXT NOT NULL,
  drug_id BIGINT REFERENCES drugs(id) ON DELETE SET NULL,
  drug_name TEXT DEFAULT '',
  dosage TEXT DEFAULT '',
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT DEFAULT '',
  taken BOOLEAN DEFAULT FALSE,
  taken_at TIMESTAMP WITH TIME ZONE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_med_schedules_patient ON medication_schedules(patient_mrn);
CREATE INDEX IF NOT EXISTS idx_med_schedules_rx ON medication_schedules(prescription_id);
CREATE INDEX IF NOT EXISTS idx_med_schedules_date ON medication_schedules(scheduled_date);

-- ----------------------------------------------------------------------------
-- 5. drug_orders table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drug_orders (
  id BIGSERIAL PRIMARY KEY,
  supplier_id BIGINT REFERENCES drug_suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT DEFAULT '',
  drug_id BIGINT REFERENCES drugs(id) ON DELETE SET NULL,
  drug_name TEXT DEFAULT '',
  quantity_ordered INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(14, 2) DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  ordered_by TEXT DEFAULT '',
  trigger_type TEXT DEFAULT 'Manual',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drug_orders_status ON drug_orders(status);
CREATE INDEX IF NOT EXISTS idx_drug_orders_supplier ON drug_orders(supplier_id);

-- ----------------------------------------------------------------------------
-- 6. Row Level Security (RLS) — permissive policies (Phase 1 demo)
-- ----------------------------------------------------------------------------
ALTER TABLE drug_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_drug_suppliers" ON drug_suppliers;
CREATE POLICY "allow_all_drug_suppliers" ON drug_suppliers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_medication_schedules" ON medication_schedules;
CREATE POLICY "allow_all_medication_schedules" ON medication_schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_drug_orders" ON drug_orders;
CREATE POLICY "allow_all_drug_orders" ON drug_orders FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 7. Seed Ethiopian pharmaceutical suppliers
-- ----------------------------------------------------------------------------
INSERT INTO drug_suppliers (name, contact_person, phone, email, address, payment_terms, lead_time_days, notes)
SELECT * FROM (VALUES
  ('Ethiopian Pharmaceuticals Supply Agency (EPSA)', 'Ato Bekele Wolde', '+251-11-275-9344', 'info@epsa.gov.et', 'Akaki Kality Sub-City, Addis Ababa', 'Net 30', 14, 'Government supplier; primary source for essential medicines.'),
  ('Addis Pharmaceuticals Factory', 'W/ro Tsehay Alemu', '+251-11-861-1111', 'sales@apf.com.et', 'Adwa, Tigray Region', 'Net 45', 21, 'Domestic manufacturer; injectables and tablets.'),
  ('Cadila Pharmaceuticals Ethiopia', 'Mr. Rajesh Patel', '+251-11-440-0044', 'orders@cadila-et.com', 'Gelan Town, Oromia', 'Net 30', 10, 'Joint venture; antibiotics and antimalarials.'),
  ('Julphar Pharmaceuticals PLC', 'Ato Dawit Mengistu', '+251-11-371-2233', 'ethiopia@julphar.net', 'Bole Lemi Industrial Park, Addis Ababa', 'Net 30', 12, 'Diabetes care, cardiology specialties.'),
  ('Sino-Ethiop Associate (Africa) PLC', 'Mr. Liu Wei', '+251-11-667-8899', 'contact@sinoethiop.com', 'Bishoftu, Oromia', 'Net 60', 28, 'Gelatin capsules and OTC products.')
) AS v(name, contact_person, phone, email, address, payment_terms, lead_time_days, notes)
WHERE NOT EXISTS (SELECT 1 FROM drug_suppliers WHERE drug_suppliers.name = v.name);
