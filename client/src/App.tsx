import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, UserPlus, Package, 
  Menu, X, Pill, Scissors, Beaker, LogOut,
  Bed, CreditCard, CalendarDays, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEMR } from './context/EMRContext';

// Portals
import RoleLogin from './components/RoleLogin';
import PatientSignup from './components/PatientSignup';
import PatientPortal from './components/PatientPortal';
import GuardianSignup from './components/GuardianSignup';
import GuardianPortal from './components/GuardianPortal';

import DoctorDashboard from './components/DoctorDashboard';
import NurseDashboard from './components/NurseDashboard';
import PatientRegistration from './components/PatientRegistration';
import StaffManagement from './components/StaffManagement';
import LabManagement from './components/LabManagement';
import OperationManagement from './components/OperationManagement';
import PharmacyManagement from './components/PharmacyManagement';
import AssetManagement from './components/AssetManagement';
import InpatientManagement from './components/InpatientManagement';
import BillingManagement from './components/BillingManagement';
import HospitalCalendar from './components/HospitalCalendar';
import PatientManagement from './components/PatientManagement';
import VitalsEntry from './components/VitalsEntry';
import ClinicalEncounter from './components/ClinicalEncounter';
import ErrorBoundary from './components/ErrorBoundary';
import Avatar from './components/Avatar';
import FlowBoard from './components/FlowBoard';

const App: React.FC = () => {
  const { role, setRole, loading, currentStaff, patients } = useEMR();
  const [view, setView] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<{ mrn: string; name: string; amharic: string } | null>(null);
  const [selectedMrn, setSelectedMrn] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'soap' | 'imaging' | 'history'>('soap');
  const [signupFlow, setSignupFlow] = useState<'none' | 'patient' | 'guardian'>('none');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHrmOpen, setIsHrmOpen] = useState(false);
  const [staffTab, setStaffTab] = useState<'portfolio' | 'leave' | 'performance'>('portfolio');
  const [autoOpenId, setAutoOpenId] = useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const id = params.get('id');

    if (type && id && role && !autoOpenId) {
      const normalizedType = type.toLowerCase();
      const normalizedId = id.trim();
      
      setAutoOpenId(normalizedId);
      if (normalizedType === 'patient') setView('patients');
      else if (normalizedType === 'staff') {
        setView('staff');
        setStaffTab('portfolio');
        setIsHrmOpen(true);
      }
      else if (normalizedType === 'asset') setView('assets');
      
      // Clear URL parameters after processing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [role, autoOpenId, loading]);

  const handleLogout = () => {
    setRole(null);
    window.location.reload(); 
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading EMR...</div>;

  if (signupFlow === 'patient') return <PatientSignup onBack={() => setSignupFlow('none')} onLogin={(mrn) => { setRole('Patient'); setSignupFlow('none'); }} />;
  if (signupFlow === 'guardian') return <GuardianSignup onBack={() => setSignupFlow('none')} onLogin={() => setSignupFlow('none')} />;

  if (!role) {
    return <RoleLogin 
      onLogin={(r) => setRole(r)} 
      onPatientSignup={() => setSignupFlow('patient')}
      onGuardianSignup={() => setSignupFlow('guardian')}
    />;
  }
  
  // 2. Logic for Patient/Guardian Portals (Full Screen)
  if (role === 'Patient') return <PatientPortal onLogout={handleLogout} />;
  if (role === 'Guardian') return <GuardianPortal onLogout={handleLogout} />;



  // 3. Logic for Admin/Staff View (Full Layout)
  return (
    <div className="app-container">
      {mobileMenuOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} onClick={() => setMobileMenuOpen(false)} />}
      
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <a href="https://mcm-emr-theta.vercel.app/" style={{ textDecoration: 'none' }}>
            <img src="/mcm_logo.png" alt="Logo" style={{ height: '40px' }} />
          </a>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} className="mobile-close"><X size={24} /></button>
        </div>
        <nav>
          <ul className="nav-list">
            <li className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }}><LayoutDashboard size={20}/> <span>Flow Board</span></li>
            <li className={`nav-item ${view === 'patients' ? 'active' : ''}`} onClick={() => { setView('patients'); setMobileMenuOpen(false); }}><Users size={20}/> <span>Patient Details</span></li>
            <li className={`nav-item ${view === 'calendar' ? 'active' : ''}`} onClick={() => { setView('calendar'); setMobileMenuOpen(false); }}><CalendarDays size={20}/> <span>Appointments</span></li>
            <li className={`nav-item ${view === 'registration' ? 'active' : ''}`} onClick={() => { setView('registration'); setMobileMenuOpen(false); }}><UserPlus size={20}/> <span>Registration</span></li>
            <li className={`nav-item ${view === 'inpatient' ? 'active' : ''}`} onClick={() => { setView('inpatient'); setMobileMenuOpen(false); }}><Bed size={20}/> <span>Inpatient Ward</span></li>
            
            {/* HRM 2nd Level Menu */}
            <li 
              className={`nav-item ${view === 'staff' ? 'active' : ''}`} 
              onClick={() => setIsHrmOpen(!isHrmOpen)}
              style={{ justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users size={20}/> <span>HRM</span>
              </div>
              <div className="menu-arrow">
                {isHrmOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </li>
            
            <AnimatePresence>
              {isHrmOpen && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{ listStyle: 'none', padding: '0 0 0 1.5rem', overflow: 'hidden' }}
                >
                  <li 
                    className={`sub-nav-item ${view === 'staff' && staffTab === 'portfolio' ? 'active' : ''}`} 
                    onClick={() => { setView('staff'); setStaffTab('portfolio'); setMobileMenuOpen(false); }}
                  >
                    <span>Members</span>
                  </li>
                  <li 
                    className={`sub-nav-item ${view === 'staff' && staffTab === 'leave' ? 'active' : ''}`} 
                    onClick={() => { setView('staff'); setStaffTab('leave'); setMobileMenuOpen(false); }}
                  >
                    <span>Leave Mgmt</span>
                  </li>
                  <li 
                    className={`sub-nav-item ${view === 'staff' && staffTab === 'performance' ? 'active' : ''}`} 
                    onClick={() => { setView('staff'); setStaffTab('performance'); setMobileMenuOpen(false); }}
                  >
                    <span>Performance</span>
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>

            <li className={`nav-item ${view === 'lab' ? 'active' : ''}`} onClick={() => { setView('lab'); setMobileMenuOpen(false); }}><Beaker size={20}/> <span>Laboratory</span></li>
            <li className={`nav-item ${view === 'operation' ? 'active' : ''}`} onClick={() => { setView('operation'); setMobileMenuOpen(false); }}><Scissors size={20}/> <span>Operations</span></li>
            <li className={`nav-item ${view === 'pharmacy' ? 'active' : ''}`} onClick={() => { setView('pharmacy'); setMobileMenuOpen(false); }}><Pill size={20}/> <span>Pharmacy</span></li>
            <li className={`nav-item ${view === 'assets' ? 'active' : ''}`} onClick={() => { setView('assets'); setMobileMenuOpen(false); }}><Package size={20}/> <span>Assets</span></li>
            <li className={`nav-item ${view === 'billing' ? 'active' : ''}`} onClick={() => { setView('billing'); setMobileMenuOpen(false); }}><CreditCard size={20}/> <span>Billing</span></li>
          </ul>
        </nav>
        <div style={{ marginTop: 'auto', padding: '1rem' }}>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}><LogOut size={20}/> <span>Logout</span></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Menu size={24} /></button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, flex: 1 }}>
            {view === 'dashboard' ? 'FLOW BOARD' : view === 'patients' ? 'PATIENT DETAILS' : view === 'calendar' ? 'APPOINTMENTS' : view.toUpperCase()}
          </h1>
          {currentStaff && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 1rem', background: '#f8fafc', borderRadius: '2rem', border: '1px solid #e2e8f0' }}>
              <Avatar name={currentStaff.name} photoUrl={currentStaff.photoUrl} size={32} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', lineHeight: 1 }}>{currentStaff.name}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{currentStaff.role}</span>
              </div>
            </div>
          )}
        </header>
        <div className="main-content-inner" style={{ padding: '2rem' }}>
          <ErrorBoundary>
            {view === 'dashboard' && (role === 'Nurse' ? <NurseDashboard /> : (
              <DoctorDashboard 
                selectedMrn={selectedMrn}
                onSelectMrn={(mrn) => {
                  setSelectedMrn(mrn);
                  const patient = patients.find(p => p.mrn === mrn);
                  setSelectedPatient(patient ? { mrn: patient.mrn, name: patient.name, amharic: patient.amharic } : null);
                }}
                onStartConsult={(p) => { setSelectedPatient(p); setSelectedMrn(p.mrn); setSelectedTab('soap'); setView('encounter'); }}
                onViewHistory={(p) => { setSelectedPatient(p); setSelectedMrn(p.mrn); setSelectedTab('history'); setView('encounter'); }}
                onNewAppointment={() => setView('calendar')}
              />
            ))}
            {view === 'patients' && (
              <PatientManagement 
                onViewVitals={(p) => { setSelectedPatient(p); setView('vitals'); }}
                onViewEncounter={(p) => { setSelectedPatient(p); setSelectedTab('soap'); setView('encounter'); }}
                onRegister={() => setView('registration')}
                autoOpenId={autoOpenId}
                onModalClose={() => setAutoOpenId(null)}
              />
            )}
            {view === 'calendar' && <HospitalCalendar />}
            {view === 'vitals' && selectedPatient && (
              <VitalsEntry 
                patientName={selectedPatient.name}
                mrn={selectedPatient.mrn}
                onClose={() => setView('patients')}
              />
            )}
            {view === 'encounter' && selectedPatient && (
              <ClinicalEncounter 
                patientName={selectedPatient.name}
                onClose={() => setView('dashboard')}
                defaultTab={selectedTab}
              />
            )}
            {view === 'registration' && <PatientRegistration onClose={() => setView('dashboard')} />}
            {view === 'inpatient' && <InpatientManagement />}
            {view === 'staff' && <StaffManagement activeTab={staffTab} autoOpenId={autoOpenId} onModalClose={() => setAutoOpenId(null)} />}
            {view === 'lab' && <LabManagement />}
            {view === 'operation' && <OperationManagement />}
            {view === 'pharmacy' && <PharmacyManagement />}
            {view === 'assets' && <AssetManagement autoOpenId={autoOpenId} onModalClose={() => setAutoOpenId(null)} />}
            {view === 'billing' && <BillingManagement />}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default App;
