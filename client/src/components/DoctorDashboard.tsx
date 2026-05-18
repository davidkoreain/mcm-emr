import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, User, MoreVertical, Plus, CheckCircle, 
  Search, Filter, LayoutGrid, List as ListIcon,
  Activity, Stethoscope, X, Trash2
} from 'lucide-react';
import { useEMR, type MedicalHistoryItem } from '../context/EMRContext';
import Avatar from './Avatar';

// ── Types & Mock Data ──────────────────────────────────────────

interface Appointment {
  id: number;
  name: string;
  day: number;
  time: string;
  duration: number;
  color: string;
}



const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 to 20:00
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DoctorDashboardProps {
  selectedMrn?: string | null;
  onSelectMrn?: (mrn: string | null) => void;
  onStartConsult?: (patient: { mrn: string; name: string; amharic: string }) => void;
  onViewHistory?: (patient: { mrn: string; name: string; amharic: string }) => void;
  onNewAppointment?: () => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ selectedMrn, onSelectMrn, onStartConsult, onViewHistory, onNewAppointment }) => {
  const { appointments, patients, currentStaff, role, medicalHistory, deleteMedicalHistory, addAppointment } = useEMR();
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<MedicalHistoryItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newAppt, setNewAppt] = useState({ patientMrn: '', startTime: '', notes: '' });
  const [currentTime, setCurrentTime] = useState(new Date());

  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const canDeleteHistory = role === 'Admin' || role === 'Doctor';
  const [mobileMode, setMobileMode] = useState<'calendar' | 'half' | 'full'>('calendar');
  // Update current time every minute for the red line
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ── Date Logic ────────────────────────────────────────────────

  const weekDays = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay()); // Sunday start
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const dayOfWeek = start.getDay(); // Sunday start
    start.setDate(start.getDate() - dayOfWeek);
    
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const handlePrev = () => {
    const d = new Date(selectedDate);
    if (viewType === 'day') d.setDate(d.getDate() - 1);
    else if (viewType === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setSelectedDate(d);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    if (viewType === 'day') d.setDate(d.getDate() + 1);
    else if (viewType === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setSelectedDate(d);
  };

  // ── Data Binding ──────────────────────────────────────────────

  const displayAppointments = useMemo(() => {
    // PERSONAL CALENDAR FILTERING
    const filteredApps = appointments.filter(app => {
      if (!currentStaff) return false;
      return app.doctorId === currentStaff.id;
    });

    const actual = filteredApps.map(app => ({
      id: app.id,
      mrn: app.patientMrn,
      date: new Date(app.startTime),
      duration: 0.5,
      color: '#2563eb'
    }));

    // Fallback demo data if actual is empty
    const combined = actual.length > 0 ? actual : [
      { id: 901, mrn: 'MRN-2026-001', date: new Date(2026, 4, 13, 8, 30), duration: 0.5, color: '#3b82f6' },
      { id: 902, mrn: 'MRN-2026-002', date: new Date(2026, 4, 13, 10, 0), duration: 0.5, color: '#3b82f6' },
      { id: 903, mrn: 'MRN-2026-003', date: new Date(2026, 4, 13, 11, 30), duration: 0.5, color: '#3b82f6' },
      { id: 904, mrn: 'MRN-2026-004', date: new Date(2026, 4, 14, 9, 0), duration: 0.5, color: '#3b82f6' },
      { id: 905, mrn: 'MRN-2026-005', date: new Date(2026, 4, 15, 14, 0), duration: 0.5, color: '#3b82f6' },
    ];

    return combined.map(item => {
      const patient = patients.find(p => p.mrn === item.mrn);
      return {
        ...item,
        name: patient?.name || 'Unknown Patient',
        patient: patient
      };
    });
  }, [appointments, patients, currentStaff]);

  const selectedAppointment = useMemo(() => {
    return displayAppointments.find(app => app.mrn === selectedMrn);
  }, [selectedMrn, displayAppointments]);

  const selectedPatient = useMemo(() => {
    if (selectedAppointment?.patient) return selectedAppointment.patient;
    if (selectedMrn) return patients.find(p => p.mrn === selectedMrn) || null;
    return null;
  }, [selectedAppointment, selectedMrn, patients]);

  const visibleHistory = useMemo(() => {
    return selectedPatient ? medicalHistory.filter(h => h.patientMrn === selectedPatient.mrn) : [];
  }, [selectedPatient, medicalHistory]);

  const getPosition = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const top = (h - 7) * 80 + (m / 60) * 80;
    return top;
  };

  // Auto-scroll to position the current time ~150px from the top
  useEffect(() => {
    let timeoutId: any;

    const attemptScroll = (retries = 5) => {
      if (scrollRef.current && (viewType === 'day' || viewType === 'week')) {
        const top = getPosition(new Date());
        const targetScroll = Math.max(0, top - 150);
        scrollRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      } else if (retries > 0) {
        timeoutId = setTimeout(() => attemptScroll(retries - 1), 100);
      }
    };

    attemptScroll();

    return () => clearTimeout(timeoutId);
  }, [viewType, selectedDate]);

  useEffect(() => {
    if (selectedPatient) setMobileMode('half');
    else setMobileMode('calendar');
  }, [selectedPatient]);

  const handlePanelTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handlePanelTouchEnd = (e: React.TouchEvent) => {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (dy > 60) setMobileMode('full');
    else if (dy < -60) {
      if (mobileMode === 'full') setMobileMode('half');
      else onSelectMrn?.(null);
    }
  };

  // ── Render Helpers ────────────────────────────────────────────

  const renderDayView = () => (
    <div ref={scrollRef} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', flex: 1, overflowY: 'auto' }}>
      <div style={{ borderRight: '1px solid #f1f5f9', background: '#f8fafc' }}>
        {HOURS.map(h => (
          <div key={h} style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>{h}:00</div>
        ))}
      </div>
      <div style={{ position: 'relative', height: `${HOURS.length * 80}px` }}>
        {HOURS.map(h => <div key={h} style={{ height: '80px', borderBottom: '1px solid #f1f5f9' }} />)}
        {displayAppointments
          .filter(app => app.date.toDateString() === selectedDate.toDateString())
          .map(app => {
            const top = getPosition(app.date);
            const isSelected = selectedMrn === app.mrn;
            return (
              <div 
                key={app.id} 
                className={`appointment-card ${selectedMrn === app.mrn ? 'selected' : ''}`}
                onClick={() => onSelectMrn && onSelectMrn(app.mrn)}
                style={{ top: `${top}px`, height: `${app.duration * 80 - 4}px`, background: selectedMrn === app.mrn ? '#1e40af' : app.color, left: '8px', right: '8px' }}
              >
                {app.name}
              </div>
            );
          })
        }
        {/* Red Current Time Line */}
        {selectedDate.toDateString() === currentTime.toDateString() && (
          <div style={{
            position: 'absolute',
            top: `${getPosition(currentTime)}px`,
            left: 0,
            right: 0,
            height: 0,
            borderTop: '2px dashed #ef4444',
            zIndex: 9,
            pointerEvents: 'none'
          }}>
            <div style={{ position: 'absolute', left: '-5px', top: '-6px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%' }} />
          </div>
        )}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
      <div style={{ minWidth: '850px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#64748b', borderRight: '1px solid #f1f5f9' }}>Time</div>
          {weekDays.map((date, i) => {
            const isSunday = date.getDay() === 0;
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={i} style={{ padding: '1rem', textAlign: 'center', borderRight: i < 6 ? '1px solid #f1f5f9' : 'none', background: isToday ? '#f0f9ff' : 'transparent' }}>
                <div style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: '700', 
                  color: isSunday ? '#ef4444' : (isToday ? '#2563eb' : '#1e293b') 
                }}>
                  <span className="desktop-day">{DAYS[i]}</span>
                  <span className="mobile-day">{DAYS[i][0]}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: isSunday ? '#ef4444' : '#94a3b8' }}>{date.getDate()}.{date.getMonth() + 1}</div>
              </div>
            );
          })}
        </div>
        <div ref={scrollRef} className="calendar-body-scroll" style={{ position: 'relative', overflowY: 'auto', flex: 1, scrollbarWidth: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', height: `${HOURS.length * 80}px` }}>
            <div style={{ borderRight: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {HOURS.map(h => (
                <div key={h} style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>{h}:00</div>
              ))}
            </div>
            {weekDays.map((date, i) => (
              <div key={i} style={{ position: 'relative', borderRight: i < 6 ? '1px solid #f1f5f9' : 'none' }}>
                {HOURS.map(h => <div key={h} style={{ height: '80px', borderBottom: '1px solid #f1f5f9' }} />)}
                {displayAppointments
                  .filter(app => app.date.toDateString() === date.toDateString())
                  .map(app => {
                    const top = getPosition(app.date);
                    const isSelected = selectedMrn === app.mrn;
                    return (
                      <div 
                        key={app.id} 
                        className={`appointment-card ${selectedMrn === app.mrn ? 'selected' : ''}`}
                        onClick={() => onSelectMrn && onSelectMrn(app.mrn)}
                        style={{ top: `${top}px`, height: `${app.duration * 80 - 4}px`, background: selectedMrn === app.mrn ? '#1e40af' : app.color }}
                      >
                        {app.name}
                      </div>
                    );
                  })
                }
              </div>
            ))}

            {/* Global Red Current Time Line across all days */}
            <div style={{
              position: 'absolute',
              top: `${getPosition(currentTime)}px`,
              left: '80px',
              right: 0,
              height: 0,
              borderTop: '2px dashed #ef4444',
              zIndex: 9,
              pointerEvents: 'none'
            }}>
              <div style={{ position: 'absolute', left: '-5px', top: '-6px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
        {DAYS.map((day, i) => {
          const isSunday = i === 0;
          return (
            <div key={i} style={{ 
              padding: '0.75rem 0.25rem', 
              textAlign: 'center', 
              fontSize: '0.75rem', 
              fontWeight: '700', 
              color: isSunday ? '#ef4444' : '#64748b' 
            }}>
              <span className="desktop-day">{day}</span>
              <span className="mobile-day">{day[0]}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', flex: 1 }}>
        {monthDays.map((date, i) => {
          const isSelectedMonth = date.getMonth() === selectedDate.getMonth();
          const isToday = date.toDateString() === new Date().toDateString();
          const isSunday = date.getDay() === 0;
          const apps = displayAppointments.filter(app => app.date.toDateString() === date.toDateString());
          
          return (
            <div key={i} style={{ 
              borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid #f1f5f9', 
              borderBottom: i < 35 ? '1px solid #f1f5f9' : 'none',
              padding: '0.5rem 0.25rem',
              background: isSelectedMonth ? 'white' : '#f8fafc',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              minWidth: '0',
              overflow: 'hidden'
            }}>
              <div style={{ 
                fontSize: '0.75rem', 
                fontWeight: '700', 
                color: isToday 
                  ? '#2563eb' 
                  : (isSunday 
                      ? (isSelectedMonth ? '#ef4444' : '#fca5a5') 
                      : (isSelectedMonth ? '#1e293b' : '#cbd5e1')),
                textAlign: 'right'
              }}>
                {date.getDate()}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {apps.map(app => (
                  <div 
                    key={app.id} 
                    onClick={(e) => { e.stopPropagation(); onSelectMrn && onSelectMrn(app.mrn); }}
                    style={{ 
                      fontSize: '0.65rem', 
                      background: selectedMrn === app.mrn ? '#1e40af' : app.color, 
                      color: 'white', 
                      padding: '2px 4px', 
                      borderRadius: '3px', 
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {app.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="doctor-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', maxWidth: '100%' }}>
      
      {/* Header Area */}
      <div>
        <div className="cal-header-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '0.5rem', padding: '0.2rem' }}>
            <button className="cal-nav-btn" onClick={handlePrev}><ChevronLeft size={18} /></button>
            <button className="cal-nav-btn" onClick={handleNext}><ChevronRight size={18} /></button>
          </div>
          <button className="today-btn" onClick={() => setSelectedDate(new Date())}>Today</button>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            />
            <CalendarIcon size={20} color="#2563eb" style={{ cursor: 'pointer' }} />
          </div>
          <button className="btn-primary" onClick={() => setShowNewModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '36px' }}>
            <Plus size={18} /> New Appointment
          </button>
          <div className="view-selector">
            <button className={viewType === 'day' ? 'active' : ''} onClick={() => setViewType('day')}>Day</button>
            <button className={viewType === 'week' ? 'active' : ''} onClick={() => setViewType('week')}>Week</button>
            <button className={viewType === 'month' ? 'active' : ''} onClick={() => setViewType('month')}>Month</button>
          </div>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
          {viewType === 'day' ? selectedDate.toDateString() : viewType === 'week' ? `Week of ${weekDays[0].toDateString()}` : 'Monthly Overview'}
        </p>
      </div>

      <div
        className={`flow-board-wrapper${selectedPatient ? ' detail-open' : ''}${mobileMode === 'half' ? ' mobile-half' : mobileMode === 'full' ? ' mobile-full' : ''}`}
        style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}
      >
        {/* Calendar Section */}
        <div className="calendar-section" style={{
          background: 'white',
          borderRadius: '1.25rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {viewType === 'day' ? renderDayView() : viewType === 'week' ? renderWeekView() : renderMonthView()}
        </div>

        {/* Patient Detail Panel */}
        <div className={`detail-panel${selectedPatient ? ' open' : ''}`}>
          {/* Drag handle — mobile only */}
          <div
            className="detail-drag-handle"
            onTouchStart={handlePanelTouchStart}
            onTouchEnd={handlePanelTouchEnd}
          />
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {selectedPatient ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <Avatar name={selectedPatient.name} photoUrl={selectedPatient.photoUrl} size={72} />
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{selectedPatient.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '2px 0 6px' }}>{selectedPatient.amharic}</p>
                  <div style={{ display: 'inline-block', padding: '0.2rem 0.6rem', background: '#eff6ff', borderRadius: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563eb', fontFamily: 'monospace' }}>{selectedPatient.mrn}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => onSelectMrn && onSelectMrn(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: '#64748b' }}>
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="info-card">
                <span className="info-label">GENDER</span>
                <span className="info-value">{selectedPatient.gender || '—'}</span>
              </div>
              <div className="info-card">
                <span className="info-label">DOB / AGE</span>
                <span className="info-value">
                  {selectedPatient.dob || '—'} 
                  {selectedPatient.dob ? ` (${new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()})` : ''}
                </span>
              </div>
              <div className="info-card">
                <span className="info-label">STATUS</span>
                <span className={`status-badge ${selectedPatient.status === 'Waiting' ? 'status-pending' : 'status-active'}`}>{selectedPatient.status}</span>
              </div>
              <div className="info-card">
                <span className="info-label">VISIT TYPE</span>
                <span className="info-value">{selectedPatient.visitType}</span>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>Reason for Visit</h4>
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', fontSize: '0.95rem', color: '#334155', borderLeft: '4px solid #3b82f6', lineHeight: 1.6 }}>
                {selectedPatient.diagnosisSummary || 'Patient reports persistent headache and fatigue for 3 days. History of hypertension. Requires review of current medication plan.'}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>Recent Vitals</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem 0.5rem', background: '#fff1f2', borderRadius: '0.75rem', border: '1px solid #ffe4e6' }}>
                  <div style={{ fontSize: '0.7rem', color: '#be123c', fontWeight: '800', marginBottom: '0.25rem' }}>HR</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#9f1239' }}>{selectedPatient.vitals?.[0]?.heartRate || '78'}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem 0.5rem', background: '#ecfdf5', borderRadius: '0.75rem', border: '1px solid #d1fae5' }}>
                  <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: '800', marginBottom: '0.25rem' }}>BP</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#065f46' }}>{selectedPatient.vitals?.[0]?.bpSystolic || '120'}/{selectedPatient.vitals?.[0]?.bpDiastolic || '80'}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem 0.5rem', background: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #dbeafe' }}>
                  <div style={{ fontSize: '0.7rem', color: '#1d4ed8', fontWeight: '800', marginBottom: '0.25rem' }}>SPO2</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e40af' }}>{selectedPatient.vitals?.[0]?.spo2 || '98'}%</div>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Medical History
                {visibleHistory.length > 5 && (
                  <button 
                    onClick={() => onViewHistory && onViewHistory({ mrn: selectedPatient.mrn, name: selectedPatient.name, amharic: selectedPatient.amharic })}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    View More
                  </button>
                )}
              </h4>
              <div style={{ position: 'relative', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'absolute', left: '4px', top: '5px', bottom: '5px', width: '2px', background: '#e2e8f0' }} />
                {visibleHistory.slice(0, 5).map((h) => (
                  <div key={h.id} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setSelectedHistoryItem(h)}>
                    <div style={{ position: 'absolute', left: '-1.5rem', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', border: '2px solid white', boxShadow: '0 0 0 2px #eff6ff' }} />
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '2px' }}>{h.date} • {h.doctor}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b' }}>{h.diagnosis}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>{h.summary}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontSize: '1rem' }}
                onClick={() => onStartConsult && onStartConsult({ mrn: selectedPatient.mrn, name: selectedPatient.name, amharic: selectedPatient.amharic })}
              >
                <Stethoscope size={22} /> Start Consult
              </button>
            </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* History Detail Modal */}
      {selectedHistoryItem && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={() => setSelectedHistoryItem(null)}>
          <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', width: '600px', maxWidth: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase' }}>Clinical Record Detail</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>{selectedHistoryItem.diagnosis}</h3>
              </div>
              <button onClick={() => setSelectedHistoryItem(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="info-card">
                <span className="info-label">DATE</span>
                <span className="info-value">{selectedHistoryItem.date}</span>
              </div>
              <div className="info-card">
                <span className="info-label">DOCTOR</span>
                <span className="info-value">{selectedHistoryItem.doctor}</span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#475569', marginBottom: '0.75rem' }}>Subjective & Assessment</h4>
              <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>{selectedHistoryItem.summary}</p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#475569', marginBottom: '0.75rem' }}>Treatment Plan</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ padding: '0.4rem 0.8rem', background: '#eff6ff', color: '#2563eb', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: '700' }}>Prescription Issued</span>
                <span style={{ padding: '0.4rem 0.8rem', background: '#ecfdf5', color: '#059669', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: '700' }}>Lab Review Done</span>
                <span style={{ padding: '0.4rem 0.8rem', background: '#fff7ed', color: '#d97706', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: '700' }}>Follow-up Scheduled</span>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {canDeleteHistory ? (
                !showDeleteConfirm ? (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.6rem 1.2rem', background: '#fef2f2', color: '#dc2626', 
                      border: '1px solid #fecaca', borderRadius: '0.75rem', 
                      fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={16} /> Delete Record
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: '700' }}>Confirm delete?</span>
                    <button 
                      onClick={async () => {
                        if (selectedHistoryItem) {
                          await deleteMedicalHistory(selectedHistoryItem.id);
                          setSelectedHistoryItem(null);
                          setShowDeleteConfirm(false);
                        }
                      }}
                      style={{ padding: '0.4rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Yes
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{ padding: '0.4rem 1rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      No
                    </button>
                  </div>
                )
              ) : <div />}
              <button className="btn-primary" onClick={() => { setSelectedHistoryItem(null); setShowDeleteConfirm(false); }} style={{ padding: '0.75rem 2rem' }}>Close Record</button>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {showNewModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '1.25rem', width: '450px', maxWidth: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', color: '#1e293b' }}>New Appointment</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Select Patient</label>
                <select 
                  value={newAppt.patientMrn} 
                  onChange={(e) => setNewAppt({ ...newAppt, patientMrn: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.6rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                >
                  <option value="">Choose Patient...</option>
                  {patients.map(p => <option key={p.mrn} value={p.mrn}>{p.name} ({p.mrn})</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={newAppt.startTime}
                  onChange={(e) => setNewAppt({ ...newAppt, startTime: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.6rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Notes</label>
                <textarea 
                  value={newAppt.notes}
                  onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
                  placeholder="Reason for appointment..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.6rem', border: '1px solid #e2e8f0', background: '#f8fafc', height: '100px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowNewModal(false)}>Cancel</button>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1.5 }}
                  disabled={!newAppt.patientMrn || !newAppt.startTime}
                  onClick={async () => {
                    if (!currentStaff) return;
                    const start = new Date(newAppt.startTime);
                    const end = new Date(start.getTime() + 30 * 60000); // Default 30 min
                    await addAppointment({
                      patientMrn: newAppt.patientMrn,
                      doctorId: currentStaff.id,
                      startTime: start.toISOString(),
                      endTime: end.toISOString(),
                      status: 'Scheduled',
                      notes: newAppt.notes
                    });
                    setShowNewModal(false);
                    setNewAppt({ patientMrn: '', startTime: '', notes: '' });
                  }}
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .view-selector {
          display: flex;
          align-items: center;
          background: #f1f5f9;
          padding: 0.2rem;
          border-radius: 0.6rem;
          height: 36px;
          box-sizing: border-box;
        }
        .view-selector button {
          padding: 0 1rem;
          height: 100%;
          border: none;
          background: none;
          font-size: 0.85rem;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          border-radius: 0.45rem;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .view-selector button.active {
          background: white;
          color: #2563eb;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .cal-nav-btn {
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          color: #64748b;
          display: flex;
          align-items: center;
          border-radius: 0.4rem;
          transition: all 0.2s;
        }
        .cal-nav-btn:hover {
          background: white;
          color: #2563eb;
        }
        .today-btn {
          padding: 0 1rem;
          height: 36px;
          border-radius: 0.6rem;
          border: 1px solid #e2e8f0;
          background: white;
          font-size: 0.85rem;
          font-weight: 700;
          color: #1e293b;
          cursor: pointer;
          transition: all 0.2s;
        }
        .today-btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .appointment-card {
          position: absolute;
          left: 6px;
          right: 6px;
          border-radius: 0.6rem;
          padding: 0.6rem;
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.12);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .appointment-card:hover {
          transform: translateY(-3px) scale(1.02);
          filter: brightness(1.1);
          z-index: 10;
          box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.15);
        }
        .appointment-card.selected {
          border: 2px solid white;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2), 0 12px 24px -6px rgba(0,0,0,0.2);
          z-index: 11;
        }
        .info-card {
          background: #f8fafc;
          padding: 0.85rem;
          border-radius: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          border: 1px solid #e2e8f0;
        }
        .info-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .info-value {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .calendar-body-scroll::-webkit-scrollbar {
          display: none;
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
    </div>
  );
};

export default DoctorDashboard;
