import React, { useState, useEffect } from 'react';
import { 
  Activity, Pill, ClipboardList, CheckSquare, Plus, BedDouble, 
  Clock, CheckCircle, ShieldAlert, AlertCircle, Sparkles, Check, 
  LogOut, Star, UserCheck, Calendar, RefreshCw
} from 'lucide-react';
import { useEMR } from '../context/EMRContext';
import type { Patient, VitalsRecord } from '../context/EMRContext';
import Avatar from './Avatar';

// ── Types ──────────────────────────────────────────────────────
type NurseNote = { id: string; text: string; time: string; };
type CareTask = { id: string; task: string; dueTime: string; completed: boolean; completedAt?: string; };
type MarEntry = { medId: string; administeredAt: string; };
type PatientNurseRecord = { notes: NurseNote[]; tasks: CareTask[]; mar: MarEntry[]; };

const emptyRecord = (): PatientNurseRecord => ({ notes: [], tasks: [], mar: [] });

const PRESET_TASKS = [
  'IV Line Check', 'Wound Dressing Change', 'Position Change',
  'Oral Hygiene', 'Fluid Balance Monitoring', 'Pain Assessment',
  'Blood Pressure Monitoring', 'Blood Glucose Check', 'Catheter Care',
  'Deep Breathing Exercises',
];

const EMPTY_VITALS: Partial<VitalsRecord> = {
  temperature: '', heartRate: '', respiratoryRate: '',
  bpSystolic: '', bpDiastolic: '', weightKg: '', heightCm: '', spo2: '',
};

// ── Styles & Aesthetics ──────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', 
  padding: '0.65rem 0.85rem', 
  borderRadius: '0.5rem',
  border: '1px solid #cbd5e1', 
  fontSize: '0.875rem', 
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '1rem',
  padding: '1.25rem',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  border: '1px solid #f1f5f9',
};

const badgeStyle = (bg: string, color: string): React.CSSProperties => ({
  padding: '0.25rem 0.65rem',
  borderRadius: '9999px',
  fontSize: '0.72rem',
  fontWeight: '600',
  background: bg,
  color: color,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
});

const lbl = (text: string) => (
  <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>{text}</div>
);

const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

const NurseDashboard: React.FC = () => {
  const { patients, updatePatient, addVitals, medicalHistory, addMedicalHistory } = useEMR();

  // Inpatient Bed Placement requested patients (unassigned ward)
  const pendingPlacement = patients.filter(p => p.bedPlacementRequested || (p.status === 'Inpatient' && !p.assignedWard));
  
  // Active inpatients with assigned ward
  const activeInpatients = patients.filter(p => p.status === 'Admitted' || (p.status === 'Inpatient' && p.assignedWard));

  const [selectedMrn, setSelectedMrn] = useState<string | null>(
    activeInpatients.length > 0 ? activeInpatients[0].mrn : null
  );
  
  const [tab, setTab] = useState<'vitals' | 'mar' | 'notes' | 'tasks'>('vitals');
  const [nurseData, setNurseData] = useState<Record<string, PatientNurseRecord>>(() => {
    try {
      const saved = localStorage.getItem('nurse_records');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('nurse_records', JSON.stringify(nurseData));
    } catch (e) {
      console.error('Failed to save nurse records to localStorage:', e);
    }
  }, [nurseData]);

  const [vitalsForm, setVitalsForm] = useState<Partial<VitalsRecord>>(EMPTY_VITALS);
  const [savingVitals, setSavingVitals] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'intensive'>('all');

  // Allocation state
  const [allocationPatient, setAllocationPatient] = useState<Patient | null>(null);
  const [allocWard, setAllocWard] = useState('Ward A');
  const [allocBed, setAllocBed] = useState('');
  const [allocating, setAllocating] = useState(false);

  // Discharge processing state
  const [discharging, setDischarging] = useState<string | null>(null);

  const selected = selectedMrn ? patients.find(p => p.mrn === selectedMrn) ?? null : null;

  const getNurse = (mrn: string | null): PatientNurseRecord =>
    (mrn ? nurseData[mrn] : undefined) ?? emptyRecord();

  const patchNurse = (mrn: string | null, diff: Partial<PatientNurseRecord>) => {
    if (!mrn) return;
    setNurseData(prev => ({ ...prev, [mrn]: { ...getNurse(mrn), ...diff } }));
  };

  const nd = selectedMrn ? getNurse(selectedMrn) : null;

  // Today Date String (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  // Statistics calculation
  const totalInpatientsCount = patients.filter(p => p.status === 'Admitted').length;
  const dailyNewCount = patients.filter(p => p.actualAdmissionDate === todayStr).length;
  const dailyDischargedCount = patients.filter(p => p.actualDischargeDate === todayStr || p.status === 'Discharged' && p.actualDischargeDate === todayStr).length;
  const intensiveCareCount = patients.filter(p => p.status === 'Admitted' && p.isIntensiveCare).length;

  const dueMeds = activeInpatients.reduce((acc, p) => {
    const administered = (nurseData[p.mrn]?.mar ?? []).map(m => m.medId);
    return acc + (p.medications ?? []).filter(m => !administered.includes(m.id)).length;
  }, 0);
  
  const pendingTasks = activeInpatients.reduce((acc, p) =>
    acc + (nurseData[p.mrn]?.tasks ?? []).filter(t => !t.completed).length, 0
  );

  // Bed allocation handler
  const handleAllocateBed = async () => {
    if (!allocationPatient || !allocBed.trim()) return;
    setAllocating(true);
    try {
      await updatePatient(allocationPatient.mrn, {
        status: 'Admitted',
        bedPlacementRequested: false,
        assignedWard: allocWard,
        assignedBed: allocBed.trim(),
        actualAdmissionDate: todayStr,
      });
      setSelectedMrn(allocationPatient.mrn);
      setAllocationPatient(null);
      setAllocBed('');
    } catch (err) {
      console.error('Failed to allocate bed:', err);
    } finally {
      setAllocating(false);
    }
  };

  // Discharge handler
  const handleDischargePatient = async (mrn: string) => {
    if (!window.confirm('Are you sure you want to discharge this patient?')) return;
    setDischarging(mrn);
    try {
      await updatePatient(mrn, {
        status: 'Discharged',
        actualDischargeDate: todayStr,
        bedPlacementRequested: false,
      });
      if (selectedMrn === mrn) {
        setSelectedMrn(null);
      }
    } catch (err) {
      console.error('Failed to discharge patient:', err);
    } finally {
      setDischarging(null);
    }
  };

  // Focus Care status toggle
  const handleToggleIntensiveCare = async (patient: Patient) => {
    try {
      await updatePatient(patient.mrn, {
        isIntensiveCare: !patient.isIntensiveCare
      });
    } catch (err) {
      console.error('Failed to toggle intensive care:', err);
    }
  };

  // Nursing log actions
  const submitVitals = async () => {
    if (!selectedMrn) return;
    const record: VitalsRecord = {
      temperature: vitalsForm.temperature ?? '',
      heartRate: vitalsForm.heartRate ?? '',
      respiratoryRate: vitalsForm.respiratoryRate ?? '',
      bpSystolic: vitalsForm.bpSystolic ?? '',
      bpDiastolic: vitalsForm.bpDiastolic ?? '',
      weightKg: vitalsForm.weightKg ?? '',
      heightCm: vitalsForm.heightCm ?? '',
      spo2: vitalsForm.spo2 ?? '',
      recordedAt: new Date().toISOString(),
    };
    setSavingVitals(true);
    await addVitals(selectedMrn, record);
    setSavingVitals(false);
    setVitalsForm(EMPTY_VITALS);
  };

  const addNote = async () => {
    if (!selectedMrn || !noteText.trim()) return;
    try {
      await addMedicalHistory({
        patientMrn: selectedMrn,
        date: new Date().toISOString().split('T')[0],
        doctor: 'Nurse Martha Kassa',
        diagnosis: 'Nursing Note',
        summary: noteText.trim(),
        riskFactors: [],
        lifestyle: {},
      });
      setNoteText('');
    } catch (err) {
      console.error('Failed to add nursing note:', err);
    }
  };

  const addTask = (taskText: string) => {
    if (!selectedMrn || !taskText.trim()) return;
    const cur = getNurse(selectedMrn);
    patchNurse(selectedMrn, {
      tasks: [...cur.tasks, { id: Date.now().toString(), task: taskText.trim(), dueTime: newTaskTime, completed: false }],
    });
    setNewTask('');
    setNewTaskTime('');
  };

  const toggleTask = (taskId: string) => {
    if (!selectedMrn) return;
    const cur = getNurse(selectedMrn);
    patchNurse(selectedMrn, {
      tasks: cur.tasks.map(t =>
        t.id === taskId
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
          : t
      ),
    });
  };

  const administerMed = (medId: string) => {
    if (!selectedMrn) return;
    const cur = getNurse(selectedMrn);
    if (cur.mar.some(m => m.medId === medId)) return;
    patchNurse(selectedMrn, {
      mar: [...cur.mar, { medId, administeredAt: new Date().toISOString() }],
    });
  };

  // Filtered active inpatient list (All active inpatients, since Focus Care has a dedicated card)
  const filteredInpatients = activeInpatients;

  const tabBtn = (key: typeof tab, icon: React.ReactNode, title: string) => (
    <button
      onClick={() => setTab(key)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.6rem 1.1rem', border: 'none', background: 'none', cursor: 'pointer',
        fontWeight: tab === key ? '600' : '400', fontSize: '0.85rem',
        color: tab === key ? '#0891b2' : '#64748b',
        borderBottom: `2px solid ${tab === key ? '#0891b2' : 'transparent'}`,
        marginBottom: '-1px',
        transition: 'color 0.2s, border-color 0.2s',
      }}
    >
      {icon}{title}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', fontFamily: 'inherit', color: '#1e293b' }}>
      
      {/* Stats Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Inpatients', value: totalInpatientsCount, icon: <BedDouble size={20} />, color: '#0891b2', bg: '#ecfeff' },
          { label: 'Daily New Admissions', value: dailyNewCount, icon: <Sparkles size={20} />, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Daily Discharges', value: dailyDischargedCount, icon: <LogOut size={20} />, color: '#6366f1', bg: '#e0e7ff' },
          { label: 'Focus Care Patients', value: intensiveCareCount, icon: <ShieldAlert size={20} />, color: '#f43f5e', bg: '#fff1f2' },
        ].map((s, idx) => (
          <div key={idx} style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderLeft: `5px solid ${s.color}`,
            background: 'white',
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>{s.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: s.color, lineHeight: '1' }}>{s.value}</div>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '0.75rem',
              background: s.bg,
              color: s.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

        /* Main Grid Workspace */
        <div className="nurse-workspace-grid">
        
        {/* COLUMN 1: Bed Placement Waiting List & Focus Care Patients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
          {/* Bed Placement Waiting List Card */}
          <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                <Clock size={18} style={{ color: '#0891b2' }} />
                Bed Placement Pending ({pendingPlacement.length})
              </div>
              <span style={badgeStyle('#e0f2fe', '#0369a1')}>Placement Request</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {pendingPlacement.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                  <CheckCircle size={28} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.78rem', fontWeight: '500' }}>No patients waiting for placement.</div>
                </div>
              ) : (
                pendingPlacement.map(p => (
                  <div key={p.mrn} style={{
                    padding: '0.85rem',
                    borderRadius: '0.75rem',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <Avatar name={p.name} photoUrl={p.photoUrl} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.mrn}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: '600' }}>
                        {p.visitType} Waiting
                      </span>
                      <button
                        onClick={() => setAllocationPatient(p)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '0.5rem',
                          background: '#0891b2',
                          color: 'white',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          boxShadow: '0 2px 4px rgba(8, 145, 178, 0.2)',
                        }}
                      >
                        <Plus size={12} /> Allocate Bed
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Focus Care Patients Card */}
          <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                <ShieldAlert size={18} style={{ color: '#f43f5e' }} />
                Focus Care Patients ({patients.filter(p => p.status === 'Admitted' && p.isIntensiveCare).length})
              </div>
              <span style={badgeStyle('#fff1f2', '#f43f5e')}>Critical Monitoring</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {patients.filter(p => p.status === 'Admitted' && p.isIntensiveCare).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                  <CheckCircle size={28} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.78rem', fontWeight: '500' }}>No focus care patients currently.</div>
                </div>
              ) : (
                patients.filter(p => p.status === 'Admitted' && p.isIntensiveCare).map(p => (
                  <div 
                    key={p.mrn} 
                    onClick={() => setSelectedMrn(p.mrn)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '0.75rem',
                      background: selectedMrn === p.mrn ? '#fff1f2' : '#f8fafc',
                      border: `1px solid ${selectedMrn === p.mrn ? '#f43f5e' : '#e2e8f0'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <Avatar name={p.name} photoUrl={p.photoUrl} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Ward: {p.assignedWard} / Bed: {p.assignedBed}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: Ward & Bed Patients List */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
          
          {/* Header & Filter */}
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                <BedDouble size={18} style={{ color: '#6366f1' }} />
                Ward Patients ({filteredInpatients.length})
              </div>
            </div>

          </div>

          {/* List Wrapper */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredInpatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
                <AlertCircle size={28} style={{ marginBottom: '0.5rem', color: '#cbd5e1' }} />
                <div style={{ fontSize: '0.8rem' }}>No active inpatients in this ward.</div>
              </div>
            ) : (
              filteredInpatients.map(p => {
                const active = selectedMrn === p.mrn;
                const pnd = getNurse(p.mrn);
                const administered = pnd.mar.map(m => m.medId);
                const dueMedsCount = (p.medications ?? []).filter(m => !administered.includes(m.id)).length;
                
                return (
                  <div
                    key={p.mrn}
                    onClick={() => { setSelectedMrn(p.mrn); setTab('vitals'); }}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      background: active ? '#e0f2fe' : '#ffffff',
                      border: `1px solid ${active ? '#38bdf8' : '#e2e8f0'}`,
                      boxShadow: active ? '0 2px 8px rgba(56, 189, 248, 0.15)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <Avatar name={p.name} photoUrl={p.photoUrl} size={36} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                          {p.isIntensiveCare && (
                            <span style={badgeStyle('#ffe4e6', '#f43f5e')}>Focus</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.mrn}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingLeft: '2.6rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: '700' }}>
                        📍 {p.assignedWard || p.ward || 'Unassigned'} - Room {p.assignedBed || '—'}
                      </span>
                      {dueMedsCount > 0 && (
                        <span style={badgeStyle('#fee2e2', '#ef4444')}>
                          {dueMedsCount} Meds Due
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: Patient Detail View & Nursing Log Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
          {!selected ? (
            <div style={{ ...cardStyle, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                <BedDouble size={48} style={{ color: '#94a3b8', marginBottom: '0.75rem' }} />
                <p style={{ fontWeight: '600', color: '#64748b', fontSize: '0.9rem' }}>Select a ward patient to manage nursing care.</p>
              </div>
            </div>
          ) : (
            <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              
              {/* Profile Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Avatar name={selected.name} photoUrl={selected.photoUrl} size={56} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>{selected.name}</h2>
                      {selected.isIntensiveCare && (
                        <span style={badgeStyle('#ffe4e6', '#f43f5e')}>Focus Care Patient</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      <span style={{ fontWeight: '700', color: '#0369a1' }}>{selected.mrn}</span>
                      {' · '}{selected.gender} · DOB: {selected.dob}
                    </div>
                  </div>
                </div>
                
                {/* Actions: Intensive Care Toggle & Discharge Button */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleToggleIntensiveCare(selected)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.5rem',
                      background: selected.isIntensiveCare ? '#ffe4e6' : '#f1f5f9',
                      color: selected.isIntensiveCare ? '#e11d48' : '#475569',
                      border: '1px solid',
                      borderColor: selected.isIntensiveCare ? '#fda4af' : '#cbd5e1',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Star size={14} fill={selected.isIntensiveCare ? '#e11d48' : 'none'} />
                    {selected.isIntensiveCare ? 'Remove Focus Care' : 'Set Focus Care'}
                  </button>
                  <button
                    onClick={() => handleDischargePatient(selected.mrn)}
                    disabled={discharging === selected.mrn}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.5rem',
                      background: '#fef2f2',
                      color: '#ef4444',
                      border: '1px solid #fca5a5',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    <LogOut size={14} />
                    {discharging === selected.mrn ? 'Discharging…' : 'Discharge'}
                  </button>
                </div>
              </div>

              {/* Vitals Summary Strip */}
              {selected.vitals.length > 0 && (() => {
                const v = selected.vitals[selected.vitals.length - 1];
                return (
                  <div style={{
                    display: 'flex', gap: '1.25rem', fontSize: '0.78rem', color: '#475569',
                    background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                    marginBottom: '1rem', border: '1px solid #e2e8f0', flexWrap: 'wrap'
                  }}>
                    {v.temperature  && <span>🌡️ Temp: <strong>{v.temperature}°C</strong></span>}
                    {v.heartRate    && <span>❤️ Pulse: <strong>{v.heartRate} bpm</strong></span>}
                    {v.bpSystolic  && <span>💉 BP: <strong>{v.bpSystolic}/{v.bpDiastolic} mmHg</strong></span>}
                    {v.spo2        && <span>🫁 SpO2: <strong>{v.spo2}%</strong></span>}
                    <span style={{ color: '#94a3b8', marginLeft: 'auto' }}>Last recorded: {fmt(v.recordedAt)}</span>
                  </div>
                );
              })()}

              {/* Tabs Section */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                {tabBtn('vitals', <Activity size={15} />, 'Record Vitals')}
                {tabBtn('mar',    <Pill size={15} />,     'MAR Log')}
                {tabBtn('notes',  <ClipboardList size={15} />, 'Nursing Notes')}
                {tabBtn('tasks',  <CheckSquare size={15} />,   'Care Tasks')}
              </div>

              {/* Tab Content Panels */}
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                
                {/* TAB: Vitals */}
                {tab === 'vitals' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.75rem' }}>Record New Vitals</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                        {[
                          { key: 'temperature',     label: 'Temp (°C)',    ph: '36.5' },
                          { key: 'heartRate',       label: 'Heart Rate (bpm)',   ph: '72' },
                          { key: 'respiratoryRate', label: 'Resp Rate (/min)',    ph: '16' },
                          { key: 'spo2',            label: 'SpO2 (%)',     ph: '98' },
                          { key: 'bpSystolic',      label: 'BP Systolic',  ph: '120' },
                          { key: 'bpDiastolic',     label: 'BP Diastolic', ph: '80' },
                          { key: 'weightKg',        label: 'Weight (kg)',  ph: '70' },
                          { key: 'heightCm',        label: 'Height (cm)',  ph: '170' },
                        ].map(({ key, label: l, ph }) => (
                          <div key={key}>
                            {lbl(l)}
                            <input
                              value={(vitalsForm as Record<string, string>)[key] ?? ''}
                              onChange={e => setVitalsForm(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder={ph}
                              style={inputStyle}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button
                          onClick={submitVitals}
                          disabled={savingVitals}
                          style={{
                            padding: '0.5rem 1.25rem', borderRadius: '0.5rem', background: '#0891b2', color: 'white',
                            border: 'none', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                          }}
                        >
                          {savingVitals ? 'Saving…' : 'Save Vitals'}
                        </button>
                      </div>
                    </div>

                    {/* Vitals History */}
                    {selected.vitals.length > 0 && (
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.5rem' }}>Vitals History</div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '0.6rem' }}>Recorded Time</th>
                                <th style={{ padding: '0.6rem' }}>Temp</th>
                                <th style={{ padding: '0.6rem' }}>Heart Rate</th>
                                <th style={{ padding: '0.6rem' }}>Resp</th>
                                <th style={{ padding: '0.6rem' }}>BP</th>
                                <th style={{ padding: '0.6rem' }}>SpO2</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...selected.vitals].reverse().map((v, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.6rem', color: '#64748b' }}>{fmt(v.recordedAt)}</td>
                                  <td style={{ padding: '0.6rem', fontWeight: '500' }}>{v.temperature}°C</td>
                                  <td style={{ padding: '0.6rem' }}>{v.heartRate}</td>
                                  <td style={{ padding: '0.6rem' }}>{v.respiratoryRate}</td>
                                  <td style={{ padding: '0.6rem' }}>{v.bpSystolic && v.bpDiastolic ? `${v.bpSystolic}/${v.bpDiastolic}` : '—'}</td>
                                  <td style={{ padding: '0.6rem', fontWeight: '500', color: '#0891b2' }}>{v.spo2}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: MAR */}
                {tab === 'mar' && nd && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(selected.medications ?? []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        No active medications prescribed.
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Medication Schedule</div>
                        {(selected.medications ?? []).map(med => {
                          const givenEntry = nd.mar.find(m => m.medId === med.id);
                          const given = !!givenEntry;
                          return (
                            <div
                              key={med.id}
                              style={{
                                padding: '0.85rem 1.1rem', borderRadius: '0.75rem',
                                border: `1px solid ${given ? '#a7f3d0' : '#e2e8f0'}`,
                                background: given ? '#f0fdf4' : '#f8fafc',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>{med.drug}</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                                  {med.dose} · {med.frequency} · {med.duration} · {med.route}
                                </div>
                                {given && givenEntry && (
                                  <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.35rem', fontWeight: '600' }}>
                                    ✅ Administered at: {fmt(givenEntry.administeredAt)}
                                  </div>
                                )}
                              </div>
                              {given ? (
                                <span style={badgeStyle('#d1fae5', '#065f46')}>
                                  <Check size={14} /> Administered
                                </span>
                              ) : (
                                <button
                                  onClick={() => administerMed(med.id)}
                                  style={{
                                    padding: '0.4rem 0.85rem', borderRadius: '0.5rem', background: '#0891b2', color: 'white',
                                    border: 'none', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
                                  }}
                                >
                                  Mark Given
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}

                {/* TAB: Notes */}
                {tab === 'notes' && selected && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Enter nursing notes and observations here…"
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={addNote}
                          disabled={!noteText.trim()}
                          style={{
                            padding: '0.45rem 1rem', borderRadius: '0.5rem', background: '#0891b2', color: 'white',
                            border: 'none', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                          }}
                        >
                          Add Note
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {(() => {
                        const dbNotes = (medicalHistory ?? [])
                          .filter(h => h.patientMrn === selected.mrn && h.diagnosis === 'Nursing Note');
                        
                        if (dbNotes.length === 0) {
                          return (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                              No nursing notes recorded yet.
                            </div>
                          );
                        }
                        
                        return [...dbNotes].reverse().map(note => (
                          <div key={note.id} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem' }}>
                              <div style={{ fontSize: '0.82rem', lineHeight: '1.5', color: '#1e293b' }}>{note.summary}</div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748b' }}>{note.doctor}</span>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmt(note.createdAt || new Date().toISOString())}</span>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* TAB: Tasks */}
                {tab === 'tasks' && nd && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>Quick Care Presets</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
                        {PRESET_TASKS.map(t => (
                          <button
                            key={t}
                            onClick={() => addTask(t)}
                            style={{
                              padding: '0.3rem 0.65rem', borderRadius: '9999px', fontSize: '0.72rem', cursor: 'pointer',
                              border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', transition: 'all 0.15s',
                            }}
                          >
                            + {t}
                          </button>
                        ))}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          value={newTask}
                          onChange={e => setNewTask(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addTask(newTask)}
                          placeholder="Add custom care task…"
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <input
                          type="time"
                          value={newTaskTime}
                          onChange={e => setNewTaskTime(e.target.value)}
                          style={{ ...inputStyle, width: '120px', flex: 'none' }}
                        />
                        <button
                          onClick={() => addTask(newTask)}
                          style={{
                            padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#0891b2', color: 'white',
                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {nd.tasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                          No care tasks assigned. Select presets or create a custom task.
                        </div>
                      ) : (
                        nd.tasks.map(task => (
                          <div
                            key={task.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.75rem',
                              padding: '0.75rem 1rem', borderRadius: '0.5rem',
                              background: task.completed ? '#ecfdf5' : '#f8fafc',
                              border: `1px solid ${task.completed ? '#a7f3d0' : '#e2e8f0'}`,
                            }}
                          >
                            <button
                              onClick={() => toggleTask(task.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.completed ? '#10b981' : '#cbd5e1', flexShrink: 0, padding: 0 }}
                            >
                              <CheckCircle size={20} />
                            </button>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '0.85rem', fontWeight: task.completed ? '400' : '600',
                                color: task.completed ? '#94a3b8' : '#1e293b',
                                textDecoration: task.completed ? 'line-through' : 'none',
                              }}>
                                {task.task}
                              </div>
                              {(task.dueTime || task.completedAt) && (
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem', display: 'flex', gap: '0.75rem' }}>
                                  {task.dueTime && <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock size={10} /> Due: {task.dueTime}</span>}
                                  {task.completedAt && <span>Done: {fmt(task.completedAt)}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}
        </div>

      </div>

      {/* Bed Allocation Modal Overlay */}
      {allocationPatient && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '1rem', padding: '1.75rem', width: '420px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <BedDouble size={22} style={{ color: '#0891b2' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Ward & Bed Allocation</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '1.25rem' }}>
              <Avatar name={allocationPatient.name} photoUrl={allocationPatient.photoUrl} size={40} />
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>{allocationPatient.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MRN: {allocationPatient.mrn}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                {lbl('Select Ward')}
                <select
                  value={allocWard}
                  onChange={e => setAllocWard(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="Ward A">Ward A (General Ward A)</option>
                  <option value="Ward B">Ward B (General Ward B)</option>
                  <option value="ICU">ICU (Intensive Care Unit)</option>
                  <option value="Pediatrics">Pediatrics (Pediatric Ward)</option>
                </select>
              </div>

              <div>
                {lbl('Bed Number / Room')}
                <input
                  type="text"
                  placeholder="e.g. 101-A, 305"
                  value={allocBed}
                  onChange={e => setAllocBed(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setAllocationPatient(null)}
                style={{
                  padding: '0.55rem 1.1rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#475569',
                  border: 'none', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAllocateBed}
                disabled={allocating || !allocBed.trim()}
                style={{
                  padding: '0.55rem 1.1rem', borderRadius: '0.5rem', background: '#0891b2', color: 'white',
                  border: 'none', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                  opacity: (!allocBed.trim() || allocating) ? 0.6 : 1
                }}
              >
                {allocating ? 'Allocating…' : 'Complete Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .nurse-workspace-grid {
          display: grid;
          grid-template-columns: 320px 320px 1fr;
          gap: 1.25rem;
          flex: 1;
          min-height: 0;
        }

        @media (max-width: 1024px) {
          .nurse-workspace-grid {
            grid-template-columns: 1fr !important;
            grid-auto-rows: auto;
            overflow-y: auto !important;
            gap: 1.5rem;
          }
          .nurse-workspace-grid > div {
            height: auto !important;
            min-height: 480px;
          }
        }
      `}</style>

    </div>
  );
};

export default NurseDashboard;
