import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, User, FileText, Scissors, Beaker, Plus, X, Check, AlertTriangle, CheckCircle2, Trash2, Tag, CalendarDays
} from 'lucide-react';
import { useEMR, type StaffMember, type Appointment, type Surgery, type CalendarEvent, type StaffLeave } from '../context/EMRContext';
import { motion, AnimatePresence } from 'framer-motion';

// Calendar Category Styling configuration
const MY_SCHEDULE_CATEGORIES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Appointment: { label: 'Appointment', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  Surgery: { label: 'Surgery', color: '#0891b2', bg: '#ecfeff', border: '#c5f2f7' },
  Consultation: { label: 'Consultation', color: '#4f46e5', bg: '#e0e7ff', border: '#c7d2fe' },
  Seminar: { label: 'Seminar', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  Meeting: { label: 'Meeting', color: '#ca8a04', bg: '#fef9c3', border: '#fef08a' },
  Training: { label: 'Training', color: '#9333ea', bg: '#faf5ff', border: '#f3e8ff' },
  Event: { label: 'Event', color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' },
  Personal: { label: 'Personal', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  LeavePending: { label: 'Leave (Pending)', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  LeaveConfirmed: { label: 'Leave (Approved)', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  LeaveRejected: { label: 'Leave (Rejected)', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' }
};

const MySchedule: React.FC = () => {
  const { 
    currentStaff, appointments, surgeries, calendarEvents, staffLeave, patients, staff,
    addCalendarEvent, deleteCalendarEvent, addStaffLeave
  } = useEMR();

  // Navigation states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  
  // Modal states
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Form states
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [personalForm, setPersonalForm] = useState({ title: '', date: '', startTime: '09:00', endTime: '10:00', notes: '' });

  // Filter state
  const [filters, setFilters] = useState<Record<string, boolean>>({
    Appointment: true, Surgery: true, HospitalEvent: true, Personal: true, Leave: true
  });

  if (!currentStaff) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#64748b', fontWeight: '800' }}>
        No staff member session found. Please login as a staff member.
      </div>
    );
  }

  // Determine user role types
  const isNurse = currentStaff.role.toLowerCase().includes('nurse');
  const isManager = currentStaff.role.toLowerCase().includes('manager');
  const isDoctor = !isNurse && !isManager && currentStaff.role !== 'Pharmacist';

  // Find doctors in the same department (specialization) for Nurses/Managers
  const deptDoctorIds = useMemo(() => {
    if (!staff || isDoctor) return [];
    return staff
      .filter(s => {
        const roleLower = s.role.toLowerCase();
        const isDoc = roleLower.includes('doctor') || roleLower.includes('md') || roleLower.includes('surgeon') || roleLower.includes('medicine') || roleLower.includes('pediatrician') || roleLower.includes('gynecologist') || roleLower.includes('radiologist') || roleLower.includes('anesthesiologist') || roleLower.includes('cardiologist');
        return isDoc && s.specialization === currentStaff.specialization;
      })
      .map(s => s.id);
  }, [staff, currentStaff, isDoctor]);

  // Helper to get Doctor/Surgeon name by ID
  const getDoctorName = (id: number) => {
    const doc = staff?.find(s => s.id === id);
    return doc ? doc.name : `Dr. (ID: ${id})`;
  };

  // Helpers
  const getPatientName = (mrn: string) => {
    const p = patients.find(x => x.mrn === mrn);
    return p ? p.name : 'Unknown Patient';
  };

  const getSurgeonName = (id: number) => {
    return currentStaff.id === id ? currentStaff.name : getDoctorName(id);
  };

  // Compile all schedules relating to this currentStaff member
  const allEvents = useMemo(() => {
    const eventsList: any[] = [];

    // 1. Appointments (Official)
    if (filters.Appointment && appointments) {
      appointments
        .filter(apt => {
          if (apt.status === 'Cancelled') return false;
          if (isDoctor) {
            return apt.doctorId === currentStaff.id;
          } else {
            // Nurse or Manager: filter by same specialization doctors, or fallback to all if none in dept
            if (deptDoctorIds.length > 0) {
              return deptDoctorIds.includes(apt.doctorId);
            }
            return true; // Fallback to all appointments if no matching department doctors
          }
        })
        .forEach(apt => {
          const docName = getDoctorName(apt.doctorId);
          eventsList.push({
            id: `apt-${apt.id}`,
            realId: apt.id,
            type: 'Appointment',
            category: 'Appointment',
            title: isDoctor 
              ? `Appointment: ${getPatientName(apt.patientMrn)}`
              : `Apt: ${getPatientName(apt.patientMrn)} (${docName})`,
            startTime: apt.startTime,
            endTime: apt.endTime,
            dateStr: apt.startTime.includes('T') ? apt.startTime.split('T')[0] : apt.startTime.split(' ')[0],
            details: `Patient: ${getPatientName(apt.patientMrn)} (MRN: ${apt.patientMrn}). Doctor: ${docName}. Status: ${apt.status}. Notes: ${apt.notes || 'None'}`
          });
        });
    }

    // 2. Surgeries (Official)
    if (filters.Surgery && surgeries) {
      surgeries
        .filter(surg => {
          if (surg.status === 'Cancelled') return false;
          if (isDoctor) {
            return surg.surgeonId === currentStaff.id;
          } else {
            // Nurse or Manager: filter by same specialization doctors, or fallback to all if none in dept
            if (deptDoctorIds.length > 0) {
              return deptDoctorIds.includes(surg.surgeonId);
            }
            return true;
          }
        })
        .forEach(surg => {
          const surgName = getDoctorName(surg.surgeonId);
          eventsList.push({
            id: `surg-${surg.id}`,
            realId: surg.id,
            type: 'Surgery',
            category: 'Surgery',
            title: isDoctor
              ? `Surgery: ${surg.operationName}`
              : `Surgery: ${surg.operationName} (${surgName})`,
            startTime: surg.startTime,
            endTime: surg.endTime,
            dateStr: surg.startTime.includes('T') ? surg.startTime.split('T')[0] : surg.startTime.split(' ')[0],
            details: `Operation: ${surg.operationName} in Room ${surg.roomNumber}. Surgeon: ${surgName}. Status: ${surg.status}`
          });
        });
    }

    // 3. Hospital Calendar Events (Official or Personal)
    if (calendarEvents) {
      calendarEvents
        .filter(ev => ev.doctorId === currentStaff.id)
        .forEach(ev => {
          const isPersonal = ev.category === 'Personal';
          if ((isPersonal && !filters.Personal) || (!isPersonal && !filters.HospitalEvent)) return;

          eventsList.push({
            id: `calev-${ev.id}`,
            realId: ev.id,
            type: isPersonal ? 'Personal' : 'HospitalEvent',
            category: ev.category,
            title: ev.title,
            startTime: ev.startTime,
            endTime: ev.endTime,
            dateStr: ev.startTime.includes('T') ? ev.startTime.split('T')[0] : ev.startTime.split(' ')[0],
            location: ev.location,
            details: ev.notes || 'No description provided.'
          });
        });
    }

    // 4. Staff Leaves (Personal / Status Check)
    if (filters.Leave && staffLeave) {
      staffLeave
        .filter(leave => leave.staffId === currentStaff.id)
        .forEach(leave => {
          const typeKey = leave.status === 'Pending' ? 'LeavePending' : leave.status === 'Confirmed' ? 'LeaveConfirmed' : 'LeaveRejected';
          eventsList.push({
            id: `leave-${leave.id}`,
            realId: leave.id,
            type: 'Leave',
            category: typeKey,
            title: `Vacation/Leave: [${leave.status}]`,
            startTime: `${leave.leaveDate}T09:00:00`,
            endTime: `${leave.leaveDate}T18:00:00`,
            dateStr: leave.leaveDate,
            details: `Leave Request status: ${leave.status}. Reason: ${leave.reason || 'None provided.'}`
          });
        });
    }

    return eventsList;
  }, [appointments, surgeries, calendarEvents, staffLeave, currentStaff, filters, patients]);

  // Calendar calculations
  const monthDays = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const dayOfWeek = start.getDay(); // Sunday starts at 0
    start.setDate(start.getDate() - dayOfWeek);
    
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // Handle Leave Submission
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    
    if (start > end) {
      alert('Start date cannot be after end date.');
      return;
    }

    try {
      // Loop through each day and submit a leave request
      const tempDate = new Date(start);
      while (tempDate <= end) {
        const dateStr = tempDate.toISOString().split('T')[0];
        await addStaffLeave({
          staffId: currentStaff.id,
          leaveDate: dateStr,
          status: 'Pending',
          reason: leaveForm.reason.trim() || 'Vacation/Leave Request'
        });
        tempDate.setDate(tempDate.getDate() + 1);
      }
      
      alert('Leave request submitted successfully. Waiting for manager approval.');
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      setShowLeaveModal(false);
    } catch (err) {
      alert('Failed to submit leave request.');
    }
  };

  // Handle Personal Event Submission
  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalForm.title || !personalForm.date || !personalForm.startTime || !personalForm.endTime) {
      alert('Please fill out all required fields.');
      return;
    }

    const start = new Date(`${personalForm.date}T${personalForm.startTime}`);
    const end = new Date(`${personalForm.date}T${personalForm.endTime}`);

    if (start >= end) {
      alert('End time must be after start time.');
      return;
    }

    try {
      await addCalendarEvent({
        doctorId: currentStaff.id,
        category: 'Personal',
        title: personalForm.title.trim(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: personalForm.notes.trim() || undefined
      });

      alert('Personal event added successfully.');
      setPersonalForm({ title: '', date: '', startTime: '09:00', endTime: '10:00', notes: '' });
      setShowPersonalModal(false);
    } catch (err) {
      alert('Failed to add personal event.');
    }
  };

  // Handle Event Deletion (Only for Personal Events)
  const handleDeleteEvent = async (ev: any) => {
    if (ev.category !== 'Personal') return;
    if (confirm('Are you sure you want to delete this personal event?')) {
      try {
        await deleteCalendarEvent(ev.realId);
        setSelectedEvent(null);
        alert('Personal event deleted.');
      } catch (e) {
        alert('Failed to delete event.');
      }
    }
  };

  // Quick statistics for current month
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStr = currentDate.toISOString().slice(0, 7); // YYYY-MM
    const thisMonthEvents = allEvents.filter(e => e.dateStr.startsWith(currentMonthStr));
    
    return {
      appointmentsCount: thisMonthEvents.filter(e => e.category === 'Appointment').length,
      surgeriesCount: thisMonthEvents.filter(e => e.category === 'Surgery').length,
      leavesCount: thisMonthEvents.filter(e => e.type === 'Leave' && e.category === 'LeaveConfirmed').length,
      personalCount: thisMonthEvents.filter(e => e.category === 'Personal').length,
    };
  }, [allEvents, currentDate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header and Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '1.5rem', borderRadius: '1.25rem', color: 'white',
          boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Appointments</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: '0.5rem 0' }}>{stats.appointmentsCount}</h2>
          </div>
          <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>Consultations scheduled this month</p>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #06b6d4, #0891b2)', padding: '1.5rem', borderRadius: '1.25rem', color: 'white',
          boxShadow: '0 10px 15px -3px rgba(6, 182, 212, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Surgeries</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: '0.5rem 0' }}>{stats.surgeriesCount}</h2>
          </div>
          <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>Operations planned this month</p>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', padding: '1.5rem', borderRadius: '1.25rem', color: 'white',
          boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Events</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: '0.5rem 0' }}>{stats.personalCount}</h2>
          </div>
          <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>Personal appointments tracked</p>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #ef4444, #b91c1c)', padding: '1.5rem', borderRadius: '1.25rem', color: 'white',
          boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vacation Days</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: '0.5rem 0' }}>{stats.leavesCount}</h2>
          </div>
          <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>Approved days off this month</p>
        </div>
      </div>

      {/* Control Panel: Navigation & Filters */}
      <div style={{ 
        background: 'white', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0', 
        display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' 
      }}>
        {/* Navigation & View Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '0.75rem', padding: '0.25rem' }}>
            <button 
              onClick={() => setViewMode('month')} 
              style={{ 
                padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer',
                background: viewMode === 'month' ? 'white' : 'transparent', color: viewMode === 'month' ? '#1e293b' : '#64748b', boxShadow: viewMode === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >Month</button>
            <button 
              onClick={() => setViewMode('list')} 
              style={{ 
                padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer',
                background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? '#1e293b' : '#64748b', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >List View</button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              style={{ padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer', color: '#64748b' }}
            >&lt;</button>
            <span style={{ fontSize: '0.95rem', fontWeight: '900', color: '#1e293b', minWidth: '110px', textAlign: 'center' }}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
            </span>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              style={{ padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer', color: '#64748b' }}
            >&gt;</button>
          </div>
        </div>

        {/* Legend Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {Object.entries({
            Appointment: 'Appointments', Surgery: 'Surgeries', HospitalEvent: 'Hospital Events', Personal: 'Personal', Leave: 'Leaves'
          }).map(([key, label]) => {
            const sampleCategory = key === 'Leave' ? 'LeaveConfirmed' : key === 'HospitalEvent' ? 'Seminar' : key;
            const meta = MY_SCHEDULE_CATEGORIES[sampleCategory];
            const active = filters[key];
            return (
              <button
                key={key}
                onClick={() => setFilters({ ...filters, [key]: !filters[key] })}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', borderRadius: '99px',
                  fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? meta.bg : '#f8fafc',
                  color: active ? meta.color : '#94a3b8',
                  border: `1px solid ${active ? meta.color : '#e2e8f0'}`
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color }} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setShowLeaveModal(true)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: '0.75rem', border: '1px solid #fee2e2',
              background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fde2e2'}
            onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
          >
            <CalendarIcon size={14} /> Request Leave
          </button>
          
          <button 
            onClick={() => setShowPersonalModal(true)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', border: 'none',
              background: '#7c3aed', color: 'white', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
            onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
          >
            <Plus size={14} /> Add Personal Event
          </button>
        </div>
      </div>

      {/* Main Calendar View Area */}
      <div style={{ background: 'white', borderRadius: '1.25rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        
        {viewMode === 'month' ? (
          <div>
            {/* Calendar Days Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, idx) => (
                <div key={d} style={{ padding: '0.85rem 0.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '900', color: idx === 0 ? '#ef4444' : '#64748b' }}>
                  {d.toUpperCase()}
                </div>
              ))}
            </div>

            {/* Calendar Day Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, 1fr)' }}>
              {monthDays.map((date, idx) => {
                const isSelectedMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const isSunday = date.getDay() === 0;
                
                const dateStr = date.toISOString().split('T')[0];
                const dayEvents = allEvents.filter(e => e.dateStr === dateStr);

                return (
                  <div key={idx} style={{
                    borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #f1f5f9',
                    borderBottom: idx < 35 ? '1px solid #f1f5f9' : 'none',
                    padding: '0.5rem',
                    background: isSelectedMonth ? 'white' : '#f8fafc',
                    display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0, overflow: 'hidden'
                  }}>
                    <div style={{
                      fontSize: '0.8rem', fontWeight: '800',
                      color: isToday ? '#7c3aed' : (isSunday ? (isSelectedMonth ? '#ef4444' : '#fca5a5') : (isSelectedMonth ? '#1e293b' : '#cbd5e1')),
                      textAlign: 'right', paddingRight: '0.25rem'
                    }}>{date.getDate()}</div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px', scrollbarWidth: 'none' }}>
                      {dayEvents.map(ev => {
                        const styleKey = ev.category;
                        const meta = MY_SCHEDULE_CATEGORIES[styleKey] || MY_SCHEDULE_CATEGORIES['Event'];
                        
                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            style={{
                              fontSize: '0.7rem', fontWeight: '750', background: `${meta.bg}`, color: meta.color,
                              borderLeft: `3px solid ${meta.color}`, padding: '3px 6px', borderRadius: '4px', cursor: 'pointer',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                          >
                            <span style={{ marginRight: '4px', opacity: 0.8 }}>
                              {ev.startTime.includes('T') ? ev.startTime.split('T')[1].substring(0, 5) : (ev.startTime.includes(' ') ? ev.startTime.split(' ')[1].substring(0, 5) : 'All Day')}
                            </span>
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
        ) : (
          /* List View */
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>Upcoming Schedules</h3>
            
            {allEvents
              .filter(ev => new Date(ev.startTime).getTime() >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime())
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .map(ev => {
                const meta = MY_SCHEDULE_CATEGORIES[ev.category] || MY_SCHEDULE_CATEGORIES['Event'];
                return (
                  <div 
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem 1.25rem', background: '#f8fafc',
                      border: '1px solid #e2e8f0', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = meta.color; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    <div style={{
                      width: '80px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', color: meta.color,
                      background: meta.bg, padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: `1px solid ${meta.border}`
                    }}>
                      {ev.dateStr}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#1e293b' }}>{ev.title}</h4>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{ev.details.slice(0, 100)}</p>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>
                      {ev.startTime.includes('T') ? ev.startTime.split('T')[1].substring(0, 5) : (ev.startTime.includes(' ') ? ev.startTime.split(' ')[1].substring(0, 5) : 'All Day')}
                    </div>
                  </div>
                );
              })}
            
            {allEvents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                No events found for this filter/month.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setShowLeaveModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '2rem', borderRadius: '1.25rem', width: '450px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>Request Vacation/Leave</h3>
              <button onClick={() => setShowLeaveModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '0.4rem' }}>START DATE</label>
                  <input 
                    type="date" 
                    required
                    value={leaveForm.startDate} 
                    onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '0.4rem' }}>END DATE</label>
                  <input 
                    type="date" 
                    required
                    value={leaveForm.endDate} 
                    onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '0.4rem' }}>REASON / NOTES</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="e.g. Annual summer leave, medical checkup, etc."
                  value={leaveForm.reason} 
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowLeaveModal(false)} style={{ flex: 1, padding: '0.7rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1.5, padding: '0.7rem', border: 'none', borderRadius: '0.5rem', background: '#dc2626', color: 'white', fontWeight: '800', cursor: 'pointer' }}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personal Event Modal */}
      {showPersonalModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setShowPersonalModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '2rem', borderRadius: '1.25rem', width: '450px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>Add Personal Event</h3>
              <button onClick={() => setShowPersonalModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handlePersonalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '0.4rem' }}>EVENT TITLE</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dentists appointment, lunch meeting with Colleague"
                  value={personalForm.title} 
                  onChange={e => setPersonalForm({ ...personalForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '0.4rem' }}>DATE</label>
                <input 
                  type="date" 
                  required
                  value={personalForm.date} 
                  onChange={e => setPersonalForm({ ...personalForm, date: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem' }} 
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '0.4rem' }}>START TIME</label>
                  <input 
                    type="time" 
                    required
                    value={personalForm.startTime} 
                    onChange={e => setPersonalForm({ ...personalForm, startTime: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '0.4rem' }}>END TIME</label>
                  <input 
                    type="time" 
                    required
                    value={personalForm.endTime} 
                    onChange={e => setPersonalForm({ ...personalForm, endTime: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '0.4rem' }}>NOTES / DESCRIPTION</label>
                <textarea 
                  rows={2}
                  placeholder="Detail notes about this appointment..."
                  value={personalForm.notes} 
                  onChange={e => setPersonalForm({ ...personalForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowPersonalModal(false)} style={{ flex: 1, padding: '0.7rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1.5, padding: '0.7rem', border: 'none', borderRadius: '0.5rem', background: '#7c3aed', color: 'white', fontWeight: '800', cursor: 'pointer' }}>Add Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '2rem', borderRadius: '1.25rem', width: '420px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <span style={{ 
                fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', padding: '0.25rem 0.6rem', borderRadius: '999px',
                background: MY_SCHEDULE_CATEGORIES[selectedEvent.category]?.bg || '#f1f5f9',
                color: MY_SCHEDULE_CATEGORIES[selectedEvent.category]?.color || '#475569',
                border: `1px solid ${MY_SCHEDULE_CATEGORIES[selectedEvent.category]?.border || '#e2e8f0'}`
              }}>
                {MY_SCHEDULE_CATEGORIES[selectedEvent.category]?.label || selectedEvent.category}
              </span>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '900', color: '#1e293b' }}>{selectedEvent.title}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.2rem', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} style={{ color: '#94a3b8' }} />
                <span>
                  {new Date(selectedEvent.startTime).toLocaleString('en-US')} – {new Date(selectedEvent.endTime).toLocaleString('en-US')}
                </span>
              </div>
              {selectedEvent.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} style={{ color: '#94a3b8' }} />
                  <span><strong>Location:</strong> {selectedEvent.location}</span>
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.6' }}>
              <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Description / Details</h4>
              <p style={{ margin: 0 }}>{selectedEvent.details}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              {selectedEvent.category === 'Personal' && (
                <button 
                  onClick={() => handleDeleteEvent(selectedEvent)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: '0.5rem', border: '1px solid #fecaca',
                    background: 'white', color: '#dc2626', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <Trash2 size={14} /> Delete Event
                </button>
              )}
              <button onClick={() => setSelectedEvent(null)} style={{ padding: '0.55rem 1.2rem', borderRadius: '0.5rem', border: 'none', background: '#1e293b', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MySchedule;
