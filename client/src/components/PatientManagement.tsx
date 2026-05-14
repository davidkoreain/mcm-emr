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

      {/* Patient Detail Modal */}
      {detailModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Patient Details</h3>
              <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'MRN', value: detailModal.mrn },
                { label: 'Name (EN)', value: detailModal.name },
                { label: 'Name (AM)', value: detailModal.amharic },
                { label: 'DOB', value: detailModal.dob },
                { label: 'Gender', value: detailModal.gender },
                { label: 'Visit Type', value: detailModal.visitType },
                { label: 'Status', value: detailModal.status },
                { label: 'Ward', value: detailModal.ward || 'N/A' },
                { label: 'Registered', value: detailModal.registeredAt || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{label}</span>
                  <span style={{ fontWeight: '700' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setDetailModal(null)}>Close</button>
              <button className="btn-primary" onClick={() => { onViewEncounter(detailModal); setDetailModal(null); }}>Start Consult</button>
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
