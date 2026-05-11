import { Router } from 'express';
import { query } from '../db';

const router = Router();

// Get all patients
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM patients ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new patient
router.post('/', async (req, res) => {
  const { 
    mrn, first_name, last_name, amharic_name, 
    date_of_birth, gender, phone_number, 
    address_city, address_woreda, address_kebele 
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO patients 
      (mrn, first_name, last_name, amharic_name, date_of_birth, gender, phone_number, address_city, address_woreda, address_kebele) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [mrn, first_name, last_name, amharic_name, date_of_birth, gender, phone_number, address_city, address_woreda, address_kebele]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
