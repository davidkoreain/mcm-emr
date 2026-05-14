import React, { useState, useMemo } from 'react';
import {
  Calendar, Coffee, Award, ShieldAlert, FileText, CheckCircle, Clock,
  UserPlus, BookOpen, GraduationCap, ChevronRight, ShieldCheck, Stethoscope, X, Activity, Users
} from 'lucide-react';
import CSVImportModal from './CSVImportModal';
import ListFilterControl from './ListFilterControl';
import { useEMR, type StaffMember as Staff } from '../context/EMRContext';
import Avatar from './Avatar';
import { QRCodeSVG } from 'qrcode.react';

const fmtStaffId = (id: number) => `STF-${String(id).padStart(3, '0')}`;

type LeaveRequest = { id: number; name: string; type: string; duration: string; status: string; date: string };
type PerformanceRecord = { id: number; name: string; type: string; title: string; date: string };

const initialLeave: LeaveRequest[] = [
  { id: 1, name: 'Nurse Tigist Hailu', type: 'Annual Leave', duration: '5 days', status: 'Pending', date: '2026-05-10' },
  { id: 2, name: 'Dr. Fitsum Ayele', type: 'Sick Leave', duration: '2 days', status: 'Approved', date: '2026-05-08' },
  { id: 3, name: 'Nurse Martha Kassa', type: 'Annual Leave', duration: '7 days', status: 'Pending', date: '2026-05-05' },
];

const initialPerf: PerformanceRecord[] = [
  { id: 1, name: 'Dr. Solomon Tsegaye', type: 'Award', title: 'Physician of the Year', date: '2026-01-15' },
  { id: 2, name: 'Nurse Martha Kassa', type: 'Award', title: 'Excellence in Nursing', date: '2026-03-10' },
  { id: 3, name: 'Staff X', type: 'Disciplinary', title: 'Tardiness Warning', date: '2026-04-05' },
  { id: 4, name: 'Dr. Fitsum Ayele', type: 'Award', title: 'Patient Satisfaction Award', date: '2026-02-20' },
];

const emptyNewStaff = { name: '', role: '', specialization: '', gender: 'Male' as const, age: 30, shift: 'Day', status: 'On Duty', education: '', license: '', licenseNo: '', npi: '', upin: '', taxId: '', experience: '' };

interface StaffManagementProps {
  activeTab?: 'leave' | 'performance' | 'portfolio';
}

const StaffManagement: React.FC<StaffManagementProps> = ({ activeTab: propTab }) => {
  const { staff, addStaff } = useEMR();
  const [internalTab, setInternalTab] = useState<'leave' | 'performance' | 'portfolio'>('portfolio');
  
  // Use prop if provided, otherwise fallback to internal state
  const activeTab = propTab || internalTab;
  const setActiveTab = setInternalTab;

  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeave);
  const [reviewModal, setReviewModal] = useState<LeaveRequest | null>(null);
  const [logsModal, setLogsModal] = useState<Staff | null>(null);
  const [addStaffModal, setAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState(emptyNewStaff);
  const [perfDetailModal, setPerfDetailModal] = useState<PerformanceRecord | null>(null);
  const [profileModal, setProfileModal] = useState<Staff | null>(null);

  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterFilters, setRosterFilters] = useState<Record<string, string>>({ category: '', specialization: '', shift: '', status: '' });
  const [rosterSort, setRosterSort] = useState('name_asc');
  const [leaveSearch, setLeaveSearch] = useState('');
  const [leaveFilters, setLeaveFilters] = useState<Record<string, string>>({ type: '', status: '' });
  const [leaveSort, setLeaveSort] = useState('name_asc');
  const [perfSearch, setPerfSearch] = useState('');
  const [perfFilters, setPerfFilters] = useState<Record<string, string>>({ type: '' });
  const [perfSort, setPerfSort] = useState('date_desc');

  const getCategory = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('doctor') || r.includes('physician') || r.includes('surgeon')) return 'Doctor';
    if (r.includes('nurse')) return 'Nurse';
    if (r.includes('pharmacist')) return 'Pharmacist';
    if (r.includes('admin') || r.includes('hr') || r.includes('management') || r.includes('coordinator')) return 'Administration';
    return 'Technical';
  };

  const uniqueSpecializations = useMemo(() => {
    const specs = staff.map(s => s.specialization).filter(Boolean);
    return ['All Specializations', ...new Set(specs)].map(s => ({ label: s, value: s === 'All Specializations' ? '' : s }));
  }, [staff]);

  const filteredRoster = useMemo(() => {
    let result = staff.filter((s) => {
      const q = rosterSearch.toLowerCase();
      if (q && !s.name.toLowerCase().includes(q) && !s.role.toLowerCase().includes(q)) return false;
      if (rosterFilters.category && getCategory(s.role) !== rosterFilters.category) return false;
      if (rosterFilters.specialization && s.specialization !== rosterFilters.specialization) return false;
      if (rosterFilters.shift && s.shift !== rosterFilters.shift) return false;
      if (rosterFilters.status && s.status !== rosterFilters.status) return false;
      return true;
    });
    return [...result].sort((a, b) => rosterSort === 'name_desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
  }, [staff, rosterSearch, rosterFilters, rosterSort]);

  const groupedRoster = useMemo(() => {
    const categories = ['Doctor', 'Nurse', 'Pharmacist', 'Administration', 'Technical'];
    const grouped: Record<string, Staff[]> = {};
    categories.forEach(cat => {
      grouped[cat] = filteredRoster.filter(s => getCategory(s.role) === cat);
    });
    return grouped;
  }, [filteredRoster]);

  const filteredLeave = useMemo(() => {
    let result = leaveRequests.filter((l) => {
      const q = leaveSearch.toLowerCase();
      if (q && !l.name.toLowerCase().includes(q)) return false;
      if (leaveFilters.type && l.type !== leaveFilters.type) return false;
      if (leaveFilters.status && l.status !== leaveFilters.status) return false;
      return true;
    });
    return [...result].sort((a, b) => leaveSort === 'name_desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
  }, [leaveRequests, leaveSearch, leaveFilters, leaveSort]);

  const filteredPerf = useMemo(() => {
    let result = initialPerf.filter((r) => {
      const q = perfSearch.toLowerCase();
      if (q && !r.name.toLowerCase().includes(q) && !r.title.toLowerCase().includes(q)) return false;
      if (perfFilters.type && r.type !== perfFilters.type) return false;
      return true;
    });
    return [...result].sort((a, b) => perfSort === 'date_asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  }, [perfSearch, perfFilters, perfSort]);

  const handleReviewLeave = (action: 'Approved' | 'Rejected') => {
    if (!reviewModal) return;
    setLeaveRequests((prev) => prev.map((l) => l.id === reviewModal.id ? { ...l, status: action } : l));
    setReviewModal(null);
  };

  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const boxStyle: React.CSSProperties = { background: 'white', borderRadius: '1rem', padding: '2rem', width: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };

  const renderProfile = (staff: Staff) => (
    <div className="staff-profile" style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Avatar name={staff.name} photoUrl={staff.photoUrl} size={100} />
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{staff.name}</h2>
            <p style={{ color: 'var(--primary-color)', fontWeight: '700', fontSize: '1.1rem' }}>{staff.specialization}</p>
            <p style={{ color: '#64748b', fontWeight: '600' }}>{staff.role}</p>
            <p style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#6366f1', fontWeight: '700', marginTop: '0.2rem' }}>{fmtStaffId(staff.id)}</p>
          </div>
        </div>
        <button onClick={() => setSelectedStaff(null)} className="btn-secondary">Back to List</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>
            <GraduationCap size={20} color="var(--primary-color)" /> Academic & Professional
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[{ label: 'EDUCATION', value: staff.education }, { label: 'WORK EXPERIENCE', value: staff.experience }].map(({ label, value }) => (
              <div key={label} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>{label}</label>
                <p style={{ fontSize: '0.95rem' }}>{value}</p>
              </div>
            ))}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>MEDICAL LICENSE</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#10b981" />
                <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>{staff.license}</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>
            <Stethoscope size={20} color="var(--primary-color)" /> Clinical & Training
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>SURGERY LOG</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {staff.surgeries.map((s, idx) => <span key={idx} style={{ padding: '0.25rem 0.75rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>{s}</span>)}
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>CME / TRAINING</label>
              <ul style={{ listStyle: 'none', padding: '0', fontSize: '0.9rem', margin: '0' }}>
                {staff.training.map((t, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <CheckCircle size={14} color="var(--primary-color)" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const activeStaff = staff.find((s) => s.id === selectedStaff);

  return (
    <div className="staff-container">
      {/* Review Leave Modal */}
      {reviewModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Review Leave Request</h3>
              <button onClick={() => setReviewModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[{ label: 'Employee', value: reviewModal.name }, { label: 'Leave Type', value: reviewModal.type }, { label: 'Duration', value: reviewModal.duration }, { label: 'Request Date', value: reviewModal.date }, { label: 'Current Status', value: reviewModal.status }].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{label}</span>
                  <span style={{ fontWeight: '700' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
              <button style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleReviewLeave('Rejected')}>Reject</button>
              <button className="btn-primary" onClick={() => handleReviewLeave('Approved')}>Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* View Logs Modal */}
      {logsModal && (
        <div style={overlayStyle}>
          <div style={{ ...boxStyle, width: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Duty Logs – {logsModal.name}</h3>
              <button onClick={() => setLogsModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { date: '2026-05-12', shift: logsModal.shift, hours: '8h', status: logsModal.status },
                { date: '2026-05-11', shift: logsModal.shift, hours: '8h', status: 'Completed' },
                { date: '2026-05-10', shift: logsModal.shift, hours: '8h', status: 'Completed' },
                { date: '2026-05-09', shift: logsModal.shift, hours: '8h', status: 'Completed' },
                { date: '2026-05-08', shift: logsModal.shift, hours: '8h', status: 'Completed' },
              ].map((log, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600' }}>{log.date}</span>
                  <span style={{ color: '#64748b' }}>{log.shift} Shift · {log.hours}</span>
                  <span className={`status-badge ${log.status === 'On Duty' ? 'status-pending' : 'status-active'}`}>{log.status}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setLogsModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Detail Modal */}
      {perfDetailModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>{perfDetailModal.type === 'Award' ? '🏆 Award Detail' : '⚠ Disciplinary Detail'}</h3>
              <button onClick={() => setPerfDetailModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[{ label: 'Title', value: perfDetailModal.title }, { label: 'Employee', value: perfDetailModal.name }, { label: 'Category', value: perfDetailModal.type }, { label: 'Date', value: perfDetailModal.date }].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{label}</span>
                  <span style={{ fontWeight: '700' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setPerfDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Profile Modal (name click) */}
      {profileModal && (
        <div style={overlayStyle} onClick={() => setProfileModal(null)}>
          <div style={{ ...boxStyle, width: '640px', maxHeight: '88vh' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Staff Profile</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: 'white', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <QRCodeSVG value={`EMR://staff/${profileModal.id}`} size={48} level="H" />
              </div>
              <button onClick={() => setProfileModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
            </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Staff ID', value: fmtStaffId(profileModal.id) },
                { label: 'Name', value: profileModal.name },
                { label: 'Role', value: profileModal.role },
                { label: 'Specialization', value: profileModal.specialization },
                { label: 'Shift', value: profileModal.shift },
                { label: 'Status', value: profileModal.status },
                { label: 'Medical License', value: profileModal.license },
                { label: 'NPI Number', value: profileModal.npi || '—' },
                { label: 'License No.', value: profileModal.licenseNo || '—' },
                { label: 'UPIN', value: profileModal.upin || '—' },
                { label: 'Tax ID', value: profileModal.taxId || '—' },
                { label: 'Education', value: profileModal.education },
                { label: 'Experience', value: profileModal.experience },
                { label: 'Surgery Log', value: profileModal.surgeries.join(', ') || 'None' },
                { label: 'Training', value: profileModal.training.join(', ') || 'None' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{label}</span>
                  <span style={{ fontWeight: '700', color: label === 'Status' && value === 'On Duty' ? '#10b981' : 'inherit' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setProfileModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {addStaffModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Add New Staff</h3>
              <button onClick={() => setAddStaffModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Full Name *', key: 'name', placeholder: 'Dr. / Nurse ...' },
                { label: 'Role / Position *', key: 'role', placeholder: 'e.g. Staff Nurse' },
                { label: 'Specialization', key: 'specialization', placeholder: 'e.g. Cardiology' },
                { label: 'Medical License (Label)', key: 'license', placeholder: 'e.g. General Physician' },
                { label: 'License No.', key: 'licenseNo', placeholder: 'e.g. ETH-MD-0000' },
                { label: 'NPI Number', key: 'npi', placeholder: '10-digit NPI' },
                { label: 'UPIN / Tax ID', key: 'taxId', placeholder: 'Tax Identification Number' },
                { label: 'Education', key: 'education', placeholder: 'e.g. BSc Nursing, AAU' },
                { label: 'Experience', key: 'experience', placeholder: 'e.g. 3 years (MCM Hospital)' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>{label}</label>
                  <input type="text" value={(newStaff as any)[key]} placeholder={placeholder}
                    onChange={(e) => setNewStaff((prev) => ({ ...prev, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Gender</label>
                  <select value={newStaff.gender} onChange={(e) => setNewStaff((p) => ({ ...p, gender: e.target.value as any }))}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
                    <option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Age</label>
                  <input type="number" value={newStaff.age} onChange={(e) => setNewStaff((p) => ({ ...p, age: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }} placeholder="e.g. 35" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Shift</label>
                  <select value={newStaff.shift} onChange={(e) => setNewStaff((p) => ({ ...p, shift: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
                    <option>Day</option><option>Night</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Status</label>
                  <select value={newStaff.status} onChange={(e) => setNewStaff((p) => ({ ...p, status: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
                    <option>On Duty</option><option>Off Duty</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => { setAddStaffModal(false); setNewStaff(emptyNewStaff); }}>Cancel</button>
              <button className="btn-primary" disabled={!newStaff.name.trim() || !newStaff.role.trim()}
                onClick={() => {
                  addStaff({
                    name: newStaff.name.trim(),
                    role: newStaff.role.trim(),
                    specialization: newStaff.specialization.trim() || 'General Medicine',
                    gender: newStaff.gender as 'Male' | 'Female',
                    age: newStaff.age || 30,
                    shift: newStaff.shift,
                    status: newStaff.status,
                    education: newStaff.education.trim() || 'Not specified',
                    license: newStaff.license.trim() || 'Pending',
                    licenseNo: newStaff.licenseNo.trim(),
                    npi: newStaff.npi.trim(),
                    taxId: newStaff.taxId.trim(),
                    experience: newStaff.experience.trim() || 'Not specified',
                    surgeries: [], training: [], awards: [],
                  });
                  setAddStaffModal(false);
                  setNewStaff(emptyNewStaff);
                }}>
                Register Staff
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="staff-content" style={{ marginTop: '0rem' }}>
        {showCSVModal && <CSVImportModal title="Medical Staff & HR" onClose={() => setShowCSVModal(false)} onImport={(data) => console.log('Imported Staff:', data)} />}

        {activeTab === 'portfolio' && selectedStaff && activeStaff ? (
          renderProfile(activeStaff)
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowCSVModal(true)}>
                <FileText size={18} /> CSV Bulk Upload
              </button>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setAddStaffModal(true)}>
                <UserPlus size={18} /> Add Staff
              </button>
            </div>

            {activeTab === 'portfolio' && (
              <>
                <ListFilterControl
                  searchValue={rosterSearch} onSearchChange={setRosterSearch} searchPlaceholder="Search staff by name or role..."
                  filters={[
                    { key: 'category', label: 'Category', options: [{ label: 'All Categories', value: '' }, { label: 'Doctor', value: 'Doctor' }, { label: 'Nurse', value: 'Nurse' }, { label: 'Pharmacist', value: 'Pharmacist' }, { label: 'Administration', value: 'Administration' }, { label: 'Technical', value: 'Technical' }] },
                    { key: 'specialization', label: 'Specialization', options: uniqueSpecializations },
                    { key: 'shift', label: 'Shift', options: [{ label: 'All Shifts', value: '' }, { label: 'Day', value: 'Day' }, { label: 'Night', value: 'Night' }] },
                    { key: 'status', label: 'Status', options: [{ label: 'All Status', value: '' }, { label: 'On Duty', value: 'On Duty' }, { label: 'Off Duty', value: 'Off Duty' }] },
                  ]}
                  filterValues={rosterFilters} onFilterChange={(k, v) => setRosterFilters((prev) => ({ ...prev, [k]: v }))}
                  sortValue={rosterSort} sortOptions={[{ label: 'Name A→Z', value: 'name_asc' }, { label: 'Name Z→A', value: 'name_desc' }]}
                  onSortChange={setRosterSort} totalCount={staff.length} filteredCount={filteredRoster.length}
                />
                <div className="staff-groups" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginTop: '1.5rem' }}>
                  {Object.entries(groupedRoster).map(([category, members]) => (
                    members.length > 0 && (
                      <div key={category} className="staff-group-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f1f5f9' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {category === 'Doctor' ? <Stethoscope size={20} /> : category === 'Nurse' ? <Activity size={20} /> : <Users size={20} />}
                          </div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{category}s <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500', marginLeft: '0.5rem' }}>({members.length})</span></h3>
                        </div>
                        <div className="asset-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                          {members.map((s) => (
                            <div key={s.id} className="stat-card" style={{ padding: '0', border: '1px solid var(--border-color)', height: 'auto', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                              <div 
                                onClick={() => setProfileModal(s)}
                                style={{ width: '100%', height: '200px', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              >
                                {s.photoUrl ? (
                                  <img src={s.photoUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <Avatar name={s.name} size={120} />
                                )}
                              </div>
                              <div style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#6366f1', fontWeight: '700' }}>{fmtStaffId(s.id)}</div>
                                    <h3 onClick={() => setProfileModal(s)} style={{ fontSize: '1.1rem', marginTop: '0.2rem', fontWeight: '800', cursor: 'pointer' }}>{s.name}</h3>
                                  </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                  <span className={`status-badge ${s.status === 'On Duty' ? 'status-active' : 'status-pending'}`} style={{ height: 'fit-content' }}>{s.status}</span>
                                  <div style={{ background: 'white', padding: '0.25rem', borderRadius: '0.4rem', border: '1px solid #e2e8f0' }}>
                                    <QRCodeSVG value={`EMR://staff/${s.id}`} size={44} level="M" />
                                  </div>
                                </div>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '700' }}>
                                    <Stethoscope size={14} /> {s.role}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Award size={14} /> {s.specialization}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={14} /> {s.shift} Shift
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => setProfileModal(s)}>Profile</button>
                                  <button className="btn-primary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => setLogsModal(s)}>Duty Logs</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                  {filteredRoster.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No staff match your search criteria.</div>}
                </div>
              </>
            )}

            {activeTab === 'leave' && (
              <>
                <ListFilterControl
                  searchValue={leaveSearch} onSearchChange={setLeaveSearch} searchPlaceholder="Search staff name..."
                  filters={[
                    { key: 'type', label: 'Type', options: [{ label: 'All Types', value: '' }, { label: 'Annual Leave', value: 'Annual Leave' }, { label: 'Sick Leave', value: 'Sick Leave' }] },
                    { key: 'status', label: 'Status', options: [{ label: 'All', value: '' }, { label: 'Pending', value: 'Pending' }, { label: 'Approved', value: 'Approved' }, { label: 'Rejected', value: 'Rejected' }] },
                  ]}
                  filterValues={leaveFilters} onFilterChange={(k, v) => setLeaveFilters((prev) => ({ ...prev, [k]: v }))}
                  sortValue={leaveSort} sortOptions={[{ label: 'Name A→Z', value: 'name_asc' }, { label: 'Name Z→A', value: 'name_desc' }]}
                  onSortChange={setLeaveSort} totalCount={leaveRequests.length} filteredCount={filteredLeave.length}
                />
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>Type</th><th>Duration</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {filteredLeave.map((l) => (
                        <tr key={l.id}>
                          <td><strong>{l.name}</strong></td>
                          <td>{l.type}</td>
                          <td>{l.duration}</td>
                          <td>
                            <span className={`status-badge ${l.status === 'Approved' ? 'status-active' : l.status === 'Rejected' ? '' : 'status-pending'}`}
                              style={l.status === 'Rejected' ? { background: '#fee2e2', color: '#991b1b' } : {}}>
                              {l.status}
                            </span>
                          </td>
                          <td>
                            {l.status === 'Pending' && (
                              <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setReviewModal(l)}>Review</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredLeave.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No leave requests match your search criteria.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'performance' && (
              <>
                <ListFilterControl
                  searchValue={perfSearch} onSearchChange={setPerfSearch} searchPlaceholder="Search by name or title..."
                  filters={[{ key: 'type', label: 'Category', options: [{ label: 'All', value: '' }, { label: 'Award', value: 'Award' }, { label: 'Disciplinary', value: 'Disciplinary' }] }]}
                  filterValues={perfFilters} onFilterChange={(k, v) => setPerfFilters((prev) => ({ ...prev, [k]: v }))}
                  sortValue={perfSort} sortOptions={[{ label: 'Newest First', value: 'date_desc' }, { label: 'Oldest First', value: 'date_asc' }]}
                  onSortChange={setPerfSort} totalCount={initialPerf.length} filteredCount={filteredPerf.length}
                />
                <div className="performance-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                  {filteredPerf.map((r) => (
                    <div key={r.id} className="stat-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', height: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '50%', background: r.type === 'Award' ? '#fef3c7' : '#fee2e2', color: r.type === 'Award' ? '#b45309' : '#b91c1c' }}>
                          {r.type === 'Award' ? <Award size={24} /> : <ShieldAlert size={24} />}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.1rem' }}>{r.title}</h4>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{r.name}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <Clock size={16} />{r.date}
                        </div>
                        <button style={{ color: 'var(--secondary-color)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setPerfDetailModal(r)}>View Detail</button>
                      </div>
                    </div>
                  ))}
                  {filteredPerf.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No performance records match your search criteria.</div>}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StaffManagement;
