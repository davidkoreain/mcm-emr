import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Heart, Activity, FileText, Beaker, LogOut, 
  ChevronLeft, ChevronRight, Clock, User, Award, GraduationCap, Filter, Search, ShieldAlert, Scissors, Menu, CheckCircle2, ChevronDown, ChevronUp, Settings as SettingsIcon, Info
} from 'lucide-react';
import { useEMR, type StaffMember } from '../context/EMRContext';
import Avatar from './Avatar';

interface PortalProps {
  onLogout: () => void;
  isGuardianView?: boolean;
}

const JOURNEY_STEPS = [
  { id: 1, label: 'Discovery', icon: Search, color: '#3b82f6', desc: 'Find doctors and available appointment dates' },
  { id: 2, label: 'Application', icon: CalendarIcon, color: '#6366f1', desc: 'Request an appointment on your preferred date' },
  { id: 3, label: 'Confirmation', icon: Award, color: '#10b981', desc: 'Finalizing your medical appointment schedule' },
  { id: 4, label: 'Visit', icon: Clock, color: '#f59e0b', desc: 'Hospital visit and arrival notification' },
  { id: 5, label: 'Admission', icon: FileText, color: '#ec4899', desc: 'Registration and hospital admission procedures' },
  { id: 6, label: 'Consultation', icon: User, color: '#8b5cf6', desc: 'Medical consultation and initial assessment' },
  { id: 7, label: 'Examination', icon: Beaker, color: '#06b6d4', desc: 'Performing required clinical tests and exams' },
  { id: 8, label: 'Results', icon: FileText, color: '#14b8a6', desc: 'Receiving and reviewing your test results' },
  { id: 9, label: 'Diagnosis', icon: ShieldAlert, color: '#ef4444', desc: 'Official diagnosis from the medical team' },
  { id: 10, label: 'Treatment Plan', icon: GraduationCap, color: '#64748b', desc: 'Establishing treatment and action schedules' },
  { id: 11, label: 'Therapy', icon: Activity, color: '#f43f5e', desc: 'Medication, injections, and inpatient care' },
  { id: 12, label: 'Procedure', icon: Scissors, color: '#d946ef', desc: 'Surgeries and major medical procedures' },
  { id: 13, label: 'Monitoring', icon: Heart, color: '#f97316', desc: 'Real-time observation after medical actions' },
  { id: 14, label: 'Feedback', icon: Clock, color: '#2dd4bf', desc: 'Additional follow-ups and final feedback' },
];

const PatientPortal: React.FC<PortalProps> = ({ onLogout, isGuardianView = false }) => {
  const { currentUser, currentGuardian, patients, appointments, staff, addAppointment, labResults, surgeries, guardians, updatePrivacy } = useEMR();
  
  // Navigation State
  const [activeMenu, setActiveMenu] = useState<'info' | 'records' | 'appointments' | 'settings'>('appointments');
  const [appointmentsExpanded, setAppointmentsExpanded] = useState(true);
  const [currentJourneyStep, setCurrentJourneyStep] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync with browser history (hash-based)
  React.useEffect(() => {
    const syncWithUrl = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('step-')) {
        const step = parseInt(hash.replace('step-', ''));
        if (!isNaN(step) && step >= 1 && step <= 14) {
          setCurrentJourneyStep(step);
          setActiveMenu('appointments');
          setAppointmentsExpanded(true);
        }
      } else if (['info', 'records', 'settings'].includes(hash)) {
        setActiveMenu(hash as any);
      }
    };
    window.addEventListener('hashchange', syncWithUrl);
    syncWithUrl();
    return () => window.removeEventListener('hashchange', syncWithUrl);
  }, []);

  const changeStep = (step: number) => {
    setCurrentJourneyStep(step);
    window.location.hash = `step-${step}`;
    setMobileMenuOpen(false);
  };

  const changeMenu = (menu: 'info' | 'records' | 'appointments' | 'settings') => {
    setActiveMenu(menu);
    if (menu !== 'appointments') {
      window.location.hash = menu;
    } else {
      window.location.hash = `step-${currentJourneyStep}`;
    }
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
      alert(`Appointment scheduled: Dr. ${selDoc.name}`);
      changeStep(3);
    } catch (e) { alert('Failed to book.'); }
  };

  const MainMenuItem = ({ id, label, icon: Icon, expandable = false }: { id: any, label: string, icon: any, expandable?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={() => {
          if (expandable) {
            setAppointmentsExpanded(!appointmentsExpanded);
            if (!appointmentsExpanded) changeMenu('appointments');
          } else {
            changeMenu(id);
          }
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1rem',
          borderRadius: '0.75rem',
          border: 'none',
          background: activeMenu === id ? '#f1f5f9' : 'transparent',
          color: activeMenu === id ? '#2563eb' : '#64748b',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign: 'left'
        }}
      >
        <Icon size={20} />
        <span style={{ flex: 1, fontWeight: '800', fontSize: '0.95rem' }}>{label}</span>
        {expandable && (appointmentsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
      </button>
      
      {expandable && appointmentsExpanded && (
        <div style={{ marginLeft: '1.25rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', borderLeft: '2px solid #f1f5f9' }}>
          {JOURNEY_STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => changeStep(step.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: (activeMenu === 'appointments' && currentJourneyStep === step.id) ? `${step.color}10` : 'transparent',
                color: (activeMenu === 'appointments' && currentJourneyStep === step.id) ? step.color : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: step.id < currentJourneyStep ? '#10b98115' : (activeMenu === 'appointments' && currentJourneyStep === step.id) ? step.color : '#f8fafc',
                color: step.id < currentJourneyStep ? '#10b981' : (activeMenu === 'appointments' && currentJourneyStep === step.id) ? 'white' : '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {step.id < currentJourneyStep ? <CheckCircle2 size={12} /> : <step.icon size={12} />}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Inter, sans-serif' }}>
    
      {/* Sidebar - 2-Level Navigation */}
      <aside 
        className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{ 
          width: '320px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', 
          position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 900, transition: 'transform 0.3s ease'
        }}
      >
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#2563eb', padding: '0.5rem', borderRadius: '0.75rem' }}>
              <Activity color="white" size={24} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MCM Medical</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap' }}>Journey Portal</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '1rem' }}>
            <Avatar name={activeUser.name} size={36} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeUser.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>{activeUser.mrn}</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <MainMenuItem id="info" label="Patient Information" icon={Info} />
          <MainMenuItem id="records" label="Medical Records" icon={FileText} />
          <MainMenuItem id="appointments" label="Appointments" icon={CalendarIcon} expandable />
          <MainMenuItem id="settings" label="Settings" icon={SettingsIcon} />
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.85rem 1.25rem', borderRadius: '0.85rem', fontWeight: '800', cursor: 'pointer' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="patient-portal-main" style={{ marginLeft: '320px', padding: '2.5rem' }}>
        {/* Mobile Header Overlay */}
        <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: '64px', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', zIndex: 800, alignItems: 'center', padding: '0 1.25rem', justifyContent: 'space-between' }} className="mobile-only-flex">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity color="#2563eb" size={24} />
            <span style={{ fontWeight: '900', color: '#0f172a' }}>Journey Portal</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}>
            <Menu size={20} color="#475569" />
          </button>
        </div>

        <div style={{ maxWidth: '1000px' }}>
          {/* Patient Information View */}
          {activeMenu === 'info' && (
            <section>
              <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2rem' }}>Patient Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#64748b' }}>Demographics</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <InfoRow label="Full Name" value={activeUser.name} />
                    <InfoRow label="Date of Birth" value={activeUser.dob} />
                    <InfoRow label="Gender" value={activeUser.gender} />
                    <InfoRow label="Phone" value={activeUser.phone} />
                  </div>
                </div>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#64748b' }}>Clinical Identifiers</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <InfoRow label="Medical Record Number (MRN)" value={activeUser.mrn} />
                    <InfoRow label="Primary Language" value={activeUser.language || 'English'} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Medical Records View */}
          {activeMenu === 'records' && (
            <section>
              <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2rem' }}>Medical Records</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Beaker size={20} color="#2563eb" /> Laboratory Results
                  </h3>
                  {filteredLabs.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                      {filteredLabs.map((l, i) => (
                        <div key={i} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '1.5rem', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{l.test}</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2563eb' }}>{l.value} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{l.unit}</span></div>
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ color: '#94a3b8' }}>No lab results available.</p>}
                </div>
                
                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Scissors size={20} color="#7c3aed" /> Surgical History
                  </h3>
                  {surgeries.filter(s => s.patientMrn === activeUser.mrn).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {surgeries.filter(s => s.patientMrn === activeUser.mrn).map((s, i) => (
                        <div key={i} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '1.25rem', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontWeight: '900', fontSize: '1.05rem' }}>{s.operationName}</div>
                          <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>{new Date(s.startTime).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ color: '#94a3b8' }}>No surgical history recorded.</p>}
                </div>
              </div>
            </section>
          )}

          {/* Appointments / Journey View */}
          {activeMenu === 'appointments' && (
            <section>
              <div style={{ marginBottom: '2.5rem', background: `linear-gradient(135deg, ${JOURNEY_STEPS[currentJourneyStep-1].color}15 0%, #ffffff 100%)`, padding: '2.5rem', borderRadius: '2rem', border: `1px solid ${JOURNEY_STEPS[currentJourneyStep-1].color}30`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05 }}>
                  {React.createElement(JOURNEY_STEPS[currentJourneyStep-1].icon, { size: 180, color: JOURNEY_STEPS[currentJourneyStep-1].color })}
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <span style={{ background: JOURNEY_STEPS[currentJourneyStep-1].color, color: 'white', padding: '0.35rem 1rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '900' }}>Step {currentJourneyStep}</span>
                    <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>{JOURNEY_STEPS[currentJourneyStep-1].label}</span>
                  </div>
                  <h2 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.75rem' }}>{JOURNEY_STEPS[currentJourneyStep-1].desc}</h2>
                  <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '700px', lineHeight: '1.7', marginBottom: '2rem' }}>
                    {currentJourneyStep === 1 ? 'Please select your preferred date and medical specialist.' : 
                     currentJourneyStep === 2 ? 'Your application is being reviewed by the hospital.' :
                     currentJourneyStep === 3 ? 'Your appointment is confirmed!' :
                     currentJourneyStep === 4 ? 'Today is your appointment day.' :
                     currentJourneyStep === 5 ? 'Registration and admission procedures are in progress.' :
                     currentJourneyStep === 6 ? 'You are now having a consultation with the medical team.' :
                     currentJourneyStep === 7 ? 'Tests are being performed as prescribed.' :
                     currentJourneyStep === 8 ? 'Your test results are being analyzed.' :
                     currentJourneyStep === 9 ? 'The medical team has provided a final diagnosis.' :
                     currentJourneyStep === 10 ? 'We are establishing a detailed schedule for your treatment.' :
                     currentJourneyStep === 11 ? 'This is the stage for prescribed medications or inpatient care.' :
                     currentJourneyStep === 12 ? 'This stage is for surgeries or major medical procedures.' :
                     currentJourneyStep === 13 ? 'Observing your condition after all procedures.' :
                     'Your medical journey is complete.'}
                  </p>
                  <button onClick={() => setCurrentJourneyStep(prev => Math.min(prev + 1, 14))} style={{ background: JOURNEY_STEPS[currentJourneyStep-1].color, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '1rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Next Step <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Step Specific Modules */}
              {currentJourneyStep <= 3 && (
                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{bookingStep === 1 ? 'Select Date' : bookingStep === 2 ? 'Select Specialist' : 'Confirm Time'}</h3>
                    {bookingStep > 1 && <button onClick={() => setBookingStep((bookingStep - 1) as 1 | 2 | 3)} style={{ background: '#f1f5f9', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: '800', color: '#475569', cursor: 'pointer' }}>Back</button>}
                  </div>
                  {bookingStep === 1 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8' }}>{d}</div>)}
                      {days.map((d, i) => d ? (
                        <button key={i} onClick={() => { setSelDate(d); setBookingStep(2); }} style={{ aspectRatio: '1', borderRadius: '1.25rem', border: '1px solid #f1f5f9', cursor: 'pointer', background: '#f8fafc', fontWeight: '800' }}>{d.getDate()}</button>
                      ) : <div key={i} />)}
                    </div>
                  )}
                  {bookingStep === 2 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                      {doctors.map(doc => (
                        <div key={doc.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <Avatar name={doc.name} size={48} />
                            <div><div style={{ fontWeight: '900' }}>Dr. {doc.name}</div><div style={{ fontSize: '0.75rem', color: '#2563eb' }}>{doc.specialization}</div></div>
                          </div>
                          <button onClick={() => { setSelDoc(doc); setBookingStep(3); }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.7rem 1.25rem', borderRadius: '0.85rem', fontWeight: '800', cursor: 'pointer' }}>Select</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {bookingStep === 3 && (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                        {slots.map(t => <button key={t} onClick={() => setSelTime(t)} style={{ padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid', borderColor: selTime === t ? '#2563eb' : '#e2e8f0', background: selTime === t ? '#2563eb' : 'white', color: selTime === t ? 'white' : '#1e293b', fontWeight: '800' }}>{t}</button>)}
                      </div>
                      <button onClick={handleBooking} disabled={!selTime} style={{ width: '100%', marginTop: '3rem', padding: '1.5rem', borderRadius: '1.5rem', background: selTime ? '#2563eb' : '#cbd5e1', color: 'white', fontWeight: '900', fontSize: '1.2rem', border: 'none', cursor: 'pointer' }}>Confirm Appointment</button>
                    </div>
                  )}
                </div>
              )}

              {/* Placeholder for others */}
              {currentJourneyStep >= 4 && (
                <div style={{ background: 'white', padding: '4rem 2rem', borderRadius: '2rem', border: '2px dashed #e2e8f0', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{JOURNEY_STEPS[currentJourneyStep-1].label} Details</h3>
                  <p style={{ color: '#64748b' }}>Functional modules for this step are being synchronized with clinical systems.</p>
                </div>
              )}
            </section>
          )}

          {/* Settings View */}
          {activeMenu === 'settings' && (
            <section>
              <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2rem' }}>Settings</h2>
              <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '1.5rem' }}>Privacy Controls</h3>
                {isGuardianView && currentGuardian ? (
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <PrivacyToggle label="Show Clinical Notes" value={!!privacy.showNotes} onToggle={() => updatePrivacy(currentGuardian.id, { ...privacy, showNotes: !privacy.showNotes })} />
                    <PrivacyToggle label="Show Lab Results" value={!!privacy.showLabs} onToggle={() => updatePrivacy(currentGuardian.id, { ...privacy, showLabs: !privacy.showLabs })} />
                    <PrivacyToggle label="Show Surgery Data" value={!!privacy.showSurgeries} onToggle={() => updatePrivacy(currentGuardian.id, { ...privacy, showSurgeries: !privacy.showSurgeries })} />
                  </div>
                ) : <p style={{ color: '#64748b' }}>Privacy settings are managed by your appointed guardian.</p>}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string, value: any }) => (
  <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginTop: '0.25rem' }}>{value}</div>
  </div>
);

const PrivacyToggle = ({ label, value, onToggle }: { label: string, value: boolean, onToggle: () => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}>
    <span style={{ fontWeight: '700' }}>{label}</span>
    <button onClick={onToggle} style={{ width: '48px', height: '24px', background: value ? '#2563eb' : '#cbd5e1', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '2px', left: value ? '26px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'all 0.2s' }} />
    </button>
  </div>
);

export default PatientPortal;
