import React, { useState } from 'react';
import {
  ShieldCheck, Cpu, BookOpen, MessageSquare, AlertCircle, Database,
  Settings, Plus, Terminal, Zap, Lock, X, Check
} from 'lucide-react';

type MedicalLaw = {
  id: number;
  title: string;
  summary: string;
  tags: string[];
  synced: boolean;
};

const initialLaws: MedicalLaw[] = [
  {
    id: 1,
    title: 'Ethiopian Medicine Administration and Control Proclamation (No. 661/2009)',
    summary: 'Regulates the registration, licensing, and distribution of medicines and medical devices.',
    tags: ['Medicine', 'Pharmacy', 'Legal'],
    synced: false,
  },
  {
    id: 2,
    title: 'FMHACA Prescription Guidelines (2026 Edition)',
    summary: 'Mandatory requirements for valid prescriptions, including doctor signature and patient identification.',
    tags: ['Prescription', 'Safety'],
    synced: false,
  },
];

const complianceLogs = [
  { id: 1, time: '10:25 AM', user: 'Dr. Solomon', action: 'Prescribed Morphine', result: 'Caution', msg: 'Local law requires duplicate record for narcotics.' },
  { id: 2, time: '11:40 AM', user: 'Dr. Abraham', action: 'Prescribed Amoxicillin', result: 'Pass', msg: 'Complies with standard treatment guidelines.' },
];

type LawForm = { title: string; summary: string; tags: string };

const emptyForm: LawForm = { title: '', summary: '', tags: '' };

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const boxStyle: React.CSSProperties = { background: 'white', borderRadius: '1rem', padding: '2rem', width: '520px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };

const AIComplianceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'laws' | 'guard' | 'config'>('laws');
  const [llmStatus] = useState<'Online' | 'Offline'>('Online');
  const [laws, setLaws] = useState<MedicalLaw[]>(initialLaws);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<MedicalLaw | null>(null);
  const [addForm, setAddForm] = useState<LawForm>(emptyForm);
  const [editForm, setEditForm] = useState<LawForm>(emptyForm);
  const [endpoint, setEndpoint] = useState('http://localhost:11434/api/generate');
  const [model, setModel] = useState('MedLlama-3-8B-Ethio (Recommended)');
  const [configSaved, setConfigSaved] = useState(false);

  const handleAddLaw = () => {
    if (!addForm.title.trim()) return;
    setLaws(prev => [...prev, {
      id: Date.now(),
      title: addForm.title,
      summary: addForm.summary,
      tags: addForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      synced: false,
    }]);
    setAddModal(false);
    setAddForm(emptyForm);
  };

  const openEdit = (law: MedicalLaw) => {
    setEditForm({ title: law.title, summary: law.summary, tags: law.tags.join(', ') });
    setEditModal(law);
  };

  const handleEditLaw = () => {
    if (!editModal || !editForm.title.trim()) return;
    setLaws(prev => prev.map(l => l.id === editModal.id ? {
      ...l,
      title: editForm.title,
      summary: editForm.summary,
      tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      synced: false,
    } : l));
    setEditModal(null);
  };

  const handleSync = (id: number) => {
    setLaws(prev => prev.map(l => l.id === id ? { ...l, synced: true } : l));
  };

  const handleSaveConfig = () => {
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  const LawFormFields = ({ form, onChange }: { form: LawForm; onChange: (f: LawForm) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Title *</label>
        <input type="text" value={form.title} placeholder="Law or guideline title"
          onChange={e => onChange({ ...form, title: e.target.value })}
          style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
      </div>
      <div>
        <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Summary</label>
        <textarea rows={3} value={form.summary} placeholder="Brief description..."
          onChange={e => onChange({ ...form, summary: e.target.value })}
          style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem' }} />
      </div>
      <div>
        <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Tags (comma-separated)</label>
        <input type="text" value={form.tags} placeholder="e.g. Medicine, Legal, Safety"
          onChange={e => onChange({ ...form, tags: e.target.value })}
          style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
      </div>
    </div>
  );

  return (
    <div className="compliance-container">
      {addModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Add Law / Guideline</h3>
              <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <LawFormFields form={addForm} onChange={setAddForm} />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddLaw} disabled={!addForm.title.trim()}>Add to Knowledge Base</button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div style={overlayStyle}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Edit Law Text</h3>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <LawFormFields form={editForm} onChange={setEditForm} />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleEditLaw} disabled={!editForm.title.trim()}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div className="pharmacy-tabs">
        <button className={`tab-btn ${activeTab === 'laws' ? 'active' : ''}`} onClick={() => setActiveTab('laws')}>
          <BookOpen size={20} /> Medical Law Registry
        </button>
        <button className={`tab-btn ${activeTab === 'guard' ? 'active' : ''}`} onClick={() => setActiveTab('guard')}>
          <ShieldCheck size={20} /> AI Prescription Guard
        </button>
        <button className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>
          <Settings size={20} /> Local LLM Config
        </button>
      </div>

      <div className="compliance-content" style={{ marginTop: '1.5rem' }}>
        {activeTab === 'laws' ? (
          <div className="law-section">
            <div className="content-header" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={20} /> Legal Knowledge Base</h3>
              <button className="btn-primary" onClick={() => setAddModal(true)}>
                <Plus size={18} /> Add Law Text
              </button>
            </div>
            <div className="law-grid" style={{ display: 'grid', gap: '1rem' }}>
              {laws.map(law => (
                <div key={law.id} className="stat-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', height: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <h4 style={{ color: 'var(--primary-color)', fontSize: '1.1rem', flex: 1, marginRight: '1rem' }}>{law.title}</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      {law.tags.map(tag => (
                        <span key={tag} className="status-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{law.summary}</p>
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => openEdit(law)}>Edit Text</button>
                    <button className="btn-secondary" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => handleSync(law.id)} disabled={law.synced}>
                      {law.synced ? <><Check size={14} color="#16a34a" /> Synced</> : 'Sync with LLM'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'guard' ? (
          <div className="guard-section" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
            <div className="compliance-monitor">
              <div className="stat-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Live Prescription Audit</h3>
                <div style={{ background: '#0f172a', color: '#10b981', padding: '1rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  <p># Local LLM Audit Thread Started...</p>
                  <p style={{ color: '#94a3b8' }}># Listening to Clinical Encounter events...</p>
                </div>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Time</th><th>User</th><th>Action</th><th>AI Result</th><th>Legal Remark</th></tr>
                  </thead>
                  <tbody>
                    {complianceLogs.map(log => (
                      <tr key={log.id}>
                        <td>{log.time}</td>
                        <td>{log.user}</td>
                        <td><strong>{log.action}</strong></td>
                        <td><span className={`status-badge ${log.result === 'Pass' ? 'status-active' : 'status-pending'}`}>{log.result}</span></td>
                        <td style={{ fontSize: '0.85rem' }}>{log.msg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="ai-status-sidebar">
              <div className="stat-card" style={{ padding: '1.5rem', background: 'var(--primary-color)', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Zap size={20} fill="white" /><strong>Local LLM Status</strong>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4ade80' }} />
                  {llmStatus}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>Model: MedLlama-3-8B-Ethio</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>Latency: 120ms (On-Premise)</div>
              </div>
              <div className="stat-card" style={{ padding: '1.5rem', marginTop: '1rem', border: '1px dashed #cbd5e1', height: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                  <Lock size={18} /><strong>Data Privacy Mode</strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  All AI processing is performed strictly within the MCM Local LAN. No data is transmitted to the internet.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="config-section stat-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>AI Infrastructure Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>AI API Endpoint</label>
                <input type="text" value={endpoint} onChange={e => setEndpoint(e.target.value)}
                  className="form-input" style={{ width: '100%' }} />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Default AI Model</label>
                <select value={model} onChange={e => setModel(e.target.value)} className="form-input" style={{ width: '100%', padding: '0.6rem' }}>
                  <option>MedLlama-3-8B-Ethio (Recommended)</option>
                  <option>Mistral-7B-Clinical</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                  <Terminal size={18} /> Connection Test
                </label>
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f1f5f9', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                  <p>&gt; ping ai-server...</p>
                  <p style={{ color: '#166534' }}>&gt; 200 OK: Ollama is running on localhost</p>
                </div>
              </div>
              <button className="btn-primary" onClick={handleSaveConfig} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                {configSaved ? <><Check size={18} /> Configuration Saved</> : 'Save Configuration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIComplianceManager;
