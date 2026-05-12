import React, { useState, useMemo } from 'react';
import { CreditCard, FileText, ShieldCheck, X } from 'lucide-react';
import ListFilterControl from './ListFilterControl';

type BillItem = { desc: string; price: number };
type PendingBill = { id: string; patient: string; items: BillItem[]; insurance: string; coverage: number };
type HistoryEntry = { id: string; patient: string; total: number; method: string; date: string; status: string };

const initialPending: PendingBill[] = [
  { id: 'B-2026-001', patient: 'Abebe Bikila', items: [{ desc: 'Consultation Fee', price: 250 }, { desc: 'Lab: CBC', price: 150 }, { desc: 'Meds: Amoxicillin', price: 120 }], insurance: 'EHIS', coverage: 0.8 },
  { id: 'B-2026-002', patient: 'Mulu Worku', items: [{ desc: 'Emergency Visit', price: 500 }, { desc: 'Meds: Paracetamol', price: 50 }], insurance: 'Self Pay', coverage: 0 },
  { id: 'B-2026-003', patient: 'Kassa Tessema', items: [{ desc: 'Inpatient Stay (3 days)', price: 900 }, { desc: 'Lab: LFT', price: 200 }, { desc: 'Meds: Ceftriaxone', price: 340 }], insurance: 'EHIS', coverage: 0.7 },
  { id: 'B-2026-004', patient: 'Selam Adane', items: [{ desc: 'OPD Consultation', price: 200 }, { desc: 'Meds: Metformin', price: 60 }], insurance: 'Self Pay', coverage: 0 },
];

const initialHistory: HistoryEntry[] = [
  { id: 'B-2026-099', patient: 'Tigist Hailu', total: 350, method: 'Cash', date: '2026-05-10', status: 'Paid' },
  { id: 'B-2026-098', patient: 'Biruk Alemu', total: 820, method: 'Bank Transfer', date: '2026-05-09', status: 'Paid' },
  { id: 'B-2026-097', patient: 'Dawit Mesfin', total: 1200, method: 'EHIS', date: '2026-05-08', status: 'Paid' },
  { id: 'B-2026-096', patient: 'Hana Bekele', total: 175, method: 'Cash', date: '2026-05-07', status: 'Paid' },
];

const calculateTotal = (items: BillItem[]) => items.reduce((acc, i) => acc + i.price, 0);

const BillingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pendingBills, setPendingBills] = useState<PendingBill[]>(initialPending);
  const [paymentHistory, setPaymentHistory] = useState<HistoryEntry[]>(initialHistory);
  const [payModal, setPayModal] = useState<PendingBill | null>(null);
  const [payMethod, setPayMethod] = useState('Cash');

  const [pendSearch, setPendSearch] = useState('');
  const [pendFilters, setPendFilters] = useState<Record<string, string>>({ insurance: '' });
  const [pendSort, setPendSort] = useState('name_asc');
  const [histSearch, setHistSearch] = useState('');
  const [histFilters, setHistFilters] = useState<Record<string, string>>({ method: '' });
  const [histSort, setHistSort] = useState('date_desc');

  const filteredPending = useMemo(() => {
    let result = pendingBills.filter((b) => {
      const q = pendSearch.toLowerCase();
      if (q && !b.patient.toLowerCase().includes(q) && !b.id.toLowerCase().includes(q)) return false;
      if (pendFilters.insurance && b.insurance !== pendFilters.insurance) return false;
      return true;
    });
    return [...result].sort((a, b) => {
      const totalA = calculateTotal(a.items) * (1 - a.coverage);
      const totalB = calculateTotal(b.items) * (1 - b.coverage);
      if (pendSort === 'amount_desc') return totalB - totalA;
      if (pendSort === 'amount_asc') return totalA - totalB;
      if (pendSort === 'name_desc') return b.patient.localeCompare(a.patient);
      return a.patient.localeCompare(b.patient);
    });
  }, [pendingBills, pendSearch, pendFilters, pendSort]);

  const filteredHistory = useMemo(() => {
    let result = paymentHistory.filter((h) => {
      const q = histSearch.toLowerCase();
      if (q && !h.patient.toLowerCase().includes(q) && !h.id.toLowerCase().includes(q)) return false;
      if (histFilters.method && h.method !== histFilters.method) return false;
      return true;
    });
    return [...result].sort((a, b) =>
      histSort === 'date_asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    );
  }, [paymentHistory, histSearch, histFilters, histSort]);

  const handleProcessPayment = () => {
    if (!payModal) return;
    const subtotal = calculateTotal(payModal.items);
    const patientPay = subtotal * (1 - payModal.coverage);
    const today = new Date().toISOString().split('T')[0];
    const entry: HistoryEntry = {
      id: payModal.id,
      patient: payModal.patient,
      total: parseFloat(patientPay.toFixed(2)),
      method: payMethod,
      date: today,
      status: 'Paid',
    };
    setPendingBills((prev) => prev.filter((b) => b.id !== payModal.id));
    setPaymentHistory((prev) => [entry, ...prev]);
    setPayModal(null);
    setActiveTab('history');
  };

  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const boxStyle: React.CSSProperties = { background: 'white', borderRadius: '1rem', padding: '2rem', width: '460px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };

  return (
    <div className="billing-container">
      {payModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Process Payment – {payModal.patient}</h3>
              <button onClick={() => setPayModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              {payModal.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #eee', fontSize: '0.9rem' }}>
                  <span>{item.desc}</span><span>{item.price.toFixed(2)} ETB</span>
                </div>
              ))}
              {payModal.coverage > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.9rem', color: '#16a34a' }}>
                  <span>Insurance ({(payModal.coverage * 100).toFixed(0)}%)</span>
                  <span>-{(calculateTotal(payModal.items) * payModal.coverage).toFixed(2)} ETB</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0', fontWeight: '700', fontSize: '1.1rem', borderTop: '2px solid #e2e8f0', marginTop: '0.5rem' }}>
                <span>Amount Due</span>
                <span style={{ color: 'var(--primary-color)' }}>{(calculateTotal(payModal.items) * (1 - payModal.coverage)).toFixed(2)} ETB</span>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Payment Method</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {['Cash', 'Bank Transfer', 'EHIS'].map((m) => (
                  <button key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, padding: '0.6rem', border: `2px solid ${payMethod === m ? 'var(--secondary-color)' : '#e2e8f0'}`, borderRadius: '0.5rem', background: payMethod === m ? '#eff6ff' : 'white', color: payMethod === m ? 'var(--secondary-color)' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setPayModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleProcessPayment}>Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      <div className="pharmacy-tabs">
        <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          <CreditCard size={20} /> Pending Payments {pendingBills.length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}>{pendingBills.length}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <FileText size={20} /> Payment History
        </button>
      </div>

      <div className="billing-content" style={{ marginTop: '1.5rem' }}>
        {activeTab === 'pending' ? (
          <>
            <ListFilterControl
              searchValue={pendSearch} onSearchChange={setPendSearch} searchPlaceholder="Search patient or invoice ID..."
              filters={[{ key: 'insurance', label: 'Insurance', options: [{ label: 'All', value: '' }, { label: 'EHIS', value: 'EHIS' }, { label: 'Self Pay', value: 'Self Pay' }] }]}
              filterValues={pendFilters} onFilterChange={(k, v) => setPendFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={pendSort} sortOptions={[{ label: 'Name A→Z', value: 'name_asc' }, { label: 'Name Z→A', value: 'name_desc' }, { label: 'Amount High→Low', value: 'amount_desc' }, { label: 'Amount Low→High', value: 'amount_asc' }]}
              onSortChange={setPendSort} totalCount={pendingBills.length} filteredCount={filteredPending.length}
            />
            {filteredPending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                {pendingBills.length === 0 ? '✓ All bills have been processed.' : 'No pending bills match your search criteria.'}
              </div>
            ) : (
              <div className="billing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '1.5rem' }}>
                {filteredPending.map((bill) => {
                  const subtotal = calculateTotal(bill.items);
                  const insuranceAmount = subtotal * bill.coverage;
                  const patientPay = subtotal - insuranceAmount;
                  return (
                    <div key={bill.id} className="stat-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', height: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Invoice #{bill.id}</div>
                          <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{bill.patient}</h3>
                        </div>
                        <span className="status-badge status-pending">Unpaid</span>
                      </div>
                      <div className="bill-items" style={{ marginBottom: '1.5rem' }}>
                        {bill.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #eee', fontSize: '0.9rem' }}>
                            <span>{item.desc}</span><span>{item.price.toFixed(2)} ETB</span>
                          </div>
                        ))}
                      </div>
                      <div className="insurance-info" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
                          <ShieldCheck size={18} />
                          {bill.insurance === 'EHIS' ? 'Ethiopian Health Insurance Service (EHIS)' : 'Self Pay'}
                        </div>
                        {bill.coverage > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span>Coverage ({(bill.coverage * 100).toFixed(0)}%)</span>
                            <span style={{ color: '#16a34a' }}>-{insuranceAmount.toFixed(2)} ETB</span>
                          </div>
                        )}
                      </div>
                      <div className="total-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '2px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Amount Due</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>{patientPay.toFixed(2)} ETB</div>
                        </div>
                        <button className="btn-primary" style={{ padding: '0.75rem 1.5rem' }} onClick={() => setPayModal(bill)}>
                          Process Payment
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <ListFilterControl
              searchValue={histSearch} onSearchChange={setHistSearch} searchPlaceholder="Search patient or invoice ID..."
              filters={[{ key: 'method', label: 'Method', options: [{ label: 'All Methods', value: '' }, { label: 'Cash', value: 'Cash' }, { label: 'Bank Transfer', value: 'Bank Transfer' }, { label: 'EHIS', value: 'EHIS' }] }]}
              filterValues={histFilters} onFilterChange={(k, v) => setHistFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={histSort} sortOptions={[{ label: 'Newest First', value: 'date_desc' }, { label: 'Oldest First', value: 'date_asc' }]}
              onSortChange={setHistSort} totalCount={paymentHistory.length} filteredCount={filteredHistory.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Invoice #</th><th>Patient</th><th>Total</th><th>Method</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filteredHistory.map((h) => (
                    <tr key={h.id}>
                      <td>{h.id}</td>
                      <td><strong>{h.patient}</strong></td>
                      <td>{h.total.toFixed(2)} ETB</td>
                      <td>{h.method}</td>
                      <td>{h.date}</td>
                      <td><span className="status-badge status-active">{h.status}</span></td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No payment records match your search criteria.</td></tr>
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

export default BillingManagement;
