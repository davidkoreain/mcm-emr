import React, { useState, useMemo } from 'react';
import { Monitor, Wrench, Trash2, Plus, AlertTriangle, MapPin, Scale, FileText, Truck, X, Wifi, Tag } from 'lucide-react';
import CSVImportModal from './CSVImportModal';
import ListFilterControl from './ListFilterControl';
import { useEMR, type Asset } from '../context/EMRContext';

type MaintenanceLog = { id: number; asset: string; task: string; technician: string; date: string; status: string };
type LossRecord = { id: number; asset: string; type: string; reason: string; date: string; action: string };

const initialMaint: MaintenanceLog[] = [
  { id: 1, asset: 'Ventilator - PB 980', task: 'Annual Calibration', technician: 'Engr. Dawit Bekele', date: '2026-04-10', status: 'Completed' },
  { id: 2, asset: 'GE MRI System', task: 'Cooling System Check', technician: 'GE Field Tech', date: '2026-05-01', status: 'In Progress' },
  { id: 3, asset: 'Patient Monitor B40 (Unit 3)', task: 'Screen Replacement', technician: 'Engr. Yonas Girma', date: '2026-05-11', status: 'In Progress' },
  { id: 4, asset: 'Infusion Pump Set', task: 'Pressure Valve Service', technician: 'Engr. Dawit Bekele', date: '2026-03-25', status: 'Completed' },
];

const lossRecords: LossRecord[] = [
  { id: 1, asset: 'Infusion Pump', type: 'Damage', reason: 'Dropped during transfer', date: '2026-03-22', action: 'Written off, replacement ordered' },
  { id: 2, asset: 'Stethoscope', type: 'Loss', reason: 'Unaccounted after ward round', date: '2026-04-18', action: 'Police report filed' },
  { id: 3, asset: 'Pulse Oximeter', type: 'Damage', reason: 'Liquid spill', date: '2026-05-02', action: 'Sent for repair' },
];

const emptyAsset = { name: '', serial: '', qty: '1', weight: '', supplier: '', status: 'Functional', location: '', rfidTag: '', barcode: '' };

const AssetManagement: React.FC = () => {
  const { assets, addAsset, updateAsset } = useEMR();
  const [activeTab, setActiveTab] = useState<'inventory' | 'maintenance' | 'loss'>('inventory');
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [maintLogs, setMaintLogs] = useState<MaintenanceLog[]>(initialMaint);
  const [detailModal, setDetailModal] = useState<Asset | null>(null);
  const [maintainModal, setMaintainModal] = useState<Asset | null>(null);
  const [maintainForm, setMaintainForm] = useState({ task: '', technician: '' });
  const [updateModal, setUpdateModal] = useState<MaintenanceLog | null>(null);
  const [addAssetModal, setAddAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState(emptyAsset);

  const [invSearch, setInvSearch] = useState('');
  const [invFilters, setInvFilters] = useState<Record<string, string>>({ status: '', location: '' });
  const [invSort, setInvSort] = useState('name_asc');
  const [maintSearch, setMaintSearch] = useState('');
  const [maintFilters, setMaintFilters] = useState<Record<string, string>>({ status: '' });
  const [maintSort, setMaintSort] = useState('date_desc');
  const [lossSearch, setLossSearch] = useState('');
  const [lossFilters, setLossFilters] = useState<Record<string, string>>({ type: '' });
  const [lossSort, setLossSort] = useState('date_desc');

  const uniqueLocations = [...new Set(assets.map((a) => a.location))];

  const filteredAssets = useMemo(() => {
    let result = assets.filter((a) => {
      const q = invSearch.toLowerCase();
      if (q && !a.name.toLowerCase().includes(q) && !a.serial.toLowerCase().includes(q) && !a.supplier.toLowerCase().includes(q)) return false;
      if (invFilters.status && a.status !== invFilters.status) return false;
      if (invFilters.location && a.location !== invFilters.location) return false;
      return true;
    });
    return [...result].sort((a, b) => invSort === 'name_desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
  }, [assets, invSearch, invFilters, invSort]);

  const filteredMaint = useMemo(() => {
    let result = maintLogs.filter((m) => {
      const q = maintSearch.toLowerCase();
      if (q && !m.asset.toLowerCase().includes(q) && !m.technician.toLowerCase().includes(q)) return false;
      if (maintFilters.status && m.status !== maintFilters.status) return false;
      return true;
    });
    return [...result].sort((a, b) => maintSort === 'date_asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  }, [maintLogs, maintSearch, maintFilters, maintSort]);

  const filteredLoss = useMemo(() => {
    let result = lossRecords.filter((r) => {
      const q = lossSearch.toLowerCase();
      if (q && !r.asset.toLowerCase().includes(q)) return false;
      if (lossFilters.type && r.type !== lossFilters.type) return false;
      return true;
    });
    return [...result].sort((a, b) => lossSort === 'date_asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  }, [lossSearch, lossFilters, lossSort]);

  const handleMaintain = () => {
    if (!maintainModal || !maintainForm.task.trim()) return;
    const newLog: MaintenanceLog = {
      id: Date.now(),
      asset: maintainModal.name,
      task: maintainForm.task,
      technician: maintainForm.technician || 'Unassigned',
      date: new Date().toISOString().split('T')[0],
      status: 'In Progress',
    };
    setMaintLogs((prev) => [newLog, ...prev]);
    updateAsset(maintainModal.id, { status: 'Maintenance Required' });
    setMaintainModal(null);
    setMaintainForm({ task: '', technician: '' });
    setActiveTab('maintenance');
  };

  const handleUpdateMaint = (newStatus: string) => {
    if (!updateModal) return;
    setMaintLogs((prev) => prev.map((m) => m.id === updateModal.id ? { ...m, status: newStatus } : m));
    if (newStatus === 'Completed') {
      const matchingAsset = assets.find((a) => updateModal.asset.includes(a.name.split(' ').slice(0, 2).join(' ')));
      if (matchingAsset) updateAsset(matchingAsset.id, { status: 'Functional' });
    }
    setUpdateModal(null);
  };

  const handleAddAsset = () => {
    if (!newAsset.name.trim()) return;
    const nextId = `AST-${String(assets.length + 100).padStart(3, '0')}`;
    const entry: Asset = {
      id: nextId, name: newAsset.name.trim(), serial: newAsset.serial.trim(),
      qty: parseInt(newAsset.qty) || 1, weight: newAsset.weight.trim() || 'N/A',
      supplier: newAsset.supplier.trim(), status: newAsset.status,
      location: newAsset.location.trim(), addedAt: new Date().toISOString().split('T')[0],
      ...(newAsset.rfidTag.trim() && { rfidTag: newAsset.rfidTag.trim() }),
      ...(newAsset.barcode.trim() && { barcode: newAsset.barcode.trim() }),
    };
    addAsset(entry);
    setAddAssetModal(false);
    setNewAsset(emptyAsset);
  };

  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const boxStyle: React.CSSProperties = { background: 'white', borderRadius: '1rem', padding: '2rem', width: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };

  return (
    <div className="asset-container">
      {/* Asset Detail Modal */}
      {detailModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Asset Details</h3>
              <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Asset ID', value: detailModal.id },
                { label: 'Name', value: detailModal.name },
                { label: 'Serial No.', value: detailModal.serial },
                { label: 'Quantity', value: String(detailModal.qty) },
                { label: 'Weight', value: detailModal.weight },
                { label: 'Supplier', value: detailModal.supplier },
                { label: 'Location', value: detailModal.location },
                { label: 'Status', value: detailModal.status },
                { label: 'Added', value: detailModal.addedAt },
                ...(detailModal.rfidTag ? [{ label: 'RFID Tag', value: detailModal.rfidTag }] : []),
                ...(detailModal.barcode ? [{ label: 'Barcode', value: detailModal.barcode }] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{label}</span>
                  <span style={{ fontWeight: '700', color: label === 'Status' && value === 'Maintenance Required' ? '#f59e0b' : 'inherit' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Maintain Modal */}
      {maintainModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Log Maintenance – {maintainModal.name}</h3>
              <button onClick={() => setMaintainModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Maintenance Task *</label>
                <input type="text" value={maintainForm.task} placeholder="e.g. Annual Calibration" onChange={(e) => setMaintainForm((p) => ({ ...p, task: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Assigned Technician</label>
                <input type="text" value={maintainForm.technician} placeholder="e.g. Engr. Dawit Bekele" onChange={(e) => setMaintainForm((p) => ({ ...p, technician: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setMaintainModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleMaintain} disabled={!maintainForm.task.trim()}>Log Maintenance</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Maintenance Modal */}
      {updateModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Update Maintenance Record</h3>
              <button onClick={() => setUpdateModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[{ label: 'Asset', value: updateModal.asset }, { label: 'Task', value: updateModal.task }, { label: 'Technician', value: updateModal.technician }, { label: 'Date', value: updateModal.date }, { label: 'Current Status', value: updateModal.status }].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{label}</span>
                  <span style={{ fontWeight: '700' }}>{value}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>Update status to:</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setUpdateModal(null)}>Cancel</button>
              {updateModal.status !== 'In Progress' && (
                <button style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleUpdateMaint('In Progress')}>In Progress</button>
              )}
              {updateModal.status !== 'Completed' && (
                <button className="btn-primary" onClick={() => handleUpdateMaint('Completed')}>Mark Completed</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {addAssetModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Add New Asset</h3>
              <button onClick={() => setAddAssetModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Asset Name *', key: 'name', placeholder: 'e.g. Patient Monitor B40' },
                { label: 'Serial Number', key: 'serial', placeholder: 'e.g. M-1122-B' },
                { label: 'Quantity', key: 'qty', placeholder: '1', type: 'number' },
                { label: 'Weight', key: 'weight', placeholder: 'e.g. 4.5kg' },
                { label: 'Supplier', key: 'supplier', placeholder: 'e.g. Philips Medical' },
                { label: 'Location / Department', key: 'location', placeholder: 'e.g. General Ward B' },
                { label: 'RFID Tag (optional)', key: 'rfidTag', placeholder: 'e.g. RF-A099-XXX' },
                { label: 'Barcode (optional)', key: 'barcode', placeholder: 'e.g. 8934567890099' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>{label}</label>
                  <input type={type || 'text'} value={(newAsset as any)[key]} placeholder={placeholder}
                    onChange={(e) => setNewAsset((p) => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Initial Status</label>
                <select value={newAsset.status} onChange={(e) => setNewAsset((p) => ({ ...p, status: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
                  <option>Functional</option><option>Maintenance Required</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => { setAddAssetModal(false); setNewAsset(emptyAsset); }}>Cancel</button>
              <button className="btn-primary" onClick={handleAddAsset} disabled={!newAsset.name.trim()}>Add Asset</button>
            </div>
          </div>
        </div>
      )}

      {showCSVModal && <CSVImportModal title="Asset Management" onClose={() => setShowCSVModal(false)} onImport={(data) => console.log('Imported Assets:', data)} />}

      <div className="pharmacy-tabs">
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}><Monitor size={20} /> Asset Inventory</button>
        <button className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}><Wrench size={20} /> Maintenance Log</button>
        <button className={`tab-btn ${activeTab === 'loss' ? 'active' : ''}`} onClick={() => setActiveTab('loss')}><Trash2 size={20} /> Loss & Damage</button>
      </div>

      <div className="asset-content" style={{ marginTop: '1.5rem' }}>
        {activeTab === 'inventory' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <ListFilterControl
                  searchValue={invSearch} onSearchChange={setInvSearch} searchPlaceholder="Search by name, serial or supplier..."
                  filters={[
                    { key: 'status', label: 'Status', options: [{ label: 'All Status', value: '' }, { label: 'Functional', value: 'Functional' }, { label: 'Maintenance Required', value: 'Maintenance Required' }] },
                    { key: 'location', label: 'Location', options: [{ label: 'All Locations', value: '' }, ...uniqueLocations.map((l) => ({ label: l, value: l }))] },
                  ]}
                  filterValues={invFilters} onFilterChange={(k, v) => setInvFilters((prev) => ({ ...prev, [k]: v }))}
                  sortValue={invSort} sortOptions={[{ label: 'Name A→Z', value: 'name_asc' }, { label: 'Name Z→A', value: 'name_desc' }]}
                  onSortChange={setInvSort} totalCount={assets.length} filteredCount={filteredAssets.length}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.15rem' }}>
                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowCSVModal(true)}><FileText size={18} /> CSV Import</button>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setAddAssetModal(true)}><Plus size={18} /> Add Asset</button>
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
                      <span className={`status-badge ${asset.status === 'Functional' ? 'status-active' : 'status-pending'}`} style={{ height: 'fit-content' }}>{asset.status}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}><MapPin size={14} color="var(--text-secondary)" /><span>{asset.location}</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}><Scale size={14} color="var(--text-secondary)" /><span>{asset.weight}</span></div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '0.4rem', marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <Truck size={12} /> Supplier: {asset.supplier}
                      </div>
                    </div>
                    {(asset.rfidTag || asset.barcode) && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        {asset.rfidTag && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: '600', color: '#6366f1', background: '#eef2ff', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', border: '1px solid #c7d2fe' }}>
                            <Wifi size={10} /> {asset.rfidTag}
                          </span>
                        )}
                        {asset.barcode && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: '600', color: '#374151', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', border: '1px solid #e2e8f0' }}>
                            <Tag size={10} /> {asset.barcode}
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }} onClick={() => setDetailModal(asset)}>Details</button>
                      <button className="btn-primary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }} onClick={() => { setMaintainForm({ task: '', technician: '' }); setMaintainModal(asset); }}>
                        {asset.status === 'Maintenance Required' ? <AlertTriangle size={13} /> : null} Maintain
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAssets.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No assets match your search criteria.</div>}
            </div>
          </>
        )}

        {activeTab === 'maintenance' && (
          <>
            <ListFilterControl
              searchValue={maintSearch} onSearchChange={setMaintSearch} searchPlaceholder="Search by asset or technician..."
              filters={[{ key: 'status', label: 'Status', options: [{ label: 'All', value: '' }, { label: 'In Progress', value: 'In Progress' }, { label: 'Completed', value: 'Completed' }] }]}
              filterValues={maintFilters} onFilterChange={(k, v) => setMaintFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={maintSort} sortOptions={[{ label: 'Newest First', value: 'date_desc' }, { label: 'Oldest First', value: 'date_asc' }]}
              onSortChange={setMaintSort} totalCount={maintLogs.length} filteredCount={filteredMaint.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Asset</th><th>Task</th><th>Technician</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredMaint.map((log) => (
                    <tr key={log.id}>
                      <td><strong>{log.asset}</strong></td>
                      <td>{log.task}</td>
                      <td>{log.technician}</td>
                      <td>{log.date}</td>
                      <td><span className={`status-badge ${log.status === 'Completed' ? 'status-active' : 'status-pending'}`}>{log.status}</span></td>
                      <td><button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setUpdateModal(log)}>Update</button></td>
                    </tr>
                  ))}
                  {filteredMaint.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No maintenance records match your search criteria.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'loss' && (
          <>
            <ListFilterControl
              searchValue={lossSearch} onSearchChange={setLossSearch} searchPlaceholder="Search asset name..."
              filters={[{ key: 'type', label: 'Type', options: [{ label: 'All', value: '' }, { label: 'Damage', value: 'Damage' }, { label: 'Loss', value: 'Loss' }] }]}
              filterValues={lossFilters} onFilterChange={(k, v) => setLossFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={lossSort} sortOptions={[{ label: 'Newest First', value: 'date_desc' }, { label: 'Oldest First', value: 'date_asc' }]}
              onSortChange={setLossSort} totalCount={lossRecords.length} filteredCount={filteredLoss.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Asset</th><th>Type</th><th>Reason</th><th>Date</th><th>Action Taken</th></tr></thead>
                <tbody>
                  {filteredLoss.map((rec) => (
                    <tr key={rec.id}>
                      <td><strong>{rec.asset}</strong></td>
                      <td><span style={{ color: rec.type === 'Damage' ? '#f59e0b' : '#ef4444', fontWeight: '700' }}>{rec.type}</span></td>
                      <td>{rec.reason}</td>
                      <td>{rec.date}</td>
                      <td>{rec.action}</td>
                    </tr>
                  ))}
                  {filteredLoss.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No records match your search criteria.</td></tr>}
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
