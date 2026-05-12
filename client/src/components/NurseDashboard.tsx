import React, { useState } from 'react';
import { Activity, Pill, ClipboardList, CheckSquare, Plus, BedDouble, Clock, CheckCircle } from 'lucide-react';
import { useEMR } from '../context/EMRContext';
import type { VitalsRecord } from '../context/EMRContext';
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

// ── Helpers ────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.45rem',
  border: '1px solid #e2e8f0', fontSize: '0.875rem', fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const lbl = (text: string) => (
  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>{text}</div>
);

const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

// ── Component ──────────────────────────────────────────────────

const NurseDashboard: React.FC = () => {
  const { patients, appendPatientVitals } = useEMR();
  const inpatients = patients.filter(p => p.status === 'Inpatient');

  const [selectedMrn, setSelectedMrn] = useState<string | null>(
    inpatients.length > 0 ? inpatients[0].mrn : null
  );
  const [tab, setTab] = useState<'vitals' | 'mar' | 'notes' | 'tasks'>('vitals');
  const [nurseData, setNurseData] = useState<Record<string, PatientNurseRecord>>({});
  const [vitalsForm, setVitalsForm] = useState<Partial<VitalsRecord>>(EMPTY_VITALS);
  const [savingVitals, setSavingVitals] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');

  const selected = selectedMrn ? patients.find(p => p.mrn === selectedMrn) ?? null : null;

  const getNurse = (mrn: string | null): PatientNurseRecord =>
    (mrn ? nurseData[mrn] : undefined) ?? emptyRecord();

  const patchNurse = (mrn: string | null, diff: Partial<PatientNurseRecord>) => {
    if (!mrn) return;
    setNurseData(prev => ({ ...prev, [mrn]: { ...getNurse(mrn), ...diff } }));
  };

  const nd = selectedMrn ? getNurse(selectedMrn) : null;

  // Stats
  const dueMeds = inpatients.reduce((acc, p) => {
    const administered = (nurseData[p.mrn]?.mar ?? []).map(m => m.medId);
    return acc + (p.medications ?? []).filter(m => !administered.includes(m.id)).length;
  }, 0);
  const pendingTasks = inpatients.reduce((acc, p) =>
    acc + (nurseData[p.mrn]?.tasks ?? []).filter(t => !t.completed).length, 0
  );

  // Actions
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
    await appendPatientVitals(selectedMrn, record);
    setSavingVitals(false);
    setVitalsForm(EMPTY_VITALS);
  };

  const addNote = () => {
    if (!selectedMrn || !noteText.trim()) return;
    const cur = getNurse(selectedMrn);
    patchNurse(selectedMrn, {
      notes: [...cur.notes, { id: Date.now().toString(), text: noteText.trim(), time: new Date().toISOString() }],
    });
    setNoteText('');
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

  // ── Render helpers ─────────────────────────────────────────

  const tabBtn = (key: typeof tab, icon: React.ReactNode, title: string) => (
    <button
      onClick={() => setTab(key)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
        fontWeight: tab === key ? '600' : '400', fontSize: '0.85rem',
        color: tab === key ? '#0891b2' : '#64748b',
        borderBottom: `2px solid ${tab === key ? '#0891b2' : 'transparent'}`,
        marginBottom: '-1px',
      }}
    >
      {icon}{title}
    </button>
  );

  // ── Render ─────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {[
          { label: 'Inpatients',    value: inpatients.length, color: '#0891b2' },
          { label: 'Wards Active',  value: [...new Set(inpatients.map(p => p.ward).filter(Boolean))].length, color: '#7c3aed' },
          { label: 'Meds Due',      value: dueMeds,           color: '#dc2626' },
          { label: 'Tasks Pending', value: pendingTasks,      color: '#d97706' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Split panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>

        {/* Ward list */}
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem', overflowY: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BedDouble size={18} /> Ward Patients
          </div>
          {inpatients.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>No inpatients currently</p>
          )}
          {inpatients.map(p => {
            const active = selectedMrn === p.mrn;
            const pnd = getNurse(p.mrn);
            const administered = pnd.mar.map(m => m.medId);
            const dueMedsCount = (p.medications ?? []).filter(m => !administered.includes(m.id)).length;
            return (
              <div
                key={p.mrn}
                onClick={() => { setSelectedMrn(p.mrn); setTab('vitals'); }}
                style={{
                  padding: '0.9rem', borderRadius: '0.5rem', cursor: 'pointer', marginBottom: '0.4rem',
                  background: active ? '#ecfeff' : '#f8fafc',
                  border: `1px solid ${active ? '#67e8f9' : '#e2e8f0'}`,
                }}
              >
                <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <Avatar name={p.name} photoUrl={p.photoUrl} size={30} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', lineHeight: '1.2' }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.mrn}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#0891b2', fontWeight: '500', marginLeft: '2.3rem' }}>
                  {p.ward || 'Ward not assigned'}
                </div>
                {dueMedsCount > 0 && (
                  <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: '600' }}>
                    {dueMedsCount} med{dueMedsCount > 1 ? 's' : ''} due
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Patient detail */}
        {!selected ? (
          <div style={{ background: 'white', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
            <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
              <BedDouble size={52} />
              <p style={{ marginTop: '0.75rem', fontWeight: '500', color: '#94a3b8' }}>Select a patient from the ward</p>
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', overflowY: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>

            {/* Patient header */}
            <div style={{ paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Avatar name={selected.name} photoUrl={selected.photoUrl} size={46} />
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{selected.name}</h2>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                      <span style={{ fontWeight: '600', color: '#0891b2' }}>{selected.mrn}</span>
                      {' · '}{selected.gender} · DOB: {selected.dob}
                    </div>
                  </div>
                </div>
                <span style={{ padding: '0.35rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '700', background: '#ecfeff', color: '#0891b2' }}>
                  {selected.ward || 'Inpatient'}
                </span>
              </div>
              {selected.vitals.length > 0 && (() => {
                const v = selected.vitals[selected.vitals.length - 1];
                return (
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#475569', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {v.temperature  && <span>🌡 {v.temperature}°C</span>}
                    {v.heartRate    && <span>❤️ {v.heartRate} bpm</span>}
                    {v.bpSystolic  && <span>💉 {v.bpSystolic}/{v.bpDiastolic} mmHg</span>}
                    {v.spo2        && <span>🫁 SpO2 {v.spo2}%</span>}
                    <span style={{ color: '#94a3b8' }}>as of {fmt(v.recordedAt)}</span>
                  </div>
                );
              })()}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              {tabBtn('vitals', <Activity size={15} />, 'Vitals')}
              {tabBtn('mar',    <Pill size={15} />,     'Medications (MAR)')}
              {tabBtn('notes',  <ClipboardList size={15} />, 'Notes')}
              {tabBtn('tasks',  <CheckSquare size={15} />,   'Care Tasks')}
            </div>

            {/* ── TAB: Vitals ── */}
            {tab === 'vitals' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: '#f8fafc', borderRadius: '0.6rem', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1e293b', marginBottom: '1rem' }}>Record New Vitals</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    {[
                      { key: 'temperature',     label: 'Temp (°C)',    ph: '36.5' },
                      { key: 'heartRate',       label: 'Heart Rate',   ph: '72 bpm' },
                      { key: 'respiratoryRate', label: 'Resp Rate',    ph: '16' },
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
                      className="btn-primary"
                      style={{ background: '#0891b2', fontSize: '0.875rem' }}
                      onClick={submitVitals}
                      disabled={savingVitals}
                    >
                      {savingVitals ? 'Saving…' : 'Save Vitals'}
                    </button>
                  </div>
                </div>

                {selected.vitals.length > 0 && (
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.75rem' }}>Vitals History</div>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr><th>Time</th><th>Temp</th><th>HR</th><th>RR</th><th>BP</th><th>SpO2</th><th>Wt</th></tr>
                        </thead>
                        <tbody>
                          {[...selected.vitals].reverse().map((v, i) => (
                            <tr key={i}>
                              <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>{fmt(v.recordedAt)}</td>
                              <td>{v.temperature || '—'}</td>
                              <td>{v.heartRate || '—'}</td>
                              <td>{v.respiratoryRate || '—'}</td>
                              <td>{v.bpSystolic && v.bpDiastolic ? `${v.bpSystolic}/${v.bpDiastolic}` : '—'}</td>
                              <td>{v.spo2 || '—'}</td>
                              <td>{v.weightKg || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: MAR ── */}
            {tab === 'mar' && nd && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(selected.medications ?? []).length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem', fontSize: '0.85rem' }}>
                    No medications prescribed for this patient.
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: '0.83rem', color: '#64748b' }}>
                      Medication Administration Record — mark each dose as administered.
                    </p>
                    {(selected.medications ?? []).map(med => {
                      const givenEntry = nd.mar.find(m => m.medId === med.id);
                      const given = !!givenEntry;
                      return (
                        <div
                          key={med.id}
                          style={{
                            padding: '1rem 1.25rem', borderRadius: '0.6rem',
                            border: `1px solid ${given ? '#86efac' : '#e2e8f0'}`,
                            background: given ? '#f0fdf4' : '#f8fafc',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{med.drug}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                              {med.dose} · {med.frequency} · {med.duration} · {med.route}
                            </div>
                            {given && givenEntry && (
                              <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: '500' }}>
                                Administered at {fmt(givenEntry.administeredAt)}
                              </div>
                            )}
                          </div>
                          {given ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#16a34a', fontWeight: '600', whiteSpace: 'nowrap' }}>
                              <CheckCircle size={18} /> Administered
                            </span>
                          ) : (
                            <button
                              className="btn-primary"
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', background: '#0891b2', whiteSpace: 'nowrap' }}
                              onClick={() => administerMed(med.id)}
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

            {/* ── TAB: Notes ── */}
            {tab === 'notes' && nd && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Enter nursing note…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      className="btn-primary"
                      style={{ fontSize: '0.875rem', background: '#0891b2' }}
                      onClick={addNote}
                      disabled={!noteText.trim()}
                    >
                      Add Note
                    </button>
                  </div>
                </div>
                {nd.notes.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', padding: '1.5rem' }}>No notes yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {[...nd.notes].reverse().map(note => (
                      <div key={note.id} style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#1e293b' }}>{note.text}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmt(note.time)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: Tasks ── */}
            {tab === 'tasks' && nd && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.6rem' }}>Quick Add</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {PRESET_TASKS.map(t => (
                      <button
                        key={t}
                        onClick={() => addTask(t)}
                        style={{ padding: '0.22rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569' }}
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
                      placeholder="Custom task…"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <input
                      type="time"
                      value={newTaskTime}
                      onChange={e => setNewTaskTime(e.target.value)}
                      style={{ ...inputStyle, width: '110px', flex: 'none' }}
                    />
                    <button
                      className="btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', background: '#0891b2' }}
                      onClick={() => addTask(newTask)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {nd.tasks.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', padding: '1.5rem' }}>
                    No tasks yet. Add from presets or enter a custom task.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {nd.tasks.map(task => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.75rem 1rem', borderRadius: '0.5rem',
                          background: task.completed ? '#f0fdf4' : '#f8fafc',
                          border: `1px solid ${task.completed ? '#86efac' : '#e2e8f0'}`,
                        }}
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.completed ? '#16a34a' : '#cbd5e1', flexShrink: 0, padding: 0 }}
                        >
                          <CheckCircle size={22} />
                        </button>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '0.875rem', fontWeight: task.completed ? '400' : '500',
                            color: task.completed ? '#94a3b8' : '#1e293b',
                            textDecoration: task.completed ? 'line-through' : 'none',
                          }}>
                            {task.task}
                          </div>
                          {(task.dueTime || task.completedAt) && (
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem', display: 'flex', gap: '0.75rem' }}>
                              {task.dueTime && <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock size={11} /> Due: {task.dueTime}</span>}
                              {task.completedAt && <span>Done: {fmt(task.completedAt)}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default NurseDashboard;
