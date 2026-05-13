import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, Shield, Heart, FileText, Beaker, Scissors, Save, LogOut, Settings } from 'lucide-react';
import { useEMR, type GuardianUser } from '../context/EMRContext';
import PatientPortal from './PatientPortal';
import Avatar from './Avatar';

const toast = { success: (m: string) => alert(m), error: (m: string) => alert(m) };

const GuardianPortal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { currentGuardian, updatePrivacy, patients } = useEMR();
  const [showSettings, setShowSettings] = useState(false);
  
  // Local state for privacy toggle to feel responsive
  const [settings, setSettings] = useState(currentGuardian?.privacySettings || {
    showNotes: true, showLabs: true, showSurgeries: true
  });

  const patient = useMemo(() => patients.find(p => p.mrn === currentGuardian?.patientMrn), [patients, currentGuardian]);

  if (!currentGuardian) return <div style={{ padding: '2rem', textAlign: 'center' }}>Access Denied</div>;

  const handleSavePrivacy = async () => {
    try {
      await updatePrivacy(currentGuardian.id, settings);
      toast.success('Privacy settings updated for patient view.');
      setShowSettings(false);
    } catch (err) {
      toast.error('Failed to update privacy.');
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="guardian-wrapper" style={{ position: 'relative', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Premium Navigation Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 2000 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ background: '#7c3aed', padding: '0.6rem', borderRadius: '1rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}>
              <Shield size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: '900', fontSize: '1.1rem', color: '#1e293b' }}>Guardian Control</span>
                <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '0.2rem 0.6rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.05em' }}>PREMIUM ACCESS</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                Managing: <span style={{ color: '#1e293b', fontWeight: '700' }}>{patient?.name || 'Loading...'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              style={{ 
                background: showSettings ? '#7c3aed' : '#f8fafc', 
                color: showSettings ? 'white' : '#475569', 
                border: '1px solid #e2e8f0',
                padding: '0.6rem 1.2rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' 
              }}
            >
              <Settings size={18} />
              Privacy Controls
            </button>
            <button 
              onClick={onLogout} 
              style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '3rem 0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', animation: 'slideIn 0.3s ease-out' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1e293b' }}>Privacy Settings</h2>
                <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '0.5rem', maxWidth: '600px' }}>
                  Choose which parts of <strong style={{ color: '#1e293b' }}>{patient?.name}'s</strong> medical records are visible to them through the Patient Portal.
                </p>
              </div>
              <button 
                className="btn-primary" 
                style={{ background: '#7c3aed', padding: '0.8rem 1.5rem', boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.3)' }} 
                onClick={handleSavePrivacy}
              >
                <Save size={18} style={{ marginRight: '0.5rem' }} /> Save Changes
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {[
                { label: 'Clinical Notes', key: 'showNotes', icon: <FileText size={22}/>, desc: 'Detailed diagnoses, doctor notes, and clinical histories.' },
                { label: 'Lab Results', key: 'showLabs', icon: <Beaker size={22}/>, desc: 'Test data, blood work, and pathology reports.' },
                { label: 'Surgery Data', key: 'showSurgeries', icon: <Scissors size={22}/>, desc: 'Operation schedules, procedures, and recovery logs.' },
              ].map(({ label, key, icon, desc }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '2rem', background: '#f8fafc', borderRadius: '1.5rem', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ background: 'white', padding: '0.75rem', borderRadius: '1rem', color: '#7c3aed', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>{icon}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: (settings as any)[key] ? '#15803d' : '#94a3b8' }}>
                        {(settings as any)[key] ? 'VISIBLE' : 'HIDDEN'}
                      </span>
                      <button 
                        onClick={() => toggleSetting(key as any)}
                        style={{ 
                          width: '48px', height: '24px', background: (settings as any)[key] ? '#7c3aed' : '#cbd5e1', 
                          borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ 
                          position: 'absolute', top: '2px', left: (settings as any)[key] ? '26px' : '2px',
                          width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'all 0.2s'
                        }} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1e293b' }}>{label}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.5' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '2rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <PatientPortal onLogout={onLogout} isGuardianView={true} />
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default GuardianPortal;
