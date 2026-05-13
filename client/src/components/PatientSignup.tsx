import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, ArrowLeft, Heart, Lock, User, Calendar, Phone, Users } from 'lucide-react';
import { useEMR, type Patient } from '../context/EMRContext';

const toast = { success: (m: string) => alert(m), error: (m: string) => alert(m) };

const PatientSignup: React.FC<{ onBack: () => void; onLogin: (mrn: string) => void }> = ({ onBack, onLogin }) => {
  const { matchPatient, registerPatientUser, setCurrentUser, addPatient, loginPortalUser } = useEMR();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    dob: '',
    phone: '',
    gender: 'Male' as 'Male' | 'Female'
  });

  const generateMRN = () => `MRN-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const p = await loginPortalUser(formData.name, formData.password);
        if (p) {
          setCurrentUser(p);
          onLogin(p.mrn);
          toast.success(`Welcome back, ${p.name}!`);
        } else {
          toast.error('Invalid name or password.');
        }
      } else {
        // Signup Flow: 1. Try to match 2. If not found, create new 3. Register user
        let targetPatient = await matchPatient(formData.name, formData.dob, formData.phone);
        
        if (!targetPatient) {
          // Create new record
          const mrn = generateMRN();
          targetPatient = {
            mrn,
            name: formData.name,
            amharic: '',
            visitType: 'OPD',
            status: 'Waiting',
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            registeredAt: new Date().toISOString().slice(0, 10),
            gender: formData.gender,
            dob: formData.dob,
            phone: formData.phone,
            city: 'Addis Ababa',
            woreda: '',
            kebele: '',
            vitals: [],
            medications: [],
            ward: '',
          };
          await addPatient(targetPatient);
        }

        await registerPatientUser(targetPatient.mrn, formData.password);
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
    <div className="patient-signup-wrapper" style={{ position: 'fixed', inset: 0, background: 'rgba(248, 250, 252, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem', overflowY: 'auto' }}>
      <div className="signup-container" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem', background: 'white', borderRadius: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', cursor: 'pointer', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: '600' }}>
          <ArrowLeft size={18} /> Back to Selection
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <ShieldCheck size={32} color="#2563eb" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1e293b', marginBottom: '0.5rem' }}>Patient Portal</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            {mode === 'login' ? 'Access your medical history and results' : 'Register to manage your hospital records'}
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
                placeholder="e.g. Abebe Bikila" 
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
                      placeholder="+251..."
                      value={formData.phone} 
                      onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                      style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', border: '1.5px solid #e2e8f0', borderRadius: '1rem', fontSize: '1rem' }} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Gender</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['Male', 'Female'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g as any })}
                      style={{
                        flex: 1, padding: '0.75rem', borderRadius: '1rem', border: '1.5px solid',
                        borderColor: formData.gender === g ? '#2563eb' : '#e2e8f0',
                        background: formData.gender === g ? '#eff6ff' : 'white',
                        color: formData.gender === g ? '#2563eb' : '#64748b',
                        fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {g}
                    </button>
                  ))}
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
              background: '#2563eb', 
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
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
            }}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Login to Portal' : 'Register Account'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              {mode === 'login' ? 'Sign up here' : 'Login instead'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientSignup;
