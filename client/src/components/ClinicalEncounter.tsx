import React, { useState, useRef } from 'react';
import {
  Clipboard, BookOpen, PenTool, CheckCircle, Save, X, Activity,
  Image as ImageIcon, Video, History, FileText, Plus, Maximize2,
  Calendar, ChevronRight, Download, Eye
} from 'lucide-react';
import { useEMR } from '../context/EMRContext';

interface ClinicalEncounterProps {
  onClose: () => void;
  patientName: string;
}

type PrescriptionRecord = { id: number; date: string; doctor: string; diagnosis: string; meds: string };

const initialHistory: PrescriptionRecord[] = [
  { id: 1, date: '2026-04-15', doctor: 'Dr. Solomon', diagnosis: 'Acute Bronchitis', meds: 'Amoxicillin 500mg, Salbutamol Inhaler' },
  { id: 2, date: '2026-02-10', doctor: 'Dr. Abraham', diagnosis: 'Hypertension', meds: 'Amlodipine 5mg QD' },
  { id: 3, date: '2025-11-20', doctor: 'Dr. Fitsum', diagnosis: 'Gastritis', meds: 'Omeprazole 20mg BID' },
];

type ImagingItem = { id: number; type: string; title: string; date: string; thumb: string; full: string; isVideo?: boolean };

const initialImaging: ImagingItem[] = [
  { id: 1, type: 'X-ray', title: 'Chest X-ray PA View', date: '2026-05-10', thumb: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&q=80&w=200', full: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&q=80&w=1200' },
  { id: 2, type: 'CT', title: 'Abdomen Contrast CT', date: '2026-05-08', thumb: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&q=80&w=200', full: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&q=80&w=1200' },
  { id: 3, type: 'Video', title: 'Endoscopy Procedure', date: '2026-05-05', thumb: 'https://images.unsplash.com/photo-1579154235602-44373db99a23?auto=format&fit=crop&q=80&w=200', full: 'https://images.unsplash.com/photo-1579154235602-44373db99a23?auto=format&fit=crop&q=80&w=1200', isVideo: true },
];

const ClinicalEncounter: React.FC<ClinicalEncounterProps> = ({ onClose, patientName }) => {
  const { patients, updatePatient } = useEMR();
  const currentPatient = patients.find(p => p.name === patientName);

  const [activeTab, setActiveTab] = useState<'soap' | 'imaging' | 'history'>('soap');
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                    <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.5rem' }}>{hist.diagnosis}</div>
                    <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                      <PillIcon size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>{hist.meds}</div>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
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

export default ClinicalEncounter;
