import React, { useState } from 'react';
import { toast } from '../utils/toast';
import { 
  ShieldCheck, 
  Cpu, 
  BookOpen, 
  MessageSquare, 
  AlertCircle, 
  Database, 
  Settings, 
  Plus, 
  Terminal,
  Zap,
  Lock
} from 'lucide-react';

const AIComplianceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'laws' | 'guard' | 'config'>('laws');
  const [llmStatus, setLlmStatus] = useState<'Online' | 'Offline'>('Online');

  const medicalLaws = [
    { 
      id: 1, 
      title: 'Ethiopian Medicine Administration and Control Proclamation (No. 661/2009)', 
      summary: 'Regulates the registration, licensing, and distribution of medicines and medical devices.',
      tags: ['Medicine', 'Pharmacy', 'Legal']
    },
    { 
      id: 2, 
      title: 'FMHACA Prescription Guidelines (2026 Edition)', 
      summary: 'Mandatory requirements for valid prescriptions, including doctor signature and patient identification.',
      tags: ['Prescription', 'Safety']
    }
  ];

  const complianceLogs = [
    { id: 1, time: '10:25 AM', user: 'Dr. Solomon', action: 'Prescribed Morphine', result: 'Caution', msg: 'Local law requires duplicate record for narcotics.' },
    { id: 2, time: '11:40 AM', user: 'Dr. Abraham', action: 'Prescribed Amoxicillin', result: 'Pass', msg: 'Complies with standard treatment guidelines.' },
  ];

  return (
    <div className="compliance-container">
      <div className="pharmacy-tabs">
        <button 
          className={`tab-btn ${activeTab === 'laws' ? 'active' : ''}`}
          onClick={() => setActiveTab('laws')}
        >
          <BookOpen size={20} />
          Medical Law Registry
        </button>
        <button 
          className={`tab-btn ${activeTab === 'guard' ? 'active' : ''}`}
          onClick={() => setActiveTab('guard')}
        >
          <ShieldCheck size={20} />
          AI Prescription Guard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <Settings size={20} />
          Local LLM Config
        </button>
      </div>

      <div className="compliance-content" style={{ marginTop: '1.5rem' }}>
        {activeTab === 'laws' ? (
          <div className="law-section">
            <div className="content-header" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={20} />
                Legal Knowledge Base
              </h3>
              <button className="btn-primary" onClick={() => toast('Law text added to knowledge base', 'success')}>
                <Plus size={18} />
                Add Law Text
              </button>
            </div>
            <div className="law-grid" style={{ display: 'grid', gap: '1rem' }}>
              {medicalLaws.map(law => (
                <div key={law.id} className="stat-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', height: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <h4 style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{law.title}</h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {law.tags.map(tag => (
                        <span key={tag} className="status-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{law.summary}</p>
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => toast('Law text editor opening...', 'info')}>Edit Text</button>
                    <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => toast('Syncing with local LLM...', 'info')}>Sync with LLM</button>
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
                      <tr>
                        <th>Time</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>AI Result</th>
                        <th>Legal Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complianceLogs.map(log => (
                        <tr key={log.id}>
                          <td>{log.time}</td>
                          <td>{log.user}</td>
                          <td><strong>{log.action}</strong></td>
                          <td>
                            <span className={`status-badge ${log.result === 'Pass' ? 'status-active' : 'status-pending'}`}>
                              {log.result}
                            </span>
                          </td>
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
                      <Zap size={20} fill="white" />
                      <strong>Local LLM Status</strong>
                   </div>
                   <div style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4ade80' }}></div>
                      {llmStatus}
                   </div>
                   <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
                      Model: MedLlama-3-8B-Ethio
                   </div>
                   <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
                      Latency: 120ms (On-Premise)
                   </div>
                </div>

                <div className="stat-card" style={{ padding: '1.5rem', marginTop: '1rem', border: '1px dashed #cbd5e1', height: 'auto' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                      <Lock size={18} />
                      <strong>Data Privacy Mode</strong>
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
                  <input type="text" defaultValue="http://localhost:11434/api/generate" className="form-input" style={{ width: '100%' }} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Default AI Model</label>
                  <select className="form-input" style={{ width: '100%', padding: '0.6rem' }}>
                    <option>MedLlama-3-8B-Ethio (Recommended)</option>
                    <option>Mistral-7B-Clinical</option>
                  </select>
                </div>
                <div className="form-group">
                   <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                      <Terminal size={18} />
                      Connection Test
                   </label>
                   <div style={{ marginTop: '1rem', padding: '1rem', background: '#f1f5f9', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                      <p>&gt; ping ai-server...</p>
                      <p style={{ color: '#166534' }}>&gt; 200 OK: Ollama is running on localhost</p>
                   </div>
                </div>
                <button className="btn-primary" onClick={() => toast('AI configuration saved', 'success')}>Save Configuration</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIComplianceManager;
