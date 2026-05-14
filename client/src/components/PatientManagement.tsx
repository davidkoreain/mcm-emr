import React, { useState, useMemo } from 'react';
import { PlusCircle, Users, X, Info, Activity, Stethoscope, Clock, Calendar } from 'lucide-react';
import { useEMR, type Patient } from '../context/EMRContext';
import ListFilterControl from './ListFilterControl';
import Avatar from './Avatar';

interface PatientManagementProps {
  onViewVitals: (patient: { mrn: string; name: string; amharic: string }) => void;
  onViewEncounter: (patient: { mrn: string; name: string; amharic: string }) => void;
  onRegister: () => void;
}

const PatientManagement: React.FC<PatientManagementProps> = ({ onViewVitals, onViewEncounter, onRegister }) => {
  const { patients } = useEMR();
  
  const [ptSearch, setPtSearch] = useState('');
  const [ptFilters, setPtFilters] = useState<Record<string, string>>({ visitType: '', status: '' });
  const [ptSort, setPtSort] = useState('name_asc');
  const [detailModal, setDetailModal] = useState<Patient | null>(null);
  const [modalTab, setModalTab] = useState<'demographic' | 'identity' | 'history' | 'insurance'>('demographic');

  const filteredPatients = useMemo(() => {
    let result = patients.filter((p) => {
      const q = ptSearch.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.amharic.includes(q) && !p.mrn.toLowerCase().includes(q)) return false;
      if (ptFilters.visitType && p.visitType !== ptFilters.visitType) return false;
      if (ptFilters.status && p.status !== ptFilters.status) return false;
      return true;
    });
    return [...result].sort((a, b) => {
      if (ptSort === 'name_desc') return b.name.localeCompare(a.name);
      if (ptSort === 'date_desc') return (b.registeredAt || '').localeCompare(a.registeredAt || '');
      if (ptSort === 'date_asc') return (a.registeredAt || '').localeCompare(b.registeredAt || '');
      return a.name.localeCompare(b.name);
    });
  }, [patients, ptSearch, ptFilters, ptSort]);

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
              <button onClick={() => { setDetailModal(null); setModalTab('demographic'); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
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

              {modalTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fee2e2' }}>
                     <h4 style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={16} /> Clinical Summary</h4>
                     <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{detailModal.diagnosisSummary || 'No recent diagnosis recorded.'}</p>
                   </div>
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
              )}

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
              <button className="btn-primary" onClick={() => { onViewEncounter(detailModal); setDetailModal(null); }}>Start Consultation</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={24} color="var(--primary-color)" />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Patient List</h2>
        </div>
        <button className="btn-primary" onClick={onRegister} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={18} /> New Patient
        </button>
      </div>

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
      />

      <div className="asset-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {filteredPatients.map((p) => (
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
                <span className={`status-badge ${p.status === 'Completed' ? 'status-active' : p.status === 'Waiting' ? 'status-pending' : 'status-active'}`} style={{ height: 'fit-content' }}>
                  {p.status}
                </span>
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
        {filteredPatients.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No patients match your search criteria.</div>}
      </div>
    </div>
  );
};

export default PatientManagement;
