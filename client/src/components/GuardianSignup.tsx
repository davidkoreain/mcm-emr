import React, { useState } from 'react';
import { UserPlus, Shield, ArrowRight, Heart } from 'lucide-react';
import { useEMR } from '../context/EMRContext';
// import { toast } from 'react-hot-toast';
const toast = { success: (m: string) => alert(m), error: (m: string) => alert(m) };

const GuardianSignup: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { matchPatient, registerGuardian } = useEMR();
  const [step, setStep] = useState(1);
  const [patientData, setPatientData] = useState({ name: '', dob: '', phone: '' });
  const [guardianData, setGuardianData] = useState({ name: '', relationship: 'Parent', phone: '', password: '' });
  const [matchedPatient, setMatchedPatient] = useState<any>(null);

  const handleMatch = async () => {
    try {
      const p = await matchPatient(patientData.name, patientData.dob, patientData.phone);
      if (p) {
        setMatchedPatient(p);
        setStep(2);
      } else {
        toast.error('Patient record not found. Please check the details.');
      }
    } catch (err) {
      toast.error('Verification failed.');
    }
  };

  const handleSignup = async () => {
    try {
      await registerGuardian({
        patientMrn: matchedPatient.mrn,
        guardianName: guardianData.name,
        relationship: guardianData.relationship,
        phone: guardianData.phone,
        passwordHash: guardianData.password, // In real app, hash this
        privacySettings: {
          showNotes: true,
          showLabs: true,
          showSurgeries: true
        }
      });
      toast.success('Guardian account created! Please login.');
      onBack();
    } catch (err) {
      toast.error('Signup failed.');
    }
  };

  return (
    <div className="signup-container" style={{ maxWidth: '480px', margin: '2rem auto', padding: '2rem', background: 'white', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
      <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '1.5rem' }}>Back to Login</button>
      
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: '64px', height: '64px', background: '#f5f3ff', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Shield size={32} color="#7c3aed" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Guardian Registration</h2>
        <p style={{ color: '#64748b' }}>Connect to your loved one's medical records</p>
      </div>

      {step === 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Step 1: Identify Patient</h3>
          <input type="text" placeholder="Patient Full Name" value={patientData.name} onChange={e => setPatientData({ ...patientData, name: e.target.value })} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }} />
          <input type="date" placeholder="Date of Birth" value={patientData.dob} onChange={e => setPatientData({ ...patientData, dob: e.target.value })} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }} />
          <input type="tel" placeholder="Patient Phone" value={patientData.phone} onChange={e => setPatientData({ ...patientData, phone: e.target.value })} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }} />
          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={handleMatch}>Verify Patient Record <ArrowRight size={18} /></button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #dcfce7', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '600' }}>Matched Patient:</p>
            <p style={{ fontWeight: '800' }}>{matchedPatient.name} ({matchedPatient.mrn})</p>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Step 2: Guardian Details</h3>
          <input type="text" placeholder="Your Full Name" value={guardianData.name} onChange={e => setGuardianData({ ...guardianData, name: e.target.value })} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }} />
          <select value={guardianData.relationship} onChange={e => setGuardianData({ ...guardianData, relationship: e.target.value })} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
            <option>Parent</option><option>Child</option><option>Spouse</option><option>Sibling</option><option>Other</option>
          </select>
          <input type="tel" placeholder="Your Phone (Login ID)" value={guardianData.phone} onChange={e => setGuardianData({ ...guardianData, phone: e.target.value })} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }} />
          <input type="password" placeholder="Choose Password" value={guardianData.password} onChange={e => setGuardianData({ ...guardianData, password: e.target.value })} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }} />
          <button className="btn-primary" style={{ marginTop: '1rem', background: '#7c3aed' }} onClick={handleSignup}>Create Guardian Account</button>
        </div>
      )}
    </div>
  );
};

export default GuardianSignup;
