import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Activity,
  Package,
  Settings,
  Bell,
  Search,
  PlusCircle,
  Beaker,
  CreditCard,
  Home,
  ShieldCheck,
  Scissors,
  FileText,
  Calendar as CalendarIcon,
} from 'lucide-react';
import PatientRegistration from './components/PatientRegistration';
import VitalsEntry from './components/VitalsEntry';
import ClinicalEncounter from './components/ClinicalEncounter';
import PharmacyManagement from './components/PharmacyManagement';
import LabManagement from './components/LabManagement';
import BillingManagement from './components/BillingManagement';
import InpatientManagement from './components/InpatientManagement';
import StaffManagement from './components/StaffManagement';
import AssetManagement from './components/AssetManagement';
import AIComplianceManager from './components/AIComplianceManager';
import OperationManagement from './components/OperationManagement';
import HospitalCalendar from './components/HospitalCalendar';
import CSVImportModal from './components/CSVImportModal';
import ListFilterControl from './components/ListFilterControl';
import { toast } from './utils/toast';

type UserRole = 'Admin' | 'Doctor' | 'Nurse' | 'Pharmacist' | 'LabTech' | 'Cashier';

const allPatients = [
  { mrn: 'MRN-2026-001', name: 'Abebe Bikila', amharic: 'አበበ ቢቂላ', visitType: 'OPD', status: 'In Progress', time: '10:30 AM', registeredAt: '2026-05-12' },
  { mrn: 'MRN-2026-002', name: 'Mulu Worku', amharic: 'ሙሉ ወርቁ', visitType: 'Emergency', status: 'Waiting', time: '11:15 AM', registeredAt: '2026-05-12' },
  { mrn: 'MRN-2026-003', name: 'Kassa Tessema', amharic: 'ካሳ ተሰማ', visitType: 'Follow-up', status: 'Consulting', time: '11:45 AM', registeredAt: '2026-05-11' },
  { mrn: 'MRN-2026-004', name: 'Selam Adane', amharic: 'ሰላም አዳነ', visitType: 'OPD', status: 'Completed', time: '09:00 AM', registeredAt: '2026-05-10' },
  { mrn: 'MRN-2026-005', name: 'Tigist Hailu', amharic: 'ትግስት ኃይሉ', visitType: 'Inpatient', status: 'In Progress', time: '08:00 AM', registeredAt: '2026-05-09' },
  { mrn: 'MRN-2026-006', name: 'Biruk Alemu', amharic: 'ብሩክ አለሙ', visitType: 'Emergency', status: 'Completed', time: '07:30 AM', registeredAt: '2026-05-08' },
  { mrn: 'MRN-2026-007', name: 'Dawit Mesfin', amharic: 'ዳዊት መስፍን', visitType: 'Follow-up', status: 'Waiting', time: '12:00 PM', registeredAt: '2026-05-07' },
  { mrn: 'MRN-2026-008', name: 'Hana Bekele', amharic: 'ሃና በቀለ', visitType: 'OPD', status: 'Consulting', time: '12:30 PM', registeredAt: '2026-05-06' },
];

function App() {
  const [role, setRole] = useState<UserRole>('Admin');
  const [view, setView] = useState<'dashboard' | 'registration' | 'patientList' | 'vitals' | 'encounter' | 'inventory' | 'lab' | 'billing' | 'inpatient' | 'staff' | 'assets' | 'compliance' | 'surgery' | 'calendar'>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<{ name: string; amharic: string } | null>(null);
  const [showCSVModal, setShowCSVModal] = useState(false);

  const [ptSearch, setPtSearch] = useState('');
  const [ptFilters, setPtFilters] = useState<Record<string, string>>({ visitType: '', status: '' });
  const [ptSort, setPtSort] = useState('name_asc');

  const filteredPatients = useMemo(() => {
    let result = allPatients.filter((p) => {
      const q = ptSearch.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.amharic.includes(q) && !p.mrn.toLowerCase().includes(q)) return false;
      if (ptFilters.visitType && p.visitType !== ptFilters.visitType) return false;
      if (ptFilters.status && p.status !== ptFilters.status) return false;
      return true;
    });
    return [...result].sort((a, b) => {
      if (ptSort === 'name_desc') return b.name.localeCompare(a.name);
      if (ptSort === 'date_desc') return b.registeredAt.localeCompare(a.registeredAt);
      if (ptSort === 'date_asc') return a.registeredAt.localeCompare(b.registeredAt);
      return a.name.localeCompare(b.name);
    });
  }, [ptSearch, ptFilters, ptSort]);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header" style={{ padding: '1.5rem', background: 'white', margin: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/mcm_logo.png" alt="MCM Hospital Logo" style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
        <nav>
          <ul className="nav-list">
            <li className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
              <LayoutDashboard size={20} /><span>Dashboard</span>
            </li>

            {(role === 'Admin' || role === 'Doctor') && (
              <li className={`nav-item ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>
                <CalendarIcon size={20} /><span>Hospital Calendar</span>
              </li>
            )}

            {(role === 'Admin' || role === 'Doctor' || role === 'Nurse') && (
              <li className={`nav-item ${view === 'patientList' || view === 'registration' ? 'active' : ''}`} onClick={() => setView('patientList')}>
                <Users size={20} /><span>Patients</span>
              </li>
            )}

            {(role === 'Admin' || role === 'Doctor' || role === 'Nurse') && (
              <li className={`nav-item ${view === 'inpatient' ? 'active' : ''}`} onClick={() => setView('inpatient')}>
                <Home size={20} /><span>Inpatient (Ward)</span>
              </li>
            )}

            {(role === 'Admin' || role === 'Doctor') && (
              <li className={`nav-item ${view === 'surgery' ? 'active' : ''}`} onClick={() => setView('surgery')}>
                <Scissors size={20} /><span>Surgery (OT)</span>
              </li>
            )}

            {(role === 'Admin' || role === 'Doctor') && (
              <li className="nav-item" onClick={() => toast('Encounters module coming soon', 'info')}>
                <Activity size={20} /><span>Encounters</span>
              </li>
            )}

            {(role === 'Admin' || role === 'LabTech') && (
              <li className={`nav-item ${view === 'lab' ? 'active' : ''}`} onClick={() => setView('lab')}>
                <Beaker size={20} /><span>Laboratory</span>
              </li>
            )}

            {(role === 'Admin' || role === 'Pharmacist') && (
              <li className={`nav-item ${view === 'inventory' ? 'active' : ''}`} onClick={() => setView('inventory')}>
                <Package size={20} /><span>Pharmacy</span>
              </li>
            )}

            {(role === 'Admin' || role === 'Cashier') && (
              <li className={`nav-item ${view === 'billing' ? 'active' : ''}`} onClick={() => setView('billing')}>
                <CreditCard size={20} /><span>Billing</span>
              </li>
            )}

            {(role === 'Admin' || role === 'Doctor') && (
              <li className={`nav-item ${view === 'staff' ? 'active' : ''}`} onClick={() => setView('staff')}>
                <Users size={20} /><span>HR & Staff</span>
              </li>
            )}

            {role === 'Admin' && (
              <li className={`nav-item ${view === 'compliance' ? 'active' : ''}`} onClick={() => setView('compliance')}>
                <ShieldCheck size={20} /><span>AI Compliance</span>
              </li>
            )}

            {role === 'Admin' && (
              <li className={`nav-item ${view === 'assets' ? 'active' : ''}`} onClick={() => setView('assets')}>
                <Settings size={20} /><span>Asset Management</span>
              </li>
            )}

            <li className="nav-item" onClick={() => toast('Settings panel coming soon', 'info')}>
              <Settings size={20} /><span>Settings</span>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="search-bar">
            <Search size={20} color="var(--text-secondary)" />
            <input type="text" placeholder="Search patient..." />
          </div>
          <div className="header-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Role:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                style={{ padding: '0.3rem', borderRadius: '0.4rem', border: '1px solid #ddd' }}
              >
                <option value="Admin">Admin</option>
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="LabTech">LabTech</option>
                <option value="Cashier">Cashier</option>
              </select>
            </div>
            <button onClick={() => setView('registration')}>
              <PlusCircle size={20} />
              New Patient
            </button>
            <button
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => setShowCSVModal(true)}
            >
              <FileText size={20} />
              CSV Import
            </button>
            <Bell size={24} color="#64748b" style={{ cursor: 'pointer' }} />
          </div>
        </header>

        {showCSVModal && (
          <CSVImportModal
            title="Patient Records"
            onClose={() => setShowCSVModal(false)}
            onImport={(data) => console.log('Imported:', data)}
          />
        )}

        {view === 'dashboard' ? (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Patients</div>
                <div className="stat-value">1,284</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Active Encounters</div>
                <div className="stat-value">42</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Pharmacy Requests</div>
                <div className="stat-value">15</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Low Stock Alerts</div>
                <div className="stat-value" style={{ color: '#ef4444' }}>8</div>
              </div>
            </section>

            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Recent Patient Visits</h2>
                <button
                  onClick={() => setView('patientList')}
                  style={{ color: 'var(--secondary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                >
                  View All
                </button>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th><th>Amharic Name</th><th>Visit Type</th><th>Status</th><th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPatients.slice(0, 3).map((p) => (
                      <tr key={p.mrn}>
                        <td>{p.name}</td>
                        <td>{p.amharic}</td>
                        <td>{p.visitType}</td>
                        <td>
                          <span className={`status-badge ${p.status === 'Completed' ? 'status-active' : p.status === 'Waiting' ? 'status-pending' : 'status-active'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>{p.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : view === 'registration' ? (
          <PatientRegistration onClose={() => setView('dashboard')} />
        ) : view === 'vitals' ? (
          <VitalsEntry
            patientName={selectedPatient?.name || ''}
            onClose={() => setView('dashboard')}
          />
        ) : view === 'encounter' ? (
          <ClinicalEncounter
            patientName={selectedPatient?.name || ''}
            onClose={() => setView('dashboard')}
          />
        ) : view === 'inventory' ? (
          <PharmacyManagement />
        ) : view === 'lab' ? (
          <LabManagement />
        ) : view === 'billing' ? (
          <BillingManagement />
        ) : view === 'inpatient' ? (
          <InpatientManagement />
        ) : view === 'staff' ? (
          <StaffManagement />
        ) : view === 'assets' ? (
          <AssetManagement />
        ) : view === 'compliance' ? (
          <AIComplianceManager />
        ) : view === 'surgery' ? (
          <OperationManagement />
        ) : view === 'calendar' ? (
          <HospitalCalendar />
        ) : (
          /* Patient List */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Patient List</h2>
              <button className="btn-primary" onClick={() => setView('registration')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={18} /> New Patient
              </button>
            </div>

            <ListFilterControl
              searchValue={ptSearch}
              onSearchChange={setPtSearch}
              searchPlaceholder="Search by name, Amharic name, or MRN..."
              filters={[
                {
                  key: 'visitType', label: 'Visit Type',
                  options: [
                    { label: 'All Types', value: '' },
                    { label: 'OPD', value: 'OPD' },
                    { label: 'Emergency', value: 'Emergency' },
                    { label: 'Follow-up', value: 'Follow-up' },
                    { label: 'Inpatient', value: 'Inpatient' },
                  ],
                },
                {
                  key: 'status', label: 'Status',
                  options: [
                    { label: 'All', value: '' },
                    { label: 'Waiting', value: 'Waiting' },
                    { label: 'In Progress', value: 'In Progress' },
                    { label: 'Consulting', value: 'Consulting' },
                    { label: 'Completed', value: 'Completed' },
                  ],
                },
              ]}
              filterValues={ptFilters}
              onFilterChange={(k, v) => setPtFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={ptSort}
              sortOptions={[
                { label: 'Name A→Z', value: 'name_asc' },
                { label: 'Name Z→A', value: 'name_desc' },
                { label: 'Registered Newest', value: 'date_desc' },
                { label: 'Registered Oldest', value: 'date_asc' },
              ]}
              onSortChange={setPtSort}
              totalCount={allPatients.length}
              filteredCount={filteredPatients.length}
            />

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>MRN</th>
                    <th>Patient Name</th>
                    <th>Amharic Name</th>
                    <th>Visit Type</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p) => (
                    <tr key={p.mrn}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.mrn}</td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.amharic}</td>
                      <td>{p.visitType}</td>
                      <td>
                        <span className={`status-badge ${p.status === 'Completed' ? 'status-active' : p.status === 'Waiting' ? 'status-pending' : 'status-active'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{p.registeredAt}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => { setSelectedPatient({ name: p.name, amharic: p.amharic }); setView('vitals'); }}
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--accent-color)' }}
                          >
                            Vitals
                          </button>
                          <button
                            onClick={() => { setSelectedPatient({ name: p.name, amharic: p.amharic }); setView('encounter'); }}
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            Consult
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No patients match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
