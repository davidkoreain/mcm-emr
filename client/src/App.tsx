import React, { useState } from 'react';
import {
  LayoutDashboard, Users, UserPlus, Package,
  Menu, X, Pill, Scissors, Beaker, LogOut,
  Bed, CreditCard, CalendarDays, ChevronDown, ChevronUp, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEMR } from './context/EMRContext';
import { DEFAULT_PERMISSIONS, STORAGE_KEY, type AllPerms } from './config/permissions';

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
import RolePermissions from './components/RolePermissions';

const App: React.FC = () => {
  const { role, setRole, loading, currentStaff, patients } = useEMR();
  const [view, setView] = useState('dashboard');

  const [permissions, setPermissions] = useState<AllPerms>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults so new menu keys are always present
        const merged: AllPerms = {};
        for (const r of Object.keys(DEFAULT_PERMISSIONS)) {
          merged[r] = { ...DEFAULT_PERMISSIONS[r], ...(parsed[r] ?? {}) };
        }
        return merged;
      }
    } catch { /* ignore */ }
    return DEFAULT_PERMISSIONS;
  });

  const savePermissions = (perms: AllPerms) => {
    setPermissions(perms);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perms));
  };

  const canSee = (menuKey: string): boolean => {
    if (!role || role === 'Patient' || role === 'Guardian') return false;
    if (role === 'Admin') return true;
    return permissions[role]?.[menuKey] ?? false;
  };
  const [selectedPatient, setSelectedPatient] = useState<{ mrn: string; name: string; amharic: string } | null>(null);
  const [selectedMrn, setSelectedMrn] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'soap' | 'imaging' | 'history'>('soap');
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [editingDrug, setEditingDrug] = useState<any | null>(null);
  const [signupFlow, setSignupFlow] = useState<'none' | 'patient' | 'guardian'>('none');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHrmOpen, setIsHrmOpen] = useState(false);
  const [staffTab, setStaffTab] = useState<'portfolio' | 'leave' | 'performance'>('portfolio');
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [labTab, setLabTab] = useState<'orders' | 'results'>('orders');
  const [isOperationOpen, setIsOperationOpen] = useState(false);
  const [operationTab, setOperationTab] = useState<'schedule' | 'resources' | 'supplies'>('schedule');
  const [isPharmacyOpen, setIsPharmacyOpen] = useState(false);
  const [pharmacyTab, setPharmacyTab] = useState<'prescriptions' | 'inventory'>('prescriptions');
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [assetsTab, setAssetsTab] = useState<'inventory' | 'maintenance' | 'loss'>('inventory');
  const [autoOpenId, setAutoOpenId] = useState<string | null>(null);

  React.useEffect(() => {
    // Handle Deep Linking from URL or SessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    let urlType = urlParams.get('type');
    let urlId = urlParams.get('id');

    // Fallback for some mobile browsers that might struggle with URLSearchParams
    if (!urlType || !urlId) {
      const matchType = window.location.search.match(/[?&]type=([^&]+)/);
      const matchId = window.location.search.match(/[?&]id=([^&]+)/);
      if (matchType) urlType = matchType[1];
      if (matchId) urlId = matchId[1];
    }

    // 1. If we have URL params, always save them to sessionStorage first
    if (urlType && urlId) {
      sessionStorage.setItem('pending_type', urlType);
      sessionStorage.setItem('pending_id', urlId);
      // Clean URL immediately to keep it tidy
      window.history.replaceState({}, '', window.location.pathname);
    }

    // 2. If logged in and we have pending items in sessionStorage, process them
    const pendingType = sessionStorage.getItem('pending_type');
    const pendingId = sessionStorage.getItem('pending_id');

    if (role && pendingType && pendingId && !autoOpenId) {
      const normalizedType = pendingType.toLowerCase();
      const normalizedId = pendingId.trim();
      
      console.log('Processing deep link:', normalizedType, normalizedId);
      setAutoOpenId(normalizedId);
      
      if (normalizedType === 'patient') setView('patients');
      else if (normalizedType === 'staff') {
        setView('staff');
        setStaffTab('portfolio');
        setIsHrmOpen(true);
      }
      else if (normalizedType === 'asset') setView('assets');

      // Clear after processing
      sessionStorage.removeItem('pending_type');
      sessionStorage.removeItem('pending_id');
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
            {canSee('dashboard') && <li className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }}><LayoutDashboard size={20}/> <span>Flow Board</span></li>}
            {canSee('patients')  && <li className={`nav-item ${view === 'patients'  ? 'active' : ''}`} onClick={() => { setView('patients');  setMobileMenuOpen(false); }}><Users size={20}/> <span>Patient Details</span></li>}
            {canSee('calendar')  && <li className={`nav-item ${view === 'calendar'  ? 'active' : ''}`} onClick={() => { setView('calendar');  setMobileMenuOpen(false); }}><CalendarDays size={20}/> <span>Appointments</span></li>}
            {canSee('inpatient') && <li className={`nav-item ${view === 'inpatient' ? 'active' : ''}`} onClick={() => { setView('inpatient'); setMobileMenuOpen(false); }}><Bed size={20}/> <span>Inpatient Ward</span></li>}

            {/* HRM 2nd Level Menu */}
            {canSee('staff') && (
              <>
                <li className={`nav-item ${view === 'staff' ? 'active' : ''}`} onClick={() => setIsHrmOpen(!isHrmOpen)} style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Users size={20}/> <span>HRM</span></div>
                  <div className="menu-arrow">{isHrmOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                </li>
                <AnimatePresence>
                  {isHrmOpen && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ listStyle: 'none', padding: '0 0 0 1.5rem', overflow: 'hidden' }}>
                      <li className={`sub-nav-item ${view === 'staff' && staffTab === 'portfolio'   ? 'active' : ''}`} onClick={() => { setView('staff'); setStaffTab('portfolio');   setMobileMenuOpen(false); }}><span>Members</span></li>
                      <li className={`sub-nav-item ${view === 'staff' && staffTab === 'leave'       ? 'active' : ''}`} onClick={() => { setView('staff'); setStaffTab('leave');       setMobileMenuOpen(false); }}><span>Leave Mgmt</span></li>
                      <li className={`sub-nav-item ${view === 'staff' && staffTab === 'performance' ? 'active' : ''}`} onClick={() => { setView('staff'); setStaffTab('performance'); setMobileMenuOpen(false); }}><span>Performance</span></li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Laboratory 2nd Level Menu */}
            {canSee('lab') && (
              <>
                <li className={`nav-item ${view === 'lab' ? 'active' : ''}`} onClick={() => setIsLabOpen(!isLabOpen)} style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Beaker size={20}/> <span>Laboratory</span></div>
                  <div className="menu-arrow">{isLabOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                </li>
                <AnimatePresence>
                  {isLabOpen && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ listStyle: 'none', padding: '0 0 0 1.5rem', overflow: 'hidden' }}>
                      <li className={`sub-nav-item ${view === 'lab' && labTab === 'orders'  ? 'active' : ''}`} onClick={() => { setView('lab'); setLabTab('orders');  setMobileMenuOpen(false); }}><span>Pending Orders</span></li>
                      <li className={`sub-nav-item ${view === 'lab' && labTab === 'results' ? 'active' : ''}`} onClick={() => { setView('lab'); setLabTab('results'); setMobileMenuOpen(false); }}><span>Results</span></li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Operations 2nd Level Menu */}
            {canSee('operation') && (
              <>
                <li className={`nav-item ${view === 'operation' ? 'active' : ''}`} onClick={() => setIsOperationOpen(!isOperationOpen)} style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Scissors size={20}/> <span>Operations</span></div>
                  <div className="menu-arrow">{isOperationOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                </li>
                <AnimatePresence>
                  {isOperationOpen && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ listStyle: 'none', padding: '0 0 0 1.5rem', overflow: 'hidden' }}>
                      <li className={`sub-nav-item ${view === 'operation' && operationTab === 'schedule'  ? 'active' : ''}`} onClick={() => { setView('operation'); setOperationTab('schedule');  setMobileMenuOpen(false); }}><span>OT Schedule</span></li>
                      <li className={`sub-nav-item ${view === 'operation' && operationTab === 'resources' ? 'active' : ''}`} onClick={() => { setView('operation'); setOperationTab('resources'); setMobileMenuOpen(false); }}><span>Resources</span></li>
                      <li className={`sub-nav-item ${view === 'operation' && operationTab === 'supplies'  ? 'active' : ''}`} onClick={() => { setView('operation'); setOperationTab('supplies');  setMobileMenuOpen(false); }}><span>Supply Tracking</span></li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Pharmacy 2nd Level Menu */}
            {canSee('pharmacy') && (
              <>
                <li className={`nav-item ${view === 'pharmacy' ? 'active' : ''}`} onClick={() => setIsPharmacyOpen(!isPharmacyOpen)} style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Pill size={20}/> <span>Pharmacy</span></div>
                  <div className="menu-arrow">{isPharmacyOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                </li>
                <AnimatePresence>
                  {isPharmacyOpen && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ listStyle: 'none', padding: '0 0 0 1.5rem', overflow: 'hidden' }}>
                      <li className={`sub-nav-item ${view === 'pharmacy' && pharmacyTab === 'prescriptions' ? 'active' : ''}`} onClick={() => { setView('pharmacy'); setPharmacyTab('prescriptions'); setMobileMenuOpen(false); }}><span>Prescriptions</span></li>
                      <li className={`sub-nav-item ${view === 'pharmacy' && pharmacyTab === 'inventory'     ? 'active' : ''}`} onClick={() => { setView('pharmacy'); setPharmacyTab('inventory');     setMobileMenuOpen(false); }}><span>Drug Inventory</span></li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Assets 2nd Level Menu */}
            {canSee('assets') && (
              <>
                <li className={`nav-item ${view === 'assets' ? 'active' : ''}`} onClick={() => setIsAssetsOpen(!isAssetsOpen)} style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Package size={20}/> <span>Assets</span></div>
                  <div className="menu-arrow">{isAssetsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                </li>
                <AnimatePresence>
                  {isAssetsOpen && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ listStyle: 'none', padding: '0 0 0 1.5rem', overflow: 'hidden' }}>
                      <li className={`sub-nav-item ${view === 'assets' && assetsTab === 'inventory'    ? 'active' : ''}`} onClick={() => { setView('assets'); setAssetsTab('inventory');    setMobileMenuOpen(false); }}><span>Inventory</span></li>
                      <li className={`sub-nav-item ${view === 'assets' && assetsTab === 'maintenance'  ? 'active' : ''}`} onClick={() => { setView('assets'); setAssetsTab('maintenance');  setMobileMenuOpen(false); }}><span>Maintenance</span></li>
                      <li className={`sub-nav-item ${view === 'assets' && assetsTab === 'loss'         ? 'active' : ''}`} onClick={() => { setView('assets'); setAssetsTab('loss');         setMobileMenuOpen(false); }}><span>Loss & Damage</span></li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </>
            )}

            {canSee('billing') && <li className={`nav-item ${view === 'billing' ? 'active' : ''}`} onClick={() => { setView('billing'); setMobileMenuOpen(false); }}><CreditCard size={20}/> <span>Billing</span></li>}

            {/* Permissions — Admin only */}
            {role === 'Admin' && (
              <li className={`nav-item ${view === 'permissions' ? 'active' : ''}`} onClick={() => { setView('permissions'); setMobileMenuOpen(false); }}>
                <Shield size={20}/> <span>Permissions</span>
              </li>
            )}
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
                onRegister={() => { setEditingPatient(null); setView('registration'); }}
                onEditPatient={(p) => { setEditingPatient(p); setView('registration'); }}
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
                patientMrn={selectedPatient.mrn}
                onClose={() => setView('dashboard')}
                defaultTab={selectedTab}
              />
            )}
            {view === 'registration' && (
              <PatientRegistration 
                initialData={editingPatient || undefined} 
                onClose={() => { setEditingPatient(null); setView('patients'); }} 
              />
            )}
            {view === 'inpatient' && <InpatientManagement />}
            {view === 'staff' && <StaffManagement activeTab={staffTab} autoOpenId={autoOpenId} onModalClose={() => setAutoOpenId(null)} />}
            {view === 'lab' && <LabManagement activeTab={labTab} />}
            {view === 'operation' && <OperationManagement activeTab={operationTab} />}
            {view === 'pharmacy' && <PharmacyManagement activeTab={pharmacyTab} />}
            {view === 'assets' && <AssetManagement activeTab={assetsTab} autoOpenId={autoOpenId} onModalClose={() => setAutoOpenId(null)} />}
            {view === 'billing' && <BillingManagement />}
            {view === 'permissions' && role === 'Admin' && <RolePermissions permissions={permissions} onUpdate={savePermissions} />}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default App;
