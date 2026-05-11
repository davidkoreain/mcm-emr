import { Router } from 'express';
import { query } from '../db';

const router = Router();

// Create new encounter
router.post('/', async (req, res) => {
  const { patient_id, provider_id, encounter_type, chief_complaint } = req.body;
  try {
    const result = await query(
      `INSERT INTO encounters (patient_id, provider_id, encounter_type, chief_complaint) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [patient_id, provider_id, encounter_type, chief_complaint]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record vitals
router.post('/:encounterId/vitals', async (req, res) => {
  const { encounterId } = req.params;
  const { temperature, heart_rate, respiratory_rate, blood_pressure_systolic, blood_pressure_diastolic, weight_kg, height_cm, spo2 } = req.body;
  
  try {
    const result = await query(
      `INSERT INTO vitals 
       (encounter_id, temperature, heart_rate, respiratory_rate, blood_pressure_systolic, blood_pressure_diastolic, weight_kg, height_cm, spo2) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [encounterId, temperature, heart_rate, respiratory_rate, blood_pressure_systolic, blood_pressure_diastolic, weight_kg, height_cm, spo2]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
