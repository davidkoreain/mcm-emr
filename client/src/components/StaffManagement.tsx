import React, { useState, useMemo } from 'react';
import { toast } from '../utils/toast';
import {
  Calendar,
  Coffee,
  Award,
  ShieldAlert,
  FileText,
  CheckCircle,
  Clock,
  UserPlus,
  BookOpen,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import CSVImportModal from './CSVImportModal';
import ListFilterControl from './ListFilterControl';

const StaffManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roster' | 'leave' | 'performance' | 'portfolio'>('roster');
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [showCSVModal, setShowCSVModal] = useState(false);

  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterFilters, setRosterFilters] = useState<Record<string, string>>({ shift: '', status: '' });
  const [rosterSort, setRosterSort] = useState('name_asc');

  const [leaveSearch, setLeaveSearch] = useState('');
  const [leaveFilters, setLeaveFilters] = useState<Record<string, string>>({ type: '', status: '' });
  const [leaveSort, setLeaveSort] = useState('name_asc');

  const [perfSearch, setPerfSearch] = useState('');
  const [perfFilters, setPerfFilters] = useState<Record<string, string>>({ type: '' });
  const [perfSort, setPerfSort] = useState('date_desc');

  const staffList = [
    {
      id: 1, name: 'Dr. Solomon Tsegaye', role: 'Chief MD / Surgeon', shift: 'Day', status: 'On Duty',
      education: 'MD from Addis Ababa University, Specialization in General Surgery',
      license: 'ETH-MD-9982 (Valid until 2028)', experience: '15 years (MCM Hospital, Black Lion Hospital)',
      surgeries: ['Appendectomy (240)', 'Hernia Repair (180)', 'Hip Replacement (45)'],
      training: ['Advanced Trauma Life Support (ATLS)', 'Robotic Surgery Fundamentals'],
      awards: ['Physician of the Year 2026', 'Outstanding Surgeon 2024'],
    },
    {
      id: 2, name: 'Nurse Martha Kassa', role: 'Head Nurse', shift: 'Night', status: 'Off Duty',
      education: 'BSc in Nursing from Jimma University',
      license: 'ETH-RN-4451 (Valid until 2027)', experience: "10 years (MCM Hospital, St. Paul's Hospital)",
      surgeries: ['Surgical Assisting (500+)', 'ICU Care Management'],
      training: ['Critical Care Nursing Certification', 'Hygiene Control Protocol'],
      awards: ['Excellence in Nursing 2025'],
    },
    {
      id: 3, name: 'Dr. Fitsum Ayele', role: 'Internal Medicine', shift: 'Day', status: 'On Duty',
      education: 'MD, MSc Internal Medicine, AAU',
      license: 'ETH-MD-7721 (Valid until 2027)', experience: '8 years (MCM Hospital)',
      surgeries: ['Bronchoscopy (30)', 'Endoscopy (60)'],
      training: ['ACLS Certification', 'Diabetes Management CME'],
      awards: [],
    },
    {
      id: 4, name: 'Nurse Tigist Hailu', role: 'Staff Nurse', shift: 'Night', status: 'On Duty',
      education: 'Diploma in Nursing, Mekelle University',
      license: 'ETH-RN-5520 (Valid until 2026)', experience: '5 years (MCM Hospital)',
      surgeries: ['Surgical Assisting (120+)'],
      training: ['Basic Life Support', 'Wound Care'],
      awards: [],
    },
  ];

  const leaveRequests = [
    { id: 1, name: 'Nurse Tigist Hailu', type: 'Annual Leave', duration: '5 days', status: 'Pending', date: '2026-05-10' },
    { id: 2, name: 'Dr. Fitsum Ayele', type: 'Sick Leave', duration: '2 days', status: 'Approved', date: '2026-05-08' },
    { id: 3, name: 'Nurse Martha Kassa', type: 'Annual Leave', duration: '7 days', status: 'Pending', date: '2026-05-05' },
  ];

  const performanceRecords = [
    { id: 1, name: 'Dr. Solomon Tsegaye', type: 'Award', title: 'Physician of the Year', date: '2026-01-15' },
    { id: 2, name: 'Nurse Martha Kassa', type: 'Award', title: 'Excellence in Nursing', date: '2026-03-10' },
    { id: 3, name: 'Staff X', type: 'Disciplinary', title: 'Tardiness Warning', date: '2026-04-05' },
    { id: 4, name: 'Dr. Fitsum Ayele', type: 'Award', title: 'Patient Satisfaction Award', date: '2026-02-20' },
  ];

  const filteredRoster = useMemo(() => {
    let result = staffList.filter((s) => {
      const q = rosterSearch.toLowerCase();
      if (q && !s.name.toLowerCase().includes(q) && !s.role.toLowerCase().includes(q)) return false;
      if (rosterFilters.shift && s.shift !== rosterFilters.shift) return false;
      if (rosterFilters.status && s.status !== rosterFilters.status) return false;
      return true;
    });
    return [...result].sort((a, b) =>
      rosterSort === 'name_desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
    );
  }, [rosterSearch, rosterFilters, rosterSort]);

  const filteredLeave = useMemo(() => {
    let result = leaveRequests.filter((l) => {
      const q = leaveSearch.toLowerCase();
      if (q && !l.name.toLowerCase().includes(q)) return false;
      if (leaveFilters.type && l.type !== leaveFilters.type) return false;
      if (leaveFilters.status && l.status !== leaveFilters.status) return false;
      return true;
    });
    return [...result].sort((a, b) =>
      leaveSort === 'name_desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
    );
  }, [leaveSearch, leaveFilters, leaveSort]);

  const filteredPerf = useMemo(() => {
    let result = performanceRecords.filter((r) => {
      const q = perfSearch.toLowerCase();
      if (q && !r.name.toLowerCase().includes(q) && !r.title.toLowerCase().includes(q)) return false;
      if (perfFilters.type && r.type !== perfFilters.type) return false;
      return true;
    });
    return [...result].sort((a, b) =>
      perfSort === 'date_asc'
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date)
    );
  }, [perfSearch, perfFilters, perfSort]);

  const renderProfile = (staff: (typeof staffList)[0]) => (
    <div className="staff-profile" style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '700' }}>
            {staff.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{staff.name}</h2>
            <p style={{ color: 'var(--primary-color)', fontWeight: '600' }}>{staff.role} | ID: STF-00{staff.id}</p>
          </div>
        </div>
        <button onClick={() => setSelectedStaff(null)} className="btn-secondary">Back to List</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="profile-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>
            <GraduationCap size={20} color="var(--primary-color)" /> Academic & Professional
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>EDUCATION</label>
              <p style={{ fontSize: '0.95rem' }}>{staff.education}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>MEDICAL LICENSE</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#10b981" />
                <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>{staff.license}</p>
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>WORK EXPERIENCE</label>
              <p style={{ fontSize: '0.95rem' }}>{staff.experience}</p>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>
            <Stethoscope size={20} color="var(--primary-color)" /> Clinical & Training Portfolio
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>SURGERY LOG</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {staff.surgeries.map((s, idx) => (
                  <span key={idx} style={{ padding: '0.25rem 0.75rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>{s}</span>
                ))}
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>EDUCATIONAL HISTORY / CME</label>
              <ul style={{ listStyle: 'none', padding: '0', fontSize: '0.9rem', margin: '0' }}>
                {staff.training.map((t, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <CheckCircle size={14} color="var(--primary-color)" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: '#fdf2f2', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #fee2e2' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#b91c1c', display: 'block', marginBottom: '0.25rem' }}>HR STATUS</label>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Current Duty: <strong>{staff.status}</strong></span>
                <span>Leaves Left: <strong>12 Days</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const activeStaff = staffList.find((s) => s.id === selectedStaff);

  return (
    <div className="staff-container">
      <div className="pharmacy-tabs">
        <button className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`} onClick={() => { setActiveTab('roster'); setSelectedStaff(null); }}>
          <Calendar size={20} /> Duty Roster
        </button>
        <button className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')}>
          <BookOpen size={20} /> Credentials & Portfolio
        </button>
        <button className={`tab-btn ${activeTab === 'leave' ? 'active' : ''}`} onClick={() => { setActiveTab('leave'); setSelectedStaff(null); }}>
          <Coffee size={20} /> Leave Mgmt
        </button>
        <button className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => { setActiveTab('performance'); setSelectedStaff(null); }}>
          <Award size={20} /> Performance
        </button>
      </div>

      <div className="staff-content" style={{ marginTop: '1.5rem' }}>
        {showCSVModal && (
          <CSVImportModal
            title="Medical Staff & HR"
            onClose={() => setShowCSVModal(false)}
            onImport={(data) => console.log('Imported Staff:', data)}
          />
        )}

        {activeTab === 'portfolio' && selectedStaff && activeStaff ? (
          renderProfile(activeStaff)
        ) : (
          <>
            {/* Header: CSV + Add button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowCSVModal(true)}>
                <FileText size={18} /> CSV Bulk Upload
              </button>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => toast('New staff registration form opening...', 'info')}>
                <UserPlus size={18} /> Add Staff
              </button>
            </div>

            {(activeTab === 'roster' || activeTab === 'portfolio') && (
              <>
                <ListFilterControl
                  searchValue={rosterSearch}
                  onSearchChange={setRosterSearch}
                  searchPlaceholder="Search staff by name or role..."
                  filters={[
                    {
                      key: 'shift', label: 'Shift',
                      options: [
                        { label: 'All Shifts', value: '' },
                        { label: 'Day', value: 'Day' },
                        { label: 'Night', value: 'Night' },
                      ],
                    },
                    {
                      key: 'status', label: 'Status',
                      options: [
                        { label: 'All', value: '' },
                        { label: 'On Duty', value: 'On Duty' },
                        { label: 'Off Duty', value: 'Off Duty' },
                      ],
                    },
                  ]}
                  filterValues={rosterFilters}
                  onFilterChange={(k, v) => setRosterFilters((prev) => ({ ...prev, [k]: v }))}
                  sortValue={rosterSort}
                  sortOptions={[
                    { label: 'Name A→Z', value: 'name_asc' },
                    { label: 'Name Z→A', value: 'name_desc' },
                  ]}
                  onSortChange={setRosterSort}
                  totalCount={staffList.length}
                  filteredCount={filteredRoster.length}
                />
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Staff Name</th>
                        <th>Role</th>
                        {activeTab === 'roster' ? (
                          <><th>Current Shift</th><th>Status</th><th>Duty Log</th></>
                        ) : (
                          <><th>License</th><th>Experience</th><th>Full Portfolio</th></>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoster.map((s) => (
                        <tr key={s.id}>
                          <td><strong>{s.name}</strong></td>
                          <td>{s.role}</td>
                          {activeTab === 'roster' ? (
                            <>
                              <td>{s.shift}</td>
                              <td><span className={`status-badge ${s.status === 'On Duty' ? 'status-active' : 'status-pending'}`}>{s.status}</span></td>
                              <td><button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => toast(`Duty logs for ${s.name} loading...`, 'info')}>View Logs</button></td>
                            </>
                          ) : (
                            <>
                              <td>{s.license}</td>
                              <td>{s.experience}</td>
                              <td>
                                <button
                                  className="btn-primary"
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  onClick={() => setSelectedStaff(s.id)}
                                >
                                  View Profile <ChevronRight size={14} />
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {filteredRoster.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            No staff match your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'leave' && (
              <>
                <ListFilterControl
                  searchValue={leaveSearch}
                  onSearchChange={setLeaveSearch}
                  searchPlaceholder="Search staff name..."
                  filters={[
                    {
                      key: 'type', label: 'Type',
                      options: [
                        { label: 'All Types', value: '' },
                        { label: 'Annual Leave', value: 'Annual Leave' },
                        { label: 'Sick Leave', value: 'Sick Leave' },
                      ],
                    },
                    {
                      key: 'status', label: 'Status',
                      options: [
                        { label: 'All', value: '' },
                        { label: 'Pending', value: 'Pending' },
                        { label: 'Approved', value: 'Approved' },
                      ],
                    },
                  ]}
                  filterValues={leaveFilters}
                  onFilterChange={(k, v) => setLeaveFilters((prev) => ({ ...prev, [k]: v }))}
                  sortValue={leaveSort}
                  sortOptions={[
                    { label: 'Name A→Z', value: 'name_asc' },
                    { label: 'Name Z→A', value: 'name_desc' },
                  ]}
                  onSortChange={setLeaveSort}
                  totalCount={leaveRequests.length}
                  filteredCount={filteredLeave.length}
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
                          <td><span className={`status-badge ${l.status === 'Approved' ? 'status-active' : 'status-pending'}`}>{l.status}</span></td>
                          <td><button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => toast(`Reviewing leave request for ${l.name}`, 'info')}>Review</button></td>
                        </tr>
                      ))}
                      {filteredLeave.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            No leave requests match your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'performance' && (
              <>
                <ListFilterControl
                  searchValue={perfSearch}
                  onSearchChange={setPerfSearch}
                  searchPlaceholder="Search by name or title..."
                  filters={[
                    {
                      key: 'type', label: 'Category',
                      options: [
                        { label: 'All', value: '' },
                        { label: 'Award', value: 'Award' },
                        { label: 'Disciplinary', value: 'Disciplinary' },
                      ],
                    },
                  ]}
                  filterValues={perfFilters}
                  onFilterChange={(k, v) => setPerfFilters((prev) => ({ ...prev, [k]: v }))}
                  sortValue={perfSort}
                  sortOptions={[
                    { label: 'Newest First', value: 'date_desc' },
                    { label: 'Oldest First', value: 'date_asc' },
                  ]}
                  onSortChange={setPerfSort}
                  totalCount={performanceRecords.length}
                  filteredCount={filteredPerf.length}
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
                        <button style={{ color: 'var(--secondary-color)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => toast(`Viewing details for ${r.title}`, 'info')}>View Detail</button>
                      </div>
                    </div>
                  ))}
                  {filteredPerf.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No performance records match your search criteria.
                    </div>
                  )}
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
