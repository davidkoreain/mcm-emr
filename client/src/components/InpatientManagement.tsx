import React, { useState, useMemo } from 'react';
import {
  Bed, User, Activity, Pill, Thermometer, Clock, CheckCircle, Home,
  ChevronRight, X, Stethoscope, Clipboard, ShieldAlert, Droplet, Save,
} from 'lucide-react';
import ListFilterControl from './ListFilterControl';
import Avatar from './Avatar';
import { useEMR } from '../context/EMRContext';

type BedPatient = {
  name: string | null;
  id: string;
  age: number;
  diagnosis: string;
  vitals: { bp: string; hr: string; temp: string; spo2: string; recordedBy: string; recordedAt: string };
  medications: { name: string; schedule: string; status: string }[];
  precautions: string[];
  notes: string;
};

type BedData = {
  id: number;
  occupied: boolean;
  patient: BedPatient;
  status: 'Stable' | 'Critical' | 'Empty';
};

type CareTask = {
  id: number;
  type: string;
  patient: string;
  task: string;
  time: string;
  sortTime: string;
  status: string;
};

const emptyPatient: BedPatient = {
  name: null, id: '', age: 0, diagnosis: '',
  vitals: { bp: '', hr: '', temp: '', spo2: '', recordedBy: '', recordedAt: '' },
  medications: [], precautions: ['None'], notes: '',
};

const namedMap: Record<number, string> = { 1: 'Abebe Bikila', 3: 'Mulu Worku', 5: 'Kassa Tessema' };

const initialBeds: BedData[] = Array.from({ length: 20 }, (_, i) => {
  const n = i + 1;
  const occupied = [1, 3, 5, 6, 8, 10, 12, 15, 16, 18].includes(n);
  const status: BedData['status'] = n === 5 ? 'Critical' : occupied ? 'Stable' : 'Empty';
  return {
    id: n, occupied, status,
    patient: occupied ? {
      name: namedMap[n] ?? null,
      id: `PAT-00${n}`,
      age: 45 + i,
      diagnosis: n === 1 ? 'Pneumonia with Pleural Effusion' : 'Post-op Recovery (Cholecystectomy)',
      vitals: { bp: '120/80', hr: '75', temp: '37.2', spo2: '98%', recordedBy: 'Nurse Martha', recordedAt: '2026-05-12 08:30' },
      medications: [
        { name: 'Amoxicillin 500mg', schedule: '08:00, 14:00, 20:00', status: 'Given' },
        { name: 'Paracetamol 1g', schedule: '09:00, 15:00', status: 'Pending' },
      ],
      precautions: n === 5 ? ['Fall Risk', 'Strict NPO'] : ['None'],
      notes: 'Patient stable, continuing IV fluids.',
    } : emptyPatient,
  };
});

const initialCareTasks: CareTask[] = [
  { id: 1, type: 'Medication', patient: 'Abebe Bikila (Bed 1)', task: 'Amoxicillin 500mg', time: '09:00 AM', sortTime: '09:00', status: 'Pending' },
  { id: 2, type: 'Vitals', patient: 'Mulu Worku (Bed 3)', task: 'Morning Vitals Check', time: '09:30 AM', sortTime: '09:30', status: 'Completed' },
  { id: 3, type: 'Hygiene', patient: 'Kassa Tessema (Bed 5)', task: 'Sponge Bath', time: '10:00 AM', sortTime: '10:00', status: 'Pending' },
  { id: 4, type: 'Medication', patient: 'Abebe Bikila (Bed 1)', task: 'Paracetamol 1g', time: '11:00 AM', sortTime: '11:00', status: 'Pending' },
  { id: 5, type: 'Vitals', patient: 'Kassa Tessema (Bed 5)', task: 'Afternoon Vitals', time: '14:00 PM', sortTime: '14:00', status: 'Pending' },
];

const wards = [
  { id: 'W1', name: 'General Ward A', totalBeds: 20, occupied: 15 },
  { id: 'W2', name: 'General Ward B', totalBeds: 20, occupied: 12 },
  { id: 'ICU', name: 'Intensive Care Unit', totalBeds: 8, occupied: 6 },
];

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const boxStyle: React.CSSProperties = { background: 'white', borderRadius: '1rem', padding: '2rem', width: '460px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };

const InpatientManagement: React.FC = () => {
  const { patients } = useEMR();
  const [activeTab, setActiveTab] = useState<'ward' | 'care'>('ward');
  const [selectedBed, setSelectedBed] = useState<number | null>(null);
  const [beds, setBeds] = useState<BedData[]>(initialBeds);
  const [careTasks, setCareTasks] = useState<CareTask[]>(initialCareTasks);
  const [noteEdits, setNoteEdits] = useState<Record<number, string>>({});

  const [careSearch, setCareSearch] = useState('');
  const [careFilters, setCareFilters] = useState<Record<string, string>>({ type: '', status: '' });
  const [careSort, setCareSort] = useState('time_asc');

  const [vitalsModal, setVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({ bedId: 1, bp: '', hr: '', temp: '', spo2: '' });
  const [medsModal, setMedsModal] = useState(false);
  const [nursingModal, setNursingModal] = useState(false);
  const [nursingForm, setNursingForm] = useState({ bedId: 1, note: '' });

  const occupiedBeds = beds.filter(b => b.occupied);

  const filteredTasks = useMemo(() => {
    let result = careTasks.filter((t) => {
      const q = careSearch.toLowerCase();
      if (q && !t.patient.toLowerCase().includes(q) && !t.task.toLowerCase().includes(q)) return false;
      if (careFilters.type && t.type !== careFilters.type) return false;
      if (careFilters.status && t.status !== careFilters.status) return false;
      return true;
    });
    return [...result].sort((a, b) =>
      careSort === 'time_desc' ? b.sortTime.localeCompare(a.sortTime) : a.sortTime.localeCompare(b.sortTime)
    );
  }, [careTasks, careSearch, careFilters, careSort]);

  const handleUpdateRecord = (bedId: number) => {
    const note = noteEdits[bedId];
    if (note !== undefined) {
      setBeds(prev => prev.map(b => b.id === bedId ? { ...b, patient: { ...b.patient, notes: note } } : b));
      setNoteEdits(prev => { const n = { ...prev }; delete n[bedId]; return n; });
    }
    setSelectedBed(null);
  };

  const handleSaveVitals = () => {
    const { bedId, bp, hr, temp, spo2 } = vitalsForm;
    if (!bp && !hr && !temp && !spo2) return;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setBeds(prev => prev.map(b => b.id === bedId ? {
      ...b, patient: { ...b.patient, vitals: {
        bp: bp || b.patient.vitals.bp,
        hr: hr || b.patient.vitals.hr,
        temp: temp || b.patient.vitals.temp,
        spo2: spo2 || b.patient.vitals.spo2,
        recordedBy: 'Current Nurse', recordedAt: now,
      }}
    } : b));
    setCareTasks(prev => prev.map(t =>
      t.type === 'Vitals' && t.patient.includes(`Bed ${bedId}`) ? { ...t, status: 'Completed' } : t
    ));
    setVitalsModal(false);
    setVitalsForm({ bedId: occupiedBeds[0]?.id ?? 1, bp: '', hr: '', temp: '', spo2: '' });
  };

  const handleAdministerMed = (bedId: number, medIdx: number) => {
    setBeds(prev => prev.map(b => b.id === bedId ? {
      ...b, patient: { ...b.patient, medications: b.patient.medications.map((m, i) =>
        i === medIdx ? { ...m, status: 'Given' } : m
      )}
    } : b));
    setCareTasks(prev => prev.map(t =>
      t.type === 'Medication' && t.patient.includes(`Bed ${bedId}`) ? { ...t, status: 'Completed' } : t
    ));
  };

  const handleSaveNursingNote = () => {
    if (!nursingForm.note.trim()) return;
    const bed = beds.find(b => b.id === nursingForm.bedId);
    if (!bed) return;
    setBeds(prev => prev.map(b =>
      b.id === nursingForm.bedId ? { ...b, patient: { ...b.patient, notes: nursingForm.note } } : b
    ));
    const now = new Date();
    setCareTasks(prev => [...prev, {
      id: Date.now(), type: 'Hygiene',
      patient: `${bed.patient.name ?? `Patient`} (Bed ${nursingForm.bedId})`,
      task: 'Nursing Note Added',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sortTime: now.toTimeString().slice(0, 5),
      status: 'Completed',
    }]);
    setNursingModal(false);
    setNursingForm({ bedId: occupiedBeds[0]?.id ?? 1, note: '' });
  };

  const bedLabel = (b: BedData) => `Bed ${b.id}${b.patient.name ? ` – ${b.patient.name}` : ''}`;

  const renderBedPopup = () => {
    if (selectedBed === null) return null;
    const bed = beds.find(b => b.id === selectedBed);
    if (!bed || !bed.occupied) return null;
    const currentNote = noteEdits[bed.id] ?? bed.patient.notes;
    const emrPatient = patients.find(p => p.name === bed.patient.name);
    const photoUrl = emrPatient?.photoUrl;

    return (
      <div style={{ ...overlayStyle, zIndex: 1001 }}>
        <div style={{ background: 'white', width: '850px', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          <div style={{ background: bed.status === 'Critical' ? '#ef4444' : 'var(--primary-color)', padding: '1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Bed size={32} />
              <div>
                <h2 style={{ fontSize: '1.5rem' }}>Bed {bed.id} - Patient Status</h2>
                <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>{bed.patient.name} ({bed.patient.age}Y/M) | ID: {bed.patient.id}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ borderRadius: '50%', border: '3px solid rgba(255,255,255,0.7)', overflow: 'hidden' }}>
                <Avatar
                  name={bed.patient.name ?? 'Patient'}
                  photoUrl={photoUrl}
                  size={64}
                  style={{ display: 'block' }}
                />
              </div>
              <button onClick={() => setSelectedBed(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={28} /></button>
            </div>
          </div>

          <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>
                <Stethoscope size={20} color="var(--primary-color)" /> Clinical Summary
              </h3>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>DIAGNOSIS</label>
                <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>{bed.patient.diagnosis}</p>
              </div>
              <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.75rem' }}>LATEST VITALS</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { icon: <Droplet size={18} color="#ef4444" />, label: 'BP', value: bed.patient.vitals.bp },
                  { icon: <Activity size={18} color="#10b981" />, label: 'HR', value: `${bed.patient.vitals.hr} bpm` },
                  { icon: <Thermometer size={18} color="#f59e0b" />, label: 'TEMP', value: `${bed.patient.vitals.temp} °C` },
                  { icon: <Activity size={18} color="#3b82f6" />, label: 'SpO2', value: bed.patient.vitals.spo2 },
                ].map(v => (
                  <div key={v.label} className="stat-card" style={{ padding: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {v.icon}
                    <div><div style={{ fontSize: '0.7rem' }}>{v.label}</div><div style={{ fontWeight: '700' }}>{v.value}</div></div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                <User size={12} /> {bed.patient.vitals.recordedBy} at {bed.patient.vitals.recordedAt}
              </div>
            </div>

            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>
                <Pill size={20} color="var(--primary-color)" /> Medication & Care
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {bed.patient.medications.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #dcfce7' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {m.schedule}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: m.status === 'Given' ? '#16a34a' : '#f59e0b' }}>{m.status}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #ffedd5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c2410c', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <ShieldAlert size={16} /> SPECIAL PRECAUTIONS
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {bed.patient.precautions.map((p, idx) => (
                    <span key={idx} style={{ background: 'white', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', border: '1px solid #fed7aa' }}>{p}</span>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>NURSING NOTES</label>
                <textarea rows={2}
                  style={{ width: '100%', marginTop: '0.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem', fontSize: '0.85rem' }}
                  value={currentNote}
                  onChange={(e) => setNoteEdits(prev => ({ ...prev, [bed.id]: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => window.print()}>
              <Clipboard size={18} /> Full Chart
            </button>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleUpdateRecord(bed.id)}>
              <Save size={18} /> Update Record
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="inpatient-container">
      {renderBedPopup()}

      {vitalsModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Record Daily Vitals</h3>
              <button onClick={() => setVitalsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Patient</label>
                <select value={vitalsForm.bedId} onChange={(e) => setVitalsForm(f => ({ ...f, bedId: +e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                  {occupiedBeds.map(b => <option key={b.id} value={b.id}>{bedLabel(b)}</option>)}
                </select>
              </div>
              {(['bp', 'hr', 'temp', 'spo2'] as const).map(key => (
                <div key={key}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                    {{ bp: 'Blood Pressure (mmHg)', hr: 'Heart Rate (bpm)', temp: 'Temperature (°C)', spo2: 'SpO2 (%)' }[key]}
                  </label>
                  <input type="text" value={vitalsForm[key]}
                    placeholder={{ bp: 'e.g. 120/80', hr: 'e.g. 75', temp: 'e.g. 37.2', spo2: 'e.g. 98%' }[key]}
                    onChange={(e) => setVitalsForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setVitalsModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveVitals}>Save Vitals</button>
            </div>
          </div>
        </div>
      )}

      {medsModal && (
        <div style={overlayStyle}>
          <div style={{ ...boxStyle, width: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Administer Medications</h3>
              <button onClick={() => setMedsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {occupiedBeds.flatMap(bed =>
                bed.patient.medications
                  .map((med, idx) => ({ bed, med, idx }))
                  .filter(({ med }) => med.status === 'Pending')
              ).map(({ bed, med, idx }) => (
                <div key={`${bed.id}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#fefce8', borderRadius: '0.75rem', border: '1px solid #fef08a' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{med.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{bedLabel(bed)} | {med.schedule}</div>
                  </div>
                  <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => handleAdministerMed(bed.id, idx)}>Mark Given</button>
                </div>
              ))}
              {occupiedBeds.every(b => b.patient.medications.every(m => m.status === 'Given')) && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#16a34a', fontWeight: '600' }}>
                  ✓ All medications have been administered.
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setMedsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {nursingModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Add Nursing Note</h3>
              <button onClick={() => setNursingModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Patient</label>
                <select value={nursingForm.bedId} onChange={(e) => setNursingForm(f => ({ ...f, bedId: +e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                  {occupiedBeds.map(b => <option key={b.id} value={b.id}>{bedLabel(b)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Note *</label>
                <textarea rows={5} value={nursingForm.note} placeholder="Enter nursing note..."
                  onChange={(e) => setNursingForm(f => ({ ...f, note: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setNursingModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveNursingNote} disabled={!nursingForm.note.trim()}>Save Note</button>
            </div>
          </div>
        </div>
      )}

      <div className="pharmacy-tabs">
        <button className={`tab-btn ${activeTab === 'ward' ? 'active' : ''}`} onClick={() => setActiveTab('ward')}>
          <Home size={20} /> Ward Overview (Bed Map)
        </button>
        <button className={`tab-btn ${activeTab === 'care' ? 'active' : ''}`} onClick={() => setActiveTab('care')}>
          <Activity size={20} /> Daily Care & Rounding
        </button>
      </div>

      <div className="inpatient-content" style={{ marginTop: '1.5rem' }}>
        {activeTab === 'ward' ? (
          <div className="ward-layout">
            <div className="ward-selector" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {wards.map(w => (
                <div key={w.id} className="stat-card" style={{ flex: 1, padding: '1rem', border: '2px solid transparent' }}>
                  <div style={{ fontWeight: '700' }}>{w.name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{w.occupied} / {w.totalBeds} Beds Occupied</div>
                  <div style={{ height: '4px', background: '#eee', marginTop: '0.5rem', borderRadius: '2px' }}>
                    <div style={{ width: `${(w.occupied / w.totalBeds) * 100}%`, height: '100%', background: 'var(--secondary-color)', borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="bed-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
              {beds.map(bed => (
                <div key={bed.id} onClick={() => bed.occupied && setSelectedBed(bed.id)}
                  style={{
                    padding: '1rem', borderRadius: '0.75rem', textAlign: 'center',
                    background: bed.occupied ? (bed.status === 'Critical' ? '#fee2e2' : '#e0f2fe') : '#f8fafc',
                    border: `1px solid ${bed.occupied ? (bed.status === 'Critical' ? '#ef4444' : '#3b82f6') : '#e2e8f0'}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: bed.occupied ? 'pointer' : 'default',
                  }}
                  onMouseEnter={e => { if (bed.occupied) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Bed size={28} color={bed.occupied ? (bed.status === 'Critical' ? '#ef4444' : '#3b82f6') : '#94a3b8'} />
                  <div style={{ fontWeight: '700', marginTop: '0.5rem' }}>Bed {bed.id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {bed.occupied ? (bed.patient.name?.split(' ')[0] ?? 'Patient') : 'Available'}
                  </div>
                  {bed.occupied && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', fontWeight: '700', color: bed.status === 'Critical' ? '#ef4444' : '#3b82f6' }}>
                      {bed.status.toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="care-dashboard" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div className="task-list">
              <h3 style={{ marginBottom: '1rem' }}>Today's Care Tasks</h3>
              <ListFilterControl
                searchValue={careSearch} onSearchChange={setCareSearch} searchPlaceholder="Search patient or task..."
                filters={[
                  { key: 'type', label: 'Type', options: [{ label: 'All Types', value: '' }, { label: 'Medication', value: 'Medication' }, { label: 'Vitals', value: 'Vitals' }, { label: 'Hygiene', value: 'Hygiene' }] },
                  { key: 'status', label: 'Status', options: [{ label: 'All', value: '' }, { label: 'Pending', value: 'Pending' }, { label: 'Completed', value: 'Completed' }] },
                ]}
                filterValues={careFilters} onFilterChange={(k, v) => setCareFilters(prev => ({ ...prev, [k]: v }))}
                sortValue={careSort} sortOptions={[{ label: 'Time ↑ (Earliest)', value: 'time_asc' }, { label: 'Time ↓ (Latest)', value: 'time_desc' }]}
                onSortChange={setCareSort} totalCount={careTasks.length} filteredCount={filteredTasks.length}
              />
              <div className="mobile-scroll-hint">← Swipe to see more →</div>
        <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Time</th><th>Patient / Bed</th><th>Task Type</th><th>Description</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(task => (
                      <tr key={task.id}>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} /> {task.time}</div></td>
                        <td><strong>{task.patient}</strong></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {task.type === 'Medication' ? <Pill size={16} color="#8b5cf6" /> : task.type === 'Vitals' ? <Thermometer size={16} color="#ef4444" /> : <Activity size={16} color="#10b981" />}
                            {task.type}
                          </div>
                        </td>
                        <td>{task.task}</td>
                        <td><span className={`status-badge ${task.status === 'Completed' ? 'status-active' : 'status-pending'}`}>{task.status}</span></td>
                      </tr>
                    ))}
                    {filteredTasks.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No tasks match your search criteria.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="patient-quick-view">
              <div className="stat-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button className="btn-secondary" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                    onClick={() => { setVitalsForm({ bedId: occupiedBeds[0]?.id ?? 1, bp: '', hr: '', temp: '', spo2: '' }); setVitalsModal(true); }}>
                    <span>Daily Vitals</span><ChevronRight size={18} />
                  </button>
                  <button className="btn-secondary" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                    onClick={() => setMedsModal(true)}>
                    <span>Administer Meds</span><ChevronRight size={18} />
                  </button>
                  <button className="btn-secondary" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                    onClick={() => { setNursingForm({ bedId: occupiedBeds[0]?.id ?? 1, note: '' }); setNursingModal(true); }}>
                    <span>Nursing Note</span><ChevronRight size={18} />
                  </button>
                </div>
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: '700', marginBottom: '0.5rem' }}>
                    <CheckCircle size={16} /> Today's Progress
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {careTasks.filter(t => t.status === 'Completed').length} / {careTasks.length} tasks completed
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InpatientManagement;
