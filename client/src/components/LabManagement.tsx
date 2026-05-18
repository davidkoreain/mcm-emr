import React, { useState, useMemo } from 'react';
import { FlaskConical, Plus, X, CheckCircle2, PlayCircle, Search, SlidersHorizontal } from 'lucide-react';
import ListFilterControl from './ListFilterControl';
import { useEMR, type LabOrder, type LabResult } from '../context/EMRContext';
import { usePageAdjustments } from '../hooks/usePageAdjustments';

const toast = { success: (m: string) => alert(m), error: (m: string) => alert(m) };

const LabManagement: React.FC<{ activeTab?: 'orders' | 'results' }> = ({ activeTab: initialTab = 'orders' }) => {
  const {
    labOrders, labResults, labTestCatalog,
    patients, staff, currentStaff,
    submitLabResult, addLabOrder, updateLabOrderResultStatus,
    loading,
  } = useEMR();

  const { isMobile } = usePageAdjustments('lab');

  const [tab, setTab] = useState<'orders' | 'results'>(initialTab);
  React.useEffect(() => { setTab(initialTab); }, [initialTab]);

  // ── New Order Modal state ──
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [noPatientMrn, setNoPatientMrn] = useState('');
  const [noTests, setNoTests] = useState<string[]>([]);
  const [noPriority, setNoPriority] = useState<'Normal' | 'Urgent'>('Normal');
  const [noScheduledDate, setNoScheduledDate] = useState('');
  const [noNotes, setNoNotes] = useState('');
  const [noAssignedTo, setNoAssignedTo] = useState('');
  const [noTestSearch, setNoTestSearch] = useState('');
  const [noTestCategory, setNoTestCategory] = useState('');

  // ── Enter Results Modal state ──
  const [enterModal, setEnterModal] = useState<{
    order: LabOrder;
    testName: string;
    value: string;
    unit: string;
    range: string;
    completedBy: string;
    notes: string;
  } | null>(null);

  // ── View Report Modal state ──
  const [reportModal, setReportModal] = useState<LabResult | null>(null);

  // ── Orders tab filters ──
  const [ordSearch, setOrdSearch] = useState('');
  const [ordPriority, setOrdPriority] = useState('');
  const [ordStatus, setOrdStatus] = useState('');
  const [ordSort, setOrdSort] = useState('time_desc');
  const [showOrdExtraFilters, setShowOrdExtraFilters] = useState(false);

  // ── Results tab filters ──
  const [resSearch, setResSearch] = useState('');
  const [resStatus, setResStatus] = useState('');
  const [resSort, setResSort] = useState('time_desc');

  // ── Derived: catalog data ──
  const categories = useMemo(() => {
    const cats = new Set(labTestCatalog.map(t => t.category));
    return Array.from(cats).sort();
  }, [labTestCatalog]);

  const filteredCatalogTests = useMemo(() => {
    let tests = labTestCatalog;
    if (noTestCategory) tests = tests.filter(t => t.category === noTestCategory);
    if (noTestSearch) {
      const q = noTestSearch.toLowerCase();
      tests = tests.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return tests;
  }, [labTestCatalog, noTestSearch, noTestCategory]);

  const pendingOrders = useMemo(() => labOrders.filter(o => o.resultStatus !== 'Completed'), [labOrders]);

  const filteredOrders = useMemo(() => {
    let list = pendingOrders.filter(o => {
      const q = ordSearch.toLowerCase();
      if (q && !o.patientName.toLowerCase().includes(q) && !o.tests.some(t => t.toLowerCase().includes(q))) return false;
      if (ordPriority && o.priority !== ordPriority) return false;
      if (ordStatus && (o.resultStatus ?? 'Scheduled') !== ordStatus) return false;
      return true;
    });
    if (ordSort === 'time_asc') return list.sort((a, b) => a.id - b.id);
    if (ordSort === 'urgent_first') return list.sort((a, b) => (a.priority === 'Urgent' ? -1 : 1) - (b.priority === 'Urgent' ? -1 : 1));
    return list.sort((a, b) => b.id - a.id);
  }, [pendingOrders, ordSearch, ordPriority, ordStatus, ordSort]);

  const filteredResults = useMemo(() => {
    let list = labResults.filter(r => {
      const q = resSearch.toLowerCase();
      if (q && !r.patientName.toLowerCase().includes(q) && !r.test.toLowerCase().includes(q)) return false;
      if (resStatus && r.status !== resStatus) return false;
      return true;
    });
    return resSort === 'name_asc'
      ? list.sort((a, b) => a.patientName.localeCompare(b.patientName))
      : list.sort((a, b) => b.id - a.id);
  }, [labResults, resSearch, resStatus, resSort]);

  // ── Helpers ──
  const getCatalogTest = (name: string) => labTestCatalog.find(t => t.name === name);

  const statusColor = (s?: string) => s === 'In Progress' ? '#f59e0b' : s === 'Completed' ? '#16a34a' : '#3b82f6';
  const statusBg = (s?: string) => s === 'In Progress' ? '#fffbeb' : s === 'Completed' ? '#f0fdf4' : '#eff6ff';

  // ── Handlers ──
  const handleCreateOrder = async () => {
    if (!noPatientMrn || noTests.length === 0) return;
    const patient = patients.find(p => p.mrn === noPatientMrn);
    if (!patient) return;
    try {
      await addLabOrder({
        patientMrn: noPatientMrn,
        patientName: patient.name,
        tests: noTests,
        priority: noPriority,
        status: 'Pending',
        resultStatus: 'Scheduled',
        orderedBy: currentStaff?.name ?? '',
        scheduledDate: noScheduledDate || undefined,
        notes: noNotes,
        assignedTo: noAssignedTo,
      });
      toast.success('Lab order created.');
      setShowNewOrder(false);
      setNoPatientMrn(''); setNoTests([]); setNoPriority('Normal');
      setNoScheduledDate(''); setNoNotes(''); setNoAssignedTo('');
      setNoTestSearch(''); setNoTestCategory('');
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    }
  };

  const handleSaveResult = async () => {
    if (!enterModal || !enterModal.value.trim()) return;
    const numVal = parseFloat(enterModal.value);
    const parts = enterModal.range.split(/[–\-]/).map(s => parseFloat(s.trim()));
    const [low, high] = parts;
    const status: 'Normal' | 'Abnormal' = (!isNaN(numVal) && !isNaN(low) && !isNaN(high) && numVal >= low && numVal <= high)
      ? 'Normal' : 'Abnormal';
    try {
      await submitLabResult(enterModal.order.id, {
        patientMrn: enterModal.order.patientMrn,
        patientName: enterModal.order.patientName,
        test: enterModal.testName,
        value: enterModal.value,
        unit: enterModal.unit,
        range: enterModal.range,
        status,
        completedBy: enterModal.completedBy,
        notes: enterModal.notes,
      });
      toast.success('Result submitted and published to patient portal.');
      setEnterModal(null);
      setTab('results');
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    }
  };

  const openEnterModal = (order: LabOrder) => {
    const firstTest = order.tests[0] ?? '';
    const catalog = getCatalogTest(firstTest);
    setEnterModal({
      order,
      testName: firstTest,
      value: '',
      unit: catalog?.unit ?? '',
      range: catalog?.normalRange ?? '',
      completedBy: currentStaff?.name ?? '',
      notes: '',
    });
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000, padding: '1rem',
  };
  const boxStyle: React.CSSProperties = {
    background: 'white', borderRadius: '1rem', padding: '2rem',
    width: '100%', maxWidth: '520px', maxHeight: '90vh',
    overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading lab data...</div>;

  return (
    <div className="lab-container">

      {/* ── New Order Modal ── */}
      {showNewOrder && (
        <div style={overlayStyle}>
          <div style={{ ...boxStyle, maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>New Lab Order</h3>
              <button onClick={() => setShowNewOrder(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Patient *</label>
                <select value={noPatientMrn} onChange={e => setNoPatientMrn(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.mrn} value={p.mrn}>{p.name} ({p.mrn})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Priority</label>
                  <select value={noPriority} onChange={e => setNoPriority(e.target.value as 'Normal' | 'Urgent')}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Scheduled Date</label>
                  <input type="date" value={noScheduledDate} onChange={e => setNoScheduledDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Assigned To</label>
                  <select value={noAssignedTo} onChange={e => setNoAssignedTo(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                    <option value="">Select staff...</option>
                    {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Ordered By</label>
                  <input readOnly value={currentStaff?.name ?? '—'}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', background: '#f8fafc', color: '#64748b' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Select Tests *</label>
                {noTests.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {noTests.map(t => (
                      <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', background: '#dbeafe', color: '#1d4ed8', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600' }}>
                        {t}
                        <button onClick={() => setNoTests(prev => prev.filter(x => x !== t))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: '#1d4ed8' }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input placeholder="Search tests..." value={noTestSearch} onChange={e => setNoTestSearch(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                  </div>
                  <select value={noTestCategory} onChange={e => setNoTestCategory(e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', minWidth: '130px' }}>
                    <option value="">All categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                  {filteredCatalogTests.length === 0
                    ? <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No tests found</div>
                    : filteredCatalogTests.map(t => {
                        const selected = noTests.includes(t.name);
                        return (
                          <button key={t.id} onClick={() => setNoTests(prev => selected ? prev.filter(x => x !== t.name) : [...prev, t.name])}
                            style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '0.5rem 0.75rem', background: selected ? '#eff6ff' : 'transparent', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', textAlign: 'left', gap: '0.5rem' }}>
                            <div style={{ width: '16px', height: '16px', flexShrink: 0, borderRadius: '4px', border: `2px solid ${selected ? '#3b82f6' : '#cbd5e1'}`, background: selected ? '#3b82f6' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {selected && <CheckCircle2 size={10} color="white" />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>{t.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {t.category}{t.normalRange ? ` · ${t.normalRange}${t.unit ? ' ' + t.unit : ''}` : ''}
                              </div>
                            </div>
                          </button>
                        );
                      })
                  }
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Notes</label>
                <textarea value={noNotes} onChange={e => setNoNotes(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setShowNewOrder(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateOrder} disabled={!noPatientMrn || noTests.length === 0}>
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Enter Results Modal ── */}
      {enterModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Enter Results</h3>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {enterModal.order.patientName} · {enterModal.order.patientMrn}
                </div>
              </div>
              <button onClick={() => setEnterModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Test</label>
                <select value={enterModal.testName}
                  onChange={e => {
                    const name = e.target.value;
                    const c = getCatalogTest(name);
                    setEnterModal(m => m ? { ...m, testName: name, unit: c?.unit ?? '', range: c?.normalRange ?? '' } : m);
                  }}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                  {enterModal.order.tests.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Result Value *</label>
                  <input type="text" placeholder="e.g. 9.2" value={enterModal.value}
                    onChange={e => setEnterModal(m => m ? { ...m, value: e.target.value } : m)}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Unit</label>
                  <input type="text" placeholder="e.g. g/dL" value={enterModal.unit}
                    onChange={e => setEnterModal(m => m ? { ...m, unit: e.target.value } : m)}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Normal Range</label>
                <input type="text" placeholder="e.g. 12.0–16.0" value={enterModal.range}
                  onChange={e => setEnterModal(m => m ? { ...m, range: e.target.value } : m)}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Completed By</label>
                  <input type="text" value={enterModal.completedBy}
                    onChange={e => setEnterModal(m => m ? { ...m, completedBy: e.target.value } : m)}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Notes</label>
                  <input type="text" placeholder="Optional notes" value={enterModal.notes}
                    onChange={e => setEnterModal(m => m ? { ...m, notes: e.target.value } : m)}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setEnterModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveResult} disabled={!enterModal.value.trim()}>
                Submit &amp; Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Report Modal ── */}
      {reportModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Lab Report</h3>
              <button onClick={() => setReportModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {([
                { label: 'Patient', value: reportModal.patientName },
                { label: 'Test', value: reportModal.test },
                { label: 'Result', value: `${reportModal.value} ${reportModal.unit}`.trim() },
                { label: 'Normal Range', value: reportModal.range },
                { label: 'Status', value: reportModal.status },
                ...(reportModal.completedBy ? [{ label: 'Completed By', value: reportModal.completedBy }] : []),
                ...(reportModal.notes ? [{ label: 'Notes', value: reportModal.notes }] : []),
              ] as { label: string; value: string }[]).map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontWeight: '700', textAlign: 'right', color: label === 'Status' ? (value === 'Abnormal' ? '#ef4444' : '#16a34a') : '#1e293b' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setReportModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="pharmacy-content">

        {/* New Order button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowNewOrder(true)}>
            <Plus size={16} /> New Lab Order
          </button>
        </div>

        {/* ── Pending Orders Tab ── */}
        {tab === 'orders' && (
          <>
            {/* Search always visible */}
            <ListFilterControl
              searchValue={ordSearch} onSearchChange={setOrdSearch} searchPlaceholder="Search by patient or test..."
              filters={[
                { key: 'priority', label: 'Priority', options: [{ label: 'All Priorities', value: '' }, { label: 'Urgent', value: 'Urgent' }, { label: 'Normal', value: 'Normal' }] },
                ...(!isMobile || showOrdExtraFilters
                  ? [{ key: 'status', label: 'Status', options: [{ label: 'All Statuses', value: '' }, { label: 'Scheduled', value: 'Scheduled' }, { label: 'In Progress', value: 'In Progress' }] }]
                  : []),
              ]}
              filterValues={{ priority: ordPriority, status: ordStatus }}
              onFilterChange={(k, v) => { if (k === 'priority') setOrdPriority(v); else setOrdStatus(v); }}
              sortValue={ordSort}
              sortOptions={[
                { label: 'Newest First', value: 'time_desc' },
                { label: 'Oldest First', value: 'time_asc' },
                { label: 'Urgent First', value: 'urgent_first' },
              ]}
              onSortChange={setOrdSort}
              totalCount={pendingOrders.length}
              filteredCount={filteredOrders.length}
            />

            {/* Mobile: Add filters toggle */}
            {isMobile && (
              <button
                onClick={() => setShowOrdExtraFilters(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', background: showOrdExtraFilters ? '#dbeafe' : '#f1f5f9', border: 'none', borderRadius: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', marginBottom: '0.75rem', color: showOrdExtraFilters ? '#1d4ed8' : '#475569' }}>
                <SlidersHorizontal size={14} />
                {showOrdExtraFilters ? 'Hide filters' : 'Add filters'}
              </button>
            )}

            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <FlaskConical size={48} style={{ marginBottom: '1rem', opacity: 0.35 }} />
                <p style={{ margin: 0 }}>No pending lab orders</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredOrders.map(order => (
                  <div key={order.id} style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    {/* Card header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>{order.patientName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>{order.patientMrn}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                        {order.priority === 'Urgent' && (
                          <span style={{ padding: '0.2rem 0.6rem', background: '#fef3c7', color: '#d97706', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700' }}>Urgent</span>
                        )}
                        <span style={{ padding: '0.2rem 0.6rem', background: statusBg(order.resultStatus), color: statusColor(order.resultStatus), borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', border: `1px solid ${statusColor(order.resultStatus)}30` }}>
                          {order.resultStatus ?? 'Scheduled'}
                        </span>
                      </div>
                    </div>

                    {/* Tests */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {order.tests.map(t => {
                        const cat = getCatalogTest(t)?.category;
                        return (
                          <span key={t} style={{ padding: '0.2rem 0.6rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>
                            {t}{cat ? ` · ${cat}` : ''}
                          </span>
                        );
                      })}
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.5rem', fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                      {order.orderedBy && <span>Ordered by: <strong style={{ color: '#334155' }}>{order.orderedBy}</strong></span>}
                      {order.assignedTo && <span>Assigned: <strong style={{ color: '#334155' }}>{order.assignedTo}</strong></span>}
                      {order.scheduledDate && <span>Scheduled: <strong style={{ color: '#334155' }}>{order.scheduledDate}</strong></span>}
                      <span>Created: <strong style={{ color: '#334155' }}>{new Date(order.createdAt).toLocaleDateString()}</strong></span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {(order.resultStatus ?? 'Scheduled') === 'Scheduled' && (
                        <button className="btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => updateLabOrderResultStatus(order.id, 'In Progress')}>
                          <PlayCircle size={14} /> Start Test
                        </button>
                      )}
                      <button className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => openEnterModal(order)}>
                        <CheckCircle2 size={14} /> Enter Results
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Results Tab ── */}
        {tab === 'results' && (
          <>
            <ListFilterControl
              searchValue={resSearch} onSearchChange={setResSearch} searchPlaceholder="Search by patient or test..."
              filters={[{ key: 'status', label: 'Result', options: [{ label: 'All Results', value: '' }, { label: 'Normal', value: 'Normal' }, { label: 'Abnormal', value: 'Abnormal' }] }]}
              filterValues={{ status: resStatus }}
              onFilterChange={(_, v) => setResStatus(v)}
              sortValue={resSort}
              sortOptions={[{ label: 'Newest First', value: 'time_desc' }, { label: 'Name A→Z', value: 'name_asc' }]}
              onSortChange={setResSort}
              totalCount={labResults.length}
              filteredCount={filteredResults.length}
            />

            {filteredResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <CheckCircle2 size={48} style={{ marginBottom: '1rem', opacity: 0.35 }} />
                <p style={{ margin: 0 }}>No lab results yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredResults.map(res => (
                  <div key={res.id} style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>{res.patientName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>{res.patientMrn}</div>
                      </div>
                      <span style={{ padding: '0.2rem 0.6rem', background: res.status === 'Normal' ? '#f0fdf4' : '#fef2f2', color: res.status === 'Normal' ? '#16a34a' : '#dc2626', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0 }}>
                        {res.status}
                      </span>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>{res.test}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '700', marginTop: '0.2rem', color: res.status === 'Abnormal' ? '#dc2626' : '#16a34a' }}>
                        {res.value}{res.unit ? ` ${res.unit}` : ''}
                      </div>
                      {res.range && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>Normal: {res.range}</div>}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.5rem', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      {res.completedBy && <span>By: <strong style={{ color: '#334155' }}>{res.completedBy}</strong></span>}
                      <span>Date: <strong style={{ color: '#334155' }}>{new Date(res.createdAt).toLocaleDateString()}</strong></span>
                    </div>

                    <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setReportModal(res)}>
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LabManagement;
