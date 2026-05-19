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
  const { appointments, patients, currentStaff, role, medicalHistory, deleteMedicalHistory, addAppointment, calendarEvents, addCalendarEvent, deleteCalendarEvent } = useEMR();
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<MedicalHistoryItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newEvent, setNewEvent] = useState<{ category: 'Consultation' | 'Seminar' | 'Meeting' | 'Training' | 'Event'; title: string; startTime: string; endTime: string; location: string; notes: string }>({ category: 'Consultation', title: '', startTime: '', endTime: '', location: '', notes: '' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [categoryFilter, setCategoryFilter] = useState<Record<string, boolean>>({ Appointment: true, Consultation: true, Seminar: true, Meeting: true, Training: true, Event: true });
  const [calendarSearch, setCalendarSearch] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
    Appointment:  { label: '환자 진료', color: '#1d4ed8', bg: '#dbeafe' },
    Consultation: { label: '진료',      color: '#0e7490', bg: '#cffafe' },
    Seminar:      { label: '세미나',    color: '#6d28d9', bg: '#ede9fe' },
    Meeting:      { label: '회의',      color: '#c2410c', bg: '#ffedd5' },
    Training:     { label: '교육',      color: '#15803d', bg: '#dcfce7' },
    Event:        { label: '행사',      color: '#be185d', bg: '#fce7f3' },
  };

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
    if (!categoryFilter.Appointment) return [];

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

    const q = calendarSearch.trim().toLowerCase();
    return combined
      .map(item => {
        const patient = patients.find(p => p.mrn === item.mrn);
        return {
          ...item,
          name: patient?.name || 'Unknown Patient',
          patient: patient,
        };
      })
      .filter(item => !q || item.name.toLowerCase().includes(q) || item.mrn.toLowerCase().includes(q));
  }, [appointments, patients, currentStaff, categoryFilter.Appointment, calendarSearch]);

  const displayEvents = useMemo(() => {
    if (!currentStaff) return [];
    const q = calendarSearch.trim().toLowerCase();
    return calendarEvents
      .filter(ev => ev.doctorId === currentStaff.id)
      .filter(ev => categoryFilter[ev.category])
      .filter(ev => !q || ev.title.toLowerCase().includes(q) || (ev.location ?? '').toLowerCase().includes(q))
      .map(ev => {
        const start = new Date(ev.startTime);
        const end = new Date(ev.endTime);
        const durationHours = Math.max(0.25, (end.getTime() - start.getTime()) / 3_600_000);
        return { ...ev, date: start, durationHours };
      });
  }, [calendarEvents, currentStaff, categoryFilter, calendarSearch]);

  const selectedEvent = useMemo(
    () => (selectedEventId != null ? calendarEvents.find(e => e.id === selectedEventId) ?? null : null),
    [selectedEventId, calendarEvents]
  );

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
        {displayEvents
          .filter(ev => ev.date.toDateString() === selectedDate.toDateString())
          .map(ev => {
            const top = getPosition(ev.date);
            const meta = CATEGORY_META[ev.category];
            return (
              <div
                key={`ev-${ev.id}`}
                className="appointment-card event-card"
                onClick={(e) => { e.stopPropagation(); setSelectedEventId(ev.id); }}
                style={{ top: `${top}px`, height: `${ev.durationHours * 80 - 4}px`, background: meta.bg, color: meta.color, border: `1px solid ${meta.color}`, left: '8px', right: '8px' }}
                title={`${meta.label} · ${ev.title}`}
              >
                <span style={{ fontWeight: 800 }}>[{meta.label}] {ev.title}</span>
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
      <div className="week-view-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div ref={scrollRef} className="calendar-body-scroll" style={{ position: 'relative', overflowY: 'auto', flex: 1, scrollbarWidth: 'none' }}>
          
          {/* Header Grid (Sticky at the top) */}
          <div className="week-grid" style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 20, 
            borderBottom: '1px solid #e2e8f0', 
            background: 'white' 
          }}>
            <div className="time-header" style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#64748b', borderRight: '1px solid #f1f5f9' }}>Time</div>
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
                  <div style={{ fontSize: '0.75rem', color: isSunday ? '#ef4444' : '#94a3b8' }}>{date.getMonth() + 1}.{date.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Body Grid */}
          <div className="week-grid" style={{ height: `${HOURS.length * 80}px`, position: 'relative' }}>
            <div style={{ borderRight: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {HOURS.map(h => (
                <div key={h} className="time-label" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>{h}:00</div>
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
                {displayEvents
                  .filter(ev => ev.date.toDateString() === date.toDateString())
                  .map(ev => {
                    const top = getPosition(ev.date);
                    const meta = CATEGORY_META[ev.category];
                    return (
                      <div
                        key={`ev-${ev.id}`}
                        className="appointment-card event-card"
                        onClick={(e) => { e.stopPropagation(); setSelectedEventId(ev.id); }}
                        style={{ top: `${top}px`, height: `${ev.durationHours * 80 - 4}px`, background: meta.bg, color: meta.color, border: `1px solid ${meta.color}` }}
                        title={`${meta.label} · ${ev.title}`}
                      >
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, lineHeight: 1.1, padding: '2px' }}>[{meta.label}]<br />{ev.title}</span>
                      </div>
                    );
                  })
                }
              </div>
            ))}

            {/* Global Red Current Time Line across all days */}
            <div 
              className="current-time-line"
              style={{
                position: 'absolute',
                top: `${getPosition(currentTime)}px`,
                right: 0,
                height: 0,
                borderTop: '2px dashed #ef4444',
                zIndex: 9,
                pointerEvents: 'none'
              }}
            >
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
          const evs = displayEvents.filter(ev => ev.date.toDateString() === date.toDateString());

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
                {evs.map(ev => {
                  const meta = CATEGORY_META[ev.category];
                  return (
                    <div
                      key={`ev-${ev.id}`}
                      onClick={(e) => { e.stopPropagation(); setSelectedEventId(ev.id); }}
                      style={{
                        fontSize: '0.65rem',
                        background: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.color}`,
                        padding: '2px 4px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: 700,
                      }}
                      title={`${meta.label} · ${ev.title}`}
                    >
                      [{meta.label}] {ev.title}
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
            <Plus size={18} /> New Event
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

        {/* Category filter chips + search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {(['Appointment','Consultation','Seminar','Meeting','Training','Event'] as const).map(cat => {
              const meta = CATEGORY_META[cat];
              const active = categoryFilter[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(f => ({ ...f, [cat]: !f[cat] }))}
                  style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.7rem',
                    borderRadius: '999px', cursor: 'pointer',
                    background: active ? meta.bg : 'white',
                    color: active ? meta.color : '#94a3b8',
                    border: `1px solid ${active ? meta.color : '#e2e8f0'}`,
                    opacity: active ? 1 : 0.6,
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px', marginLeft: 'auto' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={calendarSearch}
              onChange={e => setCalendarSearch(e.target.value)}
              placeholder="Search patient name or event title..."
              style={{ width: '100%', padding: '0.45rem 0.5rem 0.45rem 1.9rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem', boxSizing: 'border-box' }}
            />
          </div>
        </div>
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
                {(() => {
                  const raw = selectedPatient.diagnosisSummary;
                  if (!raw) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No visit reason recorded yet.</span>;
                  try {
                    const parsed = JSON.parse(raw);
                    // JSON 형태로 저장된 경우: diagnosis 또는 subjective 필드를 사용
                    const display = parsed.diagnosis || parsed.subjective || parsed.notes || '';
                    return display
                      ? display
                      : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No visit reason recorded yet.</span>;
                  } catch {
                    // 일반 텍스트인 경우 그대로 표시
                    return raw;
                  }
                })()}
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

      {/* New Event Modal */}
      {showNewModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '1.25rem', width: '480px', maxWidth: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', color: '#1e293b' }}>New Event</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(['Consultation','Seminar','Meeting','Training','Event'] as const).map(cat => {
                    const meta = CATEGORY_META[cat];
                    const active = newEvent.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, category: cat })}
                        style={{
                          fontSize: '0.78rem', fontWeight: 700, padding: '0.4rem 0.85rem',
                          borderRadius: '999px', cursor: 'pointer',
                          background: active ? meta.color : meta.bg,
                          color: active ? 'white' : meta.color,
                          border: `1px solid ${meta.color}`,
                        }}
                      >{meta.label}</button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. 외래 진료 / 부서 회의 / 심포지엄"
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '0.6rem', border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Start</label>
                  <input
                    type="datetime-local"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.6rem', border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>End</label>
                  <input
                    type="datetime-local"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.6rem', border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Location (optional)</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="e.g. 회의실 A, Zoom"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.6rem', border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Notes (optional)</label>
                <textarea
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  placeholder="Agenda, topic, etc."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.6rem', border: '1px solid #e2e8f0', background: '#f8fafc', height: '70px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button className="btn-secondary" style={{ flex: 1, padding: '0.7rem', borderRadius: '0.6rem', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer' }} onClick={() => setShowNewModal(false)}>Cancel</button>
                <button
                  className="btn-primary"
                  style={{ flex: 1.5, padding: '0.7rem', borderRadius: '0.6rem', border: 'none', background: '#2563eb', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                  disabled={!newEvent.title || !newEvent.startTime || !newEvent.endTime}
                  onClick={async () => {
                    if (!currentStaff) return;
                    const start = new Date(newEvent.startTime);
                    const end = newEvent.endTime ? new Date(newEvent.endTime) : new Date(start.getTime() + 30 * 60000);
                    await addCalendarEvent({
                      doctorId: currentStaff.id,
                      category: newEvent.category,
                      title: newEvent.title.trim(),
                      startTime: start.toISOString(),
                      endTime: end.toISOString(),
                      location: newEvent.location.trim() || undefined,
                      notes: newEvent.notes.trim() || undefined,
                    });
                    setShowNewModal(false);
                    setNewEvent({ category: 'Consultation', title: '', startTime: '', endTime: '', location: '', notes: '' });
                  }}
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={() => setSelectedEventId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '1.75rem', borderRadius: '1.25rem', width: '420px', maxWidth: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                background: CATEGORY_META[selectedEvent.category].bg, color: CATEGORY_META[selectedEvent.category].color,
                border: `1px solid ${CATEGORY_META[selectedEvent.category].color}`,
                padding: '0.25rem 0.7rem', borderRadius: '999px'
              }}>{CATEGORY_META[selectedEvent.category].label}</span>
              <button onClick={() => setSelectedEventId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{selectedEvent.title}</h3>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
              <div><strong>When:</strong> {new Date(selectedEvent.startTime).toLocaleString()} – {new Date(selectedEvent.endTime).toLocaleString()}</div>
              {selectedEvent.location && <div><strong>Where:</strong> {selectedEvent.location}</div>}
              {selectedEvent.notes && <div><strong>Notes:</strong> {selectedEvent.notes}</div>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={async () => {
                  if (confirm('Delete this event?')) {
                    await deleteCalendarEvent(selectedEvent.id);
                    setSelectedEventId(null);
                  }
                }}
                style={{ padding: '0.55rem 1rem', borderRadius: '0.5rem', border: '1px solid #fecaca', background: 'white', color: '#b91c1c', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              ><Trash2 size={14} /> Delete</button>
              <button onClick={() => setSelectedEventId(null)} style={{ padding: '0.55rem 1.1rem', borderRadius: '0.5rem', border: 'none', background: '#1e293b', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Close</button>
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
        .week-view-container {
          min-width: 850px;
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }
        .week-grid {
          display: grid;
          grid-template-columns: 80px repeat(7, minmax(0, 1fr));
        }
        .current-time-line {
          left: 80px;
        }
        @media (max-width: 640px) {
          .desktop-day { display: none; }
          .mobile-day { display: inline; }
          .week-view-container {
            min-width: 100%;
          }
          .week-grid {
            grid-template-columns: 50px repeat(7, minmax(0, 1fr));
          }
          .time-header {
            padding: 1rem 0.25rem !important;
            font-size: 0.75rem !important;
          }
          .time-label {
            font-size: 0.65rem !important;
          }
          .current-time-line {
            left: 50px;
          }
          .appointment-card {
            padding: 0.2rem 0.1rem !important;
            font-size: 0.6rem !important;
            text-align: center;
            line-height: 1.1;
          }
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
