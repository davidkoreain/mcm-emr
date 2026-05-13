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

const DoctorDashboard: React.FC = () => {
  const { appointments, patients, currentStaff } = useEMR();
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Helper to get day labels for the current week
  const weekDays = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  // State for selected patient detail
  const [selectedMrn, setSelectedMrn] = useState<string | null>(null);

  const selectedPatient = useMemo(() => {
    if (!selectedMrn) return null;
    return patients.find(p => p.mrn === selectedMrn) || null;
  }, [selectedMrn, patients]);

  // Mock Appointments for visualization (if DB is empty)
  const displayAppointments = useMemo(() => {
    const mock = [
      { id: 1, mrn: 'MRN-2026-001', name: 'John Smith', day: 0, time: '8:00', duration: 1, color: '#3b82f6' },
      { id: 2, mrn: 'MRN-2026-002', name: 'Sarah Khan', day: 0, time: '7:30', duration: 0.5, color: '#3b82f6' },
      { id: 3, mrn: 'MRN-2026-003', name: 'Igra', day: 1, time: '8:45', duration: 0.5, color: '#3b82f6' },
      { id: 4, mrn: 'MRN-2026-002', name: 'Sarah Khan', day: 2, time: '9:30', duration: 0.5, color: '#3b82f6' },
      { id: 5, mrn: 'MRN-2026-005', name: 'Emily Davis', day: 3, time: '11:30', duration: 0.5, color: '#3b82f6' },
      { id: 6, mrn: 'MRN-2026-005', name: 'Emily Davis', day: 3, time: '10:30', duration: 0.5, color: '#3b82f6' },
      { id: 7, mrn: 'MRN-2026-001', name: 'John Smith', day: 4, time: '8:15', duration: 0.5, color: '#3b82f6' },
      { id: 8, mrn: 'MRN-2026-001', name: 'John Smith', day: 5, time: '10:00', duration: 0.5, color: '#3b82f6' },
      { id: 9, mrn: 'MRN-2026-003', name: 'Igra', day: 5, time: '8:45', duration: 0.5, color: '#3b82f6' },
    ];

    if (appointments.length === 0) return mock;

    return appointments.map(app => {
      const patient = patients.find(p => p.mrn === app.patientMrn);
      return {
        id: app.id,
        mrn: app.patientMrn,
        name: patient?.name || 'Unknown',
        day: new Date(app.startTime).getDay() - 1, // Adjusted for Monday start
        time: new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        duration: 0.5,
        color: '#2563eb'
      };
    });
  }, [appointments, patients]);

  const formatMonth = (date: Date) => {
    return date.toLocaleString('default', { month: 'long' });
  };

  const getPosition = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const top = (h - 7) * 80 + (m / 60) * 80;
    return top;
  };

  return (
    <div className="doctor-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', maxWidth: '100%' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              {formatMonth(selectedDate)}
            </h2>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '0.5rem', padding: '0.2rem' }}>
              <button className="cal-nav-btn"><ChevronLeft size={18} /></button>
              <button className="cal-nav-btn"><ChevronRight size={18} /></button>
            </div>
            <button className="today-btn">Today</button>
            <CalendarIcon size={20} color="#2563eb" />
          </div>
          <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>Clinical Flow Board - Split View</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> New Appointment
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* Left Side: Calendar Graph */}
        <div style={{ 
          flex: selectedPatient ? '2' : '1',
          background: 'white', 
          borderRadius: '1rem', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease'
        }}>
          {/* Day Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#64748b', borderRight: '1px solid #f1f5f9' }}>Time</div>
            {weekDays.map((date, i) => (
              <div key={i} style={{ padding: '1rem', textAlign: 'center', borderRight: i < 6 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}>{DAYS[i]}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{date.getDate()}.{date.getMonth() + 1}</div>
              </div>
            ))}
          </div>

          {/* Calendar Grid Body */}
          <div style={{ position: 'relative', overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', height: `${HOURS.length * 80}px` }}>
              {/* Time Column */}
              <div style={{ borderRight: '1px solid #f1f5f9', background: '#f8fafc' }}>
                {HOURS.map(h => (
                  <div key={h} style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>
                    {h}:00
                  </div>
                ))}
              </div>

              {/* Grid Cells */}
              {DAYS.map((_, i) => (
                <div key={i} style={{ position: 'relative', borderRight: i < 6 ? '1px solid #f1f5f9' : 'none' }}>
                  {HOURS.map(h => (
                    <div key={h} style={{ height: '80px', borderBottom: '1px solid #f1f5f9' }} />
                  ))}

                  {/* Appointments for this day */}
                  {displayAppointments
                    .filter(app => ('day' in app ? app.day === i : false))
                    .map(app => {
                      const top = getPosition(app.time as string);
                      const isSelected = selectedMrn === app.mrn;
                      return (
                        <div 
                          key={app.id} 
                          className={`appointment-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedMrn(app.mrn)}
                          style={{ 
                            top: `${top}px`, 
                            height: `${(app.duration as number) * 80 - 4}px`,
                            background: isSelected ? '#1e40af' : (app.color as string) || '#2563eb'
                          }}
                        >
                          {app.name}
                        </div>
                      );
                    })
                  }
                </div>
              ))}
            </div>

            {/* Current Time Indicator Line */}
            <div style={{ 
              position: 'absolute', 
              left: '80px', 
              right: 0, 
              top: `${getPosition('10:15')}px`, 
              height: '2px', 
              background: '#ef4444', 
              zIndex: 10,
              pointerEvents: 'none'
            }}>
              <div style={{ position: 'absolute', left: '-5px', top: '-4px', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            </div>
          </div>
        </div>

        {/* Right Side: Patient Detail View */}
        {selectedPatient ? (
          <div style={{ 
            flex: '1',
            background: 'white', 
            borderRadius: '1rem', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Avatar name={selectedPatient.name} photoUrl={selectedPatient.photoUrl} size={64} />
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>{selectedPatient.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{selectedPatient.amharic}</p>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2563eb', fontFamily: 'monospace' }}>{selectedPatient.mrn}</span>
                </div>
              </div>
              <button onClick={() => setSelectedMrn(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}>
                <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
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
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.75rem' }}>Reason for Visit</h4>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.9rem', color: '#475569', borderLeft: '4px solid #cbd5e1' }}>
                Patient reports persistent headache and fatigue for 3 days. History of hypertension.
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.75rem' }}>Recent Vitals</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: '#fff1f2', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#be123c', fontWeight: '700' }}>HR</div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#9f1239' }}>78</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: '#ecfdf5', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: '700' }}>BP</div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#065f46' }}>120/80</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: '#eff6ff', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#1d4ed8', fontWeight: '700' }}>SPO2</div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#1e40af' }}>98%</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }}>History</button>
              <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Stethoscope size={18} /> Start Consult
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
            borderRadius: '1rem', 
            border: '1px dashed #cbd5e1',
            color: '#94a3b8'
          }}>
            <User size={48} strokeWidth={1} />
            <p style={{ marginTop: '1rem', fontWeight: '500' }}>Select a patient to view details</p>
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
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
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: white;
          font-size: 0.85rem;
          font-weight: 600;
          color: #1e293b;
          cursor: pointer;
        }
        .appointment-card {
          position: absolute;
          left: 4px;
          right: 4px;
          border-radius: 0.5rem;
          padding: 0.5rem;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }
        .appointment-card:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
          z-index: 10;
        }
        .appointment-card.selected {
          border: 2px solid white;
          box-shadow: 0 0 0 3px #3b82f6;
          z-index: 11;
        }
        .info-card {
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          border: 1px solid #e2e8f0;
        }
        .info-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .info-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
        }
        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 0.6rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;
