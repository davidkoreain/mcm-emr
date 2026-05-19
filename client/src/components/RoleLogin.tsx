import React from 'react';
import {
  LayoutDashboard, Activity, Package, Beaker, CreditCard, Users, Heart, Shield,
  User, Lock, ArrowLeft, Loader2, ClipboardCheck
} from 'lucide-react';
import { useEMR } from '../context/EMRContext';
import './RoleLogin.css';

type UserRole = 'Admin' | 'Manager' | 'Doctor' | 'Nurse' | 'Pharmacist' | 'LabTech' | 'Cashier' | 'Patient' | 'Guardian';

interface Props {
  onLogin: (role: UserRole) => void;
  onPatientSignup?: () => void;
  onGuardianSignup?: () => void;
}

const roles: { id: UserRole; label: string; desc: string; icon: React.FC<{ size: number; color: string }>; color: string; bg: string }[] = [
  { id: 'Admin',      label: 'Admin',           desc: 'Full system access & management',   icon: LayoutDashboard, color: '#0f172a', bg: '#e2e8f0' },
  { id: 'Manager',    label: 'Manager',         desc: 'Coordinate & confirm appointments', icon: ClipboardCheck,  color: '#0891b2', bg: '#cffafe' },
  { id: 'Doctor',     label: 'Doctor',          desc: 'Clinical consultations & orders',   icon: Activity,        color: '#2563eb', bg: '#dbeafe' },
  { id: 'Nurse',      label: 'Nurse',           desc: 'Patient care, vitals & ward',       icon: Users,           color: '#059669', bg: '#d1fae5' },
  { id: 'Pharmacist', label: 'Pharmacist',      desc: 'Medication dispensing & inventory', icon: Package,         color: '#7c3aed', bg: '#ede9fe' },
  { id: 'LabTech',    label: 'Lab Technician',  desc: 'Laboratory tests & results',        icon: Beaker,          color: '#b45309', bg: '#fef3c7' },
  { id: 'Cashier',    label: 'Cashier',         desc: 'Billing & payment processing',      icon: CreditCard,      color: '#b91c1c', bg: '#fee2e2' },
  { id: 'Patient',    label: 'Patient Portal',  desc: 'View records, book appointments',   icon: Heart,           color: '#db2777', bg: '#fce7f3' },
  { id: 'Guardian',   label: 'Guardian Portal', desc: 'Manage privacy & records',          icon: Shield,          color: '#7c3aed', bg: '#f5f3ff' },
];

const RoleLogin: React.FC<Props> = ({ onLogin, onPatientSignup, onGuardianSignup }) => {
  const { loginStaff, setCurrentStaff } = useEMR();
  const [loginRole, setLoginRole] = React.useState<UserRole | null>(null);
  const [staffName, setStaffName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !password) {
      setError('Please enter both name and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const staffMember = await loginStaff(staffName, password);
      if (staffMember) {
        setCurrentStaff(staffMember);
        onLogin(loginRole!);
      } else {
        setError('Invalid name or password.');
      }
    } catch (err) {
      setError('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <>
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
              else setLoginRole(id);
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
    </>
  );

  const renderLoginForm = () => (
    <div className="staff-login-form">
      <button onClick={() => setLoginRole(null)} className="back-btn">
        <ArrowLeft size={18} /> Back to Roles
      </button>
      
      <h2 className="select-role-title">{loginRole} Login</h2>
      <p className="select-role-desc">Enter your credentials to access the medical system</p>

      <form onSubmit={handleStaffLogin} className="login-form">
        <div className="input-group">
          <label><User size={16} /> Name</label>
          <input 
            type="text" 
            placeholder="Enter your full name"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="input-group">
          <label><Lock size={16} /> Password</label>
          <input 
            type="password" 
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="login-submit-btn" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : 'Login'}
        </button>
        
      </form>
    </div>
  );

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
          
          {loginRole ? renderLoginForm() : renderRoleSelection()}
        </div>
      </div>
    </div>
  );
};

export default RoleLogin;
