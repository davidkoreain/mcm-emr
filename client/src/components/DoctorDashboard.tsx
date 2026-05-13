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

  // Mock Appointments for visualization (if DB is empty)
  const displayAppointments = useMemo(() => {
    if (appointments.length > 0) return appointments;
    
    // Fallback mock data matching the user's requested style
    return [
      { id: 1, patientName: 'John Smith', day: 0, time: '8:00', duration: 1, color: '#3b82f6' },
      { id: 2, patientName: 'Sarah Khan', day: 0, time: '7:30', duration: 0.5, color: '#3b82f6' },
      { id: 3, patientName: 'Igra', day: 1, time: '8:45', duration: 0.5, color: '#3b82f6' },
      { id: 4, patientName: 'Sarah Khan', day: 2, time: '9:30', duration: 0.5, color: '#3b82f6' },
      { id: 5, patientName: 'Emily Davis', day: 3, time: '11:30', duration: 0.5, color: '#3b82f6' },
      { id: 6, patientName: 'Emily Davis', day: 3, time: '10:30', duration: 0.5, color: '#3b82f6' },
      { id: 7, patientName: 'John Smith', day: 4, time: '8:15', duration: 0.5, color: '#3b82f6' },
      { id: 8, patientName: 'John Smith', day: 5, time: '10:00', duration: 0.5, color: '#3b82f6' },
      { id: 9, patientName: 'Igra', day: 5, time: '8:45', duration: 0.5, color: '#3b82f6' },
    ];
  }, [appointments]);

  const formatMonth = (date: Date) => {
    return date.toLocaleString('default', { month: 'long' });
  };

  const getPosition = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const top = (h - 7) * 80 + (m / 60) * 80;
    return top;
  };

  return (
    <div className="doctor-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
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
          <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>All Appointments - Graph View</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="view-toggle">
            <button 
              className={viewMode === 'graph' ? 'active' : ''} 
              onClick={() => setViewMode('graph')}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''} 
              onClick={() => setViewMode('list')}
            >
              <ListIcon size={18} />
            </button>
          </div>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> New Appointment
          </button>
        </div>
      </div>

      {/* Main Calendar Content */}
      <div style={{ 
        background: 'white', 
        borderRadius: '1rem', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
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
                  .filter(app => ('day' in app ? app.day === i : false)) // Handle mock vs real
                  .map(app => {
                    const top = getPosition(app.time as string);
                    return (
                      <div 
                        key={app.id} 
                        className="appointment-card"
                        style={{ 
                          top: `${top}px`, 
                          height: `${(app.duration as number) * 80 - 4}px`,
                          background: (app.color as string) || '#2563eb'
                        }}
                      >
                        {app.patientName as string}
                      </div>
                    );
                  })
                }
              </div>
            ))}
          </div>

          {/* Current Time Indicator Line (Optional but premium) */}
          <div style={{ 
            position: 'absolute', 
            left: '80px', 
            right: 0, 
            top: `${getPosition('10:15')}px`, // Example current time
            height: '2px', 
            background: '#ef4444', 
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <div style={{ position: 'absolute', left: '-5px', top: '-4px', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
          </div>
        </div>
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
        .view-toggle {
          background: #f1f5f9;
          padding: 0.25rem;
          border-radius: 0.6rem;
          display: flex;
        }
        .view-toggle button {
          padding: 0.4rem 0.75rem;
          border: none;
          background: none;
          cursor: pointer;
          color: #64748b;
          border-radius: 0.4rem;
        }
        .view-toggle button.active {
          background: white;
          color: #2563eb;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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
          transition: transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }
        .appointment-card:hover {
          transform: scale(1.02);
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;
