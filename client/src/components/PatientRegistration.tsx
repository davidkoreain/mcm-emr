import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { useEMR } from '../context/EMRContext';

interface PatientRegistrationProps {
  onClose: () => void;
  initialData?: Patient;
}

const PatientRegistration: React.FC<PatientRegistrationProps> = ({ onClose, initialData }) => {
  const { addPatient, updatePatient } = useEMR();
  const [formData, setFormData] = useState({
    mrn: initialData?.mrn || '',
    first_name: initialData?.name?.split(' ')[0] || '',
    last_name: initialData?.name?.split(' ').slice(1).join(' ') || '',
    amharic_name: initialData?.amharic || '',
    date_of_birth: initialData?.dob || '',
    gender: initialData?.gender || 'Male',
    phone_number: initialData?.phone || '',
    address_city: initialData?.city || 'Addis Ababa',
    address_woreda: initialData?.woreda || '',
    address_kebele: initialData?.kebele || '',
    preferred_name: initialData?.preferredName || '',
    insurance_provider: initialData?.insuranceProvider || '',
    insurance_policy_no: initialData?.insurancePolicyNo || '',
    gender_identity: initialData?.genderIdentity || '',
    interpreter_needed: initialData?.interpreterNeeded || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().slice(0, 10);
    
    const payload = {
      mrn: formData.mrn,
      name: `${formData.first_name} ${formData.last_name}`.trim(),
      amharic: formData.amharic_name,
      visitType: initialData?.visitType || 'OPD',
      status: initialData?.status || 'Waiting',
      time: initialData?.time || timeStr,
      registeredAt: initialData?.registeredAt || dateStr,
      gender: formData.gender as any,
      dob: formData.date_of_birth,
      phone: formData.phone_number,
      city: formData.address_city,
      woreda: formData.address_woreda,
      kebele: formData.address_kebele,
      preferredName: formData.preferred_name,
      insuranceProvider: formData.insurance_provider,
      insurancePolicyNo: formData.insurance_policy_no,
      genderIdentity: formData.gender_identity,
      interpreterNeeded: formData.interpreter_needed,
      vitals: initialData?.vitals || [],
      medications: initialData?.medications || [],
      ward: initialData?.ward || '',
    };

    if (initialData) {
      await updatePatient(initialData.mrn, payload);
    } else {
      await addPatient(payload);
    }
    onClose();
  };

  return (
    <div className="registration-container">
      <div className="registration-header">
        <h2>{initialData ? 'Edit Patient Information' : 'Register New Patient'}</h2>
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
          
          <div className="form-group">
            <label>Preferred Name / Alias</label>
            <input 
              type="text" 
              value={formData.preferred_name}
              onChange={(e) => setFormData({...formData, preferred_name: e.target.value})}
              placeholder="e.g. Nickname"
            />
          </div>

          <div className="form-group">
            <label>Insurance Provider</label>
            <input 
              type="text" 
              value={formData.insurance_provider}
              onChange={(e) => setFormData({...formData, insurance_provider: e.target.value})}
              placeholder="e.g. Blue Cross"
            />
          </div>

          <div className="form-group">
            <label>Insurance Policy No.</label>
            <input 
              type="text" 
              value={formData.insurance_policy_no}
              onChange={(e) => setFormData({...formData, insurance_policy_no: e.target.value})}
              placeholder="e.g. POL-12345"
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <input 
              type="checkbox" 
              id="interpreter"
              checked={formData.interpreter_needed}
              onChange={(e) => setFormData({...formData, interpreter_needed: e.target.checked})}
            />
            <label htmlFor="interpreter">Interpreter Needed</label>
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
