import React, { useState, useMemo } from 'react';
import { PlusCircle, Users } from 'lucide-react';
import { useEMR } from '../context/EMRContext';
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

  return (
    <div>
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

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>MRN</th>
              <th>Patient</th>
              <th>Visit Type</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p) => (
              <tr key={p.mrn}>
                <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>{p.mrn}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar name={p.name} photoUrl={p.photoUrl} size={52} />
                    <div>
                      <div style={{ fontWeight: '600' }}>{p.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{p.amharic}</div>
                    </div>
                  </div>
                </td>
                <td>{p.visitType}</td>
                <td>
                  <span className={`status-badge ${p.status === 'Completed' ? 'status-active' : p.status === 'Waiting' ? 'status-pending' : 'status-active'}`}>
                    {p.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{p.registeredAt || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => onViewVitals({ mrn: p.mrn, name: p.name, amharic: p.amharic })}
                      className="btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#f59e0b', border: 'none' }}
                    >
                      Vitals
                    </button>
                    <button
                      onClick={() => onViewEncounter({ mrn: p.mrn, name: p.name, amharic: p.amharic })}
                      className="btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      Consult
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPatients.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No patients match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientManagement;
