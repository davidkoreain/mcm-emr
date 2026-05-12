import React, { useState } from 'react';
import { Eye, EyeOff, Shield, Heart, FileText, Beaker, Scissors, Save } from 'lucide-react';
import { useEMR, type GuardianUser } from '../context/EMRContext';
import PatientPortal from './PatientPortal';
// import { toast } from 'react-hot-toast';
const toast = { success: (m: string) => alert(m), error: (m: string) => alert(m) };

const GuardianPortal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { currentGuardian, updatePrivacy, guardians } = useEMR();
  const [showSettings, setShowSettings] = useState(false);
  
  // Local state for privacy toggle to feel responsive
  const [settings, setSettings] = useState(currentGuardian?.privacySettings || {
    showNotes: true, showLabs: true, showSurgeries: true
  });

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
    <div className="guardian-wrapper" style={{ position: 'relative', background: '#f5f3ff', minHeight: '100vh' }}>
      {/* Privacy Control Bar */}
      <div style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)', position: 'sticky', top: 0, zIndex: 2000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'white', padding: '0.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="#7c3aed" />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem', lineHeight: '1.2' }}>Guardian Mode</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Managing privacy for {currentGuardian.guardianName}'s patient</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'white', border: 'none', color: '#7c3aed', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {showSettings ? <EyeOff size={18} /> : <Eye size={18} />}
            {showSettings ? 'Close Controls' : 'Privacy Settings'}
          </button>
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>Logout</button>
        </div>
      </div>

      {showSettings && (
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '2rem', animation: 'slideDown 0.3s ease-out' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>Privacy Access Control</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Toggle which records are visible to the patient. Guardian access is always unrestricted.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {[
                { label: 'Consultation Notes', key: 'showNotes', icon: <FileText size={22}/>, desc: 'Medical history and doctor diagnoses' },
                { label: 'Laboratory Results', key: 'showLabs', icon: <Beaker size={22}/>, desc: 'Detailed test results and abnormal flags' },
                { label: 'Surgery Records', key: 'showSurgeries', icon: <Scissors size={22}/>, desc: 'Surgical schedules and operative history' },
              ].map(({ label, key, icon, desc }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '1.25rem', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ background: 'white', padding: '0.6rem', borderRadius: '0.75rem', color: '#7c3aed', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{icon}</div>
                    <button 
                      onClick={() => toggleSetting(key as any)}
                      style={{ 
                        background: (settings as any)[key] ? '#dcfce7' : '#fee2e2',
                        color: (settings as any)[key] ? '#15803d' : '#b91c1c',
                        border: 'none', padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer', fontWeight: '800', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
                      }}
                    >
                      {(settings as any)[key] ? 'VISIBLE TO PATIENT' : 'HIDDEN FROM PATIENT'}
                    </button>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" style={{ background: '#7c3aed', padding: '0.8rem 2rem' }} onClick={handleSavePrivacy}>
                <Save size={18} style={{ marginRight: '0.5rem' }} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <PatientPortal onLogout={onLogout} isGuardianView={true} />
      </div>
    </div>
  );
};

export default GuardianPortal;
