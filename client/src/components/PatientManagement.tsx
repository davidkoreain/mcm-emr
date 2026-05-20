import React, { useState, useMemo, useRef } from 'react';
import { PlusCircle, Upload, Users, X, Info, Activity, Stethoscope, Clock, Calendar, LayoutGrid, List } from 'lucide-react';
import { useEMR, type Patient } from '../context/EMRContext';
import ListFilterControl from './ListFilterControl';
import Avatar from './Avatar';
import { usePageAdjustments } from '../hooks/usePageAdjustments';
import { QRCodeSVG } from 'qrcode.react';

interface PatientManagementProps {
  onViewVitals: (patient: { mrn: string; name: string; amharic: string }) => void;
  onViewEncounter: (patient: { mrn: string; name: string; amharic: string }) => void;
  onRegister: () => void;
  onEditPatient: (patient: Patient) => void;
  autoOpenId?: string | null;
  onModalClose?: () => void;
}

const PatientManagement: React.FC<PatientManagementProps> = ({ onViewVitals, onViewEncounter, onRegister, onEditPatient, autoOpenId, onModalClose }) => {
  const { patients, role, addPatient } = useEMR();

  const [ptSearch, setPtSearch] = useState('');
  const [ptFilters, setPtFilters] = useState<Record<string, string>>({ visitType: '', status: '' });
  const [ptSort, setPtSort] = useState('name_asc');
  const [isInpatientOnly, setIsInpatientOnly] = useState(false);
  const [detailModal, setDetailModal] = useState<Patient | null>(null);
  const [modalTab, setModalTab] = useState<'demographic' | 'identity' | 'history' | 'insurance'>('demographic');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ added: number; errors: number } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Adjustment Settings
  const { columns, itemsPerPage, isMobile } = usePageAdjustments('patients');

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('emr_view_mode_patients') as 'grid' | 'list') || 'grid';
  });

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImporting(true);
    setCsvResult(null);
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
      let added = 0, errors = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = cols[idx] ?? ''; });
        if (!row.name) { errors++; continue; }
        const now = new Date();
        const mrn = 'MRN-' + Date.now() + '-' + i;
        const patient: Patient = {
          mrn,
          name: row.name || '',
          amharic: row.amharic || '',
          visitType: row.visit_type || row.visittype || 'OPD',
          status: row.status || 'Waiting',
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          registeredAt: now.toISOString(),
          gender: row.gender || '',
          dob: row.dob || row.date_of_birth || '',
          phone: row.phone || '',
          city: row.city || '',
          woreda: row.woreda || '',
          kebele: row.kebele || '',
          vitals: [],
          medications: [],
          ward: row.ward || '',
        };
        try { await addPatient(patient); added++; }
        catch { errors++; }
      }
      setCsvResult({ added, errors });
    } finally {
      setCsvImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  React.useEffect(() => {
    if (autoOpenId && patients.length > 0) {
      const patient = patients.find(p => p.mrn.toLowerCase().trim() === autoOpenId.toLowerCase().trim());
      if (patient) {
        setDetailModal(patient);
        setModalTab('demographic');
      }
    }
  }, [autoOpenId, patients]);

  const handleCloseModal = () => {
    setDetailModal(null);
    setModalTab('demographic');
    if (onModalClose) onModalClose();
  };

  const filteredPatients = useMemo(() => {
    let result = patients.filter((p) => {
      const q = ptSearch.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.amharic.includes(q) && !p.mrn.toLowerCase().includes(q)) return false;
      if (ptFilters.visitType && p.visitType !== ptFilters.visitType) return false;
      if (ptFilters.status && p.status !== ptFilters.status) return false;
      if (isInpatientOnly && p.visitType !== 'Inpatient') return false;
      return true;
    });
    return [...result].sort((a, b) => {
      if (ptSort === 'name_desc') return b.name.localeCompare(a.name);
      if (ptSort === 'date_desc') return (b.registeredAt || '').localeCompare(a.registeredAt || '');
      if (ptSort === 'date_asc') return (a.registeredAt || '').localeCompare(b.registeredAt || '');
      return a.name.localeCompare(b.name);
    });
  }, [patients, ptSearch, ptFilters, ptSort]);

  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(start, start + itemsPerPage);
  }, [filteredPatients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const boxStyle: React.CSSProperties = { background: 'white', borderRadius: '1rem', padding: '2rem', width: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };

  return (
    <div>
      {/* Patient Detail Modal */}
      {detailModal && (
        <div style={overlayStyle}>
          <div style={{ ...boxStyle, width: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Patient Profile</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{detailModal.mrn} • {detailModal.name}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <QRCodeSVG value={`https://mcm-emr-theta.vercel.app/?type=patient&id=${detailModal.mrn}`} size={120} level="H" includeMargin={true} />
                </div>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              {[
                { id: 'demographic', label: 'Demographics' },
                { id: 'identity', label: 'Identity' },
                { id: 'history', label: 'History' },
                { id: 'insurance', label: 'Insurance' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setModalTab(t.id as any)}
                  style={{
                    padding: '0.5rem 0',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    border: 'none',
                    background: 'none',
                    borderBottom: modalTab === t.id ? '2px solid var(--primary-color)' : '2px solid transparent',
                    color: modalTab === t.id ? 'var(--primary-color)' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ minHeight: '300px' }}>
              {modalTab === 'demographic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'Title', value: detailModal.title || '—' },
                    { label: 'Preferred Name', value: detailModal.preferredName || '—' },
                    { label: 'Name (AM)', value: detailModal.amharic || '—' },
                    { label: 'DOB', value: detailModal.dob || '—' },
                    { label: 'Gender', value: detailModal.gender || '—' },
                    { label: 'Language', value: detailModal.language || 'English' },
                    { label: 'Phone', value: detailModal.phone || '—' },
                    { label: 'City', value: detailModal.city || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.2rem' }}>{label}</div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {modalTab === 'identity' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'Gender Identity', value: detailModal.genderIdentity || '—' },
                    { label: 'Sexual Orientation', value: detailModal.sexualOrientation || '—' },
                    { label: 'Pronouns', value: detailModal.pronouns || '—' },
                    { label: 'Birth Sex', value: detailModal.birthSex || '—' },
                    { label: 'Ethnicity', value: detailModal.ethnicity || '—' },
                    { label: 'Race', value: detailModal.race || '—' },
                    { label: 'Nationality', value: detailModal.nationality || '—' },
                    { label: 'Religion', value: detailModal.religion || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.2rem' }}>{label}</div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {modalTab === 'history' && (() => {
                const parsedEncounter = (() => {
                  if (!detailModal.diagnosisSummary) return null;
                  try {
                    return JSON.parse(detailModal.diagnosisSummary) as {
                      date: string;
                      doctor: string;
                      icd?: string;
                      diagnosis?: string;
                      subjective?: string;
                      objective?: string;
                      notes?: string;
                    };
                  } catch {
                    return null;
                  }
                })();

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {parsedEncounter ? (
                      <div style={{ 
                        background: '#f8fafc', 
                        padding: '1.25rem', 
                        borderRadius: '0.75rem', 
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          borderBottom: '1px solid #e2e8f0', 
                          paddingBottom: '0.5rem' 
                        }}>
                          <h4 style={{ 
                            fontSize: '0.9rem', 
                            color: '#0f172a', 
                            fontWeight: 800, 
                            margin: 0, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem' 
                          }}>
                            <Stethoscope size={18} color="#2563eb" /> Clinical Summary
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                            {parsedEncounter.date}
                          </span>
                        </div>

                        {/* Doctor & ICD */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Attending:</span>
                          <span style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: '700' }}>Dr. {parsedEncounter.doctor}</span>
                          {parsedEncounter.icd && (
                            <span style={{ 
                              marginLeft: 'auto', 
                              background: '#ef444410', 
                              color: '#ef4444', 
                              padding: '0.15rem 0.5rem', 
                              borderRadius: '0.25rem', 
                              fontSize: '0.75rem', 
                              fontWeight: '700' 
                            }}>
                              ICD: {parsedEncounter.icd}
                            </span>
                          )}
                        </div>

                        {/* Diagnosis */}
                        {parsedEncounter.diagnosis && (
                          <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #fee2e2' }}>
                            <div style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Diagnosis</div>
                            <div style={{ fontSize: '0.9rem', color: '#991b1b', fontWeight: '700' }}>{parsedEncounter.diagnosis}</div>
                          </div>
                        )}

                        {/* Subjective & Objective */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                          {parsedEncounter.subjective && (
                            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Subjective</div>
                              <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: '1.4' }}>{parsedEncounter.subjective}</div>
                            </div>
                          )}
                          {parsedEncounter.objective && (
                            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Objective</div>
                              <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: '1.4' }}>{parsedEncounter.objective}</div>
                            </div>
                          )}
                        </div>

                        {/* Clinical Notes */}
                        {parsedEncounter.notes && (
                          <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #dbeafe' }}>
                            <div style={{ fontSize: '0.7rem', color: '#1e40af', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Clinical Notes</div>
                            <div style={{ fontSize: '0.825rem', color: '#1e40af', lineHeight: '1.4' }}>{parsedEncounter.notes}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fee2e2' }}>
                        <h4 style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Activity size={16} /> Clinical Summary
                        </h4>
                        <p style={{ fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>
                          {detailModal.diagnosisSummary || 'No recent diagnosis recorded.'}
                        </p>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Visit Type</div>
                        <div style={{ fontWeight: '700' }}>{detailModal.visitType}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Current Status</div>
                        <div style={{ fontWeight: '700' }}>{detailModal.status}</div>
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Social History</div>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                        Interpreter Needed: {detailModal.interpreterNeeded ? 'Yes' : 'No'} • 
                        Homeless: {detailModal.homelessStatus ? 'Yes' : 'No'} •
                        Income: {detailModal.monthlyIncome ? `$${detailModal.monthlyIncome}/mo` : 'Not Disclosed'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {modalTab === 'insurance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: '#eff6ff', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #dbeafe' }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#1e40af', marginBottom: '0.75rem' }}>Primary Insurance</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Provider</span>
                      <span style={{ fontWeight: '700' }}>{detailModal.insuranceProvider || 'Private Pay / Cash'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Policy Number</span>
                      <span style={{ fontWeight: '700', fontFamily: 'monospace' }}>{detailModal.insurancePolicyNo || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => { setDetailModal(null); setModalTab('demographic'); }}>Close</button>
              {role === 'Admin' && (
                <button 
                  style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}
                  onClick={() => { onEditPatient(detailModal); setDetailModal(null); }}
                >
                  Edit Profile
                </button>
              )}
              <button className="btn-primary" onClick={() => { onViewEncounter(detailModal); setDetailModal(null); }}>Start Consultation</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: '1.5rem' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isMobile ? 'space-between' : 'flex-start',
          width: isMobile ? '100%' : 'auto',
          gap: '0.75rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={24} color="var(--primary-color)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Patient List</h2>
          </div>
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.375rem', overflow: 'hidden' }}>
            <button 
              onClick={() => { setViewMode('grid'); localStorage.setItem('emr_view_mode_patients', 'grid'); }}
              style={{ background: viewMode === 'grid' ? '#e2e8f0' : 'white', border: 'none', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              title="Grid View"
            >
              <LayoutGrid size={16} color={viewMode === 'grid' ? '#0f172a' : '#64748b'} />
            </button>
            <button 
              onClick={() => { setViewMode('list'); localStorage.setItem('emr_view_mode_patients', 'list'); }}
              style={{ background: viewMode === 'list' ? '#e2e8f0' : 'white', border: 'none', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              title="List View"
            >
              <List size={16} color={viewMode === 'list' ? '#0f172a' : '#64748b'} />
            </button>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: isMobile ? '100%' : 'auto',
          gap: '0.75rem' 
        }}>
          <input ref={csvInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvImport} />
          <button className="btn-secondary" onClick={() => csvInputRef.current?.click()} disabled={csvImporting} style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Upload size={16} /> {csvImporting ? 'Importing…' : 'CSV Import'}
          </button>
          <button className="btn-primary" onClick={onRegister} style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <PlusCircle size={18} /> New Patient
          </button>
        </div>
      </div>
      {csvResult && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: csvResult.errors > 0 ? '#fef3c7' : '#d1fae5', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#1e293b' }}>
          CSV import complete: <strong>{csvResult.added}</strong> patients added{csvResult.errors > 0 ? `, ${csvResult.errors} rows skipped (missing name)` : ''}.{' '}
          <button onClick={() => setCsvResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>✕</button>
        </div>
      )}

      <ListFilterControl
        searchValue={ptSearch}
        onSearchChange={setPtSearch}
        searchPlaceholder="Search by name, Amharic name, or MRN..."
        filters={[
          {
            key: 'visitType', label: 'Visit Type',
            options: [
              { label: 'All Types', value: '' },
              { label: 'OPD', value: 'OPD' },
              { label: 'Emergency', value: 'Emergency' },
              { label: 'Follow-up', value: 'Follow-up' },
              { label: 'Inpatient', value: 'Inpatient' },
            ],
          },
          {
            key: 'status', label: 'Status',
            options: [
              { label: 'All', value: '' },
              { label: 'Waiting', value: 'Waiting' },
              { label: 'In Progress', value: 'In Progress' },
              { label: 'Consulting', value: 'Consulting' },
              { label: 'Completed', value: 'Completed' },
            ],
          },
        ]}
        filterValues={ptFilters}
        onFilterChange={(k, v) => setPtFilters((prev) => ({ ...prev, [k]: v }))}
        sortValue={ptSort}
        sortOptions={[
          { label: 'Name A→Z', value: 'name_asc' },
          { label: 'Name Z→A', value: 'name_desc' },
          { label: 'Registered Newest', value: 'date_desc' },
          { label: 'Registered Oldest', value: 'date_asc' },
        ]}
        onSortChange={setPtSort}
        totalCount={patients.length}
        filteredCount={filteredPatients.length}
      >
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: isInpatientOnly ? '#fef3c7' : '#f1f5f9',
          padding: '0.4rem 0.75rem',
          borderRadius: '0.5rem',
          border: isInpatientOnly ? '1px solid #f59e0b' : '1px solid #e2e8f0',
          cursor: 'pointer',
          fontSize: '0.82rem',
          color: isInpatientOnly ? '#b45309' : '#1e293b',
          fontWeight: '600',
          userSelect: 'none',
          transition: 'all 0.15s ease'
        }}>
          <input
            type="checkbox"
            checked={isInpatientOnly}
            onChange={(e) => {
              setIsInpatientOnly(e.target.checked);
              setCurrentPage(1);
            }}
            style={{
              cursor: 'pointer',
              accentColor: '#f59e0b',
              margin: 0
            }}
          />
          <span style={{ whiteSpace: 'nowrap' }}>Inpatient Only</span>
        </label>
      </ListFilterControl>

      {viewMode === 'grid' ? (
        <div className="patient-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${columns}, 1fr)`, 
          gap: '1.5rem', 
          marginTop: '1.5rem' 
        }}>
          {paginatedPatients.map((p) => (
            <div key={p.mrn} className="stat-card" style={{ padding: '0', border: '1px solid var(--border-color)', height: 'auto', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div 
                onClick={() => setDetailModal(p)}
                style={{ width: '100%', height: '200px', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Avatar name={p.name} size={120} />
                )}
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#2563eb', fontWeight: '700' }}>{p.mrn}</div>
                    <h3 onClick={() => setDetailModal(p)} style={{ fontSize: '1.1rem', marginTop: '0.2rem', fontWeight: '800', cursor: 'pointer' }}>{p.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.amharic}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span className={`status-badge ${p.status === 'Completed' ? 'status-active' : p.status === 'Waiting' ? 'status-pending' : 'status-active'}`} style={{ height: 'fit-content' }}>
                      {p.status}
                    </span>
                    <div style={{ background: 'white', padding: '0.3rem', borderRadius: '0.4rem', border: '1px solid #e2e8f0', marginTop: '0.25rem' }}>
                      <QRCodeSVG value={`https://mcm-emr-theta.vercel.app/?type=patient&id=${p.mrn}`} size={80} level="M" includeMargin={true} />
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '700' }}>
                    <Stethoscope size={14} /> {p.visitType}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} /> Registered: {p.registeredAt || '—'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => setDetailModal(p)}>Details</button>
                  <button 
                    className="btn-primary" 
                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', background: '#f59e0b', border: 'none' }} 
                    onClick={() => onViewVitals({ mrn: p.mrn, name: p.name, amharic: p.amharic })}
                  >
                    Vitals
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} 
                    onClick={() => onViewEncounter({ mrn: p.mrn, name: p.name, amharic: p.amharic })}
                  >
                    Consult
                  </button>
                </div>
              </div>
            </div>
          ))}
          {patients.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
              [System] Failed to load patient list from the server. Please retry shortly.
            </div>
          )}
          {patients.length > 0 && filteredPatients.length === 0 && !autoOpenId && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              No matching patient data found.
              <br/><span style={{ fontSize: '0.8rem' }}>(Search: "{ptSearch}", Total patients: {patients.length})</span>
            </div>
          )}
          {autoOpenId && !detailModal && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#3b82f6' }}>
              <p style={{ fontWeight: '700' }}>Matching patient details... (ID: {autoOpenId})</p>
              <p style={{ fontSize: '0.8rem' }}>Loaded patients: {patients.length}</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>MRN</th>
                  <th>Name</th>
                  <th>Visit Type</th>
                  <th>Status</th>
                  <th>Registered At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((p) => (
                  <tr key={p.mrn} style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{p.mrn}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <Avatar name={p.name} size={36} />
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{p.name}</div>
                          {p.amharic && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.amharic}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
                        <Stethoscope size={12} color="var(--primary-color)" /> {p.visitType}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${p.status === 'Completed' ? 'status-active' : p.status === 'Waiting' ? 'status-pending' : 'status-active'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.registeredAt || '—'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setDetailModal(p)}>Details</button>
                        <button className="btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#f59e0b', border: 'none' }} onClick={() => onViewVitals({ mrn: p.mrn, name: p.name, amharic: p.amharic })}>Vitals</button>
                        <button className="btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => onViewEncounter({ mrn: p.mrn, name: p.name, amharic: p.amharic })}>Consult</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
                      [System] Failed to load patient list from the server. Please retry shortly.
                    </td>
                  </tr>
                )}
                {patients.length > 0 && filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No matching patient data found. (Search: "{ptSearch}")
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem', padding: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#cbd5e1' : '#1e293b', fontWeight: '600' }}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#cbd5e1' : '#1e293b', fontWeight: '600' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
