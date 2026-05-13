import React, { useMemo } from 'react';
import { Activity, Clock, User, ChevronRight } from 'lucide-react';
import { useEMR } from '../context/EMRContext';
import Avatar from './Avatar';

interface FlowBoardProps {
  onStartConsult: (patient: { mrn: string; name: string; amharic: string }) => void;
}

const FlowBoard: React.FC<FlowBoardProps> = ({ onStartConsult }) => {
  const { patients } = useEMR();

  const boardPatients = useMemo(() => {
    // Show patients who are NOT completed
    return patients.filter(p => p.status !== 'Completed').sort((a, b) => {
      // Prioritize Emergency
      if (a.visitType === 'Emergency' && b.visitType !== 'Emergency') return -1;
      if (a.visitType !== 'Emergency' && b.visitType === 'Emergency') return 1;
      // Then by time (if available)
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [patients]);

  const stats = useMemo(() => {
    return {
      waiting: boardPatients.filter(p => p.status === 'Waiting').length,
      consulting: boardPatients.filter(p => p.status === 'Consulting').length,
      emergency: boardPatients.filter(p => p.visitType === 'Emergency').length,
    };
  }, [boardPatients]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-label">WAITING</div>
          <div className="stat-value" style={{ color: '#d97706' }}>{stats.waiting}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-label">CONSULTING</div>
          <div className="stat-value" style={{ color: '#2563eb' }}>{stats.consulting}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-label">EMERGENCY</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>{stats.emergency}</div>
        </div>
      </div>

      {/* Main Board */}
      <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table className="data-table">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Patient</th>
              <th>Status</th>
              <th>Visit Type</th>
              <th>Time</th>
              <th>MRN</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {boardPatients.map((p) => (
              <tr key={p.mrn} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar name={p.name} photoUrl={p.photoUrl} size={44} />
                    <div>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.amharic}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${p.status === 'Waiting' ? 'status-pending' : 'status-active'}`} style={{ padding: '0.25rem 0.75rem', borderRadius: '2rem' }}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: p.visitType === 'Emergency' ? '#dc2626' : '#64748b', fontWeight: p.visitType === 'Emergency' ? '700' : '500' }}>
                    {p.visitType === 'Emergency' && <Activity size={14} />}
                    {p.visitType}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.85rem' }}>
                    <Clock size={14} /> {p.time || '--:--'}
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>{p.mrn}</td>
                <td>
                  <button 
                    onClick={() => onStartConsult({ mrn: p.mrn, name: p.name, amharic: p.amharic })}
                    className="btn-primary" 
                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    Examine <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {boardPatients.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                  <User size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>No patients currently on the board.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FlowBoard;
