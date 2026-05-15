import React, { useState, useMemo } from 'react';
import { Beaker, Clipboard, X, CheckCircle2 } from 'lucide-react';
import ListFilterControl from './ListFilterControl';
import { useEMR, type LabOrder, type LabResult } from '../context/EMRContext';
// import { toast } from 'react-hot-toast';
const toast = { success: (m: string) => alert(m), error: (m: string) => alert(m) };

const LabManagement: React.FC<{ activeTab?: 'orders' | 'results' }> = ({ activeTab: initialTab = 'orders' }) => {
  const { labOrders, labResults, submitLabResult, loading } = useEMR();
  const [activeTab, setActiveTab] = useState<'orders' | 'results'>(initialTab);
  const [enterModal, setEnterModal] = useState<{ order: LabOrder; testName: string; value: string; unit: string; range: string } | null>(null);
  const [reportModal, setReportModal] = useState<LabResult | null>(null);

  const [ordSearch, setOrdSearch] = useState('');
  const [ordFilters, setOrdFilters] = useState<Record<string, string>>({ priority: '' });
  const [ordSort, setOrdSort] = useState('time_desc');
  const [resSearch, setResSearch] = useState('');
  const [resFilters, setResFilters] = useState<Record<string, string>>({ status: '' });
  const [resSort, setResSort] = useState('name_asc');

  const filteredOrders = useMemo(() => {
    let result = labOrders.filter((o) => {
      const q = ordSearch.toLowerCase();
      if (q && !o.patientName.toLowerCase().includes(q) && !o.tests.some((t) => t.toLowerCase().includes(q))) return false;
      if (ordFilters.priority && o.priority !== ordFilters.priority) return false;
      return true;
    });
    return [...result].sort((a, b) => ordSort === 'time_asc' ? a.id - b.id : b.id - a.id);
  }, [labOrders, ordSearch, ordFilters, ordSort]);

  const filteredResults = useMemo(() => {
    let result = labResults.filter((r) => {
      const q = resSearch.toLowerCase();
      if (q && !r.patientName.toLowerCase().includes(q) && !r.test.toLowerCase().includes(q)) return false;
      if (resFilters.status && r.status !== resFilters.status) return false;
      return true;
    });
    return [...result].sort((a, b) => resSort === 'name_desc' ? b.patientName.localeCompare(a.patientName) : a.patientName.localeCompare(b.patientName));
  }, [labResults, resSearch, resFilters, resSort]);

  const handleSaveResult = async () => {
    if (!enterModal || !enterModal.value.trim()) return;
    const numVal = parseFloat(enterModal.value);
    const [low, high] = enterModal.range.split('–').map((s) => parseFloat(s.trim()));
    const status = !isNaN(numVal) && !isNaN(low) && !isNaN(high)
      ? (numVal >= low && numVal <= high ? 'Normal' : 'Abnormal')
      : 'Normal';
    
    try {
      await submitLabResult(enterModal.order.id, {
        patientMrn: enterModal.order.patientMrn,
        patientName: enterModal.order.patientName,
        test: enterModal.testName,
        value: enterModal.value,
        unit: enterModal.unit,
        range: enterModal.range,
        status: status as 'Normal' | 'Abnormal',
      });
      toast.success('Lab result submitted and published to portal.');
      setEnterModal(null);
      setActiveTab('results');
    } catch (err: any) {
      toast.error('Failed to submit: ' + err.message);
    }
  };

  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const boxStyle: React.CSSProperties = { background: 'white', borderRadius: '1rem', padding: '2rem', width: '460px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading lab data...</div>;

  return (
    <div className="lab-container">
      {/* Enter Results Modal */}
      {enterModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Enter Results – {enterModal.order.patientName}</h3>
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
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setEnterModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveResult} disabled={!enterModal.value.trim()}>Submit & Publish</button>
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
                { label: 'Patient', value: reportModal.patientName },
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

      <div className="pharmacy-content">
        {activeTab === 'orders' ? (
          <>
            <ListFilterControl
              searchValue={ordSearch} onSearchChange={setOrdSearch} searchPlaceholder="Search by patient or test..."
              filters={[{ key: 'priority', label: 'Priority', options: [{ label: 'All', value: '' }, { label: 'Urgent', value: 'Urgent' }, { label: 'Normal', value: 'Normal' }] }]}
              filterValues={ordFilters} onFilterChange={(k, v) => setOrdFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={ordSort} sortOptions={[{ label: 'Newest First', value: 'time_desc' }, { label: 'Oldest First', value: 'time_asc' }]}
              onSortChange={setOrdSort} totalCount={labOrders.length} filteredCount={filteredOrders.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Tests Requested</th><th>Priority</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>{order.patientName}</strong><div style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.patientMrn}</div></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {order.tests.map((test) => <span key={test} className="status-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>{test}</span>)}
                        </div>
                      </td>
                      <td><span className={`status-badge ${order.priority === 'Urgent' ? 'status-pending' : 'status-active'}`}>{order.priority}</span></td>
                      <td>
                        <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setEnterModal({ order, testName: order.tests[0], value: '', unit: '', range: '' })}>
                          Enter Results
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <ListFilterControl
              searchValue={resSearch} onSearchChange={setResSearch} searchPlaceholder="Search results..."
              filters={[{ key: 'status', label: 'Result', options: [{ label: 'All', value: '' }, { label: 'Normal', value: 'Normal' }, { label: 'Abnormal', value: 'Abnormal' }] }]}
              filterValues={resFilters} onFilterChange={(k, v) => setResFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={resSort} sortOptions={[{ label: 'Name A→Z', value: 'name_asc' }]}
              onSortChange={setResSort} totalCount={labResults.length} filteredCount={filteredResults.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Test Name</th><th>Result</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredResults.map((res) => (
                    <tr key={res.id}>
                      <td><strong>{res.patientName}</strong></td>
                      <td>{res.test}</td>
                      <td style={{ color: res.status === 'Abnormal' ? '#ef4444' : 'inherit', fontWeight: '700' }}>{res.value} {res.unit}</td>
                      <td><span className={`status-badge ${res.status === 'Normal' ? 'status-active' : 'status-pending'}`}>{res.status}</span></td>
                      <td><button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setReportModal(res)}>View Report</button></td>
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

export default LabManagement;
