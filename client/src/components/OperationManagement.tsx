import React, { useState, useMemo } from 'react';
import { Calendar, Users, ClipboardCheck, FileText, MapPin, Plus, X, Pill, Wrench, Search, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useEMR, type Surgery, type SurgeryTeamMember, type SurgerySupplyItem, type SurgeryEquipmentItem, type SurgeryChecklistItem, type SurgeryBedTrace } from '../context/EMRContext';

type Tab = 'schedule' | 'resources' | 'checklists' | 'outcomes' | 'bedtrace';

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' };
const sheet: React.CSSProperties = { background: 'white', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };

const STATUS_COLORS: Record<Surgery['status'], { bg: string; fg: string }> = {
  'Scheduled':   { bg: '#dbeafe', fg: '#1e40af' },
  'In Progress': { bg: '#fef3c7', fg: '#92400e' },
  'Completed':   { bg: '#dcfce7', fg: '#166534' },
  'Cancelled':   { bg: '#fee2e2', fg: '#991b1b' },
};

const PRIORITY_COLORS: Record<NonNullable<Surgery['priority']>, { bg: string; fg: string }> = {
  Elective:  { bg: '#f1f5f9', fg: '#334155' },
  Urgent:    { bg: '#fef3c7', fg: '#92400e' },
  Emergency: { bg: '#fee2e2', fg: '#991b1b' },
};

const TEAM_ROLES = ['Primary Surgeon', 'Assistant Surgeon', 'Anesthesiologist', 'Scrub Nurse', 'Circulating Nurse', 'Technician'] as const;

const DEFAULT_CHECKLIST_TEMPLATE: { phase: SurgeryChecklistItem['phase']; label: string }[] = [
  { phase: 'PreOp',   label: 'Patient identity & consent verified' },
  { phase: 'PreOp',   label: 'Surgical site marked' },
  { phase: 'PreOp',   label: 'NPO status confirmed' },
  { phase: 'PreOp',   label: 'Pre-op antibiotics administered' },
  { phase: 'PreOp',   label: 'Anesthesia plan reviewed' },
  { phase: 'IntraOp', label: 'Time-out performed' },
  { phase: 'IntraOp', label: 'Sponge / instrument count (initial)' },
  { phase: 'IntraOp', label: 'Sponge / instrument count (final)' },
  { phase: 'IntraOp', label: 'Specimen labelled' },
  { phase: 'PostOp',  label: 'Patient transferred to PACU' },
  { phase: 'PostOp',  label: 'Post-op vitals stable' },
  { phase: 'PostOp',  label: 'Hand-off to ward nurse complete' },
];

const fmtDateTime = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

const OperationManagement: React.FC<{ activeTab?: Tab }> = ({ activeTab: initialTab = 'schedule' }) => {
  const {
    staff, assets, drugs, surgeries, patients, currentStaff,
    surgeryTeam, surgerySupplies, surgeryEquipment, surgeryChecklist, surgeryBedTrace,
    addSurgery, updateSurgery, addAppointment,
    addSurgeryTeamMember, removeSurgeryTeamMember,
    addSurgerySupply, updateSurgerySupply, removeSurgerySupply,
    addSurgeryEquipment, updateSurgeryEquipment, removeSurgeryEquipment,
    addSurgeryChecklistItem, updateSurgeryChecklistItem,
    addSurgeryBedTrace, updateSurgeryBedTrace, updatePatient, loading,
  } = useEMR();

  const [tab, setTab] = useState<Tab>(initialTab);
  React.useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);

  // List controls (Schedule tab)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Surgery['status']>('All');
  const [sortBy, setSortBy] = useState<'startTime' | 'priority' | 'patient'>('startTime');

  // Modals
  const [bookOpen, setBookOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const detailSurgery = useMemo(() => surgeries.find(s => s.id === detailId) || null, [surgeries, detailId]);

  // New-surgery form
  const blankForm = {
    patientMrn: '', patientName: '',
    operationName: '', operationSite: '', technique: '', description: '',
    surgeonId: '', anesthesiaType: 'General', roomNumber: 'OT 1',
    startTime: '', endTime: '',
    priority: 'Elective' as NonNullable<Surgery['priority']>,
  };
  const [form, setForm] = useState(blankForm);

  // Filtered + sorted surgery list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return surgeries
      .filter(s => {
        if (statusFilter !== 'All' && s.status !== statusFilter) return false;
        if (!q) return true;
        return (
          s.patientName.toLowerCase().includes(q) ||
          s.operationName.toLowerCase().includes(q) ||
          s.roomNumber.toLowerCase().includes(q) ||
          (s.operationSite || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const order = { Emergency: 0, Urgent: 1, Elective: 2 } as const;
          return (order[a.priority ?? 'Elective'] - order[b.priority ?? 'Elective']);
        }
        if (sortBy === 'patient') return a.patientName.localeCompare(b.patientName);
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
  }, [surgeries, search, statusFilter, sortBy]);

  const handleBook = async () => {
    if (!form.patientName.trim() || !form.operationName.trim() || !form.surgeonId) {
      alert('Patient, operation name and surgeon are required.');
      return;
    }
    try {
      const startIso = form.startTime ? new Date(form.startTime).toISOString() : new Date().toISOString();
      const endIso = form.endTime
        ? new Date(form.endTime).toISOString()
        : new Date(new Date(startIso).getTime() + 2 * 60 * 60 * 1000).toISOString();

      const newSurg = await addSurgery({
        patientMrn: form.patientMrn,
        patientName: form.patientName,
        operationName: form.operationName,
        surgeonId: Number(form.surgeonId),
        anesthesiaType: form.anesthesiaType,
        roomNumber: form.roomNumber,
        startTime: startIso,
        endTime: endIso,
        status: 'Scheduled',
        priority: form.priority,
        operationSite: form.operationSite || undefined,
        technique: form.technique || undefined,
        description: form.description || undefined,
      });

      // Auto-create the linked appointment so the surgery surfaces on the
      // hospital and patient-portal calendars.
      if (newSurg) {
        try {
          await addAppointment({
            patientMrn: form.patientMrn,
            doctorId: Number(form.surgeonId),
            startTime: startIso,
            endTime: endIso,
            status: 'Confirmed',
            notes: `[Surgery] ${form.operationName}${form.operationSite ? ' — ' + form.operationSite : ''}`,
          });
        } catch { /* non-fatal */ }

        // Seed the default checklist template (Pre/Intra/Post).
        try {
          for (let i = 0; i < DEFAULT_CHECKLIST_TEMPLATE.length; i++) {
            const t = DEFAULT_CHECKLIST_TEMPLATE[i];
            await addSurgeryChecklistItem({
              surgeryId: newSurg.id,
              phase: t.phase,
              label: t.label,
              isDone: false,
              sortOrder: i,
            });
          }
        } catch { /* non-fatal */ }

        // Auto-assign the surgeon to the team as Primary Surgeon.
        try {
          const surg = staff.find(s => s.id === Number(form.surgeonId));
          if (surg) {
            await addSurgeryTeamMember({
              surgeryId: newSurg.id,
              staffId: surg.id,
              staffName: surg.name,
              role: 'Primary Surgeon',
              department: 'Surgery',
            });
          }
        } catch { /* non-fatal */ }
      }

      setBookOpen(false);
      setForm(blankForm);
      if (newSurg) setDetailId(newSurg.id);
    } catch (err: any) {
      alert('Failed to schedule surgery: ' + (err?.message || 'unknown error'));
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading surgery data…</div>;
  }

  return (
    <div className="surgery-container">
      {/* Tab header */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {([
          ['schedule',   'OT Schedule',      <Calendar size={14} />],
          ['resources',  'Team & Resources', <Users size={14} />],
          ['checklists', 'Checklists',       <ClipboardCheck size={14} />],
          ['outcomes',   'Outcomes',         <FileText size={14} />],
          ['bedtrace',   'Bed Trace',        <MapPin size={14} />],
        ] as const).map(([key, label, icon]) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 0.95rem', border: 'none', borderRadius: '0.5rem',
              background: tab === key ? '#8b5cf6' : '#f1f5f9',
              color: tab === key ? 'white' : '#475569',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
            }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Book modal */}
      {bookOpen && (
        <div style={overlay}>
          <div style={sheet}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Schedule New Surgery</h3>
              <button onClick={() => setBookOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lblStyle}>Patient</label>
                <select value={form.patientMrn} onChange={e => {
                  const p = patients.find(pp => pp.mrn === e.target.value);
                  setForm(f => ({ ...f, patientMrn: e.target.value, patientName: p?.name || '' }));
                }} style={inpStyle}>
                  <option value="">— Choose patient —</option>
                  {patients.map(p => <option key={p.mrn} value={p.mrn}>{p.name} ({p.mrn})</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lblStyle}>Operation Name *</label>
                <input value={form.operationName} onChange={e => setForm(f => ({ ...f, operationName: e.target.value }))} style={inpStyle} placeholder="e.g. Laparoscopic Cholecystectomy" />
              </div>
              <div>
                <label style={lblStyle}>Operation Site</label>
                <input value={form.operationSite} onChange={e => setForm(f => ({ ...f, operationSite: e.target.value }))} style={inpStyle} placeholder="Right upper abdomen" />
              </div>
              <div>
                <label style={lblStyle}>Technique</label>
                <input value={form.technique} onChange={e => setForm(f => ({ ...f, technique: e.target.value }))} style={inpStyle} placeholder="Laparoscopic" />
              </div>
              <div>
                <label style={lblStyle}>Primary Surgeon *</label>
                <select value={form.surgeonId} onChange={e => setForm(f => ({ ...f, surgeonId: e.target.value }))} style={inpStyle}>
                  <option value="">— Choose —</option>
                  {staff.filter(s => s.role.includes('Doctor')).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.specialization})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lblStyle}>Anesthesia</label>
                <select value={form.anesthesiaType} onChange={e => setForm(f => ({ ...f, anesthesiaType: e.target.value }))} style={inpStyle}>
                  <option>General</option><option>Regional</option><option>Spinal</option><option>Local</option><option>Sedation</option>
                </select>
              </div>
              <div>
                <label style={lblStyle}>OT Room</label>
                <select value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} style={inpStyle}>
                  <option>OT 1</option><option>OT 2</option><option>OT 3</option><option>OT 4</option>
                </select>
              </div>
              <div>
                <label style={lblStyle}>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))} style={inpStyle}>
                  <option value="Elective">Elective</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label style={lblStyle}>Start</label>
                <input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={inpStyle} />
              </div>
              <div>
                <label style={lblStyle}>End</label>
                <input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={inpStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lblStyle}>Patient-facing description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inpStyle, resize: 'vertical' }} placeholder="Short summary shown in the patient portal" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button onClick={() => setBookOpen(false)} style={btnSecondary}>Cancel</button>
              <button onClick={handleBook} style={btnPrimary}>Schedule</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailSurgery && (
        <SurgeryDetailModal
          surgery={detailSurgery}
          onClose={() => setDetailId(null)}
          ctx={{
            staff, assets, drugs, currentStaff,
            surgeryTeam, surgerySupplies, surgeryEquipment, surgeryChecklist, surgeryBedTrace,
            updateSurgery,
            addSurgeryTeamMember, removeSurgeryTeamMember,
            addSurgerySupply, updateSurgerySupply, removeSurgerySupply,
            addSurgeryEquipment, updateSurgeryEquipment, removeSurgeryEquipment,
            addSurgeryChecklistItem, updateSurgeryChecklistItem,
            addSurgeryBedTrace, updateSurgeryBedTrace, updatePatient,
          }}
        />
      )}

      {/* ─── SCHEDULE TAB ─── */}
      {tab === 'schedule' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, operation, room, site…" style={{ ...inpStyle, paddingLeft: '2rem' }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ ...inpStyle, flex: '0 0 160px' }}>
              <option value="All">All statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ ...inpStyle, flex: '0 0 160px' }}>
              <option value="startTime">Sort: Start time</option>
              <option value="priority">Sort: Priority</option>
              <option value="patient">Sort: Patient</option>
            </select>
            <button onClick={() => setBookOpen(true)} style={{ ...btnPrimary, flex: '0 0 auto' }}><Plus size={16} /> Schedule Surgery</button>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No surgeries match your filters.</div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {filtered.map(s => {
                const teamCount = surgeryTeam.filter(t => t.surgeryId === s.id).length;
                const sup = surgerySupplies.filter(x => x.surgeryId === s.id);
                const eq  = surgeryEquipment.filter(x => x.surgeryId === s.id);
                const chk = surgeryChecklist.filter(x => x.surgeryId === s.id);
                const chkDone = chk.filter(c => c.isDone).length;
                const sc = STATUS_COLORS[s.status];
                const pc = PRIORITY_COLORS[s.priority ?? 'Elective'];
                return (
                  <div key={s.id} onClick={() => setDetailId(s.id)} style={{
                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem',
                    padding: '1rem', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 800 }}>{s.operationName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {s.patientName} {s.operationSite ? `· ${s.operationSite}` : ''}
                        </div>
                      </div>
                      <span style={{ background: sc.bg, color: sc.fg, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px' }}>{s.status}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.65rem' }}>
                      <span style={{ background: pc.bg, color: pc.fg, fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.35rem' }}>{s.priority ?? 'Elective'}</span>
                      <span style={chip}>{s.roomNumber}</span>
                      <span style={chip}>Dr. {staff.find(st => st.id === s.surgeonId)?.name ?? 'Unassigned'}</span>
                      <span style={chip}>{fmtDateTime(s.startTime)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.72rem', color: '#64748b' }}>
                      <span>👥 {teamCount} team</span>
                      <span>💊 {sup.length}</span>
                      <span>🔧 {eq.length}</span>
                      <span>✅ {chkDone}/{chk.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TEAM & RESOURCES TAB ─── */}
      {tab === 'resources' && (
        <SurgeryListPicker
          title="Choose a surgery to manage team / supplies / equipment"
          surgeries={filtered.length ? filtered : surgeries}
          surgeryTeam={surgeryTeam}
          surgerySupplies={surgerySupplies}
          surgeryEquipment={surgeryEquipment}
          surgeryChecklist={surgeryChecklist}
          staff={staff}
          onPick={s => setDetailId(s.id)}
          summary={s => {
            const t = surgeryTeam.filter(x => x.surgeryId === s.id).length;
            const sp = surgerySupplies.filter(x => x.surgeryId === s.id).length;
            const eq = surgeryEquipment.filter(x => x.surgeryId === s.id).length;
            return `${t} team · ${sp} supplies · ${eq} equipment`;
          }}
        />
      )}

      {/* ─── CHECKLISTS TAB ─── */}
      {tab === 'checklists' && (
        <SurgeryListPicker
          title="Choose a surgery to review the Pre / Intra / Post-op checklist"
          surgeries={filtered.length ? filtered : surgeries}
          surgeryTeam={surgeryTeam}
          surgerySupplies={surgerySupplies}
          surgeryEquipment={surgeryEquipment}
          surgeryChecklist={surgeryChecklist}
          staff={staff}
          onPick={s => setDetailId(s.id)}
          summary={s => {
            const chk = surgeryChecklist.filter(x => x.surgeryId === s.id);
            const done = chk.filter(c => c.isDone).length;
            return `${done} / ${chk.length} done`;
          }}
        />
      )}

      {/* ─── OUTCOMES TAB ─── */}
      {tab === 'outcomes' && (
        <div>
          <div style={{ marginBottom: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>
            Showing completed surgeries. Open a card to record or review outcomes.
          </div>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {surgeries.filter(s => s.status === 'Completed' || s.outcomeSummary).map(s => (
              <div key={s.id} onClick={() => setDetailId(s.id)} style={{
                background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer'
              }}>
                <div style={{ fontWeight: 800 }}>{s.operationName}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.patientName} · {fmtDateTime(s.startTime)}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  {s.outcomeSummary ? s.outcomeSummary.slice(0, 120) + (s.outcomeSummary.length > 120 ? '…' : '') : <em style={{ color: '#94a3b8' }}>No outcome recorded.</em>}
                </div>
              </div>
            ))}
            {surgeries.filter(s => s.status === 'Completed' || s.outcomeSummary).length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No completed surgeries yet.</div>
            )}
          </div>
        </div>
      )}

      {/* ─── BED TRACE TAB ─── */}
      {tab === 'bedtrace' && (
        <div>
          <div style={{ marginBottom: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>
            Patient bed movement during the surgical journey (Pre-op → OT → Post-op).
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(filtered.length ? filtered : surgeries).map(s => {
              const trace = surgeryBedTrace.filter(b => b.surgeryId === s.id).sort((a, b) => new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime());
              return (
                <div key={s.id} onClick={() => setDetailId(s.id)} style={{
                  background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{s.patientName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.operationName} · {fmtDateTime(s.startTime)}</div>
                    </div>
                    <span style={{ background: STATUS_COLORS[s.status].bg, color: STATUS_COLORS[s.status].fg, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', height: 'fit-content' }}>{s.status}</span>
                  </div>
                  {trace.length === 0 ? (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>No movement recorded yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.65rem', alignItems: 'center' }}>
                      {trace.map((b, idx) => (
                        <React.Fragment key={b.id}>
                          <div style={{ background: '#f1f5f9', padding: '0.35rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
                            <strong>{b.stage}</strong> · {b.location}
                            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{new Date(b.enteredAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</div>
                          </div>
                          {idx < trace.length - 1 && <span style={{ color: '#cbd5e1' }}>→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {surgeries.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No surgeries yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────── */
/* Reusable surgery list picker (used by resources / checklists tabs) */
const SurgeryListPicker: React.FC<{
  title: string;
  surgeries: Surgery[];
  surgeryTeam: SurgeryTeamMember[];
  surgerySupplies: SurgerySupplyItem[];
  surgeryEquipment: SurgeryEquipmentItem[];
  surgeryChecklist: SurgeryChecklistItem[];
  staff: ReturnType<typeof useEMR>['staff'];
  onPick: (s: Surgery) => void;
  summary: (s: Surgery) => string;
}> = ({ title, surgeries, onPick, summary, staff }) => (
  <div>
    <div style={{ marginBottom: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>{title}</div>
    <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
      {surgeries.map(s => (
        <div key={s.id} onClick={() => onPick(s)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800 }}>{s.operationName}</div>
            <span style={{ background: STATUS_COLORS[s.status].bg, color: STATUS_COLORS[s.status].fg, fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px' }}>{s.status}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{s.patientName} · Dr. {staff.find(st => st.id === s.surgeonId)?.name ?? 'Unassigned'}</div>
          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.5rem' }}>{summary(s)}</div>
        </div>
      ))}
      {surgeries.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No surgeries yet.</div>}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────── */
/* Surgery detail modal — central control panel for one surgery     */
type DetailCtx = {
  staff: ReturnType<typeof useEMR>['staff'];
  assets: ReturnType<typeof useEMR>['assets'];
  drugs: ReturnType<typeof useEMR>['drugs'];
  currentStaff: ReturnType<typeof useEMR>['currentStaff'];
  surgeryTeam: SurgeryTeamMember[];
  surgerySupplies: SurgerySupplyItem[];
  surgeryEquipment: SurgeryEquipmentItem[];
  surgeryChecklist: SurgeryChecklistItem[];
  surgeryBedTrace: SurgeryBedTrace[];
  updateSurgery: ReturnType<typeof useEMR>['updateSurgery'];
  addSurgeryTeamMember: ReturnType<typeof useEMR>['addSurgeryTeamMember'];
  removeSurgeryTeamMember: ReturnType<typeof useEMR>['removeSurgeryTeamMember'];
  addSurgerySupply: ReturnType<typeof useEMR>['addSurgerySupply'];
  updateSurgerySupply: ReturnType<typeof useEMR>['updateSurgerySupply'];
  removeSurgerySupply: ReturnType<typeof useEMR>['removeSurgerySupply'];
  addSurgeryEquipment: ReturnType<typeof useEMR>['addSurgeryEquipment'];
  updateSurgeryEquipment: ReturnType<typeof useEMR>['updateSurgeryEquipment'];
  removeSurgeryEquipment: ReturnType<typeof useEMR>['removeSurgeryEquipment'];
  addSurgeryChecklistItem: ReturnType<typeof useEMR>['addSurgeryChecklistItem'];
  updateSurgeryChecklistItem: ReturnType<typeof useEMR>['updateSurgeryChecklistItem'];
  addSurgeryBedTrace: ReturnType<typeof useEMR>['addSurgeryBedTrace'];
  updateSurgeryBedTrace: ReturnType<typeof useEMR>['updateSurgeryBedTrace'];
  updatePatient: ReturnType<typeof useEMR>['updatePatient'];
};

const SurgeryDetailModal: React.FC<{ surgery: Surgery; onClose: () => void; ctx: DetailCtx }> = ({ surgery, onClose, ctx }) => {
  const [section, setSection] = useState<'overview' | 'team' | 'supplies' | 'equipment' | 'checklist' | 'outcome' | 'bedtrace'>('overview');

  const team = ctx.surgeryTeam.filter(t => t.surgeryId === surgery.id);
  const supplies = ctx.surgerySupplies.filter(s => s.surgeryId === surgery.id);
  const equipment = ctx.surgeryEquipment.filter(e => e.surgeryId === surgery.id);
  const checklist = ctx.surgeryChecklist.filter(c => c.surgeryId === surgery.id).sort((a, b) => a.sortOrder - b.sortOrder);
  const trace = ctx.surgeryBedTrace.filter(b => b.surgeryId === surgery.id).sort((a, b) => new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime());

  // Team add form
  const [newTeamStaffId, setNewTeamStaffId] = useState('');
  const [newTeamRole, setNewTeamRole] = useState<typeof TEAM_ROLES[number]>('Assistant Surgeon');

  // Supply add form
  const [newSupItem, setNewSupItem] = useState('');
  const [newSupCat, setNewSupCat] = useState<SurgerySupplyItem['category']>('Supply');
  const [newSupQty, setNewSupQty] = useState('1');
  const [newSupUnit, setNewSupUnit] = useState('');
  const [newSupDrugId, setNewSupDrugId] = useState<string>('');

  // Equipment add form
  const [newEqAssetId, setNewEqAssetId] = useState('');

  // Checklist add form
  const [newChkLabel, setNewChkLabel] = useState('');
  const [newChkPhase, setNewChkPhase] = useState<SurgeryChecklistItem['phase']>('PreOp');

  // Outcome edit form
  const [outcome, setOutcome] = useState({
    outcomeSummary: surgery.outcomeSummary ?? '',
    outcomeFindings: surgery.outcomeFindings ?? '',
    postOpPlan: surgery.postOpPlan ?? '',
    complications: surgery.complications ?? '',
  });

  // Bed trace add form
  const [newBedStage, setNewBedStage] = useState<SurgeryBedTrace['stage']>('PreOp');
  const [newBedLoc, setNewBedLoc] = useState('');

  const sectionTabBtn = (key: typeof section, label: string, icon: React.ReactNode) => (
    <button onClick={() => setSection(key)} style={{
      display: 'flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.4rem 0.75rem', border: 'none', borderRadius: '0.4rem',
      background: section === key ? '#8b5cf6' : '#f1f5f9',
      color: section === key ? 'white' : '#475569',
      fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
    }}>{icon} {label}</button>
  );

  const handleStatusChange = async (newStatus: Surgery['status']) => {
    await ctx.updateSurgery(surgery.id, { status: newStatus });
  };

  return (
    <div style={overlay}>
      <div style={{ ...sheet, maxWidth: '880px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{surgery.operationName}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {surgery.patientName} ({surgery.patientMrn}) · {fmtDateTime(surgery.startTime)} · {surgery.roomNumber}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Status switcher */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {(['Scheduled', 'In Progress', 'Completed', 'Cancelled'] as Surgery['status'][]).map(st => (
            <button key={st} onClick={() => handleStatusChange(st)} disabled={surgery.status === st} style={{
              padding: '0.35rem 0.75rem', borderRadius: '0.4rem',
              border: '1px solid ' + STATUS_COLORS[st].bg,
              background: surgery.status === st ? STATUS_COLORS[st].bg : 'white',
              color: STATUS_COLORS[st].fg,
              fontWeight: 700, fontSize: '0.78rem', cursor: surgery.status === st ? 'default' : 'pointer',
            }}>{st}</button>
          ))}
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          {sectionTabBtn('overview',  'Overview',  <FileText size={12} />)}
          {sectionTabBtn('team',      'Team',      <Users size={12} />)}
          {sectionTabBtn('supplies',  'Supplies',  <Pill size={12} />)}
          {sectionTabBtn('equipment', 'Equipment', <Wrench size={12} />)}
          {sectionTabBtn('checklist', 'Checklist', <ClipboardCheck size={12} />)}
          {sectionTabBtn('bedtrace',  'Bed Trace', <MapPin size={12} />)}
          {sectionTabBtn('outcome',   'Outcome',   <CheckCircle2 size={12} />)}
        </div>

        {/* OVERVIEW */}
        {section === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Field label="Patient">{surgery.patientName}</Field>
            <Field label="MRN">{surgery.patientMrn}</Field>
            <Field label="Operation">{surgery.operationName}</Field>
            <Field label="Site">{surgery.operationSite || '—'}</Field>
            <Field label="Technique">{surgery.technique || '—'}</Field>
            <Field label="Anesthesia">{surgery.anesthesiaType}</Field>
            <Field label="Room">{surgery.roomNumber}</Field>
            <Field label="Priority">{surgery.priority ?? 'Elective'}</Field>
            <Field label="Start">{fmtDateTime(surgery.startTime)}</Field>
            <Field label="End">{fmtDateTime(surgery.endTime)}</Field>
            <Field label="Surgeon">Dr. {ctx.staff.find(s => s.id === surgery.surgeonId)?.name ?? 'Unassigned'}</Field>
            <Field label="Status">{surgery.status}</Field>
            {surgery.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Description (patient-facing)</div>
                <div style={{ marginTop: '0.25rem' }}>{surgery.description}</div>
              </div>
            )}
          </div>
        )}

        {/* TEAM */}
        {section === 'team' && (
          <div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={lblStyle}>Staff</label>
                <select value={newTeamStaffId} onChange={e => setNewTeamStaffId(e.target.value)} style={inpStyle}>
                  <option value="">— Choose —</option>
                  {ctx.staff.filter(s => !team.some(t => t.staffId === s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name} · {s.role}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: '0 0 180px' }}>
                <label style={lblStyle}>Role</label>
                <select value={newTeamRole} onChange={e => setNewTeamRole(e.target.value as any)} style={inpStyle}>
                  {TEAM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button style={btnPrimary} onClick={async () => {
                const st = ctx.staff.find(s => s.id === Number(newTeamStaffId));
                if (!st) return;
                await ctx.addSurgeryTeamMember({
                  surgeryId: surgery.id, staffId: st.id, staffName: st.name,
                  role: newTeamRole, department: st.role,
                });
                setNewTeamStaffId('');
              }}><Plus size={14} /> Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {team.map(m => (
                <div key={m.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{m.staffName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.role}{m.department ? ` · ${m.department}` : ''}</div>
                  </div>
                  <button onClick={() => ctx.removeSurgeryTeamMember(m.id)} style={iconBtn}><Trash2 size={14} /></button>
                </div>
              ))}
              {team.length === 0 && <div style={emptyRow}>No team members assigned.</div>}
            </div>
          </div>
        )}

        {/* SUPPLIES */}
        {section === 'supplies' && (
          <div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
              <div style={{ flex: '0 0 130px' }}>
                <label style={lblStyle}>Category</label>
                <select value={newSupCat} onChange={e => setNewSupCat(e.target.value as any)} style={inpStyle}>
                  <option value="Drug">Drug</option>
                  <option value="Supply">Supply</option>
                  <option value="Consumable">Consumable</option>
                </select>
              </div>
              {newSupCat === 'Drug' ? (
                <div style={{ flex: '1 1 200px' }}>
                  <label style={lblStyle}>Drug</label>
                  <select value={newSupDrugId} onChange={e => {
                    setNewSupDrugId(e.target.value);
                    const d = ctx.drugs.find(dd => dd.id === Number(e.target.value));
                    if (d) { setNewSupItem(d.name); setNewSupUnit(d.unit || d.form || ''); }
                  }} style={inpStyle}>
                    <option value="">— Choose drug —</option>
                    {ctx.drugs.map(d => <option key={d.id} value={d.id}>{d.name} ({d.strength})</option>)}
                  </select>
                </div>
              ) : (
                <div style={{ flex: '1 1 200px' }}>
                  <label style={lblStyle}>Item</label>
                  <input value={newSupItem} onChange={e => setNewSupItem(e.target.value)} style={inpStyle} placeholder="e.g. Surgical gloves" />
                </div>
              )}
              <div style={{ flex: '0 0 80px' }}>
                <label style={lblStyle}>Qty</label>
                <input value={newSupQty} type="number" onChange={e => setNewSupQty(e.target.value)} style={inpStyle} />
              </div>
              <div style={{ flex: '0 0 100px' }}>
                <label style={lblStyle}>Unit</label>
                <input value={newSupUnit} onChange={e => setNewSupUnit(e.target.value)} style={inpStyle} placeholder="vial / pack" />
              </div>
              <button style={btnPrimary} onClick={async () => {
                if (!newSupItem.trim()) return;
                await ctx.addSurgerySupply({
                  surgeryId: surgery.id,
                  itemName: newSupItem.trim(),
                  category: newSupCat,
                  source: newSupCat === 'Drug' ? 'Pharmacy DB' : 'Inventory DB',
                  drugId: newSupCat === 'Drug' && newSupDrugId ? Number(newSupDrugId) : undefined,
                  quantity: Number(newSupQty) || 1,
                  unit: newSupUnit || undefined,
                  status: 'Requested',
                  requestedBy: ctx.currentStaff?.name,
                });
                setNewSupItem(''); setNewSupQty('1'); setNewSupUnit(''); setNewSupDrugId('');
              }}><Plus size={14} /> Request</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {supplies.map(s => (
                <div key={s.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{s.itemName} <span style={{ fontWeight: 400, color: '#64748b' }}>× {s.quantity} {s.unit || ''}</span></div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.category} · {s.source || '—'}{s.requestedBy ? ` · by ${s.requestedBy}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <select value={s.status} onChange={e => ctx.updateSurgerySupply(s.id, { status: e.target.value as any, preparedBy: e.target.value === 'Prepared' ? ctx.currentStaff?.name : s.preparedBy })} style={{ ...inpStyle, padding: '0.3rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}>
                      <option>Requested</option><option>Prepared</option><option>Issued</option><option>Returned</option><option>Cancelled</option>
                    </select>
                    <button onClick={() => ctx.removeSurgerySupply(s.id)} style={iconBtn}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {supplies.length === 0 && <div style={emptyRow}>No supplies requested.</div>}
            </div>
          </div>
        )}

        {/* EQUIPMENT */}
        {section === 'equipment' && (
          <div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={lblStyle}>Asset</label>
                <select value={newEqAssetId} onChange={e => setNewEqAssetId(e.target.value)} style={inpStyle}>
                  <option value="">— Choose asset —</option>
                  {ctx.assets.filter(a => !equipment.some(e => e.assetId === a.id)).map(a => (
                    <option key={a.id} value={a.id}>{a.name} · {a.id} ({a.status})</option>
                  ))}
                </select>
              </div>
              <button style={btnPrimary} onClick={async () => {
                const a = ctx.assets.find(x => x.id === newEqAssetId);
                if (!a) return;
                await ctx.addSurgeryEquipment({
                  surgeryId: surgery.id,
                  assetId: a.id,
                  assetName: a.name,
                  status: 'Requested',
                  requestedBy: ctx.currentStaff?.name,
                });
                setNewEqAssetId('');
              }}><Plus size={14} /> Request</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {equipment.map(e => (
                <div key={e.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{e.assetName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{e.assetId}{e.requestedBy ? ` · by ${e.requestedBy}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <select value={e.status} onChange={ev => ctx.updateSurgeryEquipment(e.id, { status: ev.target.value as any })} style={{ ...inpStyle, padding: '0.3rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}>
                      <option>Requested</option><option>Allocated</option><option>In Use</option><option>Returned</option>
                    </select>
                    <button onClick={() => ctx.removeSurgeryEquipment(e.id)} style={iconBtn}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {equipment.length === 0 && <div style={emptyRow}>No equipment allocated.</div>}
            </div>
          </div>
        )}

        {/* CHECKLIST */}
        {section === 'checklist' && (
          <div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
              <div style={{ flex: '0 0 120px' }}>
                <label style={lblStyle}>Phase</label>
                <select value={newChkPhase} onChange={e => setNewChkPhase(e.target.value as any)} style={inpStyle}>
                  <option value="PreOp">Pre-Op</option>
                  <option value="IntraOp">Intra-Op</option>
                  <option value="PostOp">Post-Op</option>
                </select>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={lblStyle}>Item</label>
                <input value={newChkLabel} onChange={e => setNewChkLabel(e.target.value)} style={inpStyle} placeholder="e.g. Cross-match blood ready" />
              </div>
              <button style={btnPrimary} onClick={async () => {
                if (!newChkLabel.trim()) return;
                const maxOrder = checklist.reduce((m, c) => Math.max(m, c.sortOrder), -1);
                await ctx.addSurgeryChecklistItem({
                  surgeryId: surgery.id, phase: newChkPhase, label: newChkLabel.trim(),
                  isDone: false, sortOrder: maxOrder + 1,
                });
                setNewChkLabel('');
              }}><Plus size={14} /> Add</button>
            </div>
            {(['PreOp', 'IntraOp', 'PostOp'] as const).map(ph => {
              const items = checklist.filter(c => c.phase === ph);
              return (
                <div key={ph} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>
                    {ph === 'PreOp' ? 'Pre-Op' : ph === 'IntraOp' ? 'Intra-Op' : 'Post-Op'}
                  </div>
                  {items.map(c => (
                    <div key={c.id} style={{ ...rowStyle, cursor: 'pointer' }} onClick={() => ctx.updateSurgeryChecklistItem(c.id, {
                      isDone: !c.isDone,
                      doneBy: !c.isDone ? ctx.currentStaff?.name : undefined,
                      doneAt: !c.isDone ? new Date().toISOString() : undefined,
                    })}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {c.isDone ? <CheckCircle2 size={16} color="#16a34a" /> : <Circle size={16} color="#94a3b8" />}
                        <div>
                          <div style={{ fontWeight: 600, textDecoration: c.isDone ? 'line-through' : 'none' }}>{c.label}</div>
                          {c.isDone && c.doneBy && (
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.doneBy} · {c.doneAt ? new Date(c.doneAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : ''}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div style={emptyRow}>No items in this phase.</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* BED TRACE */}
        {section === 'bedtrace' && (
          <div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
              <div style={{ flex: '0 0 120px' }}>
                <label style={lblStyle}>Stage</label>
                <select value={newBedStage} onChange={e => setNewBedStage(e.target.value as any)} style={inpStyle}>
                  <option value="PreOp">Pre-Op</option>
                  <option value="OT">OT</option>
                  <option value="PostOp">Post-Op</option>
                </select>
              </div>
              <div style={{ flex: '1 1 220px' }}>
                <label style={lblStyle}>Location</label>
                <input value={newBedLoc} onChange={e => setNewBedLoc(e.target.value)} style={inpStyle} placeholder="e.g. Ward-B / Bed 4, OT 1, PACU / Bed 2" />
              </div>
              <button style={btnPrimary} onClick={async () => {
                if (!newBedLoc.trim()) return;
                const now = new Date().toISOString();
                // close previous open trace
                const open = trace.find(t => !t.exitedAt);
                if (open) await ctx.updateSurgeryBedTrace(open.id, { exitedAt: now });
                await ctx.addSurgeryBedTrace({
                  surgeryId: surgery.id,
                  patientMrn: surgery.patientMrn,
                  stage: newBedStage,
                  location: newBedLoc.trim(),
                  enteredAt: now,
                  recordedBy: ctx.currentStaff?.name,
                });
                // reflect on patient record so other modules see current location
                try {
                  if (newBedStage === 'OT') {
                    await ctx.updatePatient(surgery.patientMrn, { assignedBed: newBedLoc.trim(), assignedWard: 'OT' });
                  } else {
                    await ctx.updatePatient(surgery.patientMrn, { assignedBed: newBedLoc.trim() });
                  }
                } catch { /* non-fatal */ }
                setNewBedLoc('');
              }}><Plus size={14} /> Record move</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {trace.map(b => (
                <div key={b.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.stage} · {b.location}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Entered {new Date(b.enteredAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                      {b.exitedAt ? ` → Exited ${new Date(b.exitedAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}` : ' · still here'}
                      {b.recordedBy ? ` · by ${b.recordedBy}` : ''}
                    </div>
                  </div>
                </div>
              ))}
              {trace.length === 0 && <div style={emptyRow}>No movement recorded.</div>}
            </div>
          </div>
        )}

        {/* OUTCOME */}
        {section === 'outcome' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div>
              <label style={lblStyle}>Outcome summary</label>
              <textarea rows={2} value={outcome.outcomeSummary} onChange={e => setOutcome(o => ({ ...o, outcomeSummary: e.target.value }))} style={{ ...inpStyle, resize: 'vertical' }} placeholder="e.g. Successful; no intra-op complications." />
            </div>
            <div>
              <label style={lblStyle}>Findings</label>
              <textarea rows={2} value={outcome.outcomeFindings} onChange={e => setOutcome(o => ({ ...o, outcomeFindings: e.target.value }))} style={{ ...inpStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={lblStyle}>Post-op plan / care instructions</label>
              <textarea rows={2} value={outcome.postOpPlan} onChange={e => setOutcome(o => ({ ...o, postOpPlan: e.target.value }))} style={{ ...inpStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={lblStyle}>Complications</label>
              <textarea rows={2} value={outcome.complications} onChange={e => setOutcome(o => ({ ...o, complications: e.target.value }))} style={{ ...inpStyle, resize: 'vertical' }} placeholder="None / list any complications" />
            </div>
            <button style={btnPrimary} onClick={async () => {
              await ctx.updateSurgery(surgery.id, {
                outcomeSummary: outcome.outcomeSummary,
                outcomeFindings: outcome.outcomeFindings,
                postOpPlan: outcome.postOpPlan,
                complications: outcome.complications,
                outcomeRecordedAt: new Date().toISOString(),
                outcomeRecordedBy: ctx.currentStaff?.name,
                status: surgery.status === 'In Progress' ? 'Completed' : surgery.status,
              });
              alert('Outcome saved.');
            }}><CheckCircle2 size={14} /> Save outcome</button>
          </div>
        )}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
    <div style={{ marginTop: '0.15rem' }}>{children}</div>
  </div>
);

const lblStyle: React.CSSProperties = { fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.25rem' };
const inpStyle: React.CSSProperties = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.4rem', fontSize: '0.85rem', background: 'white', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { padding: '0.5rem 0.9rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '0.45rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' };
const btnSecondary: React.CSSProperties = { padding: '0.5rem 0.9rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.45rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' };
const chip: React.CSSProperties = { background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.35rem' };
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.55rem 0.75rem' };
const emptyRow: React.CSSProperties = { textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.85rem', background: '#f8fafc', borderRadius: '0.5rem' };
const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' };

export default OperationManagement;
