import React, { useState, useRef } from 'react';
import {
  Clipboard, BookOpen, PenTool, CheckCircle, Save, X, Activity,
  Image as ImageIcon, Video, History, FileText, Plus, Maximize2,
  Calendar, ChevronRight, Download, Eye, Trash2
} from 'lucide-react';
import { useEMR } from '../context/EMRContext';

interface ClinicalEncounterProps {
  onClose: () => void;
  patientName: string;
  defaultTab?: 'soap' | 'imaging' | 'history';
}

type PrescriptionRecord = { 
  id: number; 
  date: string; 
  doctor: string; 
  diagnosis: string; 
  meds: string;
  subjective?: string;
  objective?: string;
  labTests?: string[];
  labResults?: { test: string; result: string; range: string }[];
};

const initialHistory: PrescriptionRecord[] = [
  { 
    id: 1, date: '2026-04-15', doctor: 'Dr. Solomon', diagnosis: 'Acute Bronchitis', meds: 'Amoxicillin 500mg, Salbutamol Inhaler',
    subjective: 'Patient reports persistent cough for 5 days, yellow sputum, and mild fever (38.2C). No chest pain.',
    objective: 'Bilateral rhonchi on auscultation. Throat is mildly congested. Pulse 88, SpO2 96% on room air.',
    labTests: ['Chest X-Ray', 'CBC'],
    labResults: [
      { test: 'WBC Count', result: '11.5 x10^3/uL', range: '4.5-11.0' },
      { test: 'Neutrophils', result: '78%', range: '40-75%' }
    ]
  },
  { 
    id: 2, date: '2026-02-10', doctor: 'Dr. Abraham', diagnosis: 'Hypertension', meds: 'Amlodipine 5mg QD',
    subjective: 'Routine follow-up. Patient complains of occasional morning headaches. Adherent to meds.',
    objective: 'BP 155/95 mmHg. Heart sounds S1, S2 regular. No peripheral edema.',
    labTests: ['Urinalysis', 'Serum Creatinine'],
    labResults: [
      { test: 'Creatinine', result: '0.9 mg/dL', range: '0.7-1.3' }
    ]
  },
  { 
    id: 3, date: '2025-11-20', doctor: 'Dr. Fitsum', diagnosis: 'Gastritis', meds: 'Omeprazole 20mg BID',
    subjective: 'Epigastric burning pain, worse after meals. No melena or hematemesis.',
    objective: 'Tenderness in epigastrium on deep palpation. No masses felt.',
    labTests: ['H. pylori Stool Antigen'],
    labResults: [
      { test: 'H. pylori', result: 'Positive', range: 'Negative' }
    ]
  },
];

type ImagingItem = { id: number; type: string; title: string; date: string; thumb: string; full: string; isVideo?: boolean };

const initialImaging: ImagingItem[] = [
  { id: 1, type: 'X-ray', title: 'Chest X-ray PA View', date: '2026-05-10', thumb: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&q=80&w=200', full: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&q=80&w=1200' },
  { id: 2, type: 'CT', title: 'Abdomen Contrast CT', date: '2026-05-08', thumb: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&q=80&w=200', full: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&q=80&w=1200' },
  { id: 3, type: 'Video', title: 'Endoscopy Procedure', date: '2026-05-05', thumb: 'https://images.unsplash.com/photo-1579154235602-44373db99a23?auto=format&fit=crop&q=80&w=200', full: 'https://images.unsplash.com/photo-1579154235602-44373db99a23?auto=format&fit=crop&q=80&w=1200', isVideo: true },
];

const ClinicalEncounter: React.FC<ClinicalEncounterProps> = ({ onClose, patientName, defaultTab = 'soap' }) => {
  const { patients, updatePatient, role } = useEMR();
  const currentPatient = patients.find(p => p.name === patientName);

  const [activeTab, setActiveTab] = useState<'soap' | 'imaging' | 'history'>(defaultTab);
  const [soap, setSoap] = useState({ 
    subjective: '', 
    objective: '', 
    assessment: '', 
    plan: '', 
    icd10_code: '', 
    diagnosis_description: '',
    publishToPortal: true
  });
  const [imagingData, setImagingData] = useState<ImagingItem[]>(initialImaging);
  const [prescriptionHistory, setPrescriptionHistory] = useState<PrescriptionRecord[]>(initialHistory);
  const [maximizedImage, setMaximizedImage] = useState<string | null>(null);
  const [selectedEncounter, setSelectedEncounter] = useState<PrescriptionRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canDeleteHistory = role === 'Admin' || role === 'Doctor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPatient) {
      const planArray = soap.plan.split('\n').filter(line => line.trim() !== '');
      await updatePatient(currentPatient.mrn, {
        diagnosisSummary: soap.diagnosis_description || soap.assessment,
        treatmentPlan: soap.publishToPortal ? planArray : [],
      });
    }
    onClose();
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const url = URL.createObjectURL(file);
    setImagingData(prev => [...prev, {
      id: Date.now(),
      type: isVideo ? 'Video' : file.type.includes('pdf') ? 'PDF' : 'Image',
      title: file.name,
      date: new Date().toISOString().split('T')[0],
      thumb: isVideo ? url : url,
      full: url,
      isVideo,
    }]);
    e.target.value = '';
  };

  const handleDownload = (img: ImagingItem) => {
    const a = document.createElement('a');
    a.href = img.full;
    a.download = img.title;
    a.target = '_blank';
    a.click();
  };

  const handleRepeatPrescription = (hist: PrescriptionRecord) => {
    const today = new Date().toISOString().split('T')[0];
    setPrescriptionHistory(prev => [{ ...hist, id: Date.now(), date: today, doctor: 'Dr. (Current)' }, ...prev]);
  };

  return (
    <div className="encounter-container" style={{ maxWidth: '1200px' }}>
      {maximizedImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={() => setMaximizedImage(null)}>
          <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', padding: '0.5rem', color: 'white', cursor: 'pointer' }}
            onClick={() => setMaximizedImage(null)}><X size={24} /></button>
          <img src={maximizedImage} alt="Full view" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '0.5rem' }} onClick={e => e.stopPropagation()} />
        </div>
      )}

      {selectedEncounter && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: '2rem' }}
          onClick={() => setSelectedEncounter(null)}>
          <div style={{ background: 'white', width: '100%', maxWidth: '800px', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'modalSlideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'var(--primary-color)', color: 'white', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Past Encounter Record</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{selectedEncounter.diagnosis}</h3>
              </div>
              <button onClick={() => setSelectedEncounter(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '0.5rem', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', marginBottom: '0.25rem' }}>VISIT DATE</div>
                  <div style={{ fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> {selectedEncounter.date}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', marginBottom: '0.25rem' }}>ATTENDING DOCTOR</div>
                  <div style={{ fontWeight: '700', color: '#1e293b' }}>{selectedEncounter.doctor}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <section>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#475569', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={18} /> CLINICAL NOTES (SOAP)
                  </h4>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', marginBottom: '0.25rem' }}>SUBJECTIVE</div>
                      <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.6' }}>{selectedEncounter.subjective || 'No notes recorded.'}</p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', marginBottom: '0.25rem' }}>OBJECTIVE</div>
                      <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.6' }}>{selectedEncounter.objective || 'No physical exam recorded.'}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#475569', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Beaker size={18} /> LABS & DIAGNOSTICS
                  </h4>
                  {selectedEncounter.labResults && selectedEncounter.labResults.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b' }}>Test Name</th>
                          <th style={{ textAlign: 'center', padding: '0.75rem', color: '#64748b' }}>Result</th>
                          <th style={{ textAlign: 'right', padding: '0.75rem', color: '#64748b' }}>Reference Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEncounter.labResults.map((lr, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem', fontWeight: '600', color: '#1e293b' }}>{lr.test}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '700', color: '#3b82f6' }}>{lr.result}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#94a3b8' }}>{lr.range}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No laboratory data for this encounter.</p>
                  )}
                </section>

                <section>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#475569', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PillIcon size={18} /> PRESCRIPTIONS
                  </h4>
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '1.25rem', borderRadius: '0.75rem', color: '#0369a1', fontSize: '1rem', fontWeight: '700' }}>
                    {selectedEncounter.meds}
                  </div>
                </section>
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedEncounter(null)} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Close Record</button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleUpload} />

      <div className="encounter-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clipboard size={24} color="#3b82f6" />
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Comprehensive Clinical Chart</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Patient: {patientName} | Location: MCM OPD</p>
          </div>
        </div>
        <button onClick={onClose} className="btn-close"><X size={24} /></button>
      </div>

      <div className="pharmacy-tabs" style={{ background: '#f8fafc', padding: '0.5rem 1rem 0', borderBottom: '1px solid #e2e8f0' }}>
        <button className={`tab-btn ${activeTab === 'soap' ? 'active' : ''}`} onClick={() => setActiveTab('soap')}>
          <FileText size={18} /> Consultation (SOAP)
        </button>
        <button className={`tab-btn ${activeTab === 'imaging' ? 'active' : ''}`} onClick={() => setActiveTab('imaging')}>
          <ImageIcon size={18} /> Imaging & PACS
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <History size={18} /> Medical History
        </button>
      </div>

      <div className="encounter-body" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
        {activeTab === 'soap' ? (
          <form onSubmit={handleSubmit} className="encounter-form">
            <div className="soap-section">
              <div className="form-group full-width">
                <label><BookOpen size={16} /> Subjective (Chief Complaint & History)</label>
                <textarea rows={3} value={soap.subjective} onChange={e => setSoap({ ...soap, subjective: e.target.value })} placeholder="Enter patient symptoms and history..."></textarea>
              </div>
              <div className="form-group full-width">
                <label><Activity size={16} /> Objective (Physical Examination)</label>
                <textarea rows={3} value={soap.objective} onChange={e => setSoap({ ...soap, objective: e.target.value })} placeholder="Enter physical examination findings..."></textarea>
              </div>
              <div className="assessment-plan-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label><CheckCircle size={16} /> Assessment (Diagnosis)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input type="text" placeholder="ICD-10" style={{ width: '100px' }} value={soap.icd10_code} onChange={e => setSoap({ ...soap, icd10_code: e.target.value })} />
                    <input type="text" placeholder="Diagnosis" style={{ flex: 1 }} value={soap.diagnosis_description} onChange={e => setSoap({ ...soap, diagnosis_description: e.target.value })} />
                  </div>
                  <textarea rows={4} value={soap.assessment} onChange={e => setSoap({ ...soap, assessment: e.target.value })} placeholder="Additional notes..."></textarea>
                </div>
                <div className="form-group">
                  <label><PenTool size={16} /> Plan (Treatment & Follow-up)</label>
                  <textarea rows={6} value={soap.plan} onChange={e => setSoap({ ...soap, plan: e.target.value })} placeholder="Enter treatment plan, prescriptions, and follow-up..."></textarea>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdfa', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #ccfbf1' }}>
               <input type="checkbox" id="publish" checked={soap.publishToPortal} onChange={e => setSoap({...soap, publishToPortal: e.target.checked})} style={{ width: '18px', height: '18px' }} />
               <label htmlFor="publish" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#134e4a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                 <Eye size={16} /> Publish diagnosis and plan to Patient Portal
               </label>
            </div>
            <div className="form-actions" style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary"><Save size={20} /> Finalize Chart</button>
            </div>
          </form>
        ) : activeTab === 'imaging' ? (
          <div className="imaging-pacs">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>Medical Image Gallery</h3>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => fileInputRef.current?.click()}>
                <Plus size={18} /> Upload Image/Video
              </button>
            </div>
            <div className="image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {imagingData.map(img => (
                <div key={img.id} className="stat-card" style={{ padding: '0', overflow: 'hidden', height: 'auto', border: '1px solid #e2e8f0' }}>
                  <div style={{ position: 'relative', height: '180px', background: '#000' }}>
                    <img src={img.thumb} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                      <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', padding: '4px', color: 'white', cursor: 'pointer' }}
                        onClick={() => setMaximizedImage(img.full)}>
                        <Maximize2 size={16} />
                      </button>
                    </div>
                    {img.isVideo && (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
                        <Video size={40} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>{img.type}</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{img.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{img.date}</span>
                      <button style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer' }} onClick={() => handleDownload(img)}>
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="history-timeline">
            <h3 style={{ marginBottom: '1.5rem' }}>Longitudinal Prescription History</h3>
            <div className="timeline-container" style={{ position: 'relative', paddingLeft: '2rem' }}>
              <div style={{ position: 'absolute', left: '0.5rem', top: '0', bottom: '0', width: '2px', background: '#e2e8f0' }}></div>
              {prescriptionHistory.map((hist, idx) => (
                <div key={hist.id} style={{ position: 'relative', marginBottom: '2rem' }}>
                  <div style={{ position: 'absolute', left: '-2.1rem', top: '0.25rem', width: '1rem', height: '1rem', borderRadius: '50%', background: idx === 0 ? 'var(--primary-color)' : '#94a3b8', border: '2px solid white', boxShadow: '0 0 0 4px #f8fafc' }}></div>
                  <div className="stat-card" style={{ padding: '1.5rem', height: 'auto', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <Calendar size={14} /> {hist.date}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-color)' }}>{hist.doctor}</span>
                    </div>
                    <div 
                      style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '0.75rem', color: '#1e293b', cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#1e293b'}
                      onClick={() => setSelectedEncounter(hist)}
                    >
                      {hist.diagnosis}
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                      <PillIcon size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>{hist.meds}</div>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {canDeleteHistory ? (
                        deleteConfirmId === hist.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: '700' }}>Delete?</span>
                            <button 
                              onClick={() => {
                                setPrescriptionHistory(prev => prev.filter(h => h.id !== hist.id));
                                setDeleteConfirmId(null);
                              }}
                              style={{ padding: '0.3rem 0.8rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                            >Yes</button>
                            <button 
                              onClick={() => setDeleteConfirmId(null)}
                              style={{ padding: '0.3rem 0.8rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                            >No</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeleteConfirmId(hist.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#dc2626', border: 'none', background: 'none', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', padding: '0.3rem 0.5rem', borderRadius: '0.4rem', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        )
                      ) : <div />}
                      <button style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#3b82f6', border: 'none', background: 'none', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                        onClick={() => handleRepeatPrescription(hist)}>
                        Repeat Prescription <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PillIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" />
  </svg>
);

const Beaker: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M4.5 3h15" /><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" /><path d="M6 14h12" />
  </svg>
);

export default ClinicalEncounter;
