import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Heart, Activity, FileText, Beaker, LogOut, 
  ChevronLeft, ChevronRight, Clock, User, Award, GraduationCap, Filter, Search, ShieldAlert, Scissors, Menu
} from 'lucide-react';
import { useEMR, type StaffMember } from '../context/EMRContext';
import Avatar from './Avatar';

interface PortalProps {
  onLogout: () => void;
  isGuardianView?: boolean;
}

const PatientPortal: React.FC<PortalProps> = ({ onLogout, isGuardianView = false }) => {
  const { currentUser, currentGuardian, patients, appointments, staff, addAppointment, labResults, surgeries, guardians } = useEMR();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'records' | 'privacy'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync tab with browser history (hash-based)
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as any;
      const validTabs = ['dashboard', 'calendar', 'records', 'privacy'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initialize from hash if present
    if (window.location.hash) {
      handleHashChange();
    } else {
      window.location.hash = 'dashboard';
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    setMobileMenuOpen(false);
  };
  
  const activeUser = isGuardianView ? patients.find(p => p.mrn === currentGuardian?.patientMrn) : currentUser;

  // Booking State
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selDate, setSelDate] = useState<Date | null>(null);
  const [selDoc, setSelDoc] = useState<StaffMember | null>(null);
  const [selTime, setSelTime] = useState<string | null>(null);

  // Filter State
  const [fSpec, setFSpec] = useState('');
  const [fGender, setFGender] = useState('');
  const [fAge, setFAge] = useState('');

  if (!activeUser) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

  const myGuardian = guardians.find(g => g.patientMrn === activeUser.mrn);
  const privacy = myGuardian?.privacySettings || { showNotes: true, showLabs: true, showSurgeries: true };
  const canSeeNotes = isGuardianView || privacy.showNotes;
  const filteredLabs = labResults.filter(r => r.patientMrn === activeUser.mrn).filter(() => isGuardianView || privacy.showLabs);

  const specs = useMemo(() => Array.from(new Set(staff.filter(s => s.role.includes('Doctor')).map(s => s.specialization))), [staff]);
  const doctors = useMemo(() => {
    return staff.filter(s => {
      if (!s.role.includes('Doctor')) return false;
      if (fSpec && s.specialization !== fSpec) return false;
      if (fGender && s.gender !== fGender) return false;
      if (fAge) {
        if (fAge === '20-35' && (s.age < 20 || s.age > 35)) return false;
        if (fAge === '36-50' && (s.age < 36 || s.age > 50)) return false;
        if (fAge === '51+' && s.age < 51) return false;
      }
      return true;
    });
  }, [staff, fSpec, fGender, fAge]);

  const days = useMemo(() => {
    const arr = [];
    const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const last = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    for (let i = 0; i < first; i++) arr.push(null);
    for (let i = 1; i <= last; i++) arr.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    return arr;
  }, [currentMonth]);

  const slots = useMemo(() => {
    const s = [];
    for (let h = 9; h < 17; h++) {
      for (let m = 0; m < 60; m += 15) s.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
    return s;
  }, []);

  const handleBooking = async () => {
    if (!selDate || !selDoc || !selTime) return;
    const [h, m] = selTime.split(':');
    const start = new Date(selDate);
    start.setHours(parseInt(h), parseInt(m), 0, 0);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + 15);

    try {
      await addAppointment({
        patientMrn: activeUser.mrn, doctorId: selDoc.id,
        startTime: start.toISOString(), endTime: end.toISOString(),
        status: 'Scheduled', notes: isGuardianView ? 'Guardian' : 'Patient'
      });
      alert(`Booked with Dr. ${selDoc.name}`);
      setBookingStep(1); setActiveTab('dashboard');
    } catch (e) { alert('Failed to book.'); }
  };

  const TabBtn = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button 
      onClick={() => changeTab(id)} 
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.85rem 1.25rem', 
        borderRadius: '0.85rem', 
        border: 'none', 
        cursor: 'pointer',
        background: activeTab === id ? '#2563eb' : 'transparent', 
        color: activeTab === id ? 'white' : '#64748b', 
        fontWeight: '700',
        fontSize: '0.95rem',
        transition: 'all 0.2s ease',
        textAlign: 'left'
      }}
      onMouseOver={e => {
        if (activeTab !== id) {
          e.currentTarget.style.background = '#eff6ff';
          e.currentTarget.style.color = '#2563eb';
        }
      }}
      onMouseOut={e => {
        if (activeTab !== id) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#64748b';
        }
      }}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Inter, sans-serif' }}>
    
      {/* Sidebar */}
      <aside 
        className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{ 
          width: '280px', 
          background: 'white', 
          borderRight: '1px solid #e2e8f0', 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'fixed', 
          height: '100vh', 
          left: 0, 
          top: 0, 
          zIndex: 900,
          transition: 'transform 0.3s ease'
        }}
      >
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <Avatar name={activeUser.name} size={48} />
            <div style={{ overflow: 'hidden' }}>
              <h1 style={{ fontSize: '1.1rem', fontWeight: '900', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeUser.name}</h1>
              <p style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: '700', margin: 0 }}>{isGuardianView ? 'Guardian View' : 'Patient'}</p>
            </div>
          </div>
          <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>
            MRN: {activeUser.mrn}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <TabBtn id="dashboard" label="Dashboard" icon={Activity} />
          <TabBtn id="calendar" label="Appointments" icon={CalendarIcon} />
          <TabBtn id="records" label="Medical Records" icon={FileText} />
          {isGuardianView && <TabBtn id="privacy" label="Privacy Controls" icon={ShieldAlert} />}
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid #f1f5f9' }}>
          <button 
            onClick={onLogout} 
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              background: '#fee2e2', 
              color: '#dc2626', 
              border: 'none', 
              padding: '0.85rem 1.25rem', 
              borderRadius: '0.85rem', 
              fontWeight: '800', 
              fontSize: '0.9rem', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#fecaca'}
            onMouseOut={e => e.currentTarget.style.background = '#fee2e2'}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="patient-portal-main">
        {/* Mobile Header Overlay */}
        <div style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
          zIndex: 800,
          alignItems: 'center',
          padding: '0 1.25rem',
          justifyContent: 'space-between'
        }} className="mobile-only-flex">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity color="#2563eb" size={24} />
            <span style={{ fontWeight: '900', color: '#0f172a' }}>MCM Patient Portal</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}
          >
            <Menu size={20} color="#475569" />
          </button>
        </div>
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em' }}>
              {activeTab === 'dashboard' && 'Welcome Back,'}
              {activeTab === 'calendar' && 'Appointments'}
              {activeTab === 'records' && 'Medical Records'}
              {activeTab === 'privacy' && 'Privacy Controls'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '0.25rem' }}>
              {activeTab === 'dashboard' && "Here's what's happening with your health today."}
              {activeTab === 'calendar' && 'Schedule and manage your doctor visits.'}
              {activeTab === 'records' && 'Review your clinical history and lab results.'}
              {activeTab === 'privacy' && 'Control what information the patient can see.'}
            </p>
          </div>
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Last Update</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </header>

        <div style={{ maxWidth: '1100px' }}>
          {activeTab === 'dashboard' && (
            <>
              {/* Service Shortcuts Grid (OpenEMR Style) */}
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={18} color="#2563eb" /> Quick Services
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                  gap: '1rem' 
                }}>
                  {[
                    { label: 'Appointments', icon: CalendarIcon, color: '#3b82f6', bg: '#eff6ff', tab: 'calendar' },
                    { label: 'Clinical Records', icon: FileText, color: '#10b981', bg: '#ecfdf5', tab: 'records' },
                    { label: 'Lab Results', icon: Beaker, color: '#f59e0b', bg: '#fffbeb', tab: 'records' },
                    { label: 'Messages', icon: Clock, color: '#8b5cf6', bg: '#f5f3ff', tab: 'dashboard' },
                    { label: 'Health Snapshot', icon: Activity, color: '#ef4444', bg: '#fef2f2', tab: 'dashboard' },
                    { label: 'Billing', icon: Award, color: '#06b6d4', bg: '#ecfeff', tab: 'dashboard' },
                    { label: 'Documents', icon: GraduationCap, color: '#6366f1', bg: '#eef2ff', tab: 'records' },
                    { label: 'Profile', icon: User, color: '#ec4899', bg: '#fdf2f8', tab: 'dashboard' },
                    { label: 'Settings', icon: Filter, color: '#64748b', bg: '#f8fafc', tab: 'dashboard' },
                    { label: 'Help Center', icon: ShieldAlert, color: '#475569', bg: '#f1f5f9', tab: 'dashboard' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => item.tab && changeTab(item.tab as any)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem 1rem',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '1.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        gap: '0.75rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0,0,0,0.1)';
                        e.currentTarget.style.borderColor = item.color;
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <div style={{ 
                        background: item.bg, 
                        color: item.color, 
                        padding: '0.75rem', 
                        borderRadius: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <item.icon size={24} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#334155' }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="stats-grid">
                <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '1rem' }}>
                      <Activity color="#ef4444" size={24}/>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Vitals Summary</h3>
                  </div>
                  {activeUser.vitals[0] ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a' }}>{activeUser.vitals[0].bpSystolic}/{activeUser.vitals[0].bpDiastolic}</span>
                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>mmHg</span>
                      </div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} color="#94a3b8" />
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Checked: {new Date(activeUser.vitals[0].recordedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ) : <p style={{ color: '#94a3b8' }}>No vitals found.</p>}
                </div>

                <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#fdf2f8', padding: '0.75rem', borderRadius: '1rem' }}>
                      <Heart color="#db2777" size={24}/>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Next Appointment</h3>
                  </div>
                  {appointments.filter(a => a.patientMrn === activeUser.mrn && new Date(a.startTime) > new Date()).slice(0,1).map(a => (
                    <div key={a.id}>
                      <p style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>{new Date(a.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Avatar name={staff.find(s => s.id === a.doctorId)?.name || ''} size={28} />
                        <span style={{ fontSize: '0.95rem', color: '#475569', fontWeight: '600' }}>Dr. {staff.find(s => s.id === a.doctorId)?.name}</span>
                      </div>
                    </div>
                  ))[0] || <p style={{ color: '#94a3b8' }}>No upcoming visits.</p>}
                </div>
              </div>
            </>
          )}

          {activeTab === 'calendar' && (
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '900' }}>
                  {bookingStep === 1 ? 'Choose Preferred Date' : bookingStep === 2 ? 'Select Specialist' : 'Confirm Time Slot'}
                </h3>
                {bookingStep > 1 && (
                  <button 
                    onClick={() => setBookingStep((bookingStep - 1) as 1 | 2 | 3)} 
                    style={{ background: '#f1f5f9', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: '800', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                )}
              </div>

              {bookingStep === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', padding: '1rem' }}>{d}</div>)}
                  {days.map((d, i) => d ? (
                    <button 
                      key={i} 
                      onClick={() => { setSelDate(d); setBookingStep(2); }} 
                      style={{
                        aspectRatio: '1', borderRadius: '1.25rem', border: '1px solid #f1f5f9', cursor: 'pointer',
                        background: '#f8fafc', color: '#1e293b', fontWeight: '800', fontSize: '1.1rem', transition: 'all 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#2563eb'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#f1f5f9'}
                    >{d.getDate()}</button>
                  ) : <div key={i} />)}
                </div>
              )}

              {bookingStep === 2 && (
                <div>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '1.25rem', display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Specialty</label>
                      <select onChange={e => setFSpec(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: 'white', fontWeight: '600' }}>
                        <option value="">All Specialties</option>
                        {specs.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Gender</label>
                      <select onChange={e => setFGender(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: 'white', fontWeight: '600' }}>
                        <option value="">All Genders</option><option value="Male">Male</option><option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {doctors.map(doc => (
                      <div key={doc.id} style={{ background: 'white', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <Avatar name={doc.name} size={48} />
                          <div>
                            <div style={{ fontWeight: '900', fontSize: '1rem' }}>Dr. {doc.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: '700', textTransform: 'uppercase' }}>{doc.specialization}</div>
                          </div>
                        </div>
                        <button onClick={() => { setSelDoc(doc); setBookingStep(3); }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>Select</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '1rem' }}>
                    {slots.map(t => (
                      <button 
                        key={t} 
                        onClick={() => setSelTime(t)} 
                        style={{
                          padding: '1rem', borderRadius: '1rem', border: '1px solid',
                          borderColor: selTime === t ? '#2563eb' : '#e2e8f0',
                          background: selTime === t ? '#2563eb' : 'white', 
                          color: selTime === t ? 'white' : '#1e293b',
                          fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >{t}</button>
                    ))}
                  </div>
                  <button 
                    onClick={handleBooking} 
                    disabled={!selTime} 
                    style={{ 
                      width: '100%', marginTop: '2.5rem', padding: '1.25rem', borderRadius: '1.25rem', 
                      background: selTime ? '#2563eb' : '#cbd5e1', color: 'white', 
                      fontWeight: '900', fontSize: '1.1rem', border: 'none', cursor: selTime ? 'pointer' : 'not-allowed',
                      boxShadow: selTime ? '0 10px 15px -3px rgba(37, 99, 235, 0.4)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    Confirm Appointment
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'records' && (
            <div style={{ display: 'grid', gap: '2rem' }}>
              <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '1rem' }}>
                    <FileText color="#2563eb" size={24}/>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '900' }}>Consultation Notes</h3>
                </div>
                {canSeeNotes ? (
                  <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #f1f5f9', lineHeight: '1.7', color: '#475569', fontSize: '1rem' }}>
                    {activeUser.diagnosisSummary || 'No recent notes available in your record.'}
                  </div>
                ) : <PrivacyBar />}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '1rem' }}>
                      <Beaker color="#b45309" size={24}/>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '900' }}>Lab Results</h3>
                  </div>
                  {(isGuardianView || privacy.showLabs) && filteredLabs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {filteredLabs.map((l, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                          <span style={{ fontWeight: '800', color: '#1e293b' }}>{l.test}</span>
                          <span style={{ fontWeight: '900', color: '#2563eb', background: 'white', padding: '0.5rem 1rem', borderRadius: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>{l.value} {l.unit}</span>
                        </div>
                      ))}
                    </div>
                  ) : <PrivacyBar />}
                </div>

                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#f5f3ff', padding: '0.75rem', borderRadius: '1rem' }}>
                      <Scissors color="#7c3aed" size={24}/>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '900' }}>Surgery Records</h3>
                  </div>
                  {(isGuardianView || privacy.showSurgeries) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {surgeries.filter(s => s.patientMrn === activeUser.mrn).length > 0 ? (
                        surgeries.filter(s => s.patientMrn === activeUser.mrn).map((s, i) => (
                          <div key={i} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '1.25rem', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontWeight: '900', fontSize: '1.05rem', color: '#1e293b' }}>{s.operationName}</div>
                            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
                              <CalendarIcon size={14} />
                              {new Date(s.startTime).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </div>
                          </div>
                        ))
                      ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No surgical history.</p>}
                    </div>
                  ) : <PrivacyBar />}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && isGuardianView && currentGuardian && (
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e293b' }}>Global Privacy Settings</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  These settings affect what <strong style={{ color: '#1e293b' }}>{activeUser.name}</strong> sees when they log into their own Patient Portal account.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {[
                  { label: 'Clinical Notes', key: 'showNotes', icon: <FileText size={22}/>, desc: 'Detailed diagnoses, doctor notes, and clinical histories.' },
                  { label: 'Lab Results', key: 'showLabs', icon: <Beaker size={22}/>, desc: 'Test data, blood work, and pathology reports.' },
                  { label: 'Surgery Data', key: 'showSurgeries', icon: <Scissors size={22}/>, desc: 'Operation schedules, procedures, and recovery logs.' },
                ].map(({ label, key, icon, desc }) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '2rem', background: '#f8fafc', borderRadius: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ background: 'white', padding: '0.75rem', borderRadius: '1rem', color: '#7c3aed', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>{icon}</div>
                      <button 
                        onClick={async () => {
                          const newSettings = { ...currentGuardian.privacySettings, [key]: !(currentGuardian.privacySettings as any)[key] };
                          await useEMR().updatePrivacy(currentGuardian.id, newSettings);
                        }}
                        style={{ 
                          width: '48px', height: '24px', background: (currentGuardian.privacySettings as any)[key] ? '#7c3aed' : '#cbd5e1', 
                          borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ 
                          position: 'absolute', top: '2px', left: (currentGuardian.privacySettings as any)[key] ? '26px' : '2px',
                          width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'all 0.2s'
                        }} />
                      </button>
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1e293b' }}>{label}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.5' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const PrivacyBar = () => (
  <div style={{ padding: '3rem', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', borderRadius: '1.5rem', border: '2px dashed #e2e8f0', textAlign: 'center' }}>
    <div style={{ background: '#fff7ed', width: '48px', height: '48px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
      <ShieldAlert color="#c2410c" size={28} />
    </div>
    <h4 style={{ fontWeight: '900', fontSize: '1.1rem', margin: '0 0 0.5rem', color: '#9a3412' }}>Information Restricted</h4>
    <p style={{ fontSize: '0.9rem', color: '#9a3412', opacity: 0.8, margin: 0 }}>This section is currently managed by your guardian's privacy settings.</p>
  </div>
);

export default PatientPortal;
