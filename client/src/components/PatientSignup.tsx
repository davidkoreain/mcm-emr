import React, { useState } from 'react';
import { UserPlus, Search, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { useEMR } from '../context/EMRContext';

const PatientSignup: React.FC<{ onBack: () => void; onLogin: (mrn: string) => void }> = ({ onBack, onLogin }) => {
  const { matchPatient, registerPatientUser, setCurrentUser } = useEMR();
  const [step, setStep] = useState<'match' | 'register'>('match');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Match Form
  const [matchData, setMatchData] = useState({ name: '', dob: '', phone: '' });
  const [matchedPatient, setMatchedPatient] = useState<any>(null);

  // Register Form
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const p = await matchPatient(matchData.name.trim(), matchData.dob, matchData.phone.trim());
      if (p) {
        setMatchedPatient(p);
        setStep('register');
      } else {
        setError('No matching patient record found. Please ensure your Name, DOB, and Phone match your hospital record.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerPatientUser(matchedPatient.mrn, password); // Simplified (no actual hashing in this demo)
      setCurrentUser(matchedPatient);
      onLogin(matchedPatient.mrn);
    } catch (err: any) {
      setError('Registration failed. You may already have an account.');
    } finally {
      setLoading(false);
    }
  };

  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.98)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' };
  const cardStyle: React.CSSProperties = { maxWidth: '420px', width: '100%', background: 'white', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' };

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>
              {step === 'match' ? 'Patient Portal Signup' : 'Create Your Account'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
              {step === 'match' ? 'Verify your hospital record to continue' : 'Set your secure password'}
            </p>
          </div>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid #fee2e2' }}>
            {error}
          </div>
        )}

        {step === 'match' ? (
          <form onSubmit={handleMatch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Full Name (English)</label>
              <input type="text" required placeholder="e.g. Abebe Bikila" value={matchData.name} onChange={e => setMatchData(d => ({ ...d, name: e.target.value }))} 
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Date of Birth</label>
              <input type="date" required value={matchData.dob} onChange={e => setMatchData(d => ({ ...d, dob: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
              <input type="tel" required placeholder="e.g. +251911001001" value={matchData.phone} onChange={e => setMatchData(d => ({ ...d, phone: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem' }}>
              {loading ? 'Searching...' : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Find My Record <ArrowRight size={18} /></span>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #dcfce7', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600', textTransform: 'uppercase' }}>Record Found</div>
              <div style={{ fontWeight: '700', color: '#166534' }}>{matchedPatient.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#166534' }}>MRN: {matchedPatient.mrn}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Create Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
              <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem', background: '#db2777' }}>
              {loading ? 'Creating...' : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Complete Signup <ShieldCheck size={18} /></span>}
            </button>
            <button type="button" onClick={() => setStep('match')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' }}>Change Record</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PatientSignup;
