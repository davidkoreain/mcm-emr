import { Router } from 'express';
import { query } from '../db';

const router = Router();

// Get drug inventory
router.get('/inventory', async (req, res) => {
  try {
    const result = await query('SELECT * FROM drugs ORDER BY generic_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update drug stock
router.patch('/inventory/:id', async (req, res) => {
  const { id } = req.params;
  const { stock_quantity } = req.body;
  try {
    const result = await query(
      'UPDATE drugs SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [stock_quantity, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending prescriptions
router.get('/prescriptions', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, d.generic_name, d.form, d.strength, pat.first_name, pat.last_name, pat.amharic_name
      FROM prescriptions p
      JOIN drugs d ON p.drug_id = d.id
      JOIN encounters e ON p.encounter_id = e.id
      JOIN patients pat ON e.patient_id = pat.id
      WHERE p.status = 'Pending'
      ORDER BY p.prescribed_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dispense prescription
router.post('/prescriptions/:id/dispense', async (req, res) => {
  const { id } = req.params;
  try {
    // Start transaction or sequential queries
    const presResult = await query('SELECT drug_id FROM prescriptions WHERE id = $1', [id]);
    const drugId = presResult.rows[0].drug_id;
    
    await query('UPDATE drugs SET stock_quantity = stock_quantity - 1 WHERE id = $1', [drugId]);
    await query("UPDATE prescriptions SET status = 'Dispensed' WHERE id = $1", [id]);
    
    res.json({ message: 'Prescription dispensed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
