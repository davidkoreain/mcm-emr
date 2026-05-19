import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
  CheckCircle, XCircle, Search, Filter, ArrowUpDown, RefreshCw,
  AlertCircle, User, Stethoscope, X
} from 'lucide-react';
import { useEMR, type Appointment, type AppointmentStatus } from '../context/EMRContext';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 → 20:00
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type ViewType = 'day' | 'week' | 'month';
type StatusFilter = 'all' | 'Applied' | 'Confirmed' | 'ChangeApplied' | 'ChangeConfirmed';
type SortKey = 'time-asc' | 'time-desc' | 'created-desc' | 'status';

const STATUS_META: Record<AppointmentStatus, { label: string; color: string; bg: string; border: string }> = {
  Applied:         { label: 'Applied',          color: '#92400e', bg: '#fef3c7', border: '#fbbf24' },
  Confirmed:       { label: 'Confirmed',        color: '#065f46', bg: '#d1fae5', border: '#10b981' },
  ChangeApplied:   { label: 'Change Applied',   color: '#9a3412', bg: '#ffedd5', border: '#fb923c' },
  ChangeConfirmed: { label: 'Change Confirmed', color: '#1e40af', bg: '#dbeafe', border: '#3b82f6' },
  Cancelled:       { label: 'Cancelled',        color: '#991b1b', bg: '#fee2e2', border: '#ef4444' },
  Completed:       { label: 'Completed',        color: '#374151', bg: '#e5e7eb', border: '#9ca3af' },
  Scheduled:       { label: 'Confirmed',        color: '#065f46', bg: '#d1fae5', border: '#10b981' },
};

const ManagerDashboard: React.FC = () => {
  const { appointments, patients, staff, currentStaff, updateAppointment } = useEMR();

  const [viewType, setViewType] = useState<ViewType>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('time-asc');
  const [pendingAction, setPendingAction] = useState<{ apt: Appointment; type: 'confirm' | 'change-confirm' | 'decline' } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // ── helpers ──────────────────────────────────────────────────
  const getPatientName = (mrn: string) => patients.find(p => p.mrn === mrn)?.name ?? mrn;
  const getDoctorName  = (id?: number)  => {
    const name = (id != null ? staff.find(s => s.id === id)?.name : null) ?? 'Unknown';
    return name.replace(/^Dr\.\s+/i, '');
  };
  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // ── date logic ───────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i); return d;
    });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i); return d;
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

  // ── active appointments ──────────────────────────────────────
  const activeAppointments = useMemo(() => {
    return appointments.filter(a => a.status !== 'Cancelled' && a.status !== 'Completed');
  }, [appointments]);

  // pending = needs manager attention
  const pending = useMemo(
    () => activeAppointments.filter(a => a.status === 'Applied' || a.status === 'ChangeApplied'),
    [activeAppointments]
  );

  // calendar items (effective time = requested time when ChangeApplied)
  const calendarItems = useMemo(() => {
    return activeAppointments.map(a => {
      const useRequested = a.status === 'ChangeApplied' && a.requestedStartTime;
      const start = new Date(useRequested ? a.requestedStartTime! : a.startTime);
      const end   = new Date(useRequested ? (a.requestedEndTime ?? a.requestedStartTime!) : a.endTime);
      const durationHours = Math.max(0.25, (end.getTime() - start.getTime()) / 3_600_000);
      return { apt: a, start, end, durationHours };
    });
  }, [activeAppointments]);

  // filtered + sorted list for the right-side panel
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let arr = activeAppointments.slice();
    if (statusFilter !== 'all') {
      arr = arr.filter(a => a.status === statusFilter || (statusFilter === 'Confirmed' && a.status === 'Scheduled'));
    }
    if (q) {
      arr = arr.filter(a => {
        const pn = getPatientName(a.patientMrn).toLowerCase();
        const dn = getDoctorName(a.doctorId).toLowerCase();
        return pn.includes(q) || dn.includes(q) || a.patientMrn.toLowerCase().includes(q);
      });
    }
    arr.sort((a, b) => {
      const sa = new Date(a.startTime).getTime();
      const sb = new Date(b.startTime).getTime();
      switch (sortKey) {
        case 'time-asc':    return sa - sb;
        case 'time-desc':   return sb - sa;
        case 'created-desc':return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'status':      return a.status.localeCompare(b.status);
      }
    });
    return arr;
  }, [activeAppointments, statusFilter, searchQuery, sortKey, patients, staff]);

  const stats = useMemo(() => ({
    applied:        activeAppointments.filter(a => a.status === 'Applied').length,
    confirmed:      activeAppointments.filter(a => a.status === 'Confirmed' || a.status === 'Scheduled' || a.status === 'ChangeConfirmed').length,
    changeApplied:  activeAppointments.filter(a => a.status === 'ChangeApplied').length,
    total:          activeAppointments.length,
  }), [activeAppointments]);

  // ── auto-scroll current time into view ───────────────────────
  const getYPos = (date: Date) => (date.getHours() - 7) * 80 + (date.getMinutes() / 60) * 80;
  useEffect(() => {
    if ((viewType === 'day' || viewType === 'week') && scrollRef.current) {
      const top = Math.max(0, getYPos(new Date()) - 150);
      scrollRef.current.scrollTo({ top, behavior: 'smooth' });
    }
  }, [viewType, selectedDate]);

  // ── actions ──────────────────────────────────────────────────
  const handleConfirm = async (apt: Appointment) => {
    setActionLoading(true);
    try {
      await updateAppointment(apt.id, {
        status: 'Confirmed',
        confirmedAt: new Date().toISOString(),
        confirmedBy: currentStaff?.name ?? 'Manager',
      });
    } finally { setActionLoading(false); setPendingAction(null); }
  };
  const handleChangeConfirm = async (apt: Appointment) => {
    setActionLoading(true);
    try {
      await updateAppointment(apt.id, {
        status: 'ChangeConfirmed',
        startTime: apt.requestedStartTime ?? apt.startTime,
        endTime: apt.requestedEndTime ?? apt.endTime,
        doctorId: apt.requestedDoctorId ?? apt.doctorId,
        confirmedAt: new Date().toISOString(),
        confirmedBy: currentStaff?.name ?? 'Manager',
      });
    } finally { setActionLoading(false); setPendingAction(null); }
  };
  const handleDecline = async (apt: Appointment) => {
    setActionLoading(true);
    try {
      await updateAppointment(apt.id, { status: 'Cancelled' });
    } finally { setActionLoading(false); setPendingAction(null); }
  };

  // ── render: appointment "chip" on calendar ───────────────────
  const renderChip = (apt: Appointment, opts?: { dense?: boolean }) => {
    const meta = STATUS_META[apt.status];
    const isPending = apt.status === 'Applied' || apt.status === 'ChangeApplied';
    return (
      <div
        key={apt.id}
        className="mgr-chip"
        style={{
          background: meta.bg,
          border: `1px solid ${meta.border}`,
          color: meta.color,
          padding: opts?.dense ? '2px 4px' : '4px 6px',
          borderRadius: '6px',
          fontSize: opts?.dense ? '0.65rem' : '0.72rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={`${getPatientName(apt.patientMrn)} · ${meta.label}`}
        onClick={(e) => { e.stopPropagation();
          if (apt.status === 'Applied') setPendingAction({ apt, type: 'confirm' });
          else if (apt.status === 'ChangeApplied') setPendingAction({ apt, type: 'change-confirm' });
        }}
      >
        {isPending && <AlertCircle size={opts?.dense ? 10 : 12} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getPatientName(apt.patientMrn)}
        </span>
      </div>
    );
  };

  // ── views ────────────────────────────────────────────────────
  const renderDayView = () => (
    <div ref={scrollRef} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', flex: 1, overflowY: 'auto' }}>
      <div style={{ borderRight: '1px solid #f1f5f9', background: '#f8fafc' }}>
        {HOURS.map(h => (
          <div key={h} style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>{h}:00</div>
        ))}
      </div>
      <div style={{ position: 'relative', height: `${HOURS.length * 80}px` }}>
        {HOURS.map(h => <div key={h} style={{ height: '80px', borderBottom: '1px solid #f1f5f9' }} />)}
        {calendarItems
          .filter(ci => ci.start.toDateString() === selectedDate.toDateString())
          .map(ci => (
            <div key={ci.apt.id} style={{
              position: 'absolute', top: `${getYPos(ci.start)}px`,
              height: `${ci.durationHours * 80 - 4}px`,
              left: '8px', right: '8px', zIndex: 5,
            }}>
              {renderChip(ci.apt)}
            </div>
          ))
        }
        {selectedDate.toDateString() === currentTime.toDateString() && (
          <div style={{
            position: 'absolute', top: `${getYPos(currentTime)}px`, left: 0, right: 0,
            height: 0, borderTop: '2px dashed #ef4444', zIndex: 9, pointerEvents: 'none'
          }}>
            <div style={{ position: 'absolute', left: '-5px', top: '-6px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%' }} />
          </div>
        )}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
      <div className="mgr-week-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div ref={scrollRef} className="mgr-scroll" style={{ position: 'relative', overflowY: 'auto', flex: 1 }}>
          <div className="mgr-week-grid" style={{ position: 'sticky', top: 0, zIndex: 20, borderBottom: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#64748b', borderRight: '1px solid #f1f5f9', fontSize: '0.75rem' }}>Time</div>
            {weekDays.map((date, i) => {
              const isSunday = date.getDay() === 0;
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={i} style={{ padding: '0.75rem 0.25rem', textAlign: 'center', borderRight: i < 6 ? '1px solid #f1f5f9' : 'none', background: isToday ? '#f0f9ff' : 'transparent' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isSunday ? '#ef4444' : (isToday ? '#2563eb' : '#1e293b') }}>
                    {DAYS[i].slice(0, 3)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: isSunday ? '#ef4444' : '#94a3b8' }}>{date.getMonth() + 1}.{date.getDate()}</div>
                </div>
              );
            })}
          </div>
          <div className="mgr-week-grid" style={{ height: `${HOURS.length * 80}px`, position: 'relative' }}>
            <div style={{ borderRight: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {HOURS.map(h => (
                <div key={h} style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>{h}:00</div>
              ))}
            </div>
            {weekDays.map((date, i) => (
              <div key={i} style={{ position: 'relative', borderRight: i < 6 ? '1px solid #f1f5f9' : 'none' }}>
                {HOURS.map(h => <div key={h} style={{ height: '80px', borderBottom: '1px solid #f1f5f9' }} />)}
                {calendarItems
                  .filter(ci => ci.start.toDateString() === date.toDateString())
                  .map(ci => (
                    <div key={ci.apt.id} style={{
                      position: 'absolute', top: `${getYPos(ci.start)}px`,
                      height: `${ci.durationHours * 80 - 4}px`,
                      left: '4px', right: '4px', zIndex: 5,
                    }}>
                      {renderChip(ci.apt, { dense: true })}
                    </div>
                  ))
                }
              </div>
            ))}
            <div style={{ position: 'absolute', top: `${getYPos(currentTime)}px`, left: '80px', right: 0, height: 0, borderTop: '2px dashed #ef4444', zIndex: 9, pointerEvents: 'none' }}>
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
        {DAYS.map((day, i) => (
          <div key={i} style={{ padding: '0.75rem 0.25rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: i === 0 ? '#ef4444' : '#64748b' }}>{day.slice(0, 3)}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', flex: 1 }}>
        {monthDays.map((date, i) => {
          const inMonth = date.getMonth() === selectedDate.getMonth();
          const isToday = date.toDateString() === new Date().toDateString();
          const isSunday = date.getDay() === 0;
          const dayItems = calendarItems.filter(ci => ci.start.toDateString() === date.toDateString());
          return (
            <div key={i} style={{
              borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid #f1f5f9',
              borderBottom: i < 35 ? '1px solid #f1f5f9' : 'none',
              padding: '0.4rem 0.25rem',
              background: inMonth ? 'white' : '#f8fafc',
              minHeight: '90px', display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: 700, textAlign: 'right',
                color: isToday ? '#2563eb' : (isSunday ? (inMonth ? '#ef4444' : '#fca5a5') : (inMonth ? '#1e293b' : '#cbd5e1'))
              }}>{date.getDate()}</div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {dayItems.map(ci => renderChip(ci.apt, { dense: true }))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── render ───────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', maxWidth: '100%' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Applied (Pending)',         value: stats.applied,       meta: STATUS_META.Applied },
          { label: 'Change Requests',           value: stats.changeApplied, meta: STATUS_META.ChangeApplied },
          { label: 'Confirmed',                 value: stats.confirmed,     meta: STATUS_META.Confirmed },
          { label: 'Total Active',              value: stats.total,         meta: { bg: '#f1f5f9', color: '#0f172a', border: '#e2e8f0', label: '' } },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'white', padding: '1rem 1.25rem', borderRadius: '0.75rem',
            border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.25rem'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.meta.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main grid: calendar + list */}
      <div className="mgr-main" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 1fr)', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Calendar panel */}
        <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '600px' }}>
          {/* Calendar header */}
          <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              {viewType === 'day'
                ? selectedDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })
                : selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })
              }
            </h2>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '0.5rem', padding: '0.2rem' }}>
              <button className="mgr-icon-btn" onClick={handlePrev}><ChevronLeft size={16} /></button>
              <button className="mgr-icon-btn" onClick={handleNext}><ChevronRight size={16} /></button>
            </div>
            <button className="mgr-today-btn" onClick={() => setSelectedDate(new Date())}>Today</button>
            <div className="mgr-view-selector" style={{ marginLeft: 'auto' }}>
              {(['day','week','month'] as ViewType[]).map(v => (
                <button key={v} className={viewType === v ? 'active' : ''} onClick={() => setViewType(v)}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {viewType === 'day' && renderDayView()}
            {viewType === 'week' && renderWeekView()}
            {viewType === 'month' && renderMonthView()}
          </div>
        </div>

        {/* Applications list panel */}
        <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '600px' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Appointment Requests</h2>
              <span style={{
                background: pending.length > 0 ? '#fef3c7' : '#f1f5f9',
                color: pending.length > 0 ? '#92400e' : '#64748b',
                fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '999px'
              }}>{pending.length} pending</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient or doctor..."
                style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 1.9rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Filter size={12} style={{ color: '#64748b' }} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="mgr-select">
                <option value="all">All statuses</option>
                <option value="Applied">Applied</option>
                <option value="ChangeApplied">Change Applied</option>
                <option value="Confirmed">Confirmed</option>
                <option value="ChangeConfirmed">Change Confirmed</option>
              </select>
              <ArrowUpDown size={12} style={{ color: '#64748b', marginLeft: '0.25rem' }} />
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="mgr-select">
                <option value="time-asc">Time ↑</option>
                <option value="time-desc">Time ↓</option>
                <option value="created-desc">Newest first</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {filteredList.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No appointments match your filters.
              </div>
            ) : (
              filteredList.map(apt => {
                const meta = STATUS_META[apt.status];
                const isApplied = apt.status === 'Applied';
                const isChange  = apt.status === 'ChangeApplied';
                return (
                  <div key={apt.id} style={{
                    padding: '0.75rem', borderRadius: '0.6rem', border: '1px solid #f1f5f9',
                    marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
                    background: (isApplied || isChange) ? '#fffbeb' : 'white'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                        <User size={14} color="#64748b" />
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {getPatientName(apt.patientMrn)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{apt.patientMrn}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        {isChange && apt.changeRequestedBy && (
                          <span style={{
                            background: apt.changeRequestedBy === 'Doctor' ? '#e0f2fe' : '#fef3c7',
                            color:      apt.changeRequestedBy === 'Doctor' ? '#0369a1' : '#92400e',
                            border:    `1px solid ${apt.changeRequestedBy === 'Doctor' ? '#7dd3fc' : '#fbbf24'}`,
                            fontSize: '0.6rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '999px',
                            textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap'
                          }}>From {apt.changeRequestedBy}</span>
                        )}
                        <span style={{
                          background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                          fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '999px',
                          textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap'
                        }}>{meta.label}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: '#475569', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Stethoscope size={12} /> Dr. {getDoctorName(apt.doctorId)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {fmtTime(apt.startTime)}
                      </span>
                    </div>
                    {isChange && apt.requestedStartTime && (
                      <div style={{ background: '#ffedd5', padding: '0.4rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.72rem', color: '#9a3412', border: '1px solid #fed7aa' }}>
                        <div style={{ fontWeight: 800, marginBottom: '0.2rem' }}>Requested change:</div>
                        <div>New time: {fmtTime(apt.requestedStartTime)}</div>
                        {apt.requestedDoctorId && apt.requestedDoctorId !== apt.doctorId && (
                          <div>New doctor: Dr. {getDoctorName(apt.requestedDoctorId)}</div>
                        )}
                        {apt.changeReason && <div>Reason: {apt.changeReason}</div>}
                      </div>
                    )}
                    {(isApplied || isChange) && (
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <button
                          className="mgr-confirm-btn"
                          onClick={() => setPendingAction({ apt, type: isChange ? 'change-confirm' : 'confirm' })}
                          disabled={actionLoading}
                        >
                          <CheckCircle size={14} /> {isChange ? 'Approve Change' : 'Confirm'}
                        </button>
                        <button
                          className="mgr-decline-btn"
                          onClick={() => setPendingAction({ apt, type: 'decline' })}
                          disabled={actionLoading}
                        >
                          <XCircle size={14} /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {pendingAction && (
        <div onClick={() => !actionLoading && setPendingAction(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'white', borderRadius: '0.85rem', padding: '1.5rem', maxWidth: '460px',
            width: '100%', boxShadow: '0 25px 60px -10px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                {pendingAction.type === 'confirm' && 'Confirm Appointment'}
                {pendingAction.type === 'change-confirm' && 'Approve Change Request'}
                {pendingAction.type === 'decline' && 'Decline Appointment'}
              </h3>
              <button onClick={() => !actionLoading && setPendingAction(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#475569', marginBottom: '1.25rem' }}>
              <div><strong>Patient:</strong> {getPatientName(pendingAction.apt.patientMrn)}</div>
              <div><strong>Doctor:</strong> Dr. {getDoctorName(pendingAction.type === 'change-confirm' ? (pendingAction.apt.requestedDoctorId ?? pendingAction.apt.doctorId) : pendingAction.apt.doctorId)}</div>
              <div><strong>Time:</strong> {fmtTime(pendingAction.type === 'change-confirm' ? (pendingAction.apt.requestedStartTime ?? pendingAction.apt.startTime) : pendingAction.apt.startTime)}</div>
              {pendingAction.type === 'change-confirm' && pendingAction.apt.changeReason && (
                <div><strong>Reason:</strong> {pendingAction.apt.changeReason}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPendingAction(null)}
                disabled={actionLoading}
                style={{ padding: '0.55rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={() => {
                  if (pendingAction.type === 'confirm')        handleConfirm(pendingAction.apt);
                  else if (pendingAction.type === 'change-confirm') handleChangeConfirm(pendingAction.apt);
                  else                                         handleDecline(pendingAction.apt);
                }}
                disabled={actionLoading}
                style={{
                  padding: '0.55rem 1rem', borderRadius: '0.5rem', border: 'none',
                  background: pendingAction.type === 'decline' ? '#dc2626' : '#10b981',
                  color: 'white', fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                {actionLoading ? <RefreshCw size={14} className="mgr-spin" /> : <CheckCircle size={14} />}
                {pendingAction.type === 'decline' ? 'Decline' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .mgr-week-grid {
          display: grid;
          grid-template-columns: 80px repeat(7, minmax(0, 1fr));
        }
        .mgr-week-container { min-width: 700px; }
        .mgr-scroll::-webkit-scrollbar { display: none; }
        .mgr-icon-btn {
          background: none; border: none; padding: 0.4rem; cursor: pointer;
          color: #64748b; display: flex; align-items: center; border-radius: 0.35rem;
        }
        .mgr-icon-btn:hover { background: white; color: #2563eb; }
        .mgr-today-btn {
          padding: 0 0.85rem; height: 32px; border-radius: 0.5rem; border: 1px solid #e2e8f0;
          background: white; font-size: 0.8rem; font-weight: 700; color: #1e293b; cursor: pointer;
        }
        .mgr-today-btn:hover { background: #f8fafc; }
        .mgr-view-selector {
          display: flex; background: #f1f5f9; border-radius: 0.5rem; padding: 0.18rem;
        }
        .mgr-view-selector button {
          padding: 0.35rem 0.85rem; border: none; background: none;
          font-size: 0.8rem; font-weight: 700; color: #64748b; cursor: pointer; border-radius: 0.4rem;
        }
        .mgr-view-selector button.active {
          background: white; color: #2563eb; box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        }
        .mgr-select {
          padding: 0.3rem 0.5rem; border-radius: 0.4rem; border: 1px solid #e2e8f0;
          font-size: 0.75rem; color: #1e293b; background: white; cursor: pointer;
        }
        .mgr-confirm-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.3rem;
          padding: 0.45rem 0.6rem; border-radius: 0.5rem; border: none;
          background: #10b981; color: white; font-weight: 700; font-size: 0.78rem; cursor: pointer;
        }
        .mgr-confirm-btn:hover { background: #059669; }
        .mgr-confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .mgr-decline-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.3rem;
          padding: 0.45rem 0.7rem; border-radius: 0.5rem; border: 1px solid #fecaca;
          background: white; color: #b91c1c; font-weight: 700; font-size: 0.78rem; cursor: pointer;
        }
        .mgr-decline-btn:hover { background: #fef2f2; }
        @keyframes mgr-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        .mgr-spin { animation: mgr-spin 1s linear infinite; }
        @media (max-width: 1024px) {
          .mgr-main { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default ManagerDashboard;
