import React, { useState, useMemo } from 'react';
import { Package, ClipboardList, AlertTriangle, FileText, Plus, X } from 'lucide-react';
import CSVImportModal from './CSVImportModal';
import ListFilterControl from './ListFilterControl';

type Drug = { id: number; name: string; form: string; strength: string; stock: number; price: string; addedAt: string };
type Prescription = { id: number; patient: string; amharic: string; drug: string; dosage: string; duration: string; status: string; addedIdx: number };
type ModalType = 'addDrug' | 'updateStock';
type ModalState = { type: ModalType; data?: Drug } | null;

const initialDrugs: Drug[] = [
  { id: 1, name: 'Amoxicillin', form: 'Capsule', strength: '500mg', stock: 120, price: '15.00 ETB', addedAt: '2026-01-10' },
  { id: 2, name: 'Paracetamol', form: 'Tablet', strength: '500mg', stock: 15, price: '5.00 ETB', addedAt: '2026-02-05' },
  { id: 3, name: 'Metformin', form: 'Tablet', strength: '850mg', stock: 250, price: '20.00 ETB', addedAt: '2026-01-22' },
  { id: 4, name: 'Ceftriaxone', form: 'Injection', strength: '1g', stock: 45, price: '85.00 ETB', addedAt: '2026-03-18' },
  { id: 5, name: "Ringer's Lactate", form: 'IV Fluid', strength: '500ml', stock: 8, price: '45.00 ETB', addedAt: '2026-04-01' },
  { id: 6, name: 'Salbutamol', form: 'Syrup', strength: '2mg/5ml', stock: 60, price: '30.00 ETB', addedAt: '2026-02-14' },
  { id: 7, name: 'Omeprazole', form: 'Capsule', strength: '20mg', stock: 5, price: '18.00 ETB', addedAt: '2026-05-01' },
  { id: 8, name: 'Ciprofloxacin', form: 'Tablet', strength: '500mg', stock: 90, price: '25.00 ETB', addedAt: '2026-03-30' },
];

const initialPrescriptions: Prescription[] = [
  { id: 101, patient: 'Abebe Bikila', amharic: 'አበበ ቢቂላ', drug: 'Amoxicillin', dosage: '1 cap TID', duration: '5 days', status: 'Pending', addedIdx: 0 },
  { id: 102, patient: 'Mulu Worku', amharic: 'ሙሉ ወርቁ', drug: 'Paracetamol', dosage: '2 tabs PRN', duration: '3 days', status: 'Pending', addedIdx: 1 },
  { id: 103, patient: 'Kassa Tessema', amharic: 'ካሳ ተሰማ', drug: 'Metformin', dosage: '1 tab BD', duration: '30 days', status: 'Dispensed', addedIdx: 2 },
  { id: 104, patient: 'Selam Adane', amharic: 'ሰላም አዳነ', drug: 'Ciprofloxacin', dosage: '1 tab BD', duration: '7 days', status: 'Cancelled', addedIdx: 3 },
];

const emptyDrug = { name: '', form: 'Tablet', strength: '', stock: '', price: '' };

const PharmacyManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>('prescriptions');
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [drugs, setDrugs] = useState<Drug[]>(initialDrugs);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [modal, setModal] = useState<ModalState>(null);
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
      if (q && !p.patient.toLowerCase().includes(q) && !p.drug.toLowerCase().includes(q)) return false;
      if (rxFilters.status && p.status !== rxFilters.status) return false;
      return true;
    });
    return rxSort === 'time_asc' ? [...result].reverse() : result;
  }, [prescriptions, rxSearch, rxFilters, rxSort]);

  const handleDispense = (id: number) => {
    setPrescriptions((prev) => prev.map((p) => p.id === id ? { ...p, status: 'Dispensed' } : p));
  };

  const handleUpdateStock = () => {
    const qty = parseInt(stockValue);
    if (!isNaN(qty) && qty >= 0 && modal?.data) {
      setDrugs((prev) => prev.map((d) => d.id === modal.data!.id ? { ...d, stock: qty } : d));
      setModal(null);
      setStockValue('');
    }
  };

  const handleAddDrug = () => {
    if (!newDrug.name.trim()) return;
    const entry: Drug = {
      id: Date.now(),
      name: newDrug.name.trim(),
      form: newDrug.form,
      strength: newDrug.strength.trim(),
      stock: parseInt(newDrug.stock) || 0,
      price: newDrug.price.trim() || '0.00 ETB',
      addedAt: new Date().toISOString().split('T')[0],
    };
    setDrugs((prev) => [...prev, entry]);
    setModal(null);
    setNewDrug(emptyDrug);
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000,
  };
  const boxStyle: React.CSSProperties = {
    background: 'white', borderRadius: '1rem', padding: '2rem', width: '420px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  };

  return (
    <div className="pharmacy-container">
      {/* Update Stock Modal */}
      {modal?.type === 'updateStock' && modal.data && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Update Stock – {modal.data.name}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>Current stock: <strong>{modal.data.stock} units</strong></p>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>New Stock Quantity</label>
            <input
              type="number" min="0" value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateStock()}
              placeholder="Enter quantity"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '1rem', marginBottom: '1.5rem' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdateStock}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Drug Modal */}
      {modal?.type === 'addDrug' && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Add New Drug</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Drug Name *', key: 'name', placeholder: 'e.g. Amoxicillin' },
                { label: 'Strength', key: 'strength', placeholder: 'e.g. 500mg' },
                { label: 'Initial Stock', key: 'stock', placeholder: 'e.g. 100', type: 'number' },
                { label: 'Unit Price (ETB)', key: 'price', placeholder: 'e.g. 15.00 ETB' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>{label}</label>
                  <input
                    type={type || 'text'} value={(newDrug as any)[key]} placeholder={placeholder}
                    onChange={(e) => setNewDrug((prev) => ({ ...prev, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Form</label>
                <select value={newDrug.form} onChange={(e) => setNewDrug((prev) => ({ ...prev, form: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
                  {['Tablet', 'Capsule', 'Injection', 'Syrup', 'IV Fluid'].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => { setModal(null); setNewDrug(emptyDrug); }}>Cancel</button>
              <button className="btn-primary" onClick={handleAddDrug} disabled={!newDrug.name.trim()}>Add Drug</button>
            </div>
          </div>
        </div>
      )}

      <div className="pharmacy-tabs">
        <button className={`tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>
          <ClipboardList size={20} /> Pending Prescriptions
        </button>
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          <Package size={20} /> Drug Inventory
        </button>
      </div>

      <div className="pharmacy-content">
        {showCSVModal && (
          <CSVImportModal title="Drug Inventory & Pharmacy" onClose={() => setShowCSVModal(false)} onImport={(data) => console.log('Imported Drugs:', data)} />
        )}

        {activeTab === 'inventory' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <ListFilterControl
                  searchValue={invSearch} onSearchChange={setInvSearch} searchPlaceholder="Search drugs by name or form..."
                  filters={[
                    { key: 'form', label: 'Form', options: [{ label: 'All Forms', value: '' }, { label: 'Tablet', value: 'Tablet' }, { label: 'Capsule', value: 'Capsule' }, { label: 'Injection', value: 'Injection' }, { label: 'Syrup', value: 'Syrup' }, { label: 'IV Fluid', value: 'IV Fluid' }] },
                    { key: 'stock', label: 'Stock', options: [{ label: 'All', value: '' }, { label: 'Low Stock (<20)', value: 'low' }, { label: 'In Stock', value: 'ok' }] },
                  ]}
                  filterValues={invFilters} onFilterChange={(k, v) => setInvFilters((prev) => ({ ...prev, [k]: v }))}
                  sortValue={invSort} sortOptions={[{ label: 'Name A→Z', value: 'name_asc' }, { label: 'Name Z→A', value: 'name_desc' }, { label: 'Stock Low→High', value: 'stock_asc' }, { label: 'Stock High→Low', value: 'stock_desc' }]}
                  onSortChange={setInvSort} totalCount={drugs.length} filteredCount={filteredDrugs.length}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.15rem' }}>
                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowCSVModal(true)}>
                  <FileText size={18} /> Bulk CSV Import
                </button>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setModal({ type: 'addDrug' })}>
                  <Plus size={18} /> Add Drug
                </button>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Drug Name</th><th>Form</th><th>Strength</th><th>Stock Level</th><th>Unit Price</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filteredDrugs.map((d) => (
                    <tr key={d.id}>
                      <td><strong>{d.name}</strong></td>
                      <td>{d.form}</td>
                      <td>{d.strength}</td>
                      <td>
                        <span style={{ color: d.stock < 20 ? '#ef4444' : 'inherit', fontWeight: d.stock < 20 ? '700' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {d.stock < 20 && <AlertTriangle size={16} />}
                          {d.stock} units
                        </span>
                      </td>
                      <td>{d.price}</td>
                      <td>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => { setStockValue(String(d.stock)); setModal({ type: 'updateStock', data: d }); }}>
                          Update Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredDrugs.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No drugs match your search criteria.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <ListFilterControl
              searchValue={rxSearch} onSearchChange={setRxSearch} searchPlaceholder="Search patient or medication..."
              filters={[{ key: 'status', label: 'Status', options: [{ label: 'All', value: '' }, { label: 'Pending', value: 'Pending' }, { label: 'Dispensed', value: 'Dispensed' }, { label: 'Cancelled', value: 'Cancelled' }] }]}
              filterValues={rxFilters} onFilterChange={(k, v) => setRxFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={rxSort} sortOptions={[{ label: 'Newest First', value: 'time_desc' }, { label: 'Oldest First', value: 'time_asc' }]}
              onSortChange={setRxSort} totalCount={prescriptions.length} filteredCount={filteredRx.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Patient</th><th>Amharic Name</th><th>Medication</th><th>Dosage / Duration</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filteredRx.map((p) => (
                    <tr key={p.id}>
                      <td>{p.patient}</td>
                      <td>{p.amharic}</td>
                      <td><strong>{p.drug}</strong></td>
                      <td>{p.dosage} for {p.duration}</td>
                      <td>
                        <span className={`status-badge ${p.status === 'Pending' ? 'status-pending' : p.status === 'Dispensed' ? 'status-active' : ''}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        {p.status === 'Pending' && (
                          <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleDispense(p.id)}>
                            Dispense
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRx.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No prescriptions match your search criteria.</td></tr>
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

export default PharmacyManagement;
