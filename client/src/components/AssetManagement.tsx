import React, { useState, useMemo } from 'react';
import { toast } from '../utils/toast';
import {
  Monitor,
  Wrench,
  Trash2,
  Truck,
  Plus,
  AlertTriangle,
  MapPin,
  Scale,
  FileText,
} from 'lucide-react';
import CSVImportModal from './CSVImportModal';
import ListFilterControl from './ListFilterControl';

const AssetManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'maintenance' | 'loss'>('inventory');
  const [showCSVModal, setShowCSVModal] = useState(false);

  const [invSearch, setInvSearch] = useState('');
  const [invFilters, setInvFilters] = useState<Record<string, string>>({ status: '', location: '' });
  const [invSort, setInvSort] = useState('name_asc');

  const [maintSearch, setMaintSearch] = useState('');
  const [maintFilters, setMaintFilters] = useState<Record<string, string>>({ status: '' });
  const [maintSort, setMaintSort] = useState('date_desc');

  const [lossSearch, setLossSearch] = useState('');
  const [lossFilters, setLossFilters] = useState<Record<string, string>>({ type: '' });
  const [lossSort, setLossSort] = useState('date_desc');

  const assets = [
    {
      id: 'AST-001', name: 'GE Healthcare MRI System', serial: 'GE99283-X',
      qty: 1, weight: '1200kg', supplier: 'GE Healthcare Ethiopia',
      status: 'Functional', location: 'Radiology Dept', addedAt: '2025-01-10',
    },
    {
      id: 'AST-002', name: 'Ventilator - Puritan Bennett 980', serial: 'PB-2026-044',
      qty: 5, weight: '45kg', supplier: 'Medtronic Africa',
      status: 'Maintenance Required', location: 'ICU', addedAt: '2025-03-15',
    },
    {
      id: 'AST-003', name: 'Patient Monitor B40', serial: 'M-1122-A',
      qty: 12, weight: '4.5kg', supplier: 'Philips Medical',
      status: 'Functional', location: 'General Ward A', addedAt: '2024-11-20',
    },
    {
      id: 'AST-004', name: 'ECG Machine 12-Lead', serial: 'ECG-3301',
      qty: 3, weight: '8kg', supplier: 'GE Healthcare Ethiopia',
      status: 'Functional', location: 'Cardiology Dept', addedAt: '2025-06-05',
    },
    {
      id: 'AST-005', name: 'Infusion Pump Set', serial: 'INF-7890',
      qty: 20, weight: '1.2kg', supplier: 'B. Braun Ethiopia',
      status: 'Maintenance Required', location: 'ICU', addedAt: '2025-08-10',
    },
  ];

  const maintenanceLogs = [
    { id: 1, asset: 'Ventilator - PB 980', task: 'Annual Calibration', technician: 'Engr. Dawit Bekele', date: '2026-04-10', status: 'Completed' },
    { id: 2, asset: 'GE MRI System', task: 'Cooling System Check', technician: 'GE Field Tech', date: '2026-05-01', status: 'In Progress' },
    { id: 3, asset: 'Patient Monitor B40 (Unit 3)', task: 'Screen Replacement', technician: 'Engr. Yonas Girma', date: '2026-05-11', status: 'In Progress' },
    { id: 4, asset: 'Infusion Pump Set', task: 'Pressure Valve Service', technician: 'Engr. Dawit Bekele', date: '2026-03-25', status: 'Completed' },
  ];

  const lossDamageRecords = [
    { id: 1, asset: 'Infusion Pump', type: 'Damage', reason: 'Dropped during transfer', date: '2026-03-22', action: 'Written off, replacement ordered' },
    { id: 2, asset: 'Stethoscope', type: 'Loss', reason: 'Unaccounted after ward round', date: '2026-04-18', action: 'Police report filed' },
    { id: 3, asset: 'Pulse Oximeter', type: 'Damage', reason: 'Liquid spill', date: '2026-05-02', action: 'Sent for repair' },
  ];

  const filteredAssets = useMemo(() => {
    let result = assets.filter((a) => {
      const q = invSearch.toLowerCase();
      if (q && !a.name.toLowerCase().includes(q) && !a.serial.toLowerCase().includes(q) && !a.supplier.toLowerCase().includes(q)) return false;
      if (invFilters.status && a.status !== invFilters.status) return false;
      if (invFilters.location && a.location !== invFilters.location) return false;
      return true;
    });
    return [...result].sort((a, b) =>
      invSort === 'name_desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
    );
  }, [invSearch, invFilters, invSort]);

  const filteredMaint = useMemo(() => {
    let result = maintenanceLogs.filter((m) => {
      const q = maintSearch.toLowerCase();
      if (q && !m.asset.toLowerCase().includes(q) && !m.technician.toLowerCase().includes(q)) return false;
      if (maintFilters.status && m.status !== maintFilters.status) return false;
      return true;
    });
    return [...result].sort((a, b) =>
      maintSort === 'date_asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    );
  }, [maintSearch, maintFilters, maintSort]);

  const filteredLoss = useMemo(() => {
    let result = lossDamageRecords.filter((r) => {
      const q = lossSearch.toLowerCase();
      if (q && !r.asset.toLowerCase().includes(q)) return false;
      if (lossFilters.type && r.type !== lossFilters.type) return false;
      return true;
    });
    return [...result].sort((a, b) =>
      lossSort === 'date_asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    );
  }, [lossSearch, lossFilters, lossSort]);

  const uniqueLocations = [...new Set(assets.map((a) => a.location))];

  return (
    <div className="asset-container">
      <div className="pharmacy-tabs">
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          <Monitor size={20} /> Asset Inventory
        </button>
        <button className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>
          <Wrench size={20} /> Maintenance Log
        </button>
        <button className={`tab-btn ${activeTab === 'loss' ? 'active' : ''}`} onClick={() => setActiveTab('loss')}>
          <Trash2 size={20} /> Loss & Damage
        </button>
      </div>

      <div className="asset-content" style={{ marginTop: '1.5rem' }}>
        {showCSVModal && (
          <CSVImportModal
            title="Asset Management"
            onClose={() => setShowCSVModal(false)}
            onImport={(data) => console.log('Imported Assets:', data)}
          />
        )}

        {activeTab === 'inventory' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <ListFilterControl
                  searchValue={invSearch}
                  onSearchChange={setInvSearch}
                  searchPlaceholder="Search by name, serial or supplier..."
                  filters={[
                    {
                      key: 'status', label: 'Status',
                      options: [
                        { label: 'All Status', value: '' },
                        { label: 'Functional', value: 'Functional' },
                        { label: 'Maintenance Required', value: 'Maintenance Required' },
                      ],
                    },
                    {
                      key: 'location', label: 'Location',
                      options: [
                        { label: 'All Locations', value: '' },
                        ...uniqueLocations.map((l) => ({ label: l, value: l })),
                      ],
                    },
                  ]}
                  filterValues={invFilters}
                  onFilterChange={(k, v) => setInvFilters((prev) => ({ ...prev, [k]: v }))}
                  sortValue={invSort}
                  sortOptions={[
                    { label: 'Name A→Z', value: 'name_asc' },
                    { label: 'Name Z→A', value: 'name_desc' },
                  ]}
                  onSortChange={setInvSort}
                  totalCount={assets.length}
                  filteredCount={filteredAssets.length}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.15rem' }}>
                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowCSVModal(true)}>
                  <FileText size={18} /> CSV Import
                </button>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => toast('New asset registration form opening...', 'info')}>
                  <Plus size={18} /> Add Asset
                </button>
              </div>
            </div>

            <div className="asset-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="stat-card" style={{ padding: '0', border: '1px solid var(--border-color)', height: 'auto', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '100%', height: '160px', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Monitor size={64} color="#cbd5e1" />
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{asset.id} | S/N: {asset.serial}</div>
                        <h3 style={{ fontSize: '1rem', marginTop: '0.2rem', fontWeight: '700' }}>{asset.name}</h3>
                      </div>
                      <span className={`status-badge ${asset.status === 'Functional' ? 'status-active' : 'status-pending'}`} style={{ height: 'fit-content' }}>
                        {asset.status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                        <MapPin size={14} color="var(--text-secondary)" /><span>{asset.location}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                        <Scale size={14} color="var(--text-secondary)" /><span>{asset.weight}</span>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '0.4rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <Truck size={12} /> Supplier: {asset.supplier}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }} onClick={() => toast(`Viewing details for ${asset.name}`, 'info')}>Details</button>
                      <button className="btn-primary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }} onClick={() => toast(`Maintenance request logged for ${asset.name}`, 'success')}>
                        {asset.status === 'Maintenance Required' ? <AlertTriangle size={13} /> : null} Maintain
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAssets.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No assets match your search criteria.
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'maintenance' && (
          <>
            <ListFilterControl
              searchValue={maintSearch}
              onSearchChange={setMaintSearch}
              searchPlaceholder="Search by asset or technician..."
              filters={[
                {
                  key: 'status', label: 'Status',
                  options: [
                    { label: 'All', value: '' },
                    { label: 'In Progress', value: 'In Progress' },
                    { label: 'Completed', value: 'Completed' },
                  ],
                },
              ]}
              filterValues={maintFilters}
              onFilterChange={(k, v) => setMaintFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={maintSort}
              sortOptions={[
                { label: 'Newest First', value: 'date_desc' },
                { label: 'Oldest First', value: 'date_asc' },
              ]}
              onSortChange={setMaintSort}
              totalCount={maintenanceLogs.length}
              filteredCount={filteredMaint.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th><th>Task</th><th>Technician</th><th>Date</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaint.map((log) => (
                    <tr key={log.id}>
                      <td><strong>{log.asset}</strong></td>
                      <td>{log.task}</td>
                      <td>{log.technician}</td>
                      <td>{log.date}</td>
                      <td>
                        <span className={`status-badge ${log.status === 'Completed' ? 'status-active' : 'status-pending'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td><button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => toast(`Updating maintenance record for ${log.asset}`, 'info')}>Update</button></td>
                    </tr>
                  ))}
                  {filteredMaint.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No maintenance records match your search criteria.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'loss' && (
          <>
            <ListFilterControl
              searchValue={lossSearch}
              onSearchChange={setLossSearch}
              searchPlaceholder="Search asset name..."
              filters={[
                {
                  key: 'type', label: 'Type',
                  options: [
                    { label: 'All', value: '' },
                    { label: 'Damage', value: 'Damage' },
                    { label: 'Loss', value: 'Loss' },
                  ],
                },
              ]}
              filterValues={lossFilters}
              onFilterChange={(k, v) => setLossFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={lossSort}
              sortOptions={[
                { label: 'Newest First', value: 'date_desc' },
                { label: 'Oldest First', value: 'date_asc' },
              ]}
              onSortChange={setLossSort}
              totalCount={lossDamageRecords.length}
              filteredCount={filteredLoss.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th><th>Type</th><th>Reason</th><th>Date</th><th>Action Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoss.map((rec) => (
                    <tr key={rec.id}>
                      <td><strong>{rec.asset}</strong></td>
                      <td>
                        <span style={{ color: rec.type === 'Damage' ? '#f59e0b' : '#ef4444', fontWeight: '700' }}>
                          {rec.type}
                        </span>
                      </td>
                      <td>{rec.reason}</td>
                      <td>{rec.date}</td>
                      <td>{rec.action}</td>
                    </tr>
                  ))}
                  {filteredLoss.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No records match your search criteria.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssetManagement;
