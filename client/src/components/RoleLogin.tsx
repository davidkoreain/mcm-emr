import React from 'react';
import {
  LayoutDashboard, Activity, Package, Beaker, CreditCard, Users,
} from 'lucide-react';

type UserRole = 'Admin' | 'Doctor' | 'Nurse' | 'Pharmacist' | 'LabTech' | 'Cashier';

interface Props {
  onLogin: (role: UserRole) => void;
}

const roles: { id: UserRole; label: string; desc: string; icon: React.FC<{ size: number; color: string }>; color: string; bg: string }[] = [
  { id: 'Admin',      label: 'Admin',           desc: 'Full system access & management',   icon: LayoutDashboard, color: '#0f172a', bg: '#e2e8f0' },
  { id: 'Doctor',     label: 'Doctor',          desc: 'Clinical consultations & orders',   icon: Activity,        color: '#2563eb', bg: '#dbeafe' },
  { id: 'Nurse',      label: 'Nurse',           desc: 'Patient care, vitals & ward',       icon: Users,           color: '#059669', bg: '#d1fae5' },
  { id: 'Pharmacist', label: 'Pharmacist',      desc: 'Medication dispensing & inventory', icon: Package,         color: '#7c3aed', bg: '#ede9fe' },
  { id: 'LabTech',    label: 'Lab Technician',  desc: 'Laboratory tests & results',        icon: Beaker,          color: '#b45309', bg: '#fef3c7' },
  { id: 'Cashier',    label: 'Cashier',         desc: 'Billing & payment processing',      icon: CreditCard,      color: '#b91c1c', bg: '#fee2e2' },
];

const RoleLogin: React.FC<Props> = ({ onLogin }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
    }}>
      {/* Left panel */}
      <div style={{
        width: '380px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem 2.5rem',
        borderRight: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1.25rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          width: '180px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}>
          <img src="/mcm_logo.png" alt="MCM Logo" style={{ width: '100%', height: 'auto' }} />
        </div>
        <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: '800', textAlign: 'center', marginBottom: '0.5rem', lineHeight: 1.2 }}>
          MCM Comprehensive<br />Specialized Hospital
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem', lineHeight: 1.6 }}>
          Electronic Medical Records<br />Management System
        </p>
        <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', width: '100%', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
            Addis Ababa, Ethiopia<br />
            v2.0 · 2026
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
      }}>
        <div style={{ width: '100%', maxWidth: '640px' }}>
          <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Select Your Role
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
            Choose your department to continue to the dashboard
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
          }}>
            {roles.map(({ id, label, desc, icon: Icon, color, bg }) => (
              <button
                key={id}
                onClick={() => onLogin(id)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '1rem',
                  padding: '1.5rem 1.25rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.13)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '44px', height: '44px',
                  borderRadius: '0.75rem',
                  background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={22} color={color} />
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>{label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', lineHeight: 1.4 }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleLogin;
