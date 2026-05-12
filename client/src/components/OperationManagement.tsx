import React, { useState } from 'react';
import { Calendar, Users, Wrench, Pill, Clock, Activity, Plus, Search, Filter, X } from 'lucide-react';
import { useEMR } from '../context/EMRContext';

type OTSchedule = { id: number; room: string; patient: string; surgery: string; time: string; surgeon: string; status: string };
type SupplyItem = { item: string; qty: number; unit: string; source: string };
type OTStaff = { name: string; role: string; dept: string };
type OTEquipment = { name: string; id: string; status: string };

const initialSchedules: OTSchedule[] = [
  { id: 1, room: 'OT 1 (Major)', patient: 'Abebe Bikila', surgery: 'Appendectomy', time: '08:00 - 10:00', surgeon: 'Dr. Solomon', status: 'Ongoing' },
  { id: 2, room: 'OT 2 (Ortho)', patient: 'Mulu Worku', surgery: 'Hip Replacement', time: '10:30 - 13:00', surgeon: 'Dr. Abraham', status: 'Scheduled' },
  { id: 3, room: 'OT 3 (Minor)', patient: 'Selam Adane', surgery: 'Cyst Removal', time: '09:00 - 10:00', surgeon: 'Dr. Fitsum', status: 'Completed' },
];

const initialSupply: SupplyItem[] = [
  { item: 'Propofol 20ml', qty: 2, unit: 'Vial', source: 'Pharmacy DB' },
  { item: 'Surgical Gloves (Size 7.5)', qty: 10, unit: 'Pair', source: 'Inventory DB' },
  { item: 'Vicryl 3-0 Suture', qty: 4, unit: 'Pack', source: 'Inventory DB' },
];

const initialOTStaff: OTStaff[] = [
  { name: 'Dr. Solomon Tsegaye', role: 'Main Surgeon', dept: 'Surgery' },
  { name: 'Dr. Fitsum Ayele', role: 'Anesthesiologist', dept: 'Anesthesia' },
  { name: 'Nurse Martha Kassa', role: 'Scrub Nurse', dept: 'Nursing' },
];

const initialOTEquipment: OTEquipment[] = [
  { name: 'Laparoscopic Tower', id: 'AST-045', status: 'In Use (OT 1)' },
  { name: 'C-Arm X-Ray', id: 'AST-088', status: 'Available' },
];

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const boxStyle: React.CSSProperties = { background: 'white', borderRadius: '1rem', padding: '2rem', width: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };

const OperationManagement: React.FC = () => {
  const { staffList, assets, setAssets } = useEMR();

  const [activeTab, setActiveTab] = useState<'schedule' | 'resources' | 'supplies'>('schedule');
  const [schedules, setSchedules] = useState<OTSchedule[]>(initialSchedules);
  const [supplyUsage, setSupplyUsage] = useState<SupplyItem[]>(initialSupply);
  const [otTeam, setOtTeam] = useState<OTStaff[]>(initialOTStaff);
  const [otEquipment, setOtEquipment] = useState<OTEquipment[]>(initialOTEquipment);

  const [manageModal, setManageModal] = useState<OTSchedule | null>(null);
  const [bookModal, setBookModal] = useState(false);
  const [addItemModal, setAddItemModal] = useState(false);
  const [finalizeConfirm, setFinalizeConfirm] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [assignStaffModal, setAssignStaffModal] = useState(false);
  const [requestEquipModal, setRequestEquipModal] = useState(false);

  const [newSurgery, setNewSurgery] = useState({ patient: '', surgery: '', room: 'OT 1 (Major)', surgeon: '', time: '' });
  const [newItem, setNewItem] = useState({ item: '', qty: '1', unit: '', source: 'Inventory DB' });

  const handleManageStatus = (status: string) => {
    if (!manageModal) return;
    setSchedules(prev => prev.map(s => s.id === manageModal.id ? { ...s, status } : s));
    setManageModal(null);
  };

  const handleBookSurgery = () => {
    if (!newSurgery.patient.trim() || !newSurgery.surgery.trim()) return;
    setSchedules(prev => [...prev, {
      id: Date.now(), room: newSurgery.room, patient: newSurgery.patient.trim(),
      surgery: newSurgery.surgery.trim(), time: newSurgery.time || 'TBD',
      surgeon: newSurgery.surgeon.trim() || 'Unassigned', status: 'Scheduled',
    }]);
    setBookModal(false);
    setNewSurgery({ patient: '', surgery: '', room: 'OT 1 (Major)', surgeon: '', time: '' });
  };

  const handleAddItem = () => {
    if (!newItem.item.trim()) return;
    setSupplyUsage(prev => [...prev, { item: newItem.item.trim(), qty: parseInt(newItem.qty) || 1, unit: newItem.unit.trim() || 'Unit', source: newItem.source }]);
    setAddItemModal(false);
    setNewItem({ item: '', qty: '1', unit: '', source: 'Inventory DB' });
  };

  const handleFinalize = () => {
    setFinalized(true);
    setFinalizeConfirm(false);
    setSupplyUsage([]);
  };

  const handleAssignStaff = (staffId: number) => {
    const member = staffList.find(s => s.id === staffId);
    if (!member || otTeam.some(t => t.name === member.name)) return;
    setOtTeam(prev => [...prev, { name: member.name, role: member.role, dept: member.role.includes('Nurse') ? 'Nursing' : 'Medical' }]);
  };

  const handleRequestEquipment = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset || otEquipment.some(e => e.id === assetId)) return;
    setOtEquipment(prev => [...prev, { name: asset.name, id: asset.id, status: 'Allocated' }]);
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'In Use (OT)' } : a));
  };

  const availableStaff = staffList.filter(s => !otTeam.some(t => t.name === s.name));
  const availableAssets = assets.filter(a => a.status === 'Functional' && !otEquipment.some(e => e.id === a.id));

  return (
    <div className="surgery-container">
      {/* Manage Surgery Modal */}
      {manageModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Manage Surgery</h3>
              <button onClick={() => setManageModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[{ label: 'Room', value: manageModal.room }, { label: 'Patient', value: manageModal.patient }, { label: 'Surgery', value: manageModal.surgery }, { label: 'Time', value: manageModal.time }, { label: 'Surgeon', value: manageModal.surgeon }, { label: 'Current Status', value: manageModal.status }].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{label}</span>
                  <span style={{ fontWeight: '700' }}>{value}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>Update status:</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {['Scheduled', 'Ongoing', 'Completed', 'Cancelled'].filter(s => s !== manageModal.status).map(s => (
                <button key={s} onClick={() => handleManageStatus(s)} style={{ flex: 1, minWidth: '120px', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: s === 'Completed' ? '#dcfce7' : s === 'Cancelled' ? '#fee2e2' : s === 'Ongoing' ? '#fef3c7' : '#f1f5f9', color: s === 'Completed' ? '#166534' : s === 'Cancelled' ? '#991b1b' : '#1e293b', fontWeight: '600', cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setManageModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Book Surgery Modal */}
      {bookModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Book Surgery</h3>
              <button onClick={() => setBookModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Patient Name *', key: 'patient', placeholder: 'Patient full name' },
                { label: 'Surgery Type *', key: 'surgery', placeholder: 'e.g. Appendectomy' },
                { label: 'Surgeon', key: 'surgeon', placeholder: 'e.g. Dr. Solomon' },
                { label: 'Time Slot', key: 'time', placeholder: 'e.g. 08:00 - 10:00' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>{label}</label>
                  <input type="text" value={(newSurgery as any)[key]} placeholder={placeholder}
                    onChange={e => setNewSurgery(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>OT Room</label>
                <select value={newSurgery.room} onChange={e => setNewSurgery(p => ({ ...p, room: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
                  <option>OT 1 (Major)</option><option>OT 2 (Ortho)</option><option>OT 3 (Minor)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setBookModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleBookSurgery} disabled={!newSurgery.patient.trim() || !newSurgery.surgery.trim()}>Confirm Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal — HR DB 연동 */}
      {assignStaffModal && (
        <div style={overlayStyle}>
          <div style={{ ...boxStyle, width: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3>Assign Staff — HR Module</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Sourced from HR &amp; Staff database</p>
              </div>
              <button onClick={() => setAssignStaffModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {availableStaff.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>All available staff are already assigned to this OT.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
                {availableStaff.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: '700' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.role} · {s.shift} Shift · <span style={{ color: s.status === 'On Duty' ? '#16a34a' : '#f59e0b', fontWeight: '600' }}>{s.status}</span></div>
                    </div>
                    <button className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                      onClick={() => handleAssignStaff(s.id)}>Assign</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setAssignStaffModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Request Equipment Modal — Asset DB 연동 */}
      {requestEquipModal && (
        <div style={overlayStyle}>
          <div style={{ ...boxStyle, width: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3>Request Equipment — Asset DB</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Showing Functional assets from Asset Management</p>
              </div>
              <button onClick={() => setRequestEquipModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {availableAssets.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No functional equipment available in the Asset DB.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
                {availableAssets.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #dcfce7' }}>
                    <div>
                      <div style={{ fontWeight: '700' }}>{a.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {a.id} · {a.location} · Serial: {a.serial}</div>
                    </div>
                    <button className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                      onClick={() => handleRequestEquipment(a.id)}>Allocate</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setRequestEquipModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supply Item Modal */}
      {addItemModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Add Supply Item</h3>
              <button onClick={() => setAddItemModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Item Name *', key: 'item', placeholder: 'e.g. Surgical Gloves', type: 'text' },
                { label: 'Quantity', key: 'qty', placeholder: '1', type: 'number' },
                { label: 'Unit', key: 'unit', placeholder: 'e.g. Pair, Vial, Pack', type: 'text' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>{label}</label>
                  <input type={type} value={(newItem as any)[key]} placeholder={placeholder}
                    onChange={e => setNewItem(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Source DB</label>
                <select value={newItem.source} onChange={e => setNewItem(p => ({ ...p, source: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
                  <option>Inventory DB</option><option>Pharmacy DB</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setAddItemModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddItem} disabled={!newItem.item.trim()}>Add Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Finalize Confirm */}
      {finalizeConfirm && (
        <div style={overlayStyle}>
          <div style={{ ...boxStyle, width: '400px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Confirm Finalization</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              This will deduct <strong>{supplyUsage.length} item(s)</strong> from Inventory &amp; Pharmacy DB and mark the supply log as finalized. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setFinalizeConfirm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleFinalize}>Confirm &amp; Deduct</button>
            </div>
          </div>
        </div>
      )}

      <div className="pharmacy-tabs">
        <button className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}><Calendar size={20} /> OT Schedule</button>
        <button className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}><Users size={20} /> Staff &amp; Equipment</button>
        <button className={`tab-btn ${activeTab === 'supplies' ? 'active' : ''}`} onClick={() => setActiveTab('supplies')}><Pill size={20} /> Supply Tracking</button>
      </div>

      <div className="surgery-content" style={{ marginTop: '1.5rem' }}>
        {activeTab === 'schedule' && (
          <div className="schedule-view">
            <div className="content-header" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="search-bar"><Search size={18} /><input type="text" placeholder="Search surgery or patient..." /></div>
                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Filter size={18} /> Filter Rooms</button>
              </div>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setBookModal(true)}>
                <Plus size={18} /> Book Surgery
              </button>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>OT Room</th><th>Time Slot</th><th>Patient</th><th>Surgery Type</th><th>Main Surgeon</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {schedules.map(sc => (
                    <tr key={sc.id}>
                      <td><strong>{sc.room}</strong></td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} /> {sc.time}</div></td>
                      <td>{sc.patient}</td>
                      <td>{sc.surgery}</td>
                      <td>{sc.surgeon}</td>
                      <td>
                        <span className="status-badge" style={{ background: sc.status === 'Ongoing' ? '#fef3c7' : sc.status === 'Completed' ? '#dcfce7' : sc.status === 'Cancelled' ? '#fee2e2' : '#f1f5f9', color: sc.status === 'Ongoing' ? '#92400e' : sc.status === 'Completed' ? '#166534' : sc.status === 'Cancelled' ? '#991b1b' : '#64748b' }}>{sc.status}</span>
                      </td>
                      <td><button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setManageModal(sc)}>Manage</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="resource-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="stat-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Users size={20} color="var(--secondary-color)" /> Surgical Team (Current OT 1)
              </h3>
              {otTeam.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eee' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{s.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.dept}</div>
                  </div>
                  <span className="status-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{s.role}</span>
                </div>
              ))}
              <button className="btn-secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setAssignStaffModal(true)}>
                Assign More Staff
              </button>
            </div>
            <div className="stat-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Wrench size={20} color="var(--secondary-color)" /> Allocated Equipment
              </h3>
              {otEquipment.map((e, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eee' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{e.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {e.id}</div>
                  </div>
                  <span className={`status-badge ${e.status.includes('Available') || e.status === 'Allocated' ? 'status-active' : 'status-pending'}`}>{e.status}</span>
                </div>
              ))}
              <button className="btn-secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setRequestEquipModal(true)}>
                Request Equipment (Asset DB)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'supplies' && (
          <div className="supply-section">
            <div className="stat-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} color="#ef4444" /> Supplies &amp; Medications Consumed
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '700' }}>{finalized ? '✓ Finalized – Inventory Updated' : 'Linked to Inventory DB'}</span>
              </div>
              {finalized ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#16a34a', fontWeight: '700' }}>
                  ✓ Supply usage has been finalized and inventory has been updated.
                </div>
              ) : (
                <>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead><tr><th>Item Name</th><th>Quantity</th><th>Unit</th><th>Database Link</th><th>Action</th></tr></thead>
                      <tbody>
                        {supplyUsage.map((u, idx) => (
                          <tr key={idx}>
                            <td><strong>{u.item}</strong></td>
                            <td>{u.qty}</td>
                            <td>{u.unit}</td>
                            <td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.source}</span></td>
                            <td>
                              <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => setSupplyUsage(prev => prev.filter((_, i) => i !== idx))}>Remove</button>
                            </td>
                          </tr>
                        ))}
                        {supplyUsage.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>No items added yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={() => setAddItemModal(true)}>Add Item</button>
                    <button className="btn-primary" onClick={() => setFinalizeConfirm(true)} disabled={supplyUsage.length === 0}>Finalize Usage &amp; Deduct Inventory</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationManagement;
