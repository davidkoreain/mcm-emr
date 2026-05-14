import React, { useState, useMemo, useRef } from 'react';
import { 
  Calendar as CalendarIcon, Heart, Activity, FileText, Beaker, LogOut, 
  ChevronLeft, ChevronRight, Clock, User, Award, GraduationCap, Filter, Search, ShieldAlert, Scissors, Menu, CheckCircle2, ChevronDown, ChevronUp, Settings as SettingsIcon, Info, Edit, Save, X, Camera, ArrowUpDown, Star, BookOpen, Briefcase, Medal
} from 'lucide-react';
import { useEMR, type StaffMember, type Patient } from '../context/EMRContext';
import Avatar from './Avatar';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { currentUser, currentGuardian, patients, staff, staffLeave, addAppointment, labResults, guardians, updatePatient } = useEMR();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigation
  const [activeMenu, setActiveMenu] = useState<'info' | 'records' | 'appointments' | 'settings'>('appointments');
  const [appointmentsExpanded, setAppointmentsExpanded] = useState(true);
  const [currentJourneyStep, setCurrentJourneyStep] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Patient>>({});

  React.useEffect(() => {
    const syncWithUrl = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('step-')) {
        const step = parseInt(hash.replace('step-', ''));
        if (!isNaN(step)) { setCurrentJourneyStep(step); setActiveMenu('appointments'); setAppointmentsExpanded(true); }
      } else if (['info', 'records', 'settings'].includes(hash)) { setActiveMenu(hash as any); }
    };
    window.addEventListener('hashchange', syncWithUrl);
    syncWithUrl();
    return () => window.removeEventListener('hashchange', syncWithUrl);
  }, []);

  const changeStep = (step: number) => { setCurrentJourneyStep(step); window.location.hash = `step-${step}`; setMobileMenuOpen(false); };
  const changeMenu = (menu: 'info' | 'records' | 'appointments' | 'settings') => {
    setActiveMenu(menu);
    if (menu !== 'appointments') window.location.hash = menu;
    else window.location.hash = `step-${currentJourneyStep}`;
    setMobileMenuOpen(false);
  };
  
  const activeUser = isGuardianView ? patients.find(p => p.mrn === currentGuardian?.patientMrn) : currentUser;

  // Booking Flow: Step 1 (Date/Time) -> Step 2 (Doctor List) -> Step 3 (Doctor Details/Confirm)
  const [bookingFlowStep, setBookingFlowStep] = useState<1 | 2 | 3>(1); 
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selDate, setSelDate] = useState<Date | null>(null);
  const [selTime, setSelTime] = useState<string | null>(null);
  const [selDoc, setSelDoc] = useState<StaffMember | null>(null);

  // Search/Filter/Sort for Doctor List
  const [searchQuery, setSearchQuery] = useState('');
  const [fSpec, setFSpec] = useState('');
  const [fGender, setFGender] = useState('');
  const [fAge, setFAge] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'age'>('name');

  if (!activeUser) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

  const myGuardian = guardians.find(g => g.patientMrn === activeUser.mrn);
  const privacy = myGuardian?.privacySettings || { showNotes: true, showLabs: true, showSurgeries: true };
  const filteredLabs = labResults.filter(r => r.patientMrn === activeUser.mrn).filter(() => isGuardianView || privacy.showLabs);

  const specs = useMemo(() => Array.from(new Set(staff.filter(s => s.role.includes('Doctor')).map(s => s.specialization))), [staff]);
  
  const filteredDoctors = useMemo(() => {
    let list = staff.filter(s => s.role.includes('Doctor'));
    if (selDate) {
      const dateStr = selDate.toISOString().split('T')[0];
      const offStaffIds = staffLeave.filter(l => l.leaveDate === dateStr && l.status === 'Confirmed').map(l => l.staffId);
      list = list.filter(s => !offStaffIds.includes(Number(s.id)));
    }
    if (searchQuery) list = list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (fSpec) list = list.filter(s => s.specialization === fSpec);
    if (fGender) list = list.filter(s => s.gender === fGender);
    if (fAge) {
      if (fAge === 'under30') list = list.filter(s => s.age < 30);
      else if (fAge === '30-45') list = list.filter(s => s.age >= 30 && s.age <= 45);
      else if (fAge === '45plus') list = list.filter(s => s.age > 45);
    }
    list.sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : a.age - b.age);
    return list;
  }, [staff, staffLeave, selDate, searchQuery, fSpec, fGender, fAge, sortBy]);

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
    for (let h = 9; h < 17; h++) for (let m = 0; m < 60; m += 15) s.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
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
      alert(`Appointment confirmed with Dr. ${selDoc.name} on ${selDate.toLocaleDateString()} at ${selTime}`);
      changeStep(3);
    } catch (e) { alert('Failed to book.'); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditData({ ...editData, photoUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updatePatient(activeUser.mrn, editData);
      setIsEditing(false);
      alert('Profile updated successfully.');
    } catch (e) { alert('Failed to update profile.'); }
  };

  const MainMenuItem = ({ id, label, icon: Icon, expandable = false }: { id: any, label: string, icon: any, expandable?: boolean }) => {
    const isActive = activeMenu === id;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button
          onClick={() => {
            if (expandable) {
              setAppointmentsExpanded(!appointmentsExpanded);
            } else {
              changeMenu(id);
            }
          }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: 'none',
            background: isActive ? '#f1f5f9' : 'transparent', color: isActive ? '#2563eb' : '#64748b', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
          }}
        >
          <Icon size={20} />
          <span style={{ flex: 1, fontWeight: '800', fontSize: '0.95rem' }}>{label}</span>
          {expandable && (appointmentsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
        </button>
        
        {expandable && (
          <AnimatePresence>
            {appointmentsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ marginLeft: '1.25rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', borderLeft: '2px solid #f1f5f9' }}>
                  {JOURNEY_STEPS.map((step) => (
                    <button 
                      key={step.id} 
                      onClick={() => {
                        setActiveMenu('appointments');
                        changeStep(step.id);
                      }} 
                      style={{ 
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', borderRadius: '0.5rem', border: 'none', 
                        background: (activeMenu === 'appointments' && currentJourneyStep === step.id) ? `${step.color}10` : 'transparent', 
                        color: (activeMenu === 'appointments' && currentJourneyStep === step.id) ? step.color : '#94a3b8', 
                        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' 
                      }}
                    >
                      <div style={{ 
                        width: '24px', height: '24px', borderRadius: '6px', 
                        background: step.id < currentJourneyStep ? '#10b98115' : (activeMenu === 'appointments' && currentJourneyStep === step.id) ? step.color : '#f8fafc', 
                        color: step.id < currentJourneyStep ? '#10b981' : (activeMenu === 'appointments' && currentJourneyStep === step.id) ? 'white' : '#cbd5e1', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                      }}>
                        {step.id < currentJourneyStep ? <CheckCircle2 size={12} /> : <step.icon size={12} />}
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Inter, sans-serif' }}>
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} style={{ width: '320px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 900, transition: 'transform 0.3s ease' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#2563eb', padding: '0.5rem', borderRadius: '0.75rem' }}><Activity color="white" size={24} /></div>
            <div><div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>MCM Medical</div><div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a' }}>Journey Portal</div></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '1rem' }}>
            {activeUser.photoUrl ? <img src={activeUser.photoUrl} alt="Profile" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} /> : <Avatar name={activeUser.name} size={36} />}
            <div style={{ overflow: 'hidden' }}><div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{activeUser.name}</div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>{activeUser.mrn}</div></div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '1.5rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <MainMenuItem id="info" label="Patient Information" icon={Info} />
          <MainMenuItem id="records" label="Medical Records" icon={FileText} />
          <MainMenuItem id="appointments" label="Appointments" icon={CalendarIcon} expandable />
          <MainMenuItem id="settings" label="Settings" icon={SettingsIcon} />
        </nav>
        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid #f1f5f9' }}><button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.85rem 1.25rem', borderRadius: '0.85rem', fontWeight: '800' }}><LogOut size={18} /> Logout</button></div>
      </aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.4)', zIndex: 850, backdropFilter: 'blur(4px)'
            }}
            className="mobile-only"
          />
        )}
      </AnimatePresence>

      <main 
        className="patient-portal-main" 
        style={{ marginLeft: '320px', padding: '2.5rem' }}
        onClick={() => { if (mobileMenuOpen) setMobileMenuOpen(false); }}
      >
        <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: '64px', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', zIndex: 800, alignItems: 'center', padding: '0 1.25rem', justifyContent: 'space-between' }} className="mobile-only-flex">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Activity color="#2563eb" size={24} /><span style={{ fontWeight: '900' }}>Journey Portal</span></div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.5rem' }}><Menu size={20} /></button>
        </div>

        <div style={{ maxWidth: '1000px' }}>
          {activeMenu === 'info' && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                <div><h2 style={{ fontSize: '2rem', fontWeight: '900' }}>Patient Information</h2><p style={{ color: '#64748b' }}>Manage your personal profile and clinical identifiers</p></div>
                {!isEditing && <button onClick={() => { setEditData(activeUser); setIsEditing(true); }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.85rem 1.5rem', borderRadius: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Edit size={18} /> Edit Profile</button>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    {isEditing ? (
                      <div style={{ position: 'relative' }}>
                        {editData.photoUrl ? <img src={editData.photoUrl} alt="Preview" style={{ width: '120px', height: '120px', borderRadius: '2.5rem', objectFit: 'cover', border: '4px solid #f1f5f9' }} /> : <div style={{ width: '120px', height: '120px', borderRadius: '2.5rem', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px dashed #e2e8f0' }}><Camera size={40} color="#cbd5e1" /></div>}
                        <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: '#2563eb', color: 'white', padding: '0.75rem', borderRadius: '50%', border: 'none' }}><Camera size={20} /></button>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" capture="user" onChange={handleFileChange} />
                      </div>
                    ) : (activeUser.photoUrl ? <img src={activeUser.photoUrl} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '2.5rem', objectFit: 'cover', border: '4px solid #f1f5f9' }} /> : <Avatar name={activeUser.name} size={120} />)}
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{activeUser.name}</h3><p style={{ color: '#64748b', fontWeight: '700' }}>MRN: {activeUser.mrn}</p>
                </div>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '2rem', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#64748b', textTransform: 'uppercase' }}>Demographics</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {isEditing ? (<><EditRow label="Full Name" value={editData.name || ''} onChange={(v) => setEditData({ ...editData, name: v })} /><EditRow label="Date of Birth" value={editData.dob || ''} onChange={(v) => setEditData({ ...editData, dob: v })} /><EditRow label="Gender" value={editData.gender || ''} onChange={(v) => setEditData({ ...editData, gender: v })} /><EditRow label="Phone" value={editData.phone || ''} onChange={(v) => setEditData({ ...editData, phone: v })} /></>) : (<><InfoRow label="Full Name" value={activeUser.name} /><InfoRow label="Date of Birth" value={activeUser.dob} /><InfoRow label="Gender" value={activeUser.gender} /><InfoRow label="Phone" value={activeUser.phone} /></>)}
                  </div>
                </div>
              </div>
              {isEditing && <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}><button onClick={() => setIsEditing(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '1rem 2rem', borderRadius: '1rem', fontWeight: '800' }}><X size={18} /> Cancel</button><button onClick={handleSaveProfile} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '1rem 3rem', borderRadius: '1rem', fontWeight: '800' }}><Save size={18} /> Save Changes</button></div>}
            </section>
          )}

          {activeMenu === 'records' && (
            <section>
              <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2rem' }}>Medical Records</h2>
              <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '1.5rem' }}><Beaker size={20} color="#2563eb" /> Laboratory Results</h3>
                {filteredLabs.length > 0 ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>{filteredLabs.map((l, i) => <div key={i} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '1.5rem' }}><div style={{ fontWeight: '800' }}>{l.test}</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2563eb' }}>{l.value} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{l.unit}</span></div></div>)}</div> : <p>No results.</p>}
              </div>
            </section>
          )}

          {activeMenu === 'appointments' && (
            <section>
              <div style={{ marginBottom: '2.5rem', background: `linear-gradient(135deg, ${JOURNEY_STEPS[currentJourneyStep-1].color}15 0%, #ffffff 100%)`, padding: '2.5rem', borderRadius: '2rem', border: `1px solid ${JOURNEY_STEPS[currentJourneyStep-1].color}30`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}><span style={{ background: JOURNEY_STEPS[currentJourneyStep-1].color, color: 'white', padding: '0.35rem 1rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '900' }}>Step {currentJourneyStep}</span><span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>{JOURNEY_STEPS[currentJourneyStep-1].label}</span></div>
                  <h2 style={{ fontSize: '2.25rem', fontWeight: '900', marginBottom: '0.75rem' }}>{JOURNEY_STEPS[currentJourneyStep-1].desc}</h2>
                  <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '700px', lineHeight: '1.7', marginBottom: '2rem' }}>Explore medical experts and secure your consultation schedule.</p>
                  <button onClick={() => setCurrentJourneyStep(prev => Math.min(prev + 1, 14))} style={{ background: JOURNEY_STEPS[currentJourneyStep-1].color, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Next Step <ChevronRight size={18} /></button>
                </div>
              </div>

              {currentJourneyStep <= 2 && (
                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '900' }}>
                      {bookingFlowStep === 1 ? 'Select Date & Time' : bookingFlowStep === 2 ? 'Select Medical Specialist' : 'Specialist Details'}
                    </h3>
                    {bookingFlowStep > 1 && <button onClick={() => setBookingFlowStep((bookingFlowStep - 1) as any)} style={{ background: '#f1f5f9', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '1rem', fontWeight: '800' }}>Back</button>}
                  </div>

                  {bookingFlowStep === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                      <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '2.5rem', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><CalendarIcon size={24} color="#2563eb" /><h4 style={{ fontSize: '1.25rem', fontWeight: '900' }}>1. Select Date</h4></div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem', borderRadius: '0.75rem', cursor: 'pointer' }}><ChevronLeft size={18}/></button>
                            <span style={{ fontWeight: '900', fontSize: '1rem', minWidth: '140px', textAlign: 'center' }}>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem', borderRadius: '0.75rem', cursor: 'pointer' }}><ChevronRight size={18}/></button>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
                          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8', paddingBottom: '0.5rem' }}>{d}</div>)}
                          {days.map((d, i) => d ? (
                            <button key={i} onClick={() => setSelDate(d)} style={{ aspectRatio: '1', borderRadius: '1.25rem', border: 'none', cursor: 'pointer', background: selDate?.toDateString() === d.toDateString() ? '#2563eb' : 'white', color: selDate?.toDateString() === d.toDateString() ? 'white' : '#1e293b', fontWeight: '800', fontSize: '1rem', transition: 'all 0.2s', boxShadow: '0 4px 8px rgba(0,0,0,0.04)' }}>{d.getDate()}</button>
                          ) : <div key={i} />)}
                        </div>
                      </div>

                      {selDate && (
                        <div style={{ animation: 'fadeIn 0.5s ease' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}><Clock size={24} color="#2563eb" /><h4 style={{ fontSize: '1.25rem', fontWeight: '900' }}>2. Select Time</h4></div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1.25rem' }}>
                            {slots.map(t => <button key={t} onClick={() => setSelTime(t)} style={{ padding: '1.25rem', borderRadius: '1.5rem', border: '1px solid', borderColor: selTime === t ? '#2563eb' : '#e2e8f0', background: selTime === t ? '#2563eb' : 'white', color: selTime === t ? 'white' : '#1e293b', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>{t}</button>)}
                          </div>
                          <button onClick={() => setBookingFlowStep(2)} disabled={!selTime} style={{ width: '100%', marginTop: '3rem', padding: '1.5rem', borderRadius: '1.5rem', background: selTime ? '#2563eb' : '#cbd5e1', color: 'white', fontWeight: '900', fontSize: '1.1rem', border: 'none', cursor: 'pointer' }}>Proceed to Specialist Selection</button>
                        </div>
                      )}
                    </div>
                  )}

                  {bookingFlowStep === 2 && (
                    <div style={{ animation: 'fadeIn 0.4s ease' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '1.5rem', border: '1px solid #f1f5f9' }}>
                        <div style={{ flex: '1 1 300px', position: 'relative' }}>
                          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input type="text" placeholder="Search by specialist name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '1rem', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: '600' }} />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: '1 1 auto' }}>
                          <select value={fSpec} onChange={e => setFSpec(e.target.value)} style={{ padding: '0.85rem 1rem', borderRadius: '1rem', border: '1px solid #e2e8f0', fontWeight: '700', fontSize: '0.85rem', flex: 1, minWidth: '150px' }}>
                            <option value="">Specialty: All</option>
                            {specs.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => setSortBy(sortBy === 'name' ? 'age' : 'name')} style={{ padding: '0.85rem 1rem', borderRadius: '1rem', border: '1px solid #e2e8f0', background: 'white', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}><ArrowUpDown size={16} /> Sort</button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {filteredDoctors.map(doc => (
                          <div key={doc.id} onClick={() => { setSelDoc(doc); setBookingFlowStep(3); }} style={{ background: 'white', padding: '1.5rem', borderRadius: '2rem', border: '1px solid #e2e8f0', transition: 'all 0.3s', cursor: 'pointer', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                              <Avatar name={doc.name} size={70} />
                              <div style={{ flex: 1 }}>
                                <h5 style={{ fontWeight: '900', fontSize: '1.15rem' }}>Dr. {doc.name}</h5>
                                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{doc.specialization}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '0.4rem' }}>{doc.experience || '10+ Years'}</span></div>
                              </div>
                              <ChevronRight size={20} color="#cbd5e1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bookingFlowStep === 3 && selDoc && (
                    <div style={{ animation: 'slideUp 0.5s ease' }}>
                      <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
                        <div style={{ flex: '0 0 140px', textAlign: 'center' }}>
                          <Avatar name={selDoc.name} size={140} />
                          <div style={{ marginTop: '1.5rem', background: '#2563eb10', padding: '0.5rem', borderRadius: '1rem' }}><Star size={20} color="#2563eb" fill="#2563eb" style={{ display: 'inline' }} /><span style={{ marginLeft: '0.5rem', fontWeight: '900', color: '#2563eb' }}>4.9 Rating</span></div>
                        </div>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                          <h4 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a' }}>Dr. {selDoc.name}</h4>
                          <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2563eb', marginBottom: '1.5rem' }}>{selDoc.specialization} Specialist</p>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <DetailItem icon={GraduationCap} label="Education" value={selDoc.education || 'Harvard Medical School'} />
                            <DetailItem icon={ShieldAlert} label="License" value={selDoc.license || 'MD-2026-99182'} />
                            <DetailItem icon={BookOpen} label="Training" value={Array.isArray(selDoc.training) ? selDoc.training.join(', ') : 'Residency at Mayo Clinic'} />
                            <DetailItem icon={Briefcase} label="Experience" value={selDoc.experience || 'Over 12 years of clinical practice'} />
                            <DetailItem icon={Medal} label="Awards" value={Array.isArray(selDoc.awards) ? selDoc.awards.join(', ') : 'Best Clinician 2024'} />
                          </div>
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid #f1f5f9' }}>
                        <h5 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '1.5rem' }}>Appointment Summary</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
                          <div><div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8' }}>DATE</div><div style={{ fontSize: '1.1rem', fontWeight: '900' }}>{selDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div></div>
                          <div><div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8' }}>TIME</div><div style={{ fontSize: '1.1rem', fontWeight: '900' }}>{selTime}</div></div>
                        </div>
                        <button onClick={handleBooking} style={{ width: '100%', marginTop: '2.5rem', padding: '1.75rem', borderRadius: '2rem', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: 'white', fontWeight: '900', fontSize: '1.3rem', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px rgba(37, 99, 235, 0.25)' }}>Confirm Appointment</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentJourneyStep >= 3 && (
                <div style={{ background: 'white', padding: '5rem 2rem', borderRadius: '2.5rem', border: '2px dashed #e2e8f0', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#94a3b8' }}>{JOURNEY_STEPS[currentJourneyStep-1].label} Phase</h3>
                </div>
              )}
            </section>
          )}

          {activeMenu === 'settings' && (
            <section>
              <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2rem' }}>Settings</h2>
              <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '1.5rem' }}>Privacy Controls</h3>
                {isGuardianView && currentGuardian ? (
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <PrivacyToggle label="Show Clinical Notes" value={!!privacy.showNotes} onToggle={() => {}} />
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

const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
    <div style={{ background: '#f1f5f9', padding: '0.65rem', borderRadius: '0.75rem', color: '#2563eb' }}><Icon size={18} /></div>
    <div><div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div><div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#334155', lineHeight: '1.4' }}>{value}</div></div>
  </div>
);

const InfoRow = ({ label, value }: { label: string, value: any }) => (
  <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginTop: '0.25rem' }}>{value}</div>
  </div>
);

const EditRow = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontWeight: '600' }} />
  </div>
);

const PrivacyToggle = ({ label, value, onToggle }: { label: string, value: boolean, onToggle: () => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: '#f8fafc', borderRadius: '1.5rem' }}>
    <span style={{ fontWeight: '800' }}>{label}</span>
    <button onClick={onToggle} style={{ width: '56px', height: '28px', background: value ? '#2563eb' : '#cbd5e1', borderRadius: '14px', border: 'none', cursor: 'pointer', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '4px', left: value ? '32px' : '4px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'all 0.3s' }} />
    </button>
  </div>
);

export default PatientPortal;
