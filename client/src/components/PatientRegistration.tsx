import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { useEMR } from '../context/EMRContext';

interface PatientRegistrationProps {
  onClose: () => void;
}

const PatientRegistration: React.FC<PatientRegistrationProps> = ({ onClose }) => {
  const { addPatient } = useEMR();
  const [formData, setFormData] = useState({
    mrn: '',
    first_name: '',
    last_name: '',
    amharic_name: '',
    date_of_birth: '',
    gender: 'Male',
    phone_number: '',
    address_city: 'Addis Ababa',
    address_woreda: '',
    address_kebele: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().slice(0, 10);
    addPatient({
      mrn: formData.mrn,
      name: `${formData.first_name} ${formData.last_name}`.trim(),
      amharic: formData.amharic_name,
      visitType: 'OPD',
      status: 'Waiting',
      time: timeStr,
      registeredAt: dateStr,
      gender: formData.gender,
      dob: formData.date_of_birth,
      phone: formData.phone_number,
      city: formData.address_city,
      woreda: formData.address_woreda,
      kebele: formData.address_kebele,
      vitals: [],
      medications: [],
      ward: '',
    });
    onClose();
  };

  return (
    <div className="registration-container">
      <div className="registration-header">
        <h2>Register New Patient</h2>
        <button onClick={onClose} className="btn-close"><X size={24} /></button>
      </div>
      
      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-grid">
          <div className="form-group">
            <label>MRN (Medical Record Number)</label>
            <input 
              type="text" 
              required 
              value={formData.mrn}
              onChange={(e) => setFormData({...formData, mrn: e.target.value})}
              placeholder="e.g. MRN-2026-001"
            />
          </div>
          
          <div className="form-group">
            <label>First Name (English)</label>
            <input 
              type="text" 
              required 
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Last Name (English)</label>
            <input 
              type="text" 
              required 
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Full Name (Amharic)</label>
            <input 
              type="text" 
              value={formData.amharic_name}
              onChange={(e) => setFormData({...formData, amharic_name: e.target.value})}
              placeholder="አበበ ቢቂላ"
            />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input 
              type="date" 
              required 
              value={formData.date_of_birth}
              onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select 
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input 
              type="tel" 
              value={formData.phone_number}
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              placeholder="+251 ..."
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input 
              type="text" 
              value={formData.address_city}
              onChange={(e) => setFormData({...formData, address_city: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Woreda</label>
            <input 
              type="text" 
              value={formData.address_woreda}
              onChange={(e) => setFormData({...formData, address_woreda: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Kebele</label>
            <input 
              type="text" 
              value={formData.address_kebele}
              onChange={(e) => setFormData({...formData, address_kebele: e.target.value})}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">
            <Save size={20} />
            Save Patient
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistration;
