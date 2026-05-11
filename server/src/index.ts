import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import patientRoutes from './routes/patients';
import encounterRoutes from './routes/encounters';
import pharmacyRoutes from './routes/pharmacy';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/patients', patientRoutes);
app.use('/api/encounters', encounterRoutes);
app.use('/api/pharmacy', pharmacyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Ethiopia EMR API is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
