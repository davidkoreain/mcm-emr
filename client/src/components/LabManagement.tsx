import React, { useState, useMemo } from 'react';
import { Beaker, Clipboard, X } from 'lucide-react';
import ListFilterControl from './ListFilterControl';

type LabOrder = { id: number; patient: string; amharic: string; tests: string[]; priority: string; time: string; sortIdx: number };
type LabResult = { id: number; patient: string; test: string; value: string; unit: string; range: string; status: string };

const initialOrders: LabOrder[] = [
  { id: 1, patient: 'Abebe Bikila', amharic: 'አበበ ቢቂላ', tests: ['CBC', 'Blood Sugar'], priority: 'Normal', time: '15 mins ago', sortIdx: 3 },
  { id: 2, patient: 'Mulu Worku', amharic: 'ሙሉ ወርቁ', tests: ['Malaria Parasite', 'Widal'], priority: 'Urgent', time: '5 mins ago', sortIdx: 1 },
  { id: 3, patient: 'Kassa Tessema', amharic: 'ካሳ ተሰማ', tests: ['LFT', 'RFT'], priority: 'Normal', time: '30 mins ago', sortIdx: 4 },
  { id: 4, patient: 'Selam Adane', amharic: 'ሰላም አዳነ', tests: ['Urine R/E'], priority: 'Urgent', time: '2 mins ago', sortIdx: 0 },
  { id: 5, patient: 'Biruk Alemu', amharic: 'ብሩክ አለሙ', tests: ['Typhoid', 'ESR'], priority: 'Normal', time: '45 mins ago', sortIdx: 5 },
];

const initialResults: LabResult[] = [
  { id: 101, patient: 'Kassa Tessema', test: 'Hemoglobin', value: '9.2', unit: 'g/dL', range: '12.0 – 16.0', status: 'Abnormal' },
  { id: 102, patient: 'Selam Adane', test: 'FBG', value: '95', unit: 'mg/dL', range: '70 – 100', status: 'Normal' },
  { id: 103, patient: 'Abebe Bikila', test: 'WBC', value: '11.5', unit: 'x10³/µL', range: '4.5 – 11.0', status: 'Abnormal' },
  { id: 104, patient: 'Tigist Hailu', test: 'Creatinine', value: '0.9', unit: 'mg/dL', range: '0.6 – 1.2', status: 'Normal' },
];

type EnterModal = { order: LabOrder; testName: string; value: string; unit: string; range: string };
type ReportModal = LabResult;

const LabManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'results'>('orders');
  const [labOrders, setLabOrders] = useState<LabOrder[]>(initialOrders);
  const [recentResults, setRecentResults] = useState<LabResult[]>(initialResults);
  const [enterModal, setEnterModal] = useState<EnterModal | null>(null);
  const [reportModal, setReportModal] = useState<ReportModal | null>(null);

  const [ordSearch, setOrdSearch] = useState('');
  const [ordFilters, setOrdFilters] = useState<Record<string, string>>({ priority: '' });
  const [ordSort, setOrdSort] = useState('time_desc');
  const [resSearch, setResSearch] = useState('');
  const [resFilters, setResFilters] = useState<Record<string, string>>({ status: '' });
  const [resSort, setResSort] = useState('name_asc');

  const filteredOrders = useMemo(() => {
    let result = labOrders.filter((o) => {
      const q = ordSearch.toLowerCase();
      if (q && !o.patient.toLowerCase().includes(q) && !o.tests.some((t) => t.toLowerCase().includes(q))) return false;
      if (ordFilters.priority && o.priority !== ordFilters.priority) return false;
      return true;
    });
    return [...result].sort((a, b) => ordSort === 'time_asc' ? b.sortIdx - a.sortIdx : a.sortIdx - b.sortIdx);
  }, [labOrders, ordSearch, ordFilters, ordSort]);

  const filteredResults = useMemo(() => {
    let result = recentResults.filter((r) => {
      const q = resSearch.toLowerCase();
      if (q && !r.patient.toLowerCase().includes(q) && !r.test.toLowerCase().includes(q)) return false;
      if (resFilters.status && r.status !== resFilters.status) return false;
      return true;
    });
    return [...result].sort((a, b) => resSort === 'name_desc' ? b.patient.localeCompare(a.patient) : a.patient.localeCompare(b.patient));
  }, [recentResults, resSearch, resFilters, resSort]);

  const openEnterResults = (order: LabOrder) => {
    setEnterModal({ order, testName: order.tests[0], value: '', unit: '', range: '' });
  };

  const handleSaveResult = () => {
    if (!enterModal || !enterModal.value.trim()) return;
    const numVal = parseFloat(enterModal.value);
    const [low, high] = enterModal.range.split('–').map((s) => parseFloat(s.trim()));
    const status = !isNaN(numVal) && !isNaN(low) && !isNaN(high)
      ? (numVal >= low && numVal <= high ? 'Normal' : 'Abnormal')
      : 'Normal';
    const newResult: LabResult = {
      id: Date.now(),
      patient: enterModal.order.patient,
      test: enterModal.testName,
      value: enterModal.value,
      unit: enterModal.unit,
      range: enterModal.range,
      status,
    };
    setRecentResults((prev) => [newResult, ...prev]);
    setLabOrders((prev) => {
      const updated = prev.map((o) => o.id === enterModal.order.id ? { ...o, tests: o.tests.filter((t) => t !== enterModal.testName) } : o);
      return updated.filter((o) => o.tests.length > 0);
    });
    setEnterModal(null);
    setActiveTab('results');
  };

  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const boxStyle: React.CSSProperties = { background: 'white', borderRadius: '1rem', padding: '2rem', width: '460px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };

  return (
    <div className="lab-container">
      {/* Enter Results Modal */}
      {enterModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Enter Results – {enterModal.order.patient}</h3>
              <button onClick={() => setEnterModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Test</label>
                <select value={enterModal.testName} onChange={(e) => setEnterModal((m) => m ? { ...m, testName: e.target.value } : m)}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
                  {enterModal.order.tests.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              {[
                { label: 'Result Value *', key: 'value', placeholder: 'e.g. 9.2' },
                { label: 'Unit', key: 'unit', placeholder: 'e.g. g/dL' },
                { label: 'Normal Range', key: 'range', placeholder: 'e.g. 12.0 – 16.0' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>{label}</label>
                  <input type="text" value={(enterModal as any)[key]} placeholder={placeholder}
                    onChange={(e) => setEnterModal((m) => m ? { ...m, [key]: e.target.value } : m)}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}
                  />
                </div>
              ))}
              <p style={{ fontSize: '0.8rem', color: '#64748b', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
                Status (Normal/Abnormal) will be determined automatically from the range.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setEnterModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveResult} disabled={!enterModal.value.trim()}>Save Result</button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {reportModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Lab Report</h3>
              <button onClick={() => setReportModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Patient', value: reportModal.patient },
                { label: 'Test', value: reportModal.test },
                { label: 'Result', value: `${reportModal.value} ${reportModal.unit}` },
                { label: 'Normal Range', value: reportModal.range },
                { label: 'Status', value: reportModal.status },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{label}</span>
                  <span style={{ fontWeight: '700', color: label === 'Status' ? (value === 'Abnormal' ? '#ef4444' : '#16a34a') : 'inherit' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setReportModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="pharmacy-tabs">
        <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          <Clipboard size={20} /> Pending Lab Orders {labOrders.length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}>{labOrders.length}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
          <Beaker size={20} /> Lab Results
        </button>
      </div>

      <div className="pharmacy-content">
        {activeTab === 'orders' ? (
          <>
            <ListFilterControl
              searchValue={ordSearch} onSearchChange={setOrdSearch} searchPlaceholder="Search by patient name or test..."
              filters={[{ key: 'priority', label: 'Priority', options: [{ label: 'All', value: '' }, { label: 'Urgent', value: 'Urgent' }, { label: 'Normal', value: 'Normal' }] }]}
              filterValues={ordFilters} onFilterChange={(k, v) => setOrdFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={ordSort} sortOptions={[{ label: 'Newest First', value: 'time_desc' }, { label: 'Oldest First', value: 'time_asc' }]}
              onSortChange={setOrdSort} totalCount={labOrders.length} filteredCount={filteredOrders.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Patient</th><th>Tests Requested</th><th>Priority</th><th>Order Time</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div><strong>{order.patient}</strong></div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.amharic}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {order.tests.map((test) => (
                            <span key={test} className="status-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>{test}</span>
                          ))}
                        </div>
                      </td>
                      <td><span className={`status-badge ${order.priority === 'Urgent' ? 'status-pending' : 'status-active'}`}>{order.priority}</span></td>
                      <td>{order.time}</td>
                      <td>
                        <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openEnterResults(order)}>
                          Enter Results
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      {labOrders.length === 0 ? '✓ All lab orders have been processed.' : 'No lab orders match your search criteria.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <ListFilterControl
              searchValue={resSearch} onSearchChange={setResSearch} searchPlaceholder="Search by patient name or test..."
              filters={[{ key: 'status', label: 'Result', options: [{ label: 'All', value: '' }, { label: 'Normal', value: 'Normal' }, { label: 'Abnormal', value: 'Abnormal' }] }]}
              filterValues={resFilters} onFilterChange={(k, v) => setResFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={resSort} sortOptions={[{ label: 'Name A→Z', value: 'name_asc' }, { label: 'Name Z→A', value: 'name_desc' }]}
              onSortChange={setResSort} totalCount={recentResults.length} filteredCount={filteredResults.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Patient</th><th>Test Name</th><th>Result</th><th>Normal Range</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filteredResults.map((res) => (
                    <tr key={res.id}>
                      <td>{res.patient}</td>
                      <td><strong>{res.test}</strong></td>
                      <td style={{ color: res.status === 'Abnormal' ? '#ef4444' : 'inherit', fontWeight: '700' }}>{res.value} {res.unit}</td>
                      <td>{res.range}</td>
                      <td>
                        <span className={`status-badge ${res.status === 'Normal' ? 'status-active' : 'status-pending'}`}
                          style={{ background: res.status === 'Normal' ? '#dcfce7' : '#fee2e2', color: res.status === 'Normal' ? '#166534' : '#991b1b' }}>
                          {res.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setReportModal(res)}>
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredResults.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No results match your search criteria.</td></tr>
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

export default LabManagement;
