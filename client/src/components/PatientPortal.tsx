import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, Heart, Activity, FileText, Beaker, LogOut, 
  ChevronLeft, ChevronRight, Clock, User, Award, GraduationCap, Filter, Search as SearchIcon, ShieldAlert, Scissors, Menu, CheckCircle2, ChevronDown, ChevronUp, Settings as SettingsIcon, Info, Edit, Save, X, Camera, ArrowUpDown, Star, BookOpen, Briefcase, Medal,
  HelpCircle
} from 'lucide-react';
import { useEMR, type StaffMember, type Patient } from '../context/EMRContext';
import Avatar from './Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { PATIENT_PORTAL_MENU_STRUCTURE, type MenuItem } from '../config/permissions';

const PORTAL_ICON_MAP: Record<string, any> = {
  Info,
  FileText,
  CalendarDays: CalendarIcon,
  Calendar: CalendarIcon,
  Settings: SettingsIcon,
  Heart,
  Activity,
  Beaker,
  User,
  HelpCircle
};

interface PortalProps {
  onLogout: () => void;
  isGuardianView?: boolean;
}

const JOURNEY_STEPS = [
  { id: 1, label: 'Discovery', icon: SearchIcon, color: '#3b82f6', desc: 'Find doctors and available appointment dates' },
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
  const { 
    currentUser, 
    currentGuardian, 
    patients, 
    staff, 
    staffLeave, 
    addAppointment, 
    labResults, 
    guardians, 
    updatePatient, 
    medicalHistory,
    appointments,
    surgeries,
    medicationSchedules,
    labOrders,
    fetchAppSetting
  } = useEMR();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigation
  const [activeMenu, setActiveMenu] = useState<string>('appointments');

  const [portalMenuStructure, setPortalMenuStructure] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('emr_patient_portal_menu_structure');
    if (saved) { try { return JSON.parse(saved); } catch { /* fall through */ } }
    return PATIENT_PORTAL_MENU_STRUCTURE;
  });

  useEffect(() => {
    fetchAppSetting('emr_patient_portal_menu_structure').then((remote) => {
      if (remote) {
        setPortalMenuStructure(remote);
        localStorage.setItem('emr_patient_portal_menu_structure', JSON.stringify(remote));
      }
    }).catch(() => {/* keep local value on error */});
  }, []);

  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  const [appointmentsExpanded, setAppointmentsExpanded] = useState(true);
  const [currentJourneyStep, setCurrentJourneyStep] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Patient>>({});

  // Schedule View States
  const [scheduleViewType, setScheduleViewType] = useState<'month' | 'week' | 'day'>('month');
  const [scheduleSelectedDate, setScheduleSelectedDate] = useState(new Date());
  const [selectedScheduleEvent, setSelectedScheduleEvent] = useState<any | null>(null);
  const [doneEvents, setDoneEvents] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    const syncWithUrl = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('step-')) {
        const step = parseInt(hash.replace('step-', ''));
        if (!isNaN(step)) { setCurrentJourneyStep(step); setActiveMenu('appointments'); setAppointmentsExpanded(true); }
      } else if (['info', 'records', 'schedule', 'settings'].includes(hash)) { setActiveMenu(hash); }
    };
    window.addEventListener('hashchange', syncWithUrl);
    syncWithUrl();
    return () => window.removeEventListener('hashchange', syncWithUrl);
  }, []);

  const changeStep = (step: number) => { setCurrentJourneyStep(step); window.location.hash = `step-${step}`; setMobileMenuOpen(false); };
  const changeMenu = (menu: string) => {
    setActiveMenu(menu);
    if (menu !== 'appointments') window.location.hash = menu;
    else window.location.hash = `step-${currentJourneyStep}`;
    setMobileMenuOpen(false);
  };
  
  const activeUser = isGuardianView
    ? patients.find(p => p.mrn === currentGuardian?.patientMrn)
    : (patients.find(p => p.mrn === currentUser?.mrn) ?? currentUser);

  const getDocName = (docId: number) => {
    const doc = staff?.find(s => s.id === docId);
    return doc ? `Dr. ${doc.name}` : 'Attending Physician';
  };

  const getSurgeonName = (surgeonId: number) => {
    const doc = staff?.find(s => s.id === surgeonId);
    return doc ? `Dr. ${doc.name}` : 'Surgeon';
  };

  const parseDateTime = (isoStr: string) => {
    if (!isoStr) return { dateStr: '', timeStr: '' };
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return { dateStr: '', timeStr: '' };
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    return { dateStr, timeStr };
  };

  // Aggregated patient schedule events
  const myEvents = useMemo(() => {
    if (!activeUser) return [];
    const mrn = activeUser.mrn;
    const events: any[] = [];

    // 1. Appointments
    if (appointments) {
      appointments
        .filter(apt => apt.patientMrn === mrn && apt.status !== 'Cancelled')
        .forEach(apt => {
          const { dateStr, timeStr } = parseDateTime(apt.startTime);
          events.push({
            id: `apt-${apt.id}`,
            title: `${getDocName(apt.doctorId)} 면담`,
            type: 'Appointment',
            dateStr,
            timeStr,
            color: '#2563eb',
            details: `Appointment with doctor. Status: ${apt.status}. Notes: ${apt.notes || 'None'}`
          });
        });
    }

    // 2. Surgeries
    if (surgeries) {
      surgeries
        .filter(s => s.patientMrn === mrn && s.status !== 'Cancelled')
        .forEach(s => {
          const { dateStr, timeStr } = parseDateTime(s.startTime);
          events.push({
            id: `surg-${s.id}`,
            title: `수술: ${s.operationName}`,
            type: 'Surgery',
            dateStr,
            timeStr,
            color: '#ef4444',
            details: `Scheduled operation: ${s.operationName} in Room ${s.roomNumber}. Surgeon: ${getSurgeonName(s.surgeonId)}. Anesthesia: ${s.anesthesiaType}. Status: ${s.status}`
          });
        });
    }

    // 3. MedicationSchedules
    if (medicationSchedules) {
      medicationSchedules
        .filter(m => m.patientMrn === mrn)
        .forEach(m => {
          events.push({
            id: `med-${m.id}`,
            title: `${m.drugName} 복용 (${m.dosage})`,
            type: 'Medication',
            dateStr: m.scheduledDate,
            timeStr: m.scheduledTime || 'All Day',
            color: '#10b981',
            details: `Medication intake reminder. Drug: ${m.drugName}, Dosage: ${m.dosage}. Taken status: ${m.taken ? 'Taken at ' + m.takenAt : 'Not Taken Yet'}. Notes: ${m.notes || 'None'}`
          });
        });
    }

    // 4. LabOrders
    if (labOrders) {
      labOrders
        .filter(l => l.patientMrn === mrn)
        .forEach(l => {
          const { dateStr, timeStr } = parseDateTime(l.scheduledDate ?? l.createdAt);
          const rs = l.resultStatus ?? 'Scheduled';
          const color = rs === 'In Progress' ? '#f59e0b' : rs === 'Completed' ? '#16a34a' : '#3b82f6';
          events.push({
            id: `lab-${l.id}`,
            title: `검사 의뢰: ${l.tests?.join(', ') || 'General Lab'}`,
            type: 'LabTest',
            dateStr,
            timeStr,
            color,
            details: `Laboratory order for test(s): ${l.tests?.join(', ')}. Priority: ${l.priority}. Status: ${rs}.`
          });
        });
    }

    // 5. Admission & Discharge
    if (activeUser.admissionDate) {
      const { dateStr, timeStr } = parseDateTime(activeUser.admissionDate);
      events.push({
        id: `adm-${activeUser.mrn}`,
        title: `입원 일정 (${activeUser.ward || 'General Ward'})`,
        type: 'Admission',
        dateStr: dateStr || activeUser.admissionDate.split('T')[0],
        timeStr: timeStr || 'All Day',
        color: '#f97316',
        details: `Admitted to ward: ${activeUser.ward || 'General Ward'} on ${activeUser.admissionDate}`
      });
    }

    if (activeUser.dischargeDate) {
      const { dateStr, timeStr } = parseDateTime(activeUser.dischargeDate);
      events.push({
        id: `dis-${activeUser.mrn}`,
        title: `퇴원 일정`,
        type: 'Discharge',
        dateStr: dateStr || activeUser.dischargeDate.split('T')[0],
        timeStr: timeStr || 'All Day',
        color: '#06b6d4',
        details: `Scheduled discharge date: ${activeUser.dischargeDate}`
      });
    }

    return events;
  }, [activeUser, appointments, surgeries, medicationSchedules, labOrders, staff]);

  const scheduleMonthDays = useMemo(() => {
    const start = new Date(scheduleSelectedDate.getFullYear(), scheduleSelectedDate.getMonth(), 1);
    const dayOfWeek = start.getDay(); // Sunday start (0)
    start.setDate(start.getDate() - dayOfWeek);
    
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [scheduleSelectedDate]);

  const scheduleWeekDays = useMemo(() => {
    const start = new Date(scheduleSelectedDate);
    start.setDate(start.getDate() - start.getDay()); // Sunday start (0)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [scheduleSelectedDate]);

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

  const parsedEncounter = (() => {
    if (!activeUser.diagnosisSummary) return null;
    try {
      return JSON.parse(activeUser.diagnosisSummary) as {
        date: string; doctor: string; icd?: string; diagnosis?: string;
        subjective?: string; objective?: string; notes?: string;
      };
    } catch { return null; }
  })();

  const userHistory = useMemo(() => {
    if (!activeUser?.mrn) return [];
    return medicalHistory
      .filter(h => h.patientMrn === activeUser.mrn)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [medicalHistory, activeUser?.mrn]);

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

  const renderScheduleMonthView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
            const isSunday = i === 0;
            return (
              <div key={i} style={{ 
                padding: '1rem 0.5rem', 
                textAlign: 'center', 
                fontSize: '0.8rem', 
                fontWeight: '900', 
                color: isSunday ? '#ef4444' : '#64748b' 
              }}>
                <span className="desktop-day">{day.toUpperCase()}</span>
                <span className="mobile-day">{day[0].toUpperCase()}</span>
              </div>
            );
          })}
        </div>
        {/* Days Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, 1fr)' }}>
          {scheduleMonthDays.map((date, i) => {
            const isSelectedMonth = date.getMonth() === scheduleSelectedDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const isSunday = date.getDay() === 0;
            
            const dateStr = date.toISOString().split('T')[0];
            const dayEvents = myEvents.filter(ev => ev.dateStr === dateStr);

            return (
              <div key={i} style={{ 
                borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid #f1f5f9', 
                borderBottom: i < 35 ? '1px solid #f1f5f9' : 'none',
                padding: '0.5rem',
                background: isSelectedMonth ? 'white' : '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                minWidth: '0',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: '800', 
                  color: isToday 
                    ? '#2563eb' 
                    : (isSunday 
                        ? (isSelectedMonth ? '#ef4444' : '#fca5a5') 
                        : (isSelectedMonth ? '#1e293b' : '#cbd5e1')),
                  textAlign: 'right',
                  paddingRight: '0.25rem'
                }}>
                  {date.getDate()}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px', scrollbarWidth: 'none' }}>
                  {dayEvents.map(ev => {
                    const evDone = doneEvents.has(String(ev.id));
                    const evColor = evDone ? '#6b7280' : ev.color;
                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedScheduleEvent(ev); }}
                        style={{
                          fontSize: '0.7rem',
                          background: `${evColor}15`,
                          color: evColor,
                          borderLeft: `3px solid ${evColor}`,
                          padding: '3px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: '700',
                          transition: 'transform 0.1s',
                          textDecoration: evDone ? 'line-through' : 'none',
                          opacity: evDone ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <span style={{ fontSize: '0.65rem', marginRight: '4px', opacity: 0.8 }}>{ev.timeStr}</span>
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderScheduleWeekView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Days Header */}
        <div className="week-grid" style={{ 
          borderBottom: '1px solid #e2e8f0', 
          background: '#f8fafc'
        }}>
          <div className="time-header" style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', borderRight: '1px solid #f1f5f9' }}>
            TIME
          </div>
          {scheduleWeekDays.map((date, i) => {
            const isSunday = date.getDay() === 0;
            const isToday = date.toDateString() === new Date().toDateString();
            const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            return (
              <div key={i} style={{ 
                padding: '0.75rem 0.5rem', 
                textAlign: 'center', 
                borderRight: i < 6 ? '1px solid #f1f5f9' : 'none', 
                background: isToday ? '#eff6ff' : 'transparent',
                minWidth: '0'
              }}>
                <div style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: '900', 
                  color: isSunday ? '#ef4444' : (isToday ? '#2563eb' : '#1e293b') 
                }}>
                  <span className="desktop-day">{dayNames[i]}</span>
                  <span className="mobile-day">{dayNames[i][0]}</span>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: isSunday ? '#ef4444' : '#94a3b8', marginTop: '2px' }}>
                  {date.getMonth() + 1}.{date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hour slots & Events columns */}
        <div className="week-grid" style={{ height: '480px', position: 'relative' }}>
          {/* Hour Labels */}
          <div style={{ borderRight: '1px solid #f1f5f9', background: '#f8fafc', overflowY: 'hidden', height: '100%' }}>
            {Array.from({ length: 12 }, (_, h) => h + 8).map(h => (
              <div key={h} className="time-label" style={{ 
                height: '40px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.65rem', 
                fontWeight: '700', 
                color: '#94a3b8', 
                borderBottom: '1px solid #f1f5f9' 
              }}>
                {h.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Grid Columns */}
          {scheduleWeekDays.map((date, colIdx) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayEvents = myEvents.filter(ev => ev.dateStr === dateStr);

            return (
              <div key={colIdx} style={{ 
                position: 'relative', 
                height: '100%', 
                borderRight: colIdx < 6 ? '1px solid #f1f5f9' : 'none',
                background: date.toDateString() === new Date().toDateString() ? '#eff6ff30' : 'white'
              }}>
                {/* Subgrid line placeholders */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{ height: '40px', borderBottom: '1px solid #f1f5f9' }} />
                ))}

                {/* Relative events positioning */}
                {dayEvents.map(ev => {
                  let topPercent = 20; 
                  let heightVal = 36;
                  if (ev.timeStr && ev.timeStr !== 'All Day') {
                    const [h, m] = ev.timeStr.split(':').map(Number);
                    if (!isNaN(h)) {
                      const hourDiff = Math.max(0, h - 8);
                      topPercent = (hourDiff * 40) + ((m || 0) / 60 * 40);
                    }
                  } else {
                    topPercent = 8;
                    heightVal = 32;
                  }

                  const evDoneW = doneEvents.has(String(ev.id));
                  const evColorW = evDoneW ? '#6b7280' : ev.color;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedScheduleEvent(ev)}
                      style={{
                        position: 'absolute',
                        top: `${topPercent}px`,
                        left: '4px',
                        right: '4px',
                        height: `${heightVal}px`,
                        background: evColorW,
                        color: 'white',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.15)',
                        transition: 'transform 0.15s ease',
                        opacity: evDoneW ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                    >
                      <div style={{ fontSize: '0.55rem', opacity: 0.9, lineHeight: 1 }}>{ev.timeStr}</div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: evDoneW ? 'line-through' : 'none' }}>{ev.title}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderScheduleDayView = () => {
    const dateStr = scheduleSelectedDate.toISOString().split('T')[0];
    const dayEvents = myEvents.filter(ev => ev.dateStr === dateStr);

    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>
            {scheduleSelectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.35rem 0.85rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' }}>
            {dayEvents.length} events scheduled
          </span>
        </div>

        {dayEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {dayEvents.map(ev => {
              const evDoneD = doneEvents.has(String(ev.id));
              const evColorD = evDoneD ? '#6b7280' : ev.color;
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedScheduleEvent(ev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    padding: '1.25rem 1.5rem',
                    background: '#f8fafc',
                    borderRadius: '1.25rem',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: evDoneD ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = evColorD;
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '70px',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: '900',
                    color: evColorD,
                    background: `${evColorD}10`,
                    padding: '0.5rem',
                    borderRadius: '0.75rem'
                  }}>
                    {ev.timeStr}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', margin: 0, textDecoration: evDoneD ? 'line-through' : 'none' }}>{ev.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>{ev.details}</p>
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    color: evColorD,
                    background: `${evColorD}15`,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '99px'
                  }}>
                    {ev.type}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#f8fafc', borderRadius: '1.5rem', border: '1px solid #e2e8f0' }}>
            <CalendarIcon size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: '900', color: '#64748b', margin: 0 }}>No schedules for this day</h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Relax! There are no medical events or appointments scheduled.</p>
          </div>
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
          {portalMenuStructure.map((menu) => {
            const Icon = PORTAL_ICON_MAP[menu.icon || 'HelpCircle'] || HelpCircle;
            const hasChildren = menu.children && menu.children.length > 0;
            const isActive = activeMenu === menu.key || (menu.children?.some(c => activeMenu === menu.key && window.location.hash === `#${c.key}`));
            
            return (
              <div key={menu.key} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      setAppointmentsExpanded(!appointmentsExpanded);
                    } else {
                      changeMenu(menu.key);
                    }
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: 'none',
                    background: isActive ? '#f1f5f9' : 'transparent', color: isActive ? '#2563eb' : '#64748b', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <Icon size={20} />
                  <span style={{ flex: 1, fontWeight: '800', fontSize: '0.95rem' }}>{menu.label}</span>
                  {hasChildren && (appointmentsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                </button>
                
                {hasChildren && (
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
                          {menu.children?.map((sub) => {
                            const isStep = sub.key.startsWith('step-');
                            const stepId = isStep ? parseInt(sub.key.replace('step-', '')) : null;
                            const isSubActive = activeMenu === menu.key && (isStep ? currentJourneyStep === stepId : window.location.hash === `#${sub.key}`);
                            
                            const matchedStep = isStep && stepId ? JOURNEY_STEPS.find(js => js.id === stepId) : null;
                            const stepColor = matchedStep?.color || '#3b82f6';
                            const StepIcon = matchedStep?.icon || HelpCircle;

                            return (
                              <button 
                                key={sub.key} 
                                onClick={() => {
                                  if (isStep && stepId) {
                                    setActiveMenu(menu.key);
                                    changeStep(stepId);
                                  } else {
                                    setActiveMenu(menu.key);
                                    window.location.hash = sub.key;
                                    setMobileMenuOpen(false);
                                  }
                                }} 
                                style={{ 
                                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', borderRadius: '0.5rem', border: 'none', 
                                  background: isSubActive ? `${stepColor}10` : 'transparent', 
                                  color: isSubActive ? stepColor : '#94a3b8', 
                                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' 
                                }}
                              >
                                <div style={{ 
                                  width: '24px', height: '24px', borderRadius: '6px', 
                                  background: (stepId !== null && stepId < currentJourneyStep) ? '#10b98115' : isSubActive ? stepColor : '#f8fafc', 
                                  color: (stepId !== null && stepId < currentJourneyStep) ? '#10b981' : isSubActive ? 'white' : '#cbd5e1', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                                }}>
                                  {(stepId !== null && stepId < currentJourneyStep) ? <CheckCircle2 size={12} /> : <StepIcon size={12} />}
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
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

              {/* Longitudinal Medical History Timeline */}
              <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} color="#2563eb" /> Longitudinal Medical History
                </h3>

                {userHistory.length > 0 ? (
                  <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                    {/* Vertical line connector */}
                    <div style={{ position: 'absolute', left: '0.5rem', top: '0', bottom: '0', width: '2px', background: '#e2e8f0' }}></div>
                    
                    {userHistory.map((hist, idx) => (
                      <div key={hist.id} style={{ position: 'relative', marginBottom: '2.5rem' }}>
                        {/* Timeline Node/Dot */}
                        <div style={{ 
                          position: 'absolute', 
                          left: '-2.1rem', 
                          top: '0.25rem', 
                          width: '1.1rem', 
                          height: '1.1rem', 
                          borderRadius: '50%', 
                          background: idx === 0 ? '#2563eb' : '#94a3b8', 
                          border: '2px solid white', 
                          boxShadow: '0 0 0 4px #f8fafc' 
                        }}></div>
                        
                        {/* Card Container */}
                        <div 
                          onClick={() => setSelectedHistoryItem(hist)}
                          style={{ 
                            padding: '1.5rem', 
                            background: '#f8fafc', 
                            borderRadius: '1.25rem', 
                            border: '1px solid #e2e8f0', 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.04)';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                        >
                          {/* Card Header: Date & Doctor */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: '700' }}>
                              <CalendarIcon size={14} />
                              <span>{hist.date}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: '700' }}>
                              <User size={14} />
                              <span>{hist.doctor}</span>
                            </div>
                          </div>

                          {/* Title / Diagnosis */}
                          <h4 style={{ 
                            fontSize: '1.15rem', 
                            fontWeight: '800', 
                            color: '#1e293b', 
                            margin: '0 0 0.5rem 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            {hist.diagnosis}
                            {hist.icd10Code && (
                              <span style={{ 
                                background: '#eff6ff', 
                                color: '#2563eb', 
                                padding: '0.15rem 0.5rem', 
                                borderRadius: '99px', 
                                fontWeight: '700', 
                                fontSize: '0.7rem' 
                              }}>
                                {hist.icd10Code}
                              </span>
                            )}
                          </h4>

                          {/* Preview Summary */}
                          <p style={{ 
                            fontSize: '0.9rem', 
                            color: '#475569', 
                            margin: 0, 
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {(() => {
                              if (!hist.summary) return 'No notes recorded.';
                              try {
                                const parsed = JSON.parse(hist.summary);
                                return parsed.subjective || parsed.notes || hist.summary;
                              } catch {
                                return hist.summary;
                              }
                            })()}
                          </p>
                          
                          <div style={{ 
                            marginTop: '0.75rem', 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            fontSize: '0.8rem', 
                            fontWeight: '800', 
                            color: '#2563eb',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            View Details <ChevronRight size={14} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    <Info size={40} style={{ marginBottom: '1rem', color: '#cbd5e1' }} />
                    <p style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>No medical records found.</p>
                    <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Consultations and diagnoses will appear here.</p>
                  </div>
                )}
              </div>

              {/* Lab Status Notifications */}
              {(() => {
                const myLabOrders = labOrders.filter(l => l.patientMrn === activeUser.mrn);
                const scheduled = myLabOrders.filter(l => (l.resultStatus ?? 'Scheduled') === 'Scheduled');
                const inProgress = myLabOrders.filter(l => l.resultStatus === 'In Progress');
                const completed = myLabOrders.filter(l => l.resultStatus === 'Completed');
                if (myLabOrders.length === 0) return null;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {inProgress.map(l => (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '0.75rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#92400e' }}>Test In Progress</div>
                          <div style={{ fontSize: '0.8rem', color: '#78350f' }}>{l.tests.join(', ')} — your tests are currently being performed</div>
                        </div>
                      </div>
                    ))}
                    {scheduled.map(l => (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e40af' }}>Test Scheduled</div>
                          <div style={{ fontSize: '0.8rem', color: '#1d4ed8' }}>
                            {l.tests.join(', ')}{l.scheduledDate ? ` — scheduled for ${l.scheduledDate}` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                    {completed.map(l => (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.75rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#14532d' }}>Results Ready</div>
                          <div style={{ fontSize: '0.8rem', color: '#166534' }}>{l.tests.join(', ')} — your results are available below</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Laboratory Results */}
              <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '1.5rem' }}><Beaker size={20} color="#2563eb" /> Laboratory Results</h3>
                {filteredLabs.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {filteredLabs.map((l, i) => (
                      <div key={i} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '1.5rem' }}>
                        <div style={{ fontWeight: '800' }}>{l.test}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: l.status === 'Abnormal' ? '#dc2626' : '#2563eb' }}>
                          {l.value} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{l.unit}</span>
                        </div>
                        {l.range && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Normal: {l.range}</div>}
                        <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.15rem 0.5rem', background: l.status === 'Normal' ? '#f0fdf4' : '#fef2f2', color: l.status === 'Normal' ? '#16a34a' : '#dc2626', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700' }}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No results.</p>
                )}
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.75rem' }}>
                          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, idx) => {
                            const isSunday = idx === 0;
                            return (
                              <div key={d} style={{ 
                                textAlign: 'center', 
                                fontSize: '0.7rem', 
                                fontWeight: '900', 
                                color: isSunday ? '#ef4444' : '#94a3b8', 
                                paddingBottom: '0.5rem' 
                              }}>
                                <span className="desktop-day">{d}</span>
                                <span className="mobile-day">{d[0]}</span>
                              </div>
                            );
                          })}
                          {days.map((d, i) => {
                            if (!d) return <div key={i} />;
                            const isSunday = d.getDay() === 0;
                            const isSelected = selDate?.toDateString() === d.toDateString();
                            return (
                              <button 
                                key={i} 
                                onClick={() => setSelDate(d)} 
                                style={{ 
                                  aspectRatio: '1', 
                                  borderRadius: '1.25rem', 
                                  border: 'none', 
                                  cursor: 'pointer', 
                                  background: isSelected ? '#2563eb' : 'white', 
                                  color: isSelected 
                                    ? 'white' 
                                    : (isSunday ? '#ef4444' : '#1e293b'), 
                                  fontWeight: '800', 
                                  fontSize: '1rem', 
                                  transition: 'all 0.2s', 
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.04)' 
                                }}
                              >
                                {d.getDate()}
                              </button>
                            );
                          })}
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
                          <SearchIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
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

          {activeMenu === 'schedule' && (
            <section style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <style>{`
                .week-grid {
                  display: grid;
                  grid-template-columns: 80px repeat(7, minmax(0, 1fr));
                  width: 100%;
                }
                .desktop-day { display: inline; }
                .mobile-day { display: none; }
                @media (max-width: 768px) {
                  .week-grid {
                    grid-template-columns: 45px repeat(7, minmax(0, 1fr)) !important;
                  }
                  .desktop-day { display: none !important; }
                  .mobile-day { display: inline !important; }
                }
              `}</style>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>My Schedule</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>Comprehensive overview of your upcoming medical activities and appointments</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* View Toggles */}
                  <div style={{ display: 'flex', background: '#e2e8f0', padding: '0.25rem', borderRadius: '0.75rem' }}>
                    {(['month', 'week', 'day'] as const).map(vt => (
                      <button
                        key={vt}
                        onClick={() => setScheduleViewType(vt)}
                        style={{
                          padding: '0.45rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          background: scheduleViewType === vt ? 'white' : 'transparent',
                          color: scheduleViewType === vt ? '#2563eb' : '#64748b',
                          cursor: 'pointer',
                          boxShadow: scheduleViewType === vt ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                          transition: 'all 0.15s'
                        }}
                      >
                        {vt.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Nav Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        const d = new Date(scheduleSelectedDate);
                        if (scheduleViewType === 'month') d.setMonth(d.getMonth() - 1);
                        else if (scheduleViewType === 'week') d.setDate(d.getDate() - 7);
                        else d.setDate(d.getDate() - 1);
                        setScheduleSelectedDate(d);
                      }}
                      style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      onClick={() => setScheduleSelectedDate(new Date())}
                      style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer' }}
                    >
                      TODAY
                    </button>
                    <button 
                      onClick={() => {
                        const d = new Date(scheduleSelectedDate);
                        if (scheduleViewType === 'month') d.setMonth(d.getMonth() + 1);
                        else if (scheduleViewType === 'week') d.setDate(d.getDate() + 7);
                        else d.setDate(d.getDate() + 1);
                        setScheduleSelectedDate(d);
                      }}
                      style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar Container */}
              <div style={{ background: 'white', borderRadius: '2rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                    {scheduleSelectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '0.25rem 0.75rem', borderRadius: '99px', background: '#e0f2fe', color: '#0369a1' }}>
                      {myEvents.length} Total Schedules
                    </span>
                  </div>
                </div>

                {scheduleViewType === 'month' && renderScheduleMonthView()}
                {scheduleViewType === 'week' && renderScheduleWeekView()}
                {scheduleViewType === 'day' && renderScheduleDayView()}
              </div>

              {/* Event details popup modal */}
              <AnimatePresence>
                {selectedScheduleEvent && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(15, 23, 42, 0.4)', zIndex: 1000,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(8px)', padding: '1rem'
                    }}
                    onClick={() => setSelectedScheduleEvent(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      style={{
                        background: 'white', width: '100%', maxWidth: '500px',
                        borderRadius: '2.5rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid #e2e8f0', padding: '2.5rem', position: 'relative'
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => setSelectedScheduleEvent(null)}
                        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                      >
                        <X size={18} />
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ 
                          width: '48px', height: '48px', borderRadius: '1rem', 
                          background: `${selectedScheduleEvent.color}15`, 
                          color: selectedScheduleEvent.color, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                          <CalendarIcon size={24} />
                        </div>
                        <div>
                          <span style={{ 
                            fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', 
                            color: selectedScheduleEvent.color, background: `${selectedScheduleEvent.color}15`,
                            padding: '0.25rem 0.75rem', borderRadius: '99px'
                          }}>
                            {selectedScheduleEvent.type}
                          </span>
                          <h4 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e293b', margin: '0.25rem 0 0 0', textDecoration: doneEvents.has(String(selectedScheduleEvent.id)) ? 'line-through' : 'none', opacity: doneEvents.has(String(selectedScheduleEvent.id)) ? 0.5 : 1 }}>
                            {selectedScheduleEvent.title}
                          </h4>
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid #f1f5f9', display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <Clock size={16} style={{ color: '#94a3b8', marginTop: '2px' }} />
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8' }}>DATE & TIME</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>
                              {selectedScheduleEvent.dateStr} at {selectedScheduleEvent.timeStr}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>DETAILS</h5>
                        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                          {selectedScheduleEvent.details}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                        <button
                          onClick={() => {
                            const id = String(selectedScheduleEvent.id);
                            setDoneEvents(prev => {
                              const next = new Set(prev);
                              if (next.has(id)) next.delete(id); else next.add(id);
                              return next;
                            });
                            setSelectedScheduleEvent(null);
                          }}
                          style={{ flex: 1, padding: '1rem', borderRadius: '1.25rem', background: '#22c55e', color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer' }}
                        >
                          Done
                        </button>
                        <button
                          onClick={() => setSelectedScheduleEvent(null)}
                          style={{ flex: 1, padding: '1rem', borderRadius: '1.25rem', background: '#1e293b', color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer' }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
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
      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (max-width: 640px) {
          .desktop-day { display: none; }
          .mobile-day { display: inline; }
        }
        @media (min-width: 641px) {
          .desktop-day { display: inline; }
          .mobile-day { display: none; }
        }
      `}</style>

      {/* Medical History Detail Popup Modal */}
      {selectedHistoryItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
        }}>
          <div style={{
            background: 'white',
            width: '100%',
            maxWidth: '650px',
            borderRadius: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.75rem 2rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: '#eff6ff',
                  color: '#2563eb',
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>Consultation Record</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>MRN: {selectedHistoryItem.patientMrn}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedHistoryItem(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '2rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              {/* Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                background: '#f8fafc',
                padding: '1.25rem',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Attending Doctor</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={14} color="#64748b" /> {selectedHistoryItem.doctor}
                  </span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Date of Visit</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CalendarIcon size={14} color="#64748b" /> {selectedHistoryItem.date}
                  </span>
                </div>
              </div>

              {/* Diagnosis block */}
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Diagnosis</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                    {selectedHistoryItem.diagnosis}
                  </h4>
                  {selectedHistoryItem.icd10Code && (
                    <span style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '99px',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      border: '1px solid #fee2e2'
                    }}>
                      ICD-10: {selectedHistoryItem.icd10Code}
                    </span>
                  )}
                </div>
              </div>

              {/* Encounter Details (SOAP or raw Summary) */}
              {(() => {
                const parsed = (() => {
                  if (!selectedHistoryItem.summary) return null;
                  try {
                    return JSON.parse(selectedHistoryItem.summary);
                  } catch {
                    return null;
                  }
                })();

                if (parsed) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {parsed.subjective && (
                        <div>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                            <BookOpen size={13} /> Subjective (Symptoms & History)
                          </span>
                          <p style={{ margin: 0, padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9', fontSize: '0.92rem', color: '#334155', lineHeight: '1.6' }}>
                            {parsed.subjective}
                          </p>
                        </div>
                      )}
                      
                      {parsed.objective && (
                        <div>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                            <Activity size={13} /> Objective (Vitals & Exams)
                          </span>
                          <p style={{ margin: 0, padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9', fontSize: '0.92rem', color: '#334155', lineHeight: '1.6' }}>
                            {parsed.objective}
                          </p>
                        </div>
                      )}

                      {parsed.notes && (
                        <div>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                            <FileText size={13} /> Clinical Notes
                          </span>
                          <p style={{ margin: 0, padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9', fontSize: '0.92rem', color: '#334155', lineHeight: '1.6' }}>
                            {parsed.notes}
                          </p>
                        </div>
                      )}

                      {parsed.treatmentPlan && parsed.treatmentPlan.length > 0 && (
                        <div>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                            <CheckCircle2 size={13} /> Recommended Treatment Plan
                          </span>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {parsed.treatmentPlan.map((item: string, i: number) => (
                              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.92rem', color: '#334155' }}>
                                <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Clinical Summary</span>
                    <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.95rem', color: '#334155', lineHeight: '1.6' }}>
                      {selectedHistoryItem.summary || 'No detailed clinical notes recorded.'}
                    </div>
                  </div>
                );
              })()}

              {/* Risk factors and lifestyle if present */}
              {selectedHistoryItem.riskFactors && selectedHistoryItem.riskFactors.length > 0 && (
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Risk Factors</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedHistoryItem.riskFactors.map((rf: string, i: number) => (
                      <span key={i} style={{ background: '#fff1f2', color: '#e11d48', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: '700' }}>
                        {rf}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1.25rem 2rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#f8fafc'
            }}>
              <button 
                onClick={() => setSelectedHistoryItem(null)}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '1rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
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
