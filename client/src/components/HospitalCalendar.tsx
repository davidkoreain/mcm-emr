import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Star, Filter, Plus, 
  Search, Check, CheckSquare, Square, Clock, X, Grid, List,
  User, Phone, Droplet, ShieldAlert, Heart, Calendar, Activity, Info
} from 'lucide-react';
import { useEMR } from '../context/EMRContext';
import type { Patient, Surgery, LabOrder } from '../context/EMRContext';
import Avatar from './Avatar';

type CalEvent = {
  id: string;
  title: string;
  type: 'Admission' | 'Discharge' | 'Surgery' | 'Lab' | 'General';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  patientName?: string;
  patientMrn?: string;
  doctor?: string;
  location?: string;
  isKey?: boolean;
  color: string;
};

const TYPE_COLORS: Record<CalEvent['type'], string> = {
  Surgery: '#ef4444', // Red
  Admission: '#3b82f6', // Blue
  Discharge: '#10b981', // Green
  Lab: '#8b5cf6', // Purple
  General: '#f59e0b', // Orange
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDateLocal = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const HospitalCalendar: React.FC = () => {
  const { patients, surgeries, labOrders, medicalHistory } = useEMR();

  // Navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  // Selected Patient for Popup Modal
  const [selectedPatientMrn, setSelectedPatientMrn] = useState<string | null>(null);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientMrn) return null;
    return patients.find(p => p.mrn === selectedPatientMrn) || null;
  }, [selectedPatientMrn, patients]);

  const patientDetails = useMemo(() => {
    if (!selectedPatient) return null;

    // 1. Calculate Age
    let calculatedAge = '—';
    if (selectedPatient.dob) {
      const birthDate = new Date(selectedPatient.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      calculatedAge = `${age}`;
    }

    // 2. Find Medical History
    const history = medicalHistory?.filter(h => h.patientMrn === selectedPatient.mrn) || [];
    const latestHistory = history[history.length - 1];

    // 3. Derive Allergies (using riskFactors)
    const allergies = latestHistory?.riskFactors?.join(', ') || 'None';

    // 4. Chief Complaint / Reason / JSON Parsing
    let rawReason = selectedPatient.diagnosisSummary || latestHistory?.summary || latestHistory?.diagnosis || 'General clinical monitoring';
    let diagnosis = '';
    let subjective = '';
    let notes = '';

    if (rawReason && rawReason.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(rawReason);
        diagnosis = parsed.diagnosis || parsed.chiefComplaint || parsed.reasonForVisit || '';
        subjective = parsed.subjective || '';
        notes = parsed.notes || parsed.objective || '';
      } catch (e) {
        diagnosis = rawReason;
      }
    } else {
      diagnosis = rawReason;
    }

    // 5. Language/Race
    const language = selectedPatient.language || 'English';

    return {
      age: calculatedAge,
      allergies,
      diagnosis: diagnosis || 'General clinical monitoring',
      subjective,
      notes,
      language
    };
  }, [selectedPatient, medicalHistory]);

  // Custom events added manually
  const [customEvents, setCustomEvents] = useState<CalEvent[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    type: 'General' as CalEvent['type'],
    date: formatDateLocal(new Date()),
    time: '12:00',
    doctor: '',
    location: '',
    isKey: false
  });

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<CalEvent['type'][]>(['Admission', 'Discharge', 'Surgery', 'Lab', 'General']);
  const [keyOnly, setKeyOnly] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Time tracker for current time indicator (red dashed line)
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000); // Update every 30 seconds
    return () => clearInterval(timer);
  }, []);

  const timeGridRef = useRef<HTMLDivElement>(null);

  // Scroll to current time position in week/day view on mount or view changes
  useEffect(() => {
    if ((viewMode === 'week' || viewMode === 'day') && timeGridRef.current) {
      const hours = now.getHours();
      // Scroll to a bit before the current time (e.g. 2 hours before) to keep it in context
      const scrollPos = Math.max(0, (hours - 2) * 60);
      timeGridRef.current.scrollTop = scrollPos;
    }
  }, [viewMode, now]);

  // Aggregate database events + custom events
  const allEvents = useMemo(() => {
    const events: CalEvent[] = [];

    // 1. Admission Events (from Patients)
    patients.forEach(p => {
      const admissionDate = p.actualAdmissionDate || p.admissionDate;
      if (admissionDate) {
        events.push({
          id: `admission-${p.mrn}-${admissionDate}`,
          title: `[Admission] ${p.name} (Ward: ${p.assignedWard || p.ward || '—'})`,
          type: 'Admission',
          date: admissionDate,
          time: '09:00',
          patientName: p.name,
          patientMrn: p.mrn,
          color: TYPE_COLORS.Admission,
          isKey: p.visitType === 'Emergency'
        });
      }
    });

    // 2. Discharge Events (from Patients)
    patients.forEach(p => {
      const dischargeDate = p.actualDischargeDate || p.dischargeDate;
      if (dischargeDate) {
        events.push({
          id: `discharge-${p.mrn}-${dischargeDate}`,
          title: `[Discharge] ${p.name}`,
          type: 'Discharge',
          date: dischargeDate,
          time: '11:00',
          patientName: p.name,
          patientMrn: p.mrn,
          color: TYPE_COLORS.Discharge,
          isKey: false
        });
      }
    });

    // 3. Surgery Events
    surgeries.forEach(s => {
      if (s.status !== 'Cancelled' && s.startTime) {
        const datePart = s.startTime.split('T')[0];
        const timePart = s.startTime.split('T')[1]?.substring(0, 5) || '08:00';
        events.push({
          id: `surgery-${s.id}`,
          title: `[Surgery] ${s.patientName} - ${s.operationName}`,
          type: 'Surgery',
          date: datePart,
          time: timePart,
          patientName: s.patientName,
          patientMrn: s.patientMrn,
          location: `OR Room ${s.roomNumber}`,
          color: TYPE_COLORS.Surgery,
          isKey: true
        });
      }
    });

    // 4. Lab Order Events
    labOrders.forEach(o => {
      const datePart = o.scheduledDate || o.createdAt?.split('T')[0];
      if (datePart) {
        events.push({
          id: `lab-${o.id}`,
          title: `[Lab] ${o.patientName} - ${o.tests.join(', ')}`,
          type: 'Lab',
          date: datePart,
          time: '10:00',
          patientName: o.patientName,
          patientMrn: o.patientMrn,
          color: TYPE_COLORS.Lab,
          isKey: o.priority === 'Urgent'
        });
      }
    });

    // 5. Combine with Custom Events
    return [...events, ...customEvents];
  }, [patients, surgeries, labOrders, customEvents]);

  // Filter events based on search and selected types
  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      const matchSearch = searchTerm.trim() === '' || 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.patientName && e.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.patientMrn && e.patientMrn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.doctor && e.doctor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.location && e.location.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = selectedTypes.includes(e.type);
      const matchKey = !keyOnly || e.isKey;

      return matchSearch && matchType && matchKey;
    });
  }, [allEvents, searchTerm, selectedTypes, keyOnly]);

  // Navigate dates
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Add custom event
  const handleAddEvent = () => {
    if (!addForm.title.trim()) return;
    const newEv: CalEvent = {
      id: `custom-${Date.now()}`,
      title: addForm.title,
      type: addForm.type,
      date: addForm.date,
      time: addForm.time,
      doctor: addForm.doctor || undefined,
      location: addForm.location || undefined,
      isKey: addForm.isKey,
      color: TYPE_COLORS[addForm.type]
    };
    setCustomEvents(prev => [...prev, newEv]);
    setAddModal(false);
    setAddForm({
      title: '',
      type: 'General',
      date: formatDateLocal(new Date()),
      time: '12:00',
      doctor: '',
      location: '',
      isKey: false
    });
  };

  // Toggle filter types
  const toggleTypeFilter = (type: CalEvent['type']) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Helper: Month header label
  const headerLabel = useMemo(() => {
    if (viewMode === 'month') {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay()); // Sunday
      const end = new Date(start);
      end.setDate(end.getDate() + 6); // Saturday
      
      if (start.getMonth() === end.getMonth()) {
        return `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
      } else if (start.getFullYear() === end.getFullYear()) {
        return `${MONTH_NAMES[start.getMonth()]} - ${MONTH_NAMES[end.getMonth()]} ${start.getFullYear()}`;
      } else {
        return `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()} - ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
      }
    } else {
      return `${currentDate.getDate()} ${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  }, [currentDate, viewMode]);

  // Helper: Month days generation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday is 0
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Fill preceding empty slots (previous month days)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Fill succeeding empty slots to complete the grid (usually 42 boxes)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Helper: Week days generation (starts on Sunday)
  const weekDaysList = useMemo(() => {
    const list = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  }, [currentDate]);

  // Check if dates are today
  const checkIsToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getEventsForDate = (date: Date) => {
    const formatted = formatDateLocal(date);
    return filteredEvents.filter(e => e.date === formatted);
  };

  const getEventsForDateAndTime = (date: Date, hour: number) => {
    const formattedDate = formatDateLocal(date);
    return filteredEvents.filter(e => {
      if (e.date !== formattedDate) return false;
      const evHour = parseInt(e.time.split(':')[0], 10);
      return evHour === hour;
    });
  };

  // Current time marker y-coordinate (pixels)
  const currentTimePosition = useMemo(() => {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // 1 hour is 60px height
    return hours * 60 + minutes;
  }, [now]);

  const showTimeLineInWeek = useMemo(() => {
    const today = new Date();
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    today.setHours(0,0,0,0);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    return today.getTime() >= start.getTime() && today.getTime() <= end.getTime();
  }, [currentDate, now]);

  const showTimeLineInDay = useMemo(() => {
    return checkIsToday(currentDate);
  }, [currentDate, now]);

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const renderMonthView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '650px' }}>
        {/* Week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          {WEEK_DAYS.map((day, idx) => (
            <div 
              key={day} 
              style={{ 
                padding: '0.75rem', 
                textAlign: 'center', 
                fontWeight: '700', 
                fontSize: '0.85rem', 
                color: idx === 0 ? '#ef4444' : '#64748b' // Sunday is red
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, gridAutoRows: '1fr', background: '#e2e8f0', gap: '1px' }}>
          {monthDays.map(({ date, isCurrentMonth }, idx) => {
            const dayEvents = getEventsForDate(date);
            const isSunday = date.getDay() === 0;
            const isTodayDate = checkIsToday(date);

            return (
              <div 
                key={idx} 
                style={{ 
                  background: isCurrentMonth ? 'white' : '#f8fafc', 
                  padding: '0.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.25rem',
                  overflow: 'hidden',
                  minHeight: '100px'
                }}
              >
                {/* Date Number */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span 
                    style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: '700',
                      color: isTodayDate 
                        ? 'white' 
                        : (isSunday ? '#ef4444' : (isCurrentMonth ? '#1e293b' : '#94a3b8')),
                      background: isTodayDate ? '#3b82f6' : 'transparent',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {date.getDate()}
                  </span>
                </div>

                {/* Events list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto', flex: 1, maxHeight: '80px' }}>
                  {dayEvents.map(e => (
                    <div 
                      key={e.id}
                      title={`${e.time} - ${e.title}`}
                      onClick={(ev) => {
                        if (e.patientMrn) {
                          ev.stopPropagation();
                          setSelectedPatientMrn(e.patientMrn);
                        }
                      }}
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.15rem 0.35rem', 
                        borderRadius: '0.25rem', 
                        background: `${e.color}15`, 
                        color: e.color, 
                        borderLeft: `3px solid ${e.color}`,
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.2rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: '600',
                        cursor: e.patientMrn ? 'pointer' : 'default'
                      }}
                    >
                      {e.isKey && <Star size={8} fill={e.color} stroke="none" />}
                      <span style={{ fontWeight: '800' }}>{e.time}</span>
                      <span>{e.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div 
        ref={timeGridRef}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '600px', 
          overflowY: 'auto', 
          background: 'white',
          position: 'relative'
        }}
      >
        {/* Sticky headers */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '60px repeat(7, 1fr)', 
          borderBottom: '1px solid #e2e8f0', 
          background: '#f8fafc',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ borderRight: '1px solid #cbd5e1' }} />
          {weekDaysList.map((date, idx) => {
            const isSunday = idx === 0;
            const isTodayDate = checkIsToday(date);
            return (
              <div 
                key={idx} 
                style={{ 
                  padding: '0.5rem', 
                  textAlign: 'center', 
                  borderRight: '1px solid #e2e8f0',
                  color: isSunday ? '#ef4444' : '#475569'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: '500' }}>{WEEK_DAYS[idx].toUpperCase()}</div>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '800',
                  color: isTodayDate ? 'white' : 'inherit',
                  background: isTodayDate ? '#3b82f6' : 'transparent',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '0.15rem'
                }}>{date.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* Timeline Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', position: 'relative', height: '1440px' }}>
          
          {/* Time tracker line */}
          {showTimeLineInWeek && (
            <div style={{ 
              position: 'absolute', 
              top: `${currentTimePosition}px`, 
              left: '60px', 
              right: 0, 
              borderTop: '2px dashed #ef4444', 
              zIndex: 5,
              pointerEvents: 'none'
            }}>
              <span style={{ 
                position: 'absolute', 
                left: '-55px', 
                top: '-9px', 
                background: '#ef4444', 
                color: 'white', 
                fontSize: '0.65rem', 
                padding: '0.1rem 0.3rem', 
                borderRadius: '0.25rem',
                fontWeight: '800'
              }}>
                {now.toTimeString().substring(0, 5)}
              </span>
            </div>
          )}

          {/* Hourly Slots */}
          {Array.from({ length: 24 }).map((_, hour) => (
            <React.Fragment key={hour}>
              {/* Hour Indicator */}
              <div style={{ 
                height: '60px', 
                paddingRight: '0.5rem', 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'flex-end', 
                fontSize: '0.72rem', 
                color: '#64748b',
                fontWeight: '600',
                borderRight: '1px solid #cbd5e1',
                paddingTop: '0.25rem',
                background: '#f8fafc'
              }}>
                {formatHour(hour)}
              </div>

              {/* Day cells for this hour */}
              {weekDaysList.map((date, idx) => {
                const hourEvents = getEventsForDateAndTime(date, hour);
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      height: '60px', 
                      borderRight: '1px solid #f1f5f9', 
                      borderBottom: '1px solid #f1f5f9', 
                      padding: '0.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.1rem',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {hourEvents.map(e => (
                      <div 
                        key={e.id}
                        title={`${e.time} - ${e.title}`}
                        onClick={(ev) => {
                          if (e.patientMrn) {
                            ev.stopPropagation();
                            setSelectedPatientMrn(e.patientMrn);
                          }
                        }}
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.25rem',
                          borderRadius: '0.2rem',
                          background: `${e.color}15`,
                          color: e.color,
                          borderLeft: `2.5px solid ${e.color}`,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: '600',
                          lineHeight: '1.2',
                          cursor: e.patientMrn ? 'pointer' : 'default'
                        }}
                      >
                        {e.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const isSunday = currentDate.getDay() === 0;
    return (
      <div 
        ref={timeGridRef}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '600px', 
          overflowY: 'auto', 
          background: 'white',
          position: 'relative'
        }}
      >
        {/* Sticky Day Header */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '80px 1fr', 
          borderBottom: '1px solid #e2e8f0', 
          background: '#f8fafc',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          padding: '0.75rem'
        }}>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ 
              fontSize: '1.5rem', 
              fontWeight: '800', 
              color: isSunday ? '#ef4444' : '#1e293b' 
            }}>
              {WEEK_DAYS[currentDate.getDay()]}
            </span>
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: '500', 
              color: '#64748b' 
            }}>
              {currentDate.getDate()} {MONTH_NAMES[currentDate.getMonth()]}
            </span>
          </div>
        </div>

        {/* Timeline details */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', position: 'relative', height: '1440px' }}>
          
          {/* Current time tracker dashed line */}
          {showTimeLineInDay && (
            <div style={{ 
              position: 'absolute', 
              top: `${currentTimePosition}px`, 
              left: '80px', 
              right: 0, 
              borderTop: '2px dashed #ef4444', 
              zIndex: 5,
              pointerEvents: 'none'
            }}>
              <span style={{ 
                position: 'absolute', 
                left: '-65px', 
                top: '-9px', 
                background: '#ef4444', 
                color: 'white', 
                fontSize: '0.65rem', 
                padding: '0.1rem 0.3rem', 
                borderRadius: '0.25rem',
                fontWeight: '800'
              }}>
                {now.toTimeString().substring(0, 5)}
              </span>
            </div>
          )}

          {/* Slots */}
          {Array.from({ length: 24 }).map((_, hour) => {
            const hourEvents = getEventsForDateAndTime(currentDate, hour);
            return (
              <React.Fragment key={hour}>
                <div style={{ 
                  height: '60px', 
                  paddingRight: '0.75rem', 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: 'flex-end', 
                  fontSize: '0.78rem', 
                  color: '#64748b',
                  fontWeight: '600',
                  borderRight: '1px solid #cbd5e1',
                  paddingTop: '0.25rem',
                  background: '#f8fafc'
                }}>
                  {formatHour(hour)}
                </div>
                
                <div style={{ 
                  height: '60px', 
                  borderBottom: '1px solid #f1f5f9', 
                  padding: '0.25rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  overflowY: 'auto'
                }}>
                  {hourEvents.map(e => (
                    <div 
                      key={e.id}
                      onClick={(ev) => {
                        if (e.patientMrn) {
                          ev.stopPropagation();
                          setSelectedPatientMrn(e.patientMrn);
                        }
                      }}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.35rem',
                        background: `${e.color}15`,
                        color: e.color,
                        borderLeft: `4px solid ${e.color}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        fontWeight: '600',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        minWidth: '180px',
                        flex: '1 1 auto',
                        maxHeight: '50px',
                        cursor: e.patientMrn ? 'pointer' : 'default'
                      }}
                    >
                      <div style={{ fontWeight: '700', fontSize: '0.75rem' }}>{e.title}</div>
                      {e.location && <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.1rem' }}>📍 {e.location}</div>}
                    </div>
                  ))}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', background: '#f8fafc', padding: '1rem', borderRadius: '1rem' }}>
      
      {/* ── Add Event Modal ── */}
      {addModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.75rem', width: '420px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Add Custom Schedule</h3>
              <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Event Title *</label>
                <input type="text" value={addForm.title} placeholder="e.g. Ward checkup meeting"
                  onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} 
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', outline: 'none' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Date *</label>
                  <input type="date" value={addForm.date}
                    onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} 
                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Time</label>
                  <input type="time" value={addForm.time}
                    onChange={e => setAddForm(f => ({ ...f, time: e.target.value }))} 
                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Type</label>
                  <select value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value as CalEvent['type'] }))}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', outline: 'none', background: 'white' }}>
                    <option value="General">General</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Admission">Admission</option>
                    <option value="Discharge">Discharge</option>
                    <option value="Lab">Lab Test</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Location</label>
                  <input type="text" value={addForm.location} placeholder="Room / Ward"
                    onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))} 
                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Doctor In-charge</label>
                <input type="text" value={addForm.doctor} placeholder="Dr. Name"
                  onChange={e => setAddForm(f => ({ ...f, doctor: e.target.value }))} 
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', outline: 'none' }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569', cursor: 'pointer', marginTop: '0.5rem' }}>
                <input type="checkbox" checked={addForm.isKey} onChange={e => setAddForm(f => ({ ...f, isKey: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
                Mark as High Priority Task
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <button onClick={() => setAddModal(false)} style={{ padding: '0.45rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', background: '#f8fafc', color: '#475569', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddEvent} disabled={!addForm.title.trim()} style={{ padding: '0.45rem 1rem', border: 'none', borderRadius: '0.5rem', background: '#3b82f6', color: 'white', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Add Event</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upper Control Toolbar ── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'white', 
        padding: '0.85rem 1.25rem', 
        borderRadius: '0.75rem', 
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        
        {/* Navigation & Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={24} style={{ color: '#3b82f6' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              {headerLabel}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '0.2rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: '0.5rem' }}>
            <button onClick={handlePrev} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.35rem', color: '#475569', display: 'flex' }}><ChevronLeft size={16} /></button>
            <button onClick={handleToday} style={{ border: 'none', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.65rem', borderRadius: '0.35rem', color: '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Today</button>
            <button onClick={handleNext} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.35rem', color: '#475569', display: 'flex' }}><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Search, Filter, Views, and Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.65rem', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search schedules/patients..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: '0.45rem 0.65rem 0.45rem 1.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontSize: '0.78rem',
                outline: 'none',
                width: '180px'
              }}
            />
          </div>

          {/* Filter Dropdown Toggle */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowFilterDropdown(prev => !prev)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.45rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem',
                background: 'white', fontSize: '0.78rem', fontWeight: '600', color: '#475569', cursor: 'pointer'
              }}
            >
              <Filter size={14} /> Filter
              {selectedTypes.length < 5 && (
                <span style={{ background: '#3b82f6', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedTypes.length}
                </span>
              )}
            </button>

            {showFilterDropdown && (
              <div style={{ 
                position: 'absolute', right: 0, top: '115%', background: 'white', 
                border: '1px solid #cbd5e1', borderRadius: '0.75rem', padding: '0.75rem', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', zIndex: 100, minWidth: '180px' 
              }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>FILTER CATEGORIES</div>
                {(['Admission', 'Discharge', 'Surgery', 'Lab', 'General'] as CalEvent['type'][]).map(t => {
                  const active = selectedTypes.includes(t);
                  return (
                    <button 
                      key={t}
                      onClick={() => toggleTypeFilter(t)}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '0.5rem',
                        width: '100%', padding: '0.4rem 0.5rem', border: 'none', background: 'transparent',
                        borderRadius: '0.35rem', cursor: 'pointer', textAlign: 'left', fontSize: '0.78rem',
                        color: active ? '#0f172a' : '#64748b', fontWeight: active ? '700' : '400',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: TYPE_COLORS[t] }} />
                      <span style={{ flex: 1 }}>{t}s</span>
                      {active ? <CheckSquare size={14} style={{ color: '#3b82f6' }} /> : <Square size={14} style={{ color: '#cbd5e1' }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* View switches */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.2rem', borderRadius: '0.5rem' }}>
            {(['month', 'week', 'day'] as const).map(v => (
              <button 
                key={v}
                onClick={() => setViewMode(v)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  border: 'none',
                  borderRadius: '0.35rem',
                  background: viewMode === v ? 'white' : 'transparent',
                  color: viewMode === v ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === v ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Add schedule button */}
          <button 
            onClick={() => setAddModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.45rem 0.85rem', background: '#3b82f6', color: 'white',
              border: 'none', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: '700',
              cursor: 'pointer', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
            }}
          >
            <Plus size={14} /> Add Event
          </button>
        </div>
      </div>

      {/* ── Main Grid Wrapper ── */}
      <div style={{ 
        flex: 1, 
        background: 'white', 
        borderRadius: '0.75rem', 
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        minHeight: '450px'
      }}>
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      {/* ── Legend footer ── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 0.5rem',
        fontSize: '0.75rem',
        color: '#64748b',
        fontWeight: '600'
      }}>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          {(Object.keys(TYPE_COLORS) as CalEvent['type'][]).map(type => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '30%', background: TYPE_COLORS[type] }} />
              <span>{type}s</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }} onClick={() => setKeyOnly(k => !k)}>
          <Star size={12} fill={keyOnly ? '#f59e0b' : 'none'} color={keyOnly ? '#f59e0b' : '#94a3b8'} />
          <span>High Priority Only</span>
        </div>
      </div>

      {/* ── Patient Info Detail Modal ── */}
      {selectedPatient && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '1rem', padding: '1.75rem', width: '520px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '1.25rem'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <User size={20} style={{ color: '#0284c7' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Patient Admission Detail</h3>
              </div>
              <button 
                onClick={() => setSelectedPatientMrn(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Brief */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
              <Avatar name={selectedPatient.name} photoUrl={selectedPatient.photoUrl} size={50} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>{selectedPatient.name}</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '2rem', background: '#e0f2fe', color: '#0369a1', fontWeight: '700' }}>
                    {selectedPatient.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>MRN: {selectedPatient.mrn}</div>
              </div>
            </div>

            {/* Basic Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '0.5rem' }}>
                <span style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '0.15rem', fontSize: '0.72rem' }}>Gender / Age</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{selectedPatient.gender || '—'} / {patientDetails?.age || '—'} yrs</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '0.5rem' }}>
                <span style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '0.15rem', fontSize: '0.72rem' }}>Phone Contact</span>
                <span style={{ color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Phone size={11} style={{ color: '#64748b' }} /> {selectedPatient.phone || '—'}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '0.5rem' }}>
                <span style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '0.15rem', fontSize: '0.72rem' }}>Assigned Location</span>
                <span style={{ color: '#0369a1', fontWeight: '800' }}>
                  📍 {selectedPatient.assignedWard || selectedPatient.ward || 'Unassigned'} {selectedPatient.assignedBed ? `- Room ${selectedPatient.assignedBed}` : ''}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '0.5rem' }}>
                <span style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '0.15rem', fontSize: '0.72rem' }}>Blood Group / Allergies</span>
                <span style={{ color: patientDetails?.allergies && patientDetails.allergies !== 'None' ? '#ef4444' : '#0f172a', fontWeight: '700' }}>
                  {selectedPatient.race || 'O+'} / {patientDetails?.allergies || 'None'}
                </span>
              </div>
            </div>

            {/* Medical Brief */}
            <div style={{ background: '#ecfeff', border: '1px solid #cffafe', padding: '0.85rem', borderRadius: '0.75rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0891b2', fontWeight: '700', fontSize: '0.75rem' }}>
                <Activity size={14} /> Clinical Summary & Diagnosis
              </div>
              <div>
                <span style={{ fontWeight: '700', color: '#0f172a', display: 'block', fontSize: '0.78rem' }}>Diagnosis:</span>
                <span style={{ color: '#155e75', fontWeight: '600' }}>{patientDetails?.diagnosis || 'General clinical monitoring'}</span>
              </div>
              {patientDetails?.subjective && (
                <div>
                  <span style={{ fontWeight: '700', color: '#0f172a', display: 'block', fontSize: '0.78rem', marginTop: '0.25rem' }}>Subjective Symptoms:</span>
                  <span style={{ color: '#1e293b', fontStyle: 'italic' }}>{patientDetails.subjective}</span>
                </div>
              )}
              {patientDetails?.notes && (
                <div>
                  <span style={{ fontWeight: '700', color: '#0f172a', display: 'block', fontSize: '0.78rem', marginTop: '0.25rem' }}>Clinical Notes:</span>
                  <span style={{ color: '#475569', fontSize: '0.78rem' }}>{patientDetails.notes}</span>
                </div>
              )}
            </div>

            {/* Close Button Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <button
                onClick={() => setSelectedPatientMrn(null)}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '0.5rem', background: '#0284c7', color: 'white',
                  border: 'none', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
                }}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HospitalCalendar;
