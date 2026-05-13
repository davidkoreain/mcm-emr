import React from 'react';
import {
  LayoutDashboard, Activity, Package, Beaker, CreditCard, Users, Heart, Shield
} from 'lucide-react';
import './RoleLogin.css';

type UserRole = 'Admin' | 'Doctor' | 'Nurse' | 'Pharmacist' | 'LabTech' | 'Cashier' | 'Patient' | 'Guardian';

interface Props {
  onLogin: (role: UserRole) => void;
  onPatientSignup?: () => void;
  onGuardianSignup?: () => void;
}

const roles: { id: UserRole; label: string; desc: string; icon: React.FC<{ size: number; color: string }>; color: string; bg: string }[] = [
  { id: 'Admin',      label: 'Admin',           desc: 'Full system access & management',   icon: LayoutDashboard, color: '#0f172a', bg: '#e2e8f0' },
  { id: 'Doctor',     label: 'Doctor',          desc: 'Clinical consultations & orders',   icon: Activity,        color: '#2563eb', bg: '#dbeafe' },
  { id: 'Nurse',      label: 'Nurse',           desc: 'Patient care, vitals & ward',       icon: Users,           color: '#059669', bg: '#d1fae5' },
  { id: 'Pharmacist', label: 'Pharmacist',      desc: 'Medication dispensing & inventory', icon: Package,         color: '#7c3aed', bg: '#ede9fe' },
  { id: 'LabTech',    label: 'Lab Technician',  desc: 'Laboratory tests & results',        icon: Beaker,          color: '#b45309', bg: '#fef3c7' },
  { id: 'Cashier',    label: 'Cashier',         desc: 'Billing & payment processing',      icon: CreditCard,      color: '#b91c1c', bg: '#fee2e2' },
  { id: 'Patient',    label: 'Patient Portal',  desc: 'View records, book appointments',   icon: Heart,           color: '#db2777', bg: '#fce7f3' },
  { id: 'Guardian',   label: 'Guardian Portal', desc: 'Manage privacy & records',          icon: Shield,          color: '#7c3aed', bg: '#f5f3ff' },
];

const RoleLogin: React.FC<Props> = ({ onLogin, onPatientSignup, onGuardianSignup }) => {
  return (
    <div className="login-container">
      {/* Left panel - hidden on mobile */}
      <div className="login-left">
        <a href="https://mcm-emr-theta.vercel.app/" className="login-logo-link">
          <div className="login-logo-box">
            <img src="/mcm_logo.png" alt="MCM Logo" />
          </div>
        </a>
        <h1 className="login-title">
          MCM Comprehensive<br />Specialized Hospital
        </h1>
        <p className="login-subtitle">
          Electronic Medical Records<br />Management System
        </p>
        <div className="login-footer">
          <p>
            Addis Ababa, Ethiopia<br />
            v2.0 · 2026
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-right-content">
          {/* Logo for mobile */}
          <div className="login-logo-mobile">
            <a href="https://mcm-emr-theta.vercel.app/" className="login-logo-link">
              <div className="login-mobile-logo-box">
                <img src="/mcm_logo.png" alt="MCM Logo" />
              </div>
            </a>
          </div>
          
          <h2 className="select-role-title">Select Your Role</h2>
          <p className="select-role-desc">
            Choose your department to continue to the dashboard
          </p>

          <div className="login-grid">
            {roles.map(({ id, label, desc, icon: Icon, color, bg }) => (
              <button
                key={id}
                onClick={() => {
                  if (id === 'Patient' && onPatientSignup) onPatientSignup();
                  else if (id === 'Guardian' && onGuardianSignup) onGuardianSignup();
                  else onLogin(id);
                }}
                className="role-card"
              >
                <div className="role-icon-box" style={{ background: bg }}>
                  <Icon size={22} color={color} />
                </div>
                <div className="role-text-box">
                  <div className="role-label">{label}</div>
                  <div className="role-desc">{desc}</div>
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
