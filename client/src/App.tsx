import React, { useState } from 'react';
import {
  LayoutDashboard, Users, UserPlus, Package,
  Menu, X, Pill, Scissors, Beaker, LogOut,
  Bed, CreditCard, CalendarDays, ChevronDown, ChevronUp, Shield, Settings,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEMR } from './context/EMRContext';
import { DEFAULT_PERMISSIONS, STORAGE_KEY, MENU_STRUCTURE, type AllPerms, type MenuItem } from './config/permissions';

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
import MenuConfiguration from './components/MenuConfiguration';
import AdjustmentSettings from './components/AdjustmentSettings';

const ICON_COMPONENTS: Record<string, any> = {
  LayoutDashboard, Users, UserPlus, Package, Pill, Scissors, Beaker,
  Bed, CreditCard, CalendarDays, Shield, Settings, HelpCircle
};

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoOpenId, setAutoOpenId] = useState<string | null>(null);

  const [menuStructure] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('emr_custom_menu_structure');
    if (saved) {
      try { return JSON.parse(saved); } catch { return MENU_STRUCTURE; }
    }
    return MENU_STRUCTURE;
  });

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
            {menuStructure.map((menu) => {
              if (!canSee(menu.key)) return null;
              
              const Icon = ICON_COMPONENTS[menu.icon || 'HelpCircle'] || HelpCircle;
              const hasChildren = menu.children && menu.children.length > 0;
              const isOpen = openMenus[menu.key];
              const isActive = view === menu.key || (menu.children?.some((c: any) => view === c.key));

              return (
                <React.Fragment key={menu.key}>
                  <li 
                    className={`nav-item ${isActive && !hasChildren ? 'active' : ''}`} 
                    onClick={() => {
                      if (hasChildren) {
                        toggleMenu(menu.key);
                      } else {
                        setView(menu.key);
                        setMobileMenuOpen(false);
                      }
                    }}
                    style={{ justifyContent: hasChildren ? 'space-between' : 'flex-start' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Icon size={20}/> <span>{menu.label}</span>
                    </div>
                    {hasChildren && (
                      <div className="menu-arrow">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                    )}
                  </li>
                  {hasChildren && (
                    <AnimatePresence>
                      {isOpen && (
                        <motion.ul 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          transition={{ duration: 0.3, ease: 'easeInOut' }} 
                          style={{ listStyle: 'none', padding: '0 0 0 1.5rem', overflow: 'hidden' }}
                        >
                           {menu.children?.map((child: any) => {
                             if (!canSee(child.key)) return null;
                             
                             let isChildActive = view === child.key;
                             const tab = child.key.includes('.') ? child.key.split('.')[1] : child.key;
                             
                             if (view === 'staff' && menu.key === 'staff') isChildActive = staffTab === tab;
                             if (view === 'lab' && menu.key === 'lab') isChildActive = labTab === tab;
                             if (view === 'operation' && menu.key === 'operation') isChildActive = operationTab === tab;
                             if (view === 'pharmacy' && menu.key === 'pharmacy') isChildActive = pharmacyTab === tab;
                             if (view === 'assets' && menu.key === 'assets') isChildActive = assetsTab === tab;
                            
                            return (
                              <li 
                                key={child.key}
                                className={`sub-nav-item ${isChildActive ? 'active' : ''}`} 
                                onClick={() => { 
                                  const isModuleWithTabs = ['staff', 'lab', 'operation', 'pharmacy', 'assets'].includes(menu.key);
                                  
                                  if (isModuleWithTabs) {
                                    setView(menu.key);
                                    const tab = child.key.includes('.') ? child.key.split('.')[1] : child.key;
                                    if (menu.key === 'staff') setStaffTab(tab as any);
                                    if (menu.key === 'lab') setLabTab(tab as any);
                                    if (menu.key === 'operation') setOperationTab(tab as any);
                                    if (menu.key === 'pharmacy') setPharmacyTab(tab as any);
                                    if (menu.key === 'assets') setAssetsTab(tab as any);
                                  } else {
                                    setView(child.key);
                                  }
                                  setMobileMenuOpen(false); 
                                }}
                              >
                                <span>{child.label}</span>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  )}
                </React.Fragment>
              );
            })}
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
            {view === 'dashboard' ? 'FLOW BOARD' : 
             view === 'patients' ? 'PATIENT DETAILS' : 
             view === 'calendar' ? 'APPOINTMENTS' : 
             view === 'menu_config' ? 'MENU CONFIGURATION' :
             view === 'adjustment' ? 'DISPLAY ADJUSTMENTS' :
             view.toUpperCase().replace('_', ' ')}
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
            {view === 'menu_config' && role === 'Admin' && <MenuConfiguration />}
            {view === 'adjustment' && role === 'Admin' && <AdjustmentSettings />}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default App;
