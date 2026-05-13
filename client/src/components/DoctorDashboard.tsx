import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, User, MoreVertical, Plus, CheckCircle, 
  Search, Filter, LayoutGrid, List as ListIcon,
  Activity, Stethoscope
} from 'lucide-react';
import { useEMR } from '../context/EMRContext';
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
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DoctorDashboardProps {
  onStartConsult?: (patient: { mrn: string; name: string; amharic: string }) => void;
  onViewHistory?: (patient: { mrn: string; name: string; amharic: string }) => void;
  onNewAppointment?: () => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onStartConsult, onViewHistory, onNewAppointment }) => {
  const { appointments, patients, currentStaff } = useEMR();
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMrn, setSelectedMrn] = useState<string | null>(null);

  // ── Date Logic ────────────────────────────────────────────────

  const weekDays = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const dayOfWeek = start.getDay() === 0 ? 6 : start.getDay() - 1; // Monday start
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

  const selectedPatient = useMemo(() => {
    if (!selectedMrn) return null;
    return patients.find(p => p.mrn === selectedMrn) || null;
  }, [selectedMrn, patients]);

  const displayAppointments = useMemo(() => {
    const mock = [
      { id: 1, mrn: 'MRN-2026-001', date: new Date(2026, 4, 11, 8, 0), duration: 1, color: '#3b82f6' },
      { id: 2, mrn: 'MRN-2026-002', date: new Date(2026, 4, 11, 7, 30), duration: 0.5, color: '#3b82f6' },
      { id: 3, mrn: 'MRN-2026-003', date: new Date(2026, 4, 12, 8, 45), duration: 0.5, color: '#3b82f6' },
      { id: 4, mrn: 'MRN-2026-002', date: new Date(2026, 4, 13, 9, 30), duration: 0.5, color: '#3b82f6' },
      { id: 5, mrn: 'MRN-2026-005', date: new Date(2026, 4, 14, 11, 30), duration: 0.5, color: '#3b82f6' },
      { id: 6, mrn: 'MRN-2026-005', date: new Date(2026, 4, 14, 10, 30), duration: 0.5, color: '#3b82f6' },
      { id: 7, mrn: 'MRN-2026-001', date: new Date(2026, 4, 15, 8, 15), duration: 0.5, color: '#3b82f6' },
      { id: 8, mrn: 'MRN-2026-001', date: new Date(2026, 4, 16, 10, 0), duration: 0.5, color: '#3b82f6' },
      { id: 9, mrn: 'MRN-2026-003', date: new Date(2026, 4, 16, 8, 45), duration: 0.5, color: '#3b82f6' },
    ];

    const actual = appointments.map(app => ({
      id: app.id,
      mrn: app.patientMrn,
      date: new Date(app.startTime),
      duration: 0.5,
      color: '#2563eb'
    }));

    const combined = actual.length > 0 ? actual : mock;

    // Always fetch the name from the current patients list to ensure consistency
    return combined.map(item => {
      const patient = patients.find(p => p.mrn === item.mrn);
      return {
        ...item,
        name: patient?.name || 'Unknown Patient'
      };
    });
  }, [appointments, patients]);

  const getPosition = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const top = (h - 7) * 80 + (m / 60) * 80;
    return top;
  };

  // ── Render Helpers ────────────────────────────────────────────

  const renderDayView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', flex: 1, overflowY: 'auto' }}>
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
                className={`appointment-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedMrn(app.mrn)}
                style={{ top: `${top}px`, height: `${app.duration * 80 - 4}px`, background: isSelected ? '#1e40af' : app.color, left: '8px', right: '8px' }}
              >
                {app.name}
              </div>
            );
          })
        }
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
        <div style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#64748b', borderRight: '1px solid #f1f5f9' }}>Time</div>
        {weekDays.map((date, i) => (
          <div key={i} style={{ padding: '1rem', textAlign: 'center', borderRight: i < 6 ? '1px solid #f1f5f9' : 'none', background: date.toDateString() === new Date().toDateString() ? '#f0f9ff' : 'transparent' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: date.toDateString() === new Date().toDateString() ? '#2563eb' : '#1e293b' }}>{DAYS[i]}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{date.getDate()}.{date.getMonth() + 1}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', overflowY: 'auto', flex: 1 }}>
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
                      className={`appointment-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedMrn(app.mrn)}
                      style={{ top: `${top}px`, height: `${app.duration * 80 - 4}px`, background: isSelected ? '#1e40af' : app.color }}
                    >
                      {app.name}
                    </div>
                  );
                })
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
        {DAYS.map((day, i) => (
          <div key={i} style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>{day}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', flex: 1 }}>
        {monthDays.map((date, i) => {
          const isSelectedMonth = date.getMonth() === selectedDate.getMonth();
          const isToday = date.toDateString() === new Date().toDateString();
          const apps = displayAppointments.filter(app => app.date.toDateString() === date.toDateString());
          
          return (
            <div key={i} style={{ 
              borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid #f1f5f9', 
              borderBottom: i < 35 ? '1px solid #f1f5f9' : 'none',
              padding: '0.5rem',
              background: isSelectedMonth ? 'white' : '#f8fafc',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              <div style={{ 
                fontSize: '0.75rem', 
                fontWeight: '700', 
                color: isToday ? '#2563eb' : isSelectedMonth ? '#1e293b' : '#cbd5e1',
                textAlign: 'right'
              }}>
                {date.getDate()}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {apps.map(app => (
                  <div 
                    key={app.id} 
                    onClick={(e) => { e.stopPropagation(); setSelectedMrn(app.mrn); }}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
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
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
              {viewType === 'day' ? selectedDate.toDateString() : viewType === 'week' ? `Week of ${weekDays[0].toDateString()}` : 'Monthly Overview'}
            </p>
          </div>

          <div className="view-selector">
            <button className={viewType === 'day' ? 'active' : ''} onClick={() => setViewType('day')}>Day</button>
            <button className={viewType === 'week' ? 'active' : ''} onClick={() => setViewType('week')}>Week</button>
            <button className={viewType === 'month' ? 'active' : ''} onClick={() => setViewType('month')}>Month</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={onNewAppointment} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> New Appointment
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* Main Calendar View */}
        <div style={{ 
          flex: selectedPatient ? '2.2' : '1',
          background: 'white', 
          borderRadius: '1.25rem', 
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)', 
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {viewType === 'day' ? renderDayView() : viewType === 'week' ? renderWeekView() : renderMonthView()}
        </div>

        {/* Right Side: Patient Detail View */}
        {selectedPatient ? (
          <div style={{ 
            flex: '1',
            background: 'white', 
            borderRadius: '1.25rem', 
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)', 
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            animation: 'slideIn 0.3s ease-out'
          }}>
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
              <button onClick={() => setSelectedMrn(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: '#64748b' }}>
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
                Patient reports persistent headache and fatigue for 3 days. History of hypertension. Requires review of current medication plan.
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>Recent Vitals</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem 0.5rem', background: '#fff1f2', borderRadius: '0.75rem', border: '1px solid #ffe4e6' }}>
                  <div style={{ fontSize: '0.7rem', color: '#be123c', fontWeight: '800', marginBottom: '0.25rem' }}>HR</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#9f1239' }}>78</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem 0.5rem', background: '#ecfdf5', borderRadius: '0.75rem', border: '1px solid #d1fae5' }}>
                  <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: '800', marginBottom: '0.25rem' }}>BP</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#065f46' }}>120/80</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem 0.5rem', background: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #dbeafe' }}>
                  <div style={{ fontSize: '0.7rem', color: '#1d4ed8', fontWeight: '800', marginBottom: '0.25rem' }}>SPO2</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e40af' }}>98%</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, padding: '0.8rem' }}
                onClick={() => onViewHistory && onViewHistory({ mrn: selectedPatient.mrn, name: selectedPatient.name, amharic: selectedPatient.amharic })}
              >
                History
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 1.5, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
                onClick={() => onStartConsult && onStartConsult({ mrn: selectedPatient.mrn, name: selectedPatient.name, amharic: selectedPatient.amharic })}
              >
                <Stethoscope size={20} /> Start Consult
              </button>
            </div>
          </div>
        ) : (
          <div style={{ 
            flex: '1', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: '#f8fafc', 
            borderRadius: '1.25rem', 
            border: '2px dashed #e2e8f0',
            color: '#94a3b8'
          }}>
            <div style={{ padding: '2rem', background: 'white', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
              <User size={64} strokeWidth={1} color="#cbd5e1" />
            </div>
            <p style={{ fontSize: '1rem', fontWeight: '600', color: '#64748b' }}>Select a patient to view details</p>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>Click any appointment card in the calendar</p>
          </div>
        )}
      </div>

      <style>{`
        .view-selector {
          display: flex;
          background: #f1f5f9;
          padding: 0.25rem;
          border-radius: 0.75rem;
        }
        .view-selector button {
          padding: 0.5rem 1.25rem;
          border: none;
          background: none;
          font-size: 0.85rem;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          border-radius: 0.6rem;
          transition: all 0.2s;
        }
        .view-selector button.active {
          background: white;
          color: #2563eb;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
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
          padding: 0.4rem 1rem;
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
      `}</style>
    </div>
  );
};

export default DoctorDashboard;
