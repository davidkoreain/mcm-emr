import React, { useState, useMemo } from 'react';
import { Package, ClipboardList, AlertTriangle, FileText, Plus } from 'lucide-react';
import CSVImportModal from './CSVImportModal';
import ListFilterControl from './ListFilterControl';

const PharmacyManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>('prescriptions');
  const [showCSVModal, setShowCSVModal] = useState(false);

  const [invSearch, setInvSearch] = useState('');
  const [invFilters, setInvFilters] = useState<Record<string, string>>({ form: '', stock: '' });
  const [invSort, setInvSort] = useState('name_asc');

  const [rxSearch, setRxSearch] = useState('');
  const [rxFilters, setRxFilters] = useState<Record<string, string>>({ status: '' });
  const [rxSort, setRxSort] = useState('time_desc');

  const drugs = [
    { id: 1, name: 'Amoxicillin', form: 'Capsule', strength: '500mg', stock: 120, price: '15.00 ETB', addedAt: '2026-01-10' },
    { id: 2, name: 'Paracetamol', form: 'Tablet', strength: '500mg', stock: 15, price: '5.00 ETB', addedAt: '2026-02-05' },
    { id: 3, name: 'Metformin', form: 'Tablet', strength: '850mg', stock: 250, price: '20.00 ETB', addedAt: '2026-01-22' },
    { id: 4, name: 'Ceftriaxone', form: 'Injection', strength: '1g', stock: 45, price: '85.00 ETB', addedAt: '2026-03-18' },
    { id: 5, name: "Ringer's Lactate", form: 'IV Fluid', strength: '500ml', stock: 8, price: '45.00 ETB', addedAt: '2026-04-01' },
    { id: 6, name: 'Salbutamol', form: 'Syrup', strength: '2mg/5ml', stock: 60, price: '30.00 ETB', addedAt: '2026-02-14' },
    { id: 7, name: 'Omeprazole', form: 'Capsule', strength: '20mg', stock: 5, price: '18.00 ETB', addedAt: '2026-05-01' },
    { id: 8, name: 'Ciprofloxacin', form: 'Tablet', strength: '500mg', stock: 90, price: '25.00 ETB', addedAt: '2026-03-30' },
  ];

  const prescriptions = [
    { id: 101, patient: 'Abebe Bikila', amharic: 'አበበ ቢቂላ', drug: 'Amoxicillin', dosage: '1 cap TID', duration: '5 days', status: 'Pending', addedIdx: 0 },
    { id: 102, patient: 'Mulu Worku', amharic: 'ሙሉ ወርቁ', drug: 'Paracetamol', dosage: '2 tabs PRN', duration: '3 days', status: 'Pending', addedIdx: 1 },
    { id: 103, patient: 'Kassa Tessema', amharic: 'ካሳ ተሰማ', drug: 'Metformin', dosage: '1 tab BD', duration: '30 days', status: 'Dispensed', addedIdx: 2 },
    { id: 104, patient: 'Selam Adane', amharic: 'ሰላም አዳነ', drug: 'Ciprofloxacin', dosage: '1 tab BD', duration: '7 days', status: 'Cancelled', addedIdx: 3 },
  ];

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
  }, [invSearch, invFilters, invSort]);

  const filteredRx = useMemo(() => {
    let result = prescriptions.filter((p) => {
      const q = rxSearch.toLowerCase();
      if (q && !p.patient.toLowerCase().includes(q) && !p.drug.toLowerCase().includes(q)) return false;
      if (rxFilters.status && p.status !== rxFilters.status) return false;
      return true;
    });
    return rxSort === 'time_asc' ? [...result].reverse() : result;
  }, [rxSearch, rxFilters, rxSort]);

  return (
    <div className="pharmacy-container">
      <div className="pharmacy-tabs">
        <button
          className={`tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('prescriptions')}
        >
          <ClipboardList size={20} /> Pending Prescriptions
        </button>
        <button
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Package size={20} /> Drug Inventory
        </button>
      </div>

      <div className="pharmacy-content">
        {showCSVModal && (
          <CSVImportModal
            title="Drug Inventory & Pharmacy"
            onClose={() => setShowCSVModal(false)}
            onImport={(data) => console.log('Imported Drugs:', data)}
          />
        )}

        {activeTab === 'inventory' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <ListFilterControl
                  searchValue={invSearch}
                  onSearchChange={setInvSearch}
                  searchPlaceholder="Search drugs by name or form..."
                  filters={[
                    {
                      key: 'form', label: 'Form',
                      options: [
                        { label: 'All Forms', value: '' },
                        { label: 'Tablet', value: 'Tablet' },
                        { label: 'Capsule', value: 'Capsule' },
                        { label: 'Injection', value: 'Injection' },
                        { label: 'Syrup', value: 'Syrup' },
                        { label: 'IV Fluid', value: 'IV Fluid' },
                      ],
                    },
                    {
                      key: 'stock', label: 'Stock',
                      options: [
                        { label: 'All', value: '' },
                        { label: 'Low Stock (<20)', value: 'low' },
                        { label: 'In Stock', value: 'ok' },
                      ],
                    },
                  ]}
                  filterValues={invFilters}
                  onFilterChange={(k, v) => setInvFilters((prev) => ({ ...prev, [k]: v }))}
                  sortValue={invSort}
                  sortOptions={[
                    { label: 'Name A→Z', value: 'name_asc' },
                    { label: 'Name Z→A', value: 'name_desc' },
                    { label: 'Stock Low→High', value: 'stock_asc' },
                    { label: 'Stock High→Low', value: 'stock_desc' },
                  ]}
                  onSortChange={setInvSort}
                  totalCount={drugs.length}
                  filteredCount={filteredDrugs.length}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.15rem' }}>
                <button
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => setShowCSVModal(true)}
                >
                  <FileText size={18} /> Bulk CSV Import
                </button>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} /> Add Drug
                </button>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Drug Name</th>
                    <th>Form</th>
                    <th>Strength</th>
                    <th>Stock Level</th>
                    <th>Unit Price</th>
                    <th>Action</th>
                  </tr>
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
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Update Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredDrugs.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No drugs match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <ListFilterControl
              searchValue={rxSearch}
              onSearchChange={setRxSearch}
              searchPlaceholder="Search patient or medication..."
              filters={[
                {
                  key: 'status', label: 'Status',
                  options: [
                    { label: 'All', value: '' },
                    { label: 'Pending', value: 'Pending' },
                    { label: 'Dispensed', value: 'Dispensed' },
                    { label: 'Cancelled', value: 'Cancelled' },
                  ],
                },
              ]}
              filterValues={rxFilters}
              onFilterChange={(k, v) => setRxFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={rxSort}
              sortOptions={[
                { label: 'Newest First', value: 'time_desc' },
                { label: 'Oldest First', value: 'time_asc' },
              ]}
              onSortChange={setRxSort}
              totalCount={prescriptions.length}
              filteredCount={filteredRx.length}
            />

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Amharic Name</th>
                    <th>Medication</th>
                    <th>Dosage / Duration</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
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
                          <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            Dispense
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRx.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No prescriptions match your search criteria.
                      </td>
                    </tr>
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
