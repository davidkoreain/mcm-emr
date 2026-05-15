import React, { useState, useMemo } from 'react';
import { Package, ClipboardList, AlertTriangle, FileText, Plus, X, CheckCircle2 } from 'lucide-react';
import CSVImportModal from './CSVImportModal';
import ListFilterControl from './ListFilterControl';
import { useEMR, type Drug, type Prescription } from '../context/EMRContext';
// import { toast } from 'react-hot-toast';
const toast = { success: (m: string) => alert(m), error: (m: string) => alert(m) };

const emptyDrug = { name: '', form: 'Tablet', strength: '', stock: '', price: '' };

const PharmacyManagement: React.FC = () => {
  const { drugs, prescriptions, dispenseMedication, loading } = useEMR();
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>('prescriptions');
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [modal, setModal] = useState<{ type: 'addDrug' | 'updateStock'; data?: Drug } | null>(null);
  const [newDrug, setNewDrug] = useState(emptyDrug);
  const [stockValue, setStockValue] = useState('');

  const [invSearch, setInvSearch] = useState('');
  const [invFilters, setInvFilters] = useState<Record<string, string>>({ form: '', stock: '' });
  const [invSort, setInvSort] = useState('name_asc');
  const [rxSearch, setRxSearch] = useState('');
  const [rxFilters, setRxFilters] = useState<Record<string, string>>({ status: '' });
  const [rxSort, setRxSort] = useState('time_desc');

  const filteredDrugs = useMemo(() => {
    let result = drugs.filter((d) => {
      const q = invSearch.toLowerCase();
      if (q && !d.name.toLowerCase().includes(q) && !d.form.toLowerCase().includes(q)) return false;
      if (invFilters.form && d.form !== invFilters.form) return false;
      if (invFilters.stock === 'low' && d.stock >= 20) return false;
      if (invFilters.stock === 'ok' && d.stock < 20) return false;
      return true;
    });
    return [...result].sort((a, b) => {
      if (invSort === 'name_asc') return a.name.localeCompare(b.name);
      if (invSort === 'name_desc') return b.name.localeCompare(a.name);
      if (invSort === 'stock_asc') return a.stock - b.stock;
      if (invSort === 'stock_desc') return b.stock - a.stock;
      return 0;
    });
  }, [drugs, invSearch, invFilters, invSort]);

  const filteredRx = useMemo(() => {
    let result = prescriptions.filter((p) => {
      const q = rxSearch.toLowerCase();
      if (q && !p.patientName.toLowerCase().includes(q) && !p.drug.toLowerCase().includes(q)) return false;
      if (rxFilters.status && p.status !== rxFilters.status) return false;
      return true;
    });
    return rxSort === 'time_asc' ? [...result].reverse() : result;
  }, [prescriptions, rxSearch, rxFilters, rxSort]);

  const handleDispenseAction = async (rx: Prescription) => {
    const drug = drugs.find(d => d.name.toLowerCase() === rx.drug.toLowerCase());
    if (!drug) {
      toast.error('Drug not found in inventory.');
      return;
    }
    if (drug.stock <= 0) {
      toast.error('Out of stock!');
      return;
    }
    try {
      await dispenseMedication(rx.id, drug.id, 1);
      toast.success('Medication dispensed successfully.');
    } catch (err: any) {
      toast.error('Failed to dispense: ' + err.message);
    }
  };

  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const boxStyle: React.CSSProperties = { background: 'white', borderRadius: '1rem', padding: '2rem', width: '420px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading pharmacy data...</div>;

  return (
    <div className="pharmacy-container">
      {showCSVModal && <CSVImportModal title="Drugs Inventory" onClose={() => setShowCSVModal(false)} onImport={() => {}} />}
      
      {modal && (
        <div style={overlayStyle}>
          <div style={{ ...boxStyle, width: modal.type === 'updateStock' ? '420px' : '500px' }}>
            <h3 style={{ marginBottom: '1rem' }}>
              {modal.type === 'addDrug' ? 'Add New Drug' : modal.type === 'editDrug' ? 'Edit Drug Details' : 'Update Stock'}
            </h3>
            
            {(modal.type === 'addDrug' || modal.type === 'editDrug') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Drug Name</label>
                  <input type="text" value={newDrug.name} onChange={e => setNewDrug({...newDrug, name: e.target.value})} placeholder="e.g. Paracetamol" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Form</label>
                    <select value={newDrug.form} onChange={e => setNewDrug({...newDrug, form: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                      <option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Injection</option><option>Ointment</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Strength</label>
                    <input type="text" value={newDrug.strength} onChange={e => setNewDrug({...newDrug, strength: e.target.value})} placeholder="e.g. 500mg" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Initial Stock</label>
                    <input type="number" value={newDrug.stock} onChange={e => setNewDrug({...newDrug, stock: e.target.value})} placeholder="0" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Price</label>
                    <input type="text" value={newDrug.price} onChange={e => setNewDrug({...newDrug, price: e.target.value})} placeholder="e.g. 15.00 ETB" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                  </div>
                </div>
              </div>
            )}

            {modal.type === 'updateStock' && (
              <>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>Updating stock for: <strong>{modal.data?.name}</strong></p>
                <input type="number" value={stockValue} onChange={e => setStockValue(e.target.value)} placeholder="New stock quantity" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginBottom: '1.5rem' }} />
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => { setModal(null); setNewDrug(emptyDrug); }}>Cancel</button>
              <button className="btn-primary" onClick={async () => {
                if (modal.type === 'addDrug') {
                  await addDrug({ ...newDrug, stock: parseInt(newDrug.stock) || 0 });
                } else if (modal.type === 'editDrug' && modal.data) {
                  await updateDrug(modal.data.id, { ...newDrug, stock: parseInt(newDrug.stock) || 0 });
                } else if (modal.type === 'updateStock' && modal.data) {
                  await updateDrug(modal.data.id, { stock: parseInt(stockValue) || 0 });
                }
                setModal(null);
                setNewDrug(emptyDrug);
              }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div className="pharmacy-tabs">
        <button className={`tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>
          <FileText size={20} /> Pending Prescriptions {prescriptions.filter(p => p.status === 'Pending').length > 0 && <span className="tab-badge">{prescriptions.filter(p => p.status === 'Pending').length}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          <Package size={20} /> Drug Inventory
        </button>
      </div>

      <div className="pharmacy-content">
        {activeTab === 'prescriptions' ? (
          <>
            <ListFilterControl
              searchValue={rxSearch} onSearchChange={setRxSearch} searchPlaceholder="Search by patient or drug..."
              filters={[{ key: 'status', label: 'Status', options: [{ label: 'All', value: '' }, { label: 'Pending', value: 'Pending' }, { label: 'Dispensed', value: 'Dispensed' }] }]}
              filterValues={rxFilters} onFilterChange={(k, v) => setRxFilters(prev => ({ ...prev, [k]: v }))}
              sortValue={rxSort} sortOptions={[{ label: 'Newest First', value: 'time_desc' }, { label: 'Oldest First', value: 'time_asc' }]}
              onSortChange={setRxSort} totalCount={prescriptions.length} filteredCount={filteredRx.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Medication</th><th>Dosage</th><th>Duration</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredRx.map(rx => (
                    <tr key={rx.id}>
                      <td><strong>{rx.patientName}</strong><div style={{ fontSize: '0.75rem', color: '#64748b' }}>{rx.patientMrn}</div></td>
                      <td>{rx.drug}</td>
                      <td>{rx.dosage}</td>
                      <td>{rx.duration}</td>
                      <td><span className={`status-badge ${rx.status === 'Dispensed' ? 'status-active' : 'status-pending'}`}>{rx.status}</span></td>
                      <td>
                        {rx.status === 'Pending' && (
                          <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleDispenseAction(rx)}>Dispense</button>
                        )}
                        {rx.status === 'Dispensed' && <CheckCircle2 size={18} color="#16a34a" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" onClick={() => setModal({ type: 'addDrug' })}><Plus size={18} /> Add Drug</button>
                <button className="btn-secondary" onClick={() => setShowCSVModal(true)}><ClipboardList size={18} /> Import CSV</button>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: '600' }}>
                  <AlertTriangle size={18} /> {drugs.filter(d => d.stock < 20).length} Low Stock
                </div>
              </div>
            </div>
            <ListFilterControl
              searchValue={invSearch} onSearchChange={setInvSearch} searchPlaceholder="Search drugs..."
              filters={[
                { key: 'form', label: 'Form', options: [{ label: 'All', value: '' }, { label: 'Tablet', value: 'Tablet' }, { label: 'Capsule', value: 'Capsule' }, { label: 'Syrup', value: 'Syrup' }] },
                { key: 'stock', label: 'Stock', options: [{ label: 'All', value: '' }, { label: 'Low Stock (<20)', value: 'low' }, { label: 'In Stock', value: 'ok' }] }
              ]}
              filterValues={invFilters} onFilterChange={(k, v) => setInvFilters(prev => ({ ...prev, [k]: v }))}
              sortValue={invSort} sortOptions={[{ label: 'Name A-Z', value: 'name_asc' }, { label: 'Stock Low-High', value: 'stock_asc' }]}
              onSortChange={setInvSort} totalCount={drugs.length} filteredCount={filteredDrugs.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Drug Name</th><th>Form</th><th>Strength</th><th>Stock</th><th>Price</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredDrugs.map(d => (
                    <tr key={d.id}>
                      <td><strong>{d.name}</strong></td>
                      <td>{d.form}</td>
                      <td>{d.strength}</td>
                      <td>
                        <span style={{ color: d.stock < 20 ? '#ef4444' : 'inherit', fontWeight: '700' }}>{d.stock}</span>
                      </td>
                      <td>{d.price}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => { setModal({ type: 'updateStock', data: d }); setStockValue(d.stock.toString()); }}>Update</button>
                          {role === 'Admin' && (
                            <button 
                              style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                              onClick={() => {
                                setModal({ type: 'editDrug', data: d });
                                setNewDrug({
                                  name: d.name,
                                  form: d.form,
                                  strength: d.strength,
                                  stock: d.stock.toString(),
                                  price: d.price
                                });
                              }}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PharmacyManagement;
