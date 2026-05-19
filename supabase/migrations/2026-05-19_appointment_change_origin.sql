-- Track who initiated an appointment change request: 'Patient' or 'Doctor'.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS change_requested_by TEXT;
