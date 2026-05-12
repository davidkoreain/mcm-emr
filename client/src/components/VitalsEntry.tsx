import React, { useState } from 'react';
import { Activity, Thermometer, Weight, Ruler, Wind, Droplets, Save, X, CheckCircle } from 'lucide-react';
import { useEMR } from '../context/EMRContext';

interface VitalsEntryProps {
  onClose: () => void;
  patientName: string;
  mrn: string;
}

const VitalsEntry: React.FC<VitalsEntryProps> = ({ onClose, patientName, mrn }) => {
  const { addVitals } = useEMR();
  const [saved, setSaved] = useState(false);
  const [vitals, setVitals] = useState({
    temperature: '',
    heart_rate: '',
    respiratory_rate: '',
    bp_systolic: '',
    bp_diastolic: '',
    weight_kg: '',
    height_cm: '',
    spo2: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record = {
      temperature: vitals.temperature,
      heartRate: vitals.heart_rate,
      respiratoryRate: vitals.respiratory_rate,
      bpSystolic: vitals.bp_systolic,
      bpDiastolic: vitals.bp_diastolic,
      weightKg: vitals.weight_kg,
      heightCm: vitals.height_cm,
      spo2: vitals.spo2,
      recordedAt: new Date().toISOString(),
    };
    addVitals(mrn, record);
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="vitals-container">
      <div className="vitals-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={24} color="#3b82f6" />
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Record Vitals</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Patient: {patientName}</p>
          </div>
        </div>
        <button onClick={onClose} className="btn-close"><X size={24} /></button>
      </div>

      {saved && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#dcfce7', color: '#15803d', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          <CheckCircle size={18} /> Vitals saved to patient record.
        </div>
      )}
      <form onSubmit={handleSubmit} className="vitals-form">
        <div className="vitals-grid">
          {/* Temperature */}
          <div className="vital-input-group">
            <label><Thermometer size={16} /> Temp (°C)</label>
            <input 
              type="number" step="0.1" 
              value={vitals.temperature}
              onChange={(e) => setVitals({...vitals, temperature: e.target.value})}
              placeholder="36.5"
            />
          </div>

          {/* Heart Rate */}
          <div className="vital-input-group">
            <label><Activity size={16} /> Heart Rate (bpm)</label>
            <input 
              type="number" 
              value={vitals.heart_rate}
              onChange={(e) => setVitals({...vitals, heart_rate: e.target.value})}
              placeholder="72"
            />
          </div>

          {/* Blood Pressure */}
          <div className="vital-input-group bp-group">
            <label><Droplets size={16} /> Blood Pressure (mmHg)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="number" placeholder="Sys" 
                value={vitals.bp_systolic}
                onChange={(e) => setVitals({...vitals, bp_systolic: e.target.value})}
              />
              <span>/</span>
              <input 
                type="number" placeholder="Dia" 
                value={vitals.bp_diastolic}
                onChange={(e) => setVitals({...vitals, bp_diastolic: e.target.value})}
              />
            </div>
          </div>

          {/* Resp Rate */}
          <div className="vital-input-group">
            <label><Wind size={16} /> Resp Rate (bpm)</label>
            <input 
              type="number" 
              value={vitals.respiratory_rate}
              onChange={(e) => setVitals({...vitals, respiratory_rate: e.target.value})}
              placeholder="16"
            />
          </div>

          {/* SpO2 */}
          <div className="vital-input-group">
            <label><Activity size={16} /> SpO2 (%)</label>
            <input 
              type="number" 
              value={vitals.spo2}
              onChange={(e) => setVitals({...vitals, spo2: e.target.value})}
              placeholder="98"
            />
          </div>

          {/* Weight */}
          <div className="vital-input-group">
            <label><Weight size={16} /> Weight (kg)</label>
            <input 
              type="number" step="0.1" 
              value={vitals.weight_kg}
              onChange={(e) => setVitals({...vitals, weight_kg: e.target.value})}
              placeholder="70.0"
            />
          </div>

          {/* Height */}
          <div className="vital-input-group">
            <label><Ruler size={16} /> Height (cm)</label>
            <input 
              type="number" 
              value={vitals.height_cm}
              onChange={(e) => setVitals({...vitals, height_cm: e.target.value})}
              placeholder="170"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">
            <Save size={20} />
            Record Vitals
          </button>
        </div>
      </form>
    </div>
  );
};

export default VitalsEntry;
