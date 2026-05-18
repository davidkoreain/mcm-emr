import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Star, Filter, Plus, LayoutGrid, FileText, X } from 'lucide-react';
import CSVImportModal from './CSVImportModal';

type CalEvent = {
  id: number;
  title: string;
  type: string;
  date: string;
  time: string;
  doctor: string;
  isKey: boolean;
  color: string;
};

const TYPE_COLORS: Record<string, string> = {
  Surgery: '#ef4444', Ward: '#3b82f6', Staff: '#8b5cf6', Leave: '#f59e0b',
};

const initialEvents: CalEvent[] = [
  { id: 1, title: 'Major Surgery: Hip Replacement', type: 'Surgery', date: '2026-05-12', time: '09:00', doctor: 'Dr. Solomon', isKey: true, color: '#ef4444' },
  { id: 2, title: 'Ward Rounds: General Ward A', type: 'Ward', date: '2026-05-12', time: '08:00', doctor: 'Staff Nurse', isKey: false, color: '#3b82f6' },
  { id: 3, title: 'Staff Meeting: ICU Team', type: 'Staff', date: '2026-05-13', time: '14:00', doctor: 'All Chiefs', isKey: true, color: '#8b5cf6' },
  { id: 4, title: 'Patient Discharge: Room 402', type: 'Ward', date: '2026-05-12', time: '11:00', doctor: 'Nurse Martha', isKey: false, color: '#10b981' },
  { id: 5, title: 'Annual Leave: Dr. Abraham', type: 'Leave', date: '2026-05-14', time: 'All Day', doctor: 'Dr. Abraham', isKey: false, color: '#f59e0b' },
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function getDaysInMonth(year: number, month: number) {
  if (month === 1 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) return 29;
  return DAYS_IN_MONTH[month];
}

const HospitalCalendar: React.FC = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [events, setEvents] = useState<CalEvent[]>(initialEvents);
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', type: 'Ward', date: '', time: '', doctor: '', isKey: false });
  const [filterType, setFilterType] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [keyOnly, setKeyOnly] = useState(false);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const goToday = () => { setYear(2026); setMonth(4); };

  const handleAddEvent = () => {
    if (!addForm.title.trim() || !addForm.date) return;
    const color = TYPE_COLORS[addForm.type] ?? '#64748b';
    setEvents(prev => [...prev, {
      id: Date.now(), title: addForm.title, type: addForm.type,
      date: addForm.date, time: addForm.time || 'All Day',
      doctor: addForm.doctor, isKey: addForm.isKey, color,
    }]);
    setAddModal(false);
    setAddForm({ title: '', type: 'Ward', date: '', time: '', doctor: '', isKey: false });
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const currentMonthLabel = `${MONTH_NAMES[month]} ${year}`;

  const filteredEvents = useMemo(() =>
    events.filter(e => (!filterType || e.type === filterType) && (!keyOnly || e.isKey)),
    [events, filterType, keyOnly]
  );

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const isToday = (day: number) => year === 2026 && month === 4 && day === 12;

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' };

  return (
    <div className="calendar-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {addModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', width: '460px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Add New Event</h3>
              <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Title *</label>
                <input type="text" value={addForm.title} placeholder="Event title"
                  onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Date *</label>
                <input type="date" value={addForm.date}
                  onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Time</label>
                <input type="time" value={addForm.time}
                  onChange={e => setAddForm(f => ({ ...f, time: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Doctor / Staff</label>
                <input type="text" value={addForm.doctor} placeholder="e.g. Dr. Solomon"
                  onChange={e => setAddForm(f => ({ ...f, doctor: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Type</label>
                <select value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                  <option value="Surgery">Surgery</option>
                  <option value="Ward">Ward / Patient</option>
                  <option value="Staff">Staff / Admin</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
                <input type="checkbox" checked={addForm.isKey} onChange={e => setAddForm(f => ({ ...f, isKey: e.target.checked }))} />
                Mark as Key Task
              </label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddEvent} disabled={!addForm.title.trim() || !addForm.date}>Add Event</button>
            </div>
          </div>
        </div>
      )}

      <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarIcon size={28} /> {currentMonthLabel}
          </h2>
          <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
            <button className="btn-icon" onClick={prevMonth}><ChevronLeft size={20} /></button>
            <button className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }} onClick={goToday}>Today</button>
            <button className="btn-icon" onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
            {(['month', 'week', 'day'] as const).map(v => (
              <button key={v} className={`tab-btn ${viewMode === v ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                onClick={() => setViewMode(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowCSVModal(true)}>
            <FileText size={18} /> CSV Import
          </button>
          <div style={{ position: 'relative' }}>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => setShowFilter(f => !f)}>
              <Filter size={18} /> Filters
              {filterType && <span style={{ background: 'var(--primary-color)', color: 'white', borderRadius: '9999px', padding: '0 0.4rem', fontSize: '0.7rem' }}>1</span>}
            </button>
            {showFilter && (
              <div style={{ position: 'absolute', right: 0, top: '110%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', zIndex: 100, minWidth: '180px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.5rem', color: '#64748b' }}>EVENT TYPE</p>
                {['', 'Surgery', 'Ward', 'Staff', 'Leave'].map(t => (
                  <button key={t} onClick={() => { setFilterType(t); setShowFilter(false); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.4rem 0.6rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', background: filterType === t ? '#eff6ff' : 'transparent', color: filterType === t ? 'var(--primary-color)' : 'inherit', fontWeight: filterType === t ? '700' : '400' }}>
                    {t || 'All Types'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setAddModal(true)}>
            <Plus size={18} /> Add Event
          </button>
        </div>
      </div>

      {showCSVModal && (
        <CSVImportModal title="Hospital Schedules & Events" onClose={() => setShowCSVModal(false)} onImport={(data) => console.log('Imported Events:', data)} />
      )}

      <div className="calendar-grid-wrapper" style={{ flex: 1, background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {viewMode === 'month' ? (
          <div className="calendar-month-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', height: '100%', gridAutoRows: 'minmax(120px, 1fr)' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
              const isSunday = idx === 0;
              return (
                <div key={day} style={{ 
                  padding: '0.75rem', 
                  textAlign: 'center', 
                  fontWeight: '700', 
                  fontSize: '0.85rem', 
                  color: isSunday ? '#ef4444' : '#64748b', 
                  borderBottom: '1px solid #e2e8f0', 
                  background: '#f8fafc' 
                }}>
                  <span className="desktop-day">{day}</span>
                  <span className="mobile-day">{day[0]}</span>
                </div>
              );
            })}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dayEvents = getEventsForDay(day);
              const isSunday = new Date(year, month, day).getDay() === 0;
              return (
                <div key={day} style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '0.5rem', minHeight: '120px' }}>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: '600', 
                    color: isToday(day) 
                      ? 'white' 
                      : (isSunday ? '#ef4444' : '#1e293b'), 
                    background: isToday(day) ? 'var(--primary-color)' : 'transparent', 
                    borderRadius: '50%', 
                    padding: '0.15rem 0.45rem' 
                  }}>{day}</span>
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {dayEvents.slice(0, 3).map(e => (
                      <div key={e.id} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: `${e.color}18`, color: e.color, borderLeft: `3px solid ${e.color}`, display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: e.isKey ? '700' : '500' }}>
                        {e.isKey && <Star size={10} fill={e.color} />}
                        {e.time !== 'All Day' ? e.time + ' ' : ''}{e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div style={{ fontSize: '0.7rem', color: '#64748b', paddingLeft: '0.25rem' }}>+{dayEvents.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
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
        {[['#ef4444', 'Surgery'], ['#3b82f6', 'Ward/Patient'], ['#8b5cf6', 'Staff/Admin'], ['#10b981', 'Discharge']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color }} />{label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginLeft: 'auto' }}>
          <Star size={14} fill="#f59e0b" color="#f59e0b" />
          <span style={{ fontWeight: '700' }}>Key Tasks Only</span>
          <input type="checkbox" checked={keyOnly} onChange={e => setKeyOnly(e.target.checked)} style={{ width: '16px', height: '16px' }} />
        </div>
      </div>
      <style>{`
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

export default HospitalCalendar;
