import React, { useState } from 'react';
import { Shield, ArrowRight, ArrowLeft, Heart, Lock, User, Calendar, Phone, Users } from 'lucide-react';
import { useEMR } from '../context/EMRContext';

const toast = { success: (m: string) => alert(m), error: (m: string) => alert(m) };

const GuardianSignup: React.FC<{ onBack: () => void; onLogin: () => void }> = ({ onBack, onLogin }) => {
  const { matchPatient, registerGuardian, loginGuardian, setRole, setCurrentGuardian } = useEMR();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    dob: '',
    phone: '',
    patientName: '',
    relationship: 'Parent'
  });

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const guardian = await loginGuardian(formData.name, formData.password);
        if (guardian) {
          setCurrentGuardian(guardian);
          setRole('Guardian');
          onLogin();
          toast.success(`Welcome back, ${guardian.guardianName}!`);
        } else {
          toast.error('Invalid name or password.');
        }
      } else {
        // Signup Flow
        // 1. First, try to find the patient record (optional but recommended in real EMR)
        // For this simplified version, we'll try to match or just proceed
        const p = await matchPatient(formData.patientName, '', ''); // Basic match by name
        
        await registerGuardian({
          patientMrn: p?.mrn || 'NEW-PATIENT', // Fallback MRN
          guardianName: formData.name,
          relationship: formData.relationship,
          phone: formData.phone,
          passwordHash: formData.password,
          privacySettings: { showNotes: true, showLabs: true, showSurgeries: true }
        });
        
        toast.success('Account created! Please login.');
        setMode('login');
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container" style={{ maxWidth: '440px', margin: '4rem auto', padding: '2.5rem', background: 'white', borderRadius: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', cursor: 'pointer', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: '600' }}>
        <ArrowLeft size={18} /> Back to Selection
      </button>

      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ width: '64px', height: '64px', background: '#f5f3ff', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <Shield size={32} color="#7c3aed" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1e293b', marginBottom: '0.5rem' }}>Guardian Portal</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          {mode === 'login' ? 'Access your loved one\'s health data' : 'Create an account to manage medical access'}
        </p>
      </div>

      <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Full Name</label>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              required
              placeholder="e.g. John Doe" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', border: '1.5px solid #e2e8f0', borderRadius: '1rem', fontSize: '1rem' }} 
            />
          </div>
        </div>

        {mode === 'signup' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Date of Birth</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="date" 
                    required
                    value={formData.dob} 
                    onChange={e => setFormData({ ...formData, dob: e.target.value })} 
                    style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', border: '1.5px solid #e2e8f0', borderRadius: '1rem', fontSize: '0.9rem' }} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="tel" 
                    required
                    placeholder="09..."
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                    style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', border: '1.5px solid #e2e8f0', borderRadius: '1rem', fontSize: '1rem' }} 
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Patient Name</label>
                <div style={{ position: 'relative' }}>
                  <Heart size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    required
                    placeholder="Patient Name"
                    value={formData.patientName} 
                    onChange={e => setFormData({ ...formData, patientName: e.target.value })} 
                    style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', border: '1.5px solid #e2e8f0', borderRadius: '1rem', fontSize: '0.9rem' }} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Relationship</label>
                <div style={{ position: 'relative' }}>
                  <Users size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <select 
                    value={formData.relationship} 
                    onChange={e => setFormData({ ...formData, relationship: e.target.value })} 
                    style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', border: '1.5px solid #e2e8f0', borderRadius: '1rem', fontSize: '1rem', appearance: 'none', background: 'white' }}
                  >
                    <option>Parent</option><option>Child</option><option>Spouse</option><option>Sibling</option><option>Other</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="password" 
              required
              placeholder="••••••••" 
              value={formData.password} 
              onChange={e => setFormData({ ...formData, password: e.target.value })} 
              style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', border: '1.5px solid #e2e8f0', borderRadius: '1rem', fontSize: '1rem' }} 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            marginTop: '1rem', 
            background: '#7c3aed', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: '1rem', 
            border: 'none', 
            fontWeight: '800', 
            fontSize: '1rem', 
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s',
            boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.3)'
          }}
        >
          {loading ? 'Processing...' : mode === 'login' ? 'Login to Portal' : 'Register Account'}
          {!loading && <ArrowRight size={20} />}
        </button>
      </form>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
          {mode === 'login' ? "Don't have a guardian account?" : "Already have an account?"}
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: '#7c3aed', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            {mode === 'login' ? 'Sign up here' : 'Login instead'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default GuardianSignup;
