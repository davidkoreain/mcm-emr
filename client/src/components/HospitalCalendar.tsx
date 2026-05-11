import React, { useState } from 'react';
import { toast } from '../utils/toast';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  MapPin, 
  Star, 
  Filter, 
  Plus, 
  Layers,
  LayoutGrid,
  List,
  FileText
} from 'lucide-react';
import CSVImportModal from './CSVImportModal';

const HospitalCalendar: React.FC = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentMonth, setCurrentMonth] = useState('May 2026');
  const [showCSVModal, setShowCSVModal] = useState(false);

  const events = [
    { id: 1, title: 'Major Surgery: Hip Replacement', type: 'Surgery', date: '2026-05-12', time: '09:00', doctor: 'Dr. Solomon', isKey: true, color: '#ef4444' },
    { id: 2, title: 'Ward Rounds: General Ward A', type: 'Ward', date: '2026-05-12', time: '08:00', doctor: 'Staff Nurse', isKey: false, color: '#3b82f6' },
    { id: 3, title: 'Staff Meeting: ICU Team', type: 'Staff', date: '2026-05-13', time: '14:00', doctor: 'All Chiefs', isKey: true, color: '#8b5cf6' },
    { id: 4, title: 'Patient Discharge: Room 402', type: 'Ward', date: '2026-05-12', time: '11:00', doctor: 'Nurse Martha', isKey: false, color: '#10b981' },
    { id: 5, title: 'Annual Leave: Dr. Abraham', type: 'Staff', date: '2026-05-14', time: 'All Day', doctor: 'Dr. Abraham', isKey: false, color: '#f59e0b' },
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="calendar-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarIcon size={28} />
            {currentMonth}
          </h2>
          <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
            <button className="btn-icon" onClick={() => toast('Previous month', 'info')}><ChevronLeft size={20} /></button>
            <button className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }} onClick={() => toast('Showing today: May 2026', 'info')}>Today</button>
            <button className="btn-icon" onClick={() => toast('Next month', 'info')}><ChevronRight size={20} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
             <button 
               className={`tab-btn ${viewMode === 'month' ? 'active' : ''}`} 
               style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
               onClick={() => setViewMode('month')}
             >Month</button>
             <button 
               className={`tab-btn ${viewMode === 'week' ? 'active' : ''}`} 
               style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
               onClick={() => setViewMode('week')}
             >Week</button>
             <button 
               className={`tab-btn ${viewMode === 'day' ? 'active' : ''}`} 
               style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
               onClick={() => setViewMode('day')}
             >Day</button>
          </div>
          <button 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setShowCSVModal(true)}
          >
            <FileText size={18} />
            CSV Import
          </button>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => toast('Filter panel opening...', 'info')}>
            <Filter size={18} />
            Filters
          </button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => toast('New event form opening...', 'info')}>
            <Plus size={18} />
            Add Event
          </button>
        </div>
      </div>

      {showCSVModal && (
        <CSVImportModal 
          title="Hospital Schedules & Events" 
          onClose={() => setShowCSVModal(false)} 
          onImport={(data) => console.log('Imported Events:', data)} 
        />
      )}

      <div className="calendar-grid-wrapper" style={{ flex: 1, background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {viewMode === 'month' ? (
          <div className="calendar-month-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', height: '100%', gridAutoRows: 'minmax(120px, 1fr)' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '700', fontSize: '0.85rem', color: '#64748b', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                {day}
              </div>
            ))}
            {Array.from({ length: 4 }).map((_, i) => (
               <div key={`empty-${i}`} style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}></div>
            ))}
            {days.map(day => (
              <div key={day} style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '0.5rem', minHeight: '120px', position: 'relative' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: day === 12 ? 'var(--primary-color)' : '#1e293b' }}>{day}</span>
                {day === 12 && (
                  <div className="day-events" style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {events.filter(e => e.date === '2026-05-12').map(e => (
                      <div 
                        key={e.id} 
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.25rem', 
                          background: `${e.color}15`, 
                          color: e.color, 
                          borderLeft: `3px solid ${e.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: e.isKey ? '700' : '500'
                        }}
                      >
                        {e.isKey && <Star size={10} fill={e.color} />}
                        {e.time} {e.title}
                      </div>
                    ))}
                  </div>
                )}
                {day === 13 && (
                   <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: '#8b5cf615', color: '#8b5cf6', borderLeft: '3px solid #8b5cf6', fontWeight: '700' }}>
                         <Star size={10} fill="#8b5cf6" style={{ marginRight: '0.25rem' }} />
                         14:00 Team Meeting
                      </div>
                   </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
             <LayoutGrid size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
             <p>Week and Day views are currently under optimization for high-density medical scheduling.</p>
             <button className="btn-secondary" onClick={() => setViewMode('month')} style={{ marginTop: '1rem' }}>Return to Month View</button>
          </div>
        )}
      </div>

      <div className="calendar-legend" style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', padding: '0 0.5rem' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }}></div>
            Surgery
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }}></div>
            Ward/Patient
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#8b5cf6' }}></div>
            Staff/Admin
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }}></div>
            Discharge
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginLeft: 'auto' }}>
            <Star size={14} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontWeight: '700' }}>Key Tasks Only</span>
            <input type="checkbox" style={{ width: '16px', height: '16px' }} />
         </div>
      </div>
    </div>
  );
};

export default HospitalCalendar;
