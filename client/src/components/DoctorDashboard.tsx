import React, { useState } from 'react';
import { Plus, X, CheckCircle, Stethoscope, FlaskConical, Scan, Pill } from 'lucide-react';
import { useEMR } from '../context/EMRContext';

// ── Types ──────────────────────────────────────────────────────

type OrderItem = {
  id: string;
  category: 'Lab' | 'Radiology' | 'Other';
  test: string;
  status: 'Ordered' | 'In Progress' | 'Completed';
  result: string;
};

type Prescription = {
  id: string;
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
};

type Consultation = {
  chiefComplaint: string;
  symptoms: string[];
  examNotes: string;
  orders: OrderItem[];
  diagnosis: string;
  icd10: string;
  prescriptions: Prescription[];
  plan: '' | 'Discharge' | 'Admit' | 'Follow-up';
  ward: string;
  followupDate: string;
  clinicalNotes: string;
};

// ── Constants ──────────────────────────────────────────────────

const EMPTY = (): Consultation => ({
  chiefComplaint: '', symptoms: [], examNotes: '', orders: [],
  diagnosis: '', icd10: '', prescriptions: [],
  plan: '', ward: '', followupDate: '', clinicalNotes: '',
});

const LAB_TESTS = [
  'CBC (Complete Blood Count)', 'LFT (Liver Function Test)', 'RFT (Renal Function Test)',
  'Blood Sugar (Fasting)', 'Blood Sugar (Random)', 'HbA1c', 'Lipid Profile',
  'Thyroid Function (TSH)', 'Urine Analysis', 'Malaria RDT', 'HIV Test',
  'Blood Culture', 'CRP / ESR', 'Coagulation Profile',
];
const RADIOLOGY_TESTS = [
  'Chest X-Ray', 'Abdominal X-Ray', 'Ultrasound (Abdomen)', 'Ultrasound (Pelvis)',
  'CT Scan (Head)', 'CT Scan (Chest)', 'CT Scan (Abdomen)', 'MRI (Brain)', 'Echocardiogram',
];
const OTHER_TESTS = ['ECG (12-Lead)', 'Spirometry', 'Endoscopy', 'Bronchoscopy', 'Biopsy'];

const COMMON_SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Chest Pain', 'Shortness of Breath',
  'Abdominal Pain', 'Nausea / Vomiting', 'Diarrhea', 'Fatigue',
  'Dizziness', 'Joint Pain', 'Rash', 'Loss of Appetite', 'Weight Loss',
];

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  'Waiting':            { bg: '#fff7ed', text: '#c2410c' },
  'In Consultation':    { bg: '#eff6ff', text: '#1d4ed8' },
  'Awaiting Results':   { bg: '#faf5ff', text: '#7c3aed' },
  'Results Ready':      { bg: '#ecfeff', text: '#0e7490' },
  'Completed':          { bg: '#f0fdf4', text: '#15803d' },
  'Inpatient':          { bg: '#fef2f2', text: '#dc2626' },
};

const sc = (status: string) => STATUS_COLOR[status] ?? { bg: '#f1f5f9', text: '#475569' };

// ── Helpers ────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.45rem',
  border: '1px solid #e2e8f0', fontSize: '0.875rem', fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const label = (text: string) => (
  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>{text}</div>
);

// ── Component ──────────────────────────────────────────────────

const DoctorDashboard: React.FC = () => {
  const { patients, updatePatient } = useEMR();

  const [consults, setConsults] = useState<Record<string, Consultation>>({});
  const [selectedMrn, setSelectedMrn] = useState<string | null>(null);
  const [tab, setTab] = useState<'assessment' | 'orders' | 'results' | 'treatment'>('assessment');
  const [newSymptom, setNewSymptom] = useState('');
  const [newOrder, setNewOrder] = useState<{ category: 'Lab' | 'Radiology' | 'Other'; test: string }>({ category: 'Lab', test: '' });
  const [newRx, setNewRx] = useState({ drug: '', dose: '', frequency: '', duration: '', route: 'Oral' });
  const [resultDraft, setResultDraft] = useState<Record<string, string>>({});

  const queue = patients.filter(p => !['Completed'].includes(p.status));
  const selected = selectedMrn ? patients.find(p => p.mrn === selectedMrn) ?? null : null;

  const get = (mrn: string): Consultation => consults[mrn] ?? EMPTY();
  const patch = (mrn: string, diff: Partial<Consultation>) =>
    setConsults(prev => ({ ...prev, [mrn]: { ...get(mrn), ...diff } }));
  const c = selectedMrn ? get(selectedMrn) : null;

  // Stats
  const inConsult  = patients.filter(p => p.status === 'In Consultation').length;
  const awaiting   = patients.filter(p => p.status === 'Awaiting Results').length;
  const ready      = patients.filter(p => p.status === 'Results Ready').length;

  // ── Actions ────────────────────────────────────────────────

  const startConsult = () => {
    if (!selectedMrn) return;
    updatePatient(selectedMrn, { status: 'In Consultation' });
    setTab('assessment');
  };

  const placeOrders = () => {
    if (!selectedMrn || !c || c.orders.length === 0) return;
    updatePatient(selectedMrn, { status: 'Awaiting Results' });
    setTab('results');
  };

  const markResultsDone = () => {
    if (!selectedMrn) return;
    updatePatient(selectedMrn, { status: 'Results Ready' });
    setTab('treatment');
  };

  const completeVisit = () => {
    if (!selectedMrn || !c || !c.diagnosis.trim() || !c.plan) return;
    updatePatient(selectedMrn, { status: c.plan === 'Admit' ? 'Inpatient' : 'Completed' });
    setSelectedMrn(null);
  };

  const addSymptom = (s: string) => {
    if (!selectedMrn || !s.trim()) return;
    const cur = get(selectedMrn);
    if (!cur.symptoms.includes(s)) patch(selectedMrn, { symptoms: [...cur.symptoms, s] });
    setNewSymptom('');
  };

  const addOrder = () => {
    if (!selectedMrn || !newOrder.test) return;
    const cur = get(selectedMrn);
    patch(selectedMrn, {
      orders: [...cur.orders, { id: Date.now().toString(), ...newOrder, status: 'Ordered', result: '' }],
    });
    setNewOrder(prev => ({ ...prev, test: '' }));
  };

  const saveResult = (orderId: string) => {
    if (!selectedMrn) return;
    const val = resultDraft[orderId] ?? '';
    const cur = get(selectedMrn);
    patch(selectedMrn, {
      orders: cur.orders.map(o => o.id === orderId ? { ...o, result: val, status: 'Completed' } : o),
    });
    setResultDraft(prev => { const n = { ...prev }; delete n[orderId]; return n; });
  };

  const addRx = () => {
    if (!selectedMrn || !newRx.drug.trim()) return;
    const cur = get(selectedMrn);
    patch(selectedMrn, { prescriptions: [...cur.prescriptions, { id: Date.now().toString(), ...newRx }] });
    setNewRx({ drug: '', dose: '', frequency: '', duration: '', route: 'Oral' });
  };

  // ── Render ─────────────────────────────────────────────────

  const tabBtn = (key: typeof tab, icon: React.ReactNode, title: string) => (
    <button
      onClick={() => setTab(key)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
        fontWeight: tab === key ? '600' : '400', fontSize: '0.85rem',
        color: tab === key ? '#2563eb' : '#64748b',
        borderBottom: `2px solid ${tab === key ? '#2563eb' : 'transparent'}`,
        marginBottom: '-1px',
      }}
    >
      {icon}{title}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {[
          { label: "Today's Queue",    value: queue.length,  color: '#3b82f6' },
          { label: 'In Consultation',  value: inConsult,     color: '#6366f1' },
          { label: 'Awaiting Results', value: awaiting,      color: '#8b5cf6' },
          { label: 'Results Ready',    value: ready,         color: '#0891b2' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Split panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>

        {/* Patient queue */}
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem', overflowY: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.75rem' }}>
            Patient Queue
          </div>
          {queue.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>No active patients</p>
          )}
          {queue.map(p => {
            const active = selectedMrn === p.mrn;
            return (
              <div
                key={p.mrn}
                onClick={() => { setSelectedMrn(p.mrn); setTab('assessment'); }}
                style={{
                  padding: '0.8rem', borderRadius: '0.5rem', cursor: 'pointer', marginBottom: '0.4rem',
                  background: active ? '#eff6ff' : '#f8fafc',
                  border: `1px solid ${active ? '#93c5fd' : '#e2e8f0'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.mrn} · {p.visitType} · {p.time}</div>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '9999px', whiteSpace: 'nowrap', background: sc(p.status).bg, color: sc(p.status).text }}>
                    {p.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Consultation panel */}
        {!selected ? (
          <div style={{ background: 'white', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
            <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
              <Stethoscope size={52} />
              <p style={{ marginTop: '0.75rem', fontWeight: '500', color: '#94a3b8' }}>Select a patient to begin</p>
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', overflowY: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>

            {/* Patient header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{selected.name}</h2>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {selected.mrn} · {selected.gender} · DOB: {selected.dob} · {selected.visitType}
                </div>
                {selected.vitals.length > 0 && (() => {
                  const v = selected.vitals[selected.vitals.length - 1];
                  return (
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#475569', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                      {v.temperature  && <span>🌡 {v.temperature}°C</span>}
                      {v.heartRate    && <span>❤️ {v.heartRate} bpm</span>}
                      {v.bpSystolic  && <span>💉 {v.bpSystolic}/{v.bpDiastolic} mmHg</span>}
                      {v.spo2        && <span>🫁 SpO2 {v.spo2}%</span>}
                    </div>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '700', background: sc(selected.status).bg, color: sc(selected.status).text }}>
                  {selected.status}
                </span>
                {selected.status === 'Waiting' && (
                  <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }} onClick={startConsult}>
                    Start Consultation
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              {tabBtn('assessment', <Stethoscope size={15}/>, 'Assessment')}
              {tabBtn('orders',     <FlaskConical size={15}/>, 'Orders')}
              {tabBtn('results',    <Scan size={15}/>,         'Results')}
              {tabBtn('treatment',  <Pill size={15}/>,         'Diagnosis & Rx')}
            </div>

            {/* ── TAB: Assessment ── */}
            {tab === 'assessment' && c && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  {label('Chief Complaint')}
                  <textarea
                    value={c.chiefComplaint}
                    onChange={e => patch(selectedMrn, { chiefComplaint: e.target.value })}
                    placeholder="Patient's main complaint in their own words…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div>
                  {label('Symptoms')}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
                    {COMMON_SYMPTOMS.map(s => {
                      const on = c.symptoms.includes(s);
                      return (
                        <button key={s} onClick={() => on
                          ? patch(selectedMrn, { symptoms: c.symptoms.filter(x => x !== s) })
                          : addSymptom(s)}
                          style={{ padding: '0.22rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', cursor: 'pointer', border: `1px solid ${on ? '#93c5fd' : '#e2e8f0'}`, background: on ? '#dbeafe' : '#f8fafc', color: on ? '#1d4ed8' : '#64748b', fontWeight: on ? '600' : '400' }}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input value={newSymptom} onChange={e => setNewSymptom(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSymptom(newSymptom)}
                      placeholder="Custom symptom… (Enter to add)"
                      style={{ ...inputStyle, flex: 1 }} />
                    <button className="btn-primary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem' }} onClick={() => addSymptom(newSymptom)}>Add</button>
                  </div>
                </div>

                <div>
                  {label('Physical Examination')}
                  <textarea value={c.examNotes} onChange={e => patch(selectedMrn, { examNotes: e.target.value })}
                    placeholder="General appearance, auscultation, palpation, percussion findings…"
                    rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button className="btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => setTab('treatment')} disabled={selected.status === 'Waiting'}>
                    Skip to Diagnosis
                  </button>
                  <button className="btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => setTab('orders')} disabled={selected.status === 'Waiting'}>
                    Proceed to Orders →
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB: Orders ── */}
            {tab === 'orders' && c && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end' }}>
                  <div style={{ width: '120px' }}>
                    {label('Category')}
                    <select value={newOrder.category} onChange={e => setNewOrder({ category: e.target.value as typeof newOrder.category, test: '' })} style={inputStyle}>
                      <option value="Lab">Lab</option>
                      <option value="Radiology">Radiology</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    {label('Test')}
                    <select value={newOrder.test} onChange={e => setNewOrder(prev => ({ ...prev, test: e.target.value }))} style={inputStyle}>
                      <option value="">Select test…</option>
                      {(newOrder.category === 'Lab' ? LAB_TESTS : newOrder.category === 'Radiology' ? RADIOLOGY_TESTS : OTHER_TESTS).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn-primary" onClick={addOrder} style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Plus size={16} /> Add
                  </button>
                </div>

                {c.orders.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.85rem' }}>No orders yet.</p>
                ) : (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead><tr><th>Category</th><th>Test</th><th>Status</th><th></th></tr></thead>
                      <tbody>
                        {c.orders.map(o => (
                          <tr key={o.id}>
                            <td>
                              <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.3rem', fontSize: '0.75rem', background: o.category === 'Lab' ? '#eff6ff' : o.category === 'Radiology' ? '#faf5ff' : '#f0fdf4', color: o.category === 'Lab' ? '#1d4ed8' : o.category === 'Radiology' ? '#7c3aed' : '#15803d' }}>
                                {o.category}
                              </span>
                            </td>
                            <td style={{ fontWeight: '500' }}>{o.test}</td>
                            <td><span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#fef9c3', color: '#854d0e' }}>Ordered</span></td>
                            <td>
                              <button onClick={() => patch(selectedMrn, { orders: c.orders.filter(x => x.id !== o.id) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button className="btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => setTab('treatment')}>Skip to Diagnosis</button>
                  <button className="btn-primary" style={{ fontSize: '0.85rem' }} onClick={placeOrders} disabled={c.orders.length === 0}>
                    Place Orders & Await Results
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB: Results ── */}
            {tab === 'results' && c && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {c.orders.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.85rem' }}>No tests ordered.</p>
                ) : (
                  <>
                    <p style={{ fontSize: '0.83rem', color: '#64748b' }}>Enter results as they arrive. All completed → Proceed to Diagnosis.</p>
                    {c.orders.map(o => (
                      <div key={o.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.6rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div>
                            <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{o.test}</span>
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>{o.category}</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: o.status === 'Completed' ? '#dcfce7' : '#fef9c3', color: o.status === 'Completed' ? '#15803d' : '#854d0e' }}>
                            {o.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            value={resultDraft[o.id] ?? o.result}
                            onChange={e => setResultDraft(prev => ({ ...prev, [o.id]: e.target.value }))}
                            placeholder="Enter result or findings…"
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: '#10b981' }} onClick={() => saveResult(o.id)}>
                            Save
                          </button>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn-primary" style={{ fontSize: '0.85rem' }} onClick={markResultsDone}>
                        All Results In → Proceed to Diagnosis
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── TAB: Diagnosis & Rx ── */}
            {tab === 'treatment' && c && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Diagnosis */}
                <div>
                  {label('Diagnosis *')}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input value={c.diagnosis} onChange={e => patch(selectedMrn, { diagnosis: e.target.value })}
                      placeholder="Primary diagnosis…" style={{ ...inputStyle, flex: 1 }} />
                    <input value={c.icd10} onChange={e => patch(selectedMrn, { icd10: e.target.value })}
                      placeholder="ICD-10" style={{ ...inputStyle, width: '100px', flex: 'none' }} />
                  </div>
                </div>

                {/* Prescriptions */}
                <div>
                  {label('Prescriptions')}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '0.4rem', alignItems: 'flex-end', marginBottom: '0.6rem' }}>
                    {[
                      { key: 'drug',      ph: 'Drug name',  lbl: 'Drug' },
                      { key: 'dose',      ph: '500mg',      lbl: 'Dose' },
                      { key: 'frequency', ph: 'TID',        lbl: 'Frequency' },
                      { key: 'duration',  ph: '7 days',     lbl: 'Duration' },
                    ].map(({ key, ph, lbl }) => (
                      <div key={key}>
                        {label(lbl)}
                        <input value={newRx[key as keyof typeof newRx]}
                          onChange={e => setNewRx(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={ph} style={inputStyle} />
                      </div>
                    ))}
                    <div>
                      {label('Route')}
                      <select value={newRx.route} onChange={e => setNewRx(prev => ({ ...prev, route: e.target.value }))} style={inputStyle}>
                        <option>Oral</option><option>IV</option><option>IM</option><option>SC</option><option>Topical</option>
                      </select>
                    </div>
                    <button className="btn-primary" onClick={addRx} style={{ padding: '0.55rem 0.8rem', fontSize: '0.85rem', marginTop: '1rem' }}>
                      <Plus size={16} />
                    </button>
                  </div>
                  {c.prescriptions.length > 0 && (
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead><tr><th>Drug</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Route</th><th></th></tr></thead>
                        <tbody>
                          {c.prescriptions.map(rx => (
                            <tr key={rx.id}>
                              <td style={{ fontWeight: '600' }}>{rx.drug}</td>
                              <td>{rx.dose}</td><td>{rx.frequency}</td><td>{rx.duration}</td><td>{rx.route}</td>
                              <td>
                                <button onClick={() => patch(selectedMrn, { prescriptions: c.prescriptions.filter(x => x.id !== rx.id) })}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                  <X size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Outcome plan */}
                <div>
                  {label('Outcome Plan *')}
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {(['Discharge', 'Admit', 'Follow-up'] as const).map(plan => {
                      const colors = plan === 'Admit' ? { on: '#fee2e2', border: '#fca5a5', text: '#dc2626' }
                        : plan === 'Discharge' ? { on: '#dcfce7', border: '#86efac', text: '#15803d' }
                        : { on: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' };
                      const on = c.plan === plan;
                      return (
                        <button key={plan} onClick={() => patch(selectedMrn, { plan })}
                          style={{ padding: '0.5rem 1.2rem', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600',
                            background: on ? colors.on : '#f1f5f9', color: on ? colors.text : '#64748b',
                            border: `2px solid ${on ? colors.border : '#e2e8f0'}` }}>
                          {plan === 'Discharge' ? 'Discharge' : plan === 'Admit' ? 'Admit to Ward' : 'Follow-up'}
                        </button>
                      );
                    })}
                  </div>
                  {c.plan === 'Admit' && (
                    <input value={c.ward} onChange={e => patch(selectedMrn, { ward: e.target.value })}
                      placeholder="Ward / Room (e.g. General Ward A, ICU)"
                      style={{ ...inputStyle, marginTop: '0.6rem', borderColor: '#fca5a5' }} />
                  )}
                  {c.plan === 'Follow-up' && (
                    <input type="date" value={c.followupDate} onChange={e => patch(selectedMrn, { followupDate: e.target.value })}
                      style={{ ...inputStyle, marginTop: '0.6rem', width: 'auto', borderColor: '#93c5fd' }} />
                  )}
                </div>

                {/* Clinical notes */}
                <div>
                  {label('Clinical Notes')}
                  <textarea value={c.clinicalNotes} onChange={e => patch(selectedMrn, { clinicalNotes: e.target.value })}
                    placeholder="Patient instructions, follow-up guidance, additional notes…"
                    rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                {/* Complete */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    className="btn-primary"
                    onClick={completeVisit}
                    disabled={!c.diagnosis.trim() || !c.plan}
                    style={{ fontSize: '0.9rem', padding: '0.6rem 1.75rem', background: (!c.diagnosis.trim() || !c.plan) ? '#94a3b8' : '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <CheckCircle size={18} />
                    Complete Visit
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
