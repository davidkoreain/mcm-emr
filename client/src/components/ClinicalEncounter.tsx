import React, { useState, useEffect, useRef } from 'react';
import {
  Clipboard, BookOpen, PenTool, CheckCircle, Save, X, Activity,
  Image as ImageIcon, Video, History, FileText, Plus, Maximize2,
  Calendar, ChevronRight, Download, Eye, Trash2, PlusCircle, Clock, Check
} from 'lucide-react';
import { useEMR } from '../context/EMRContext';
import type { Patient } from '../context/EMRContext';

interface ClinicalEncounterProps {
  onClose: () => void;
  patientName: string;
  patientMrn?: string;
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

const ClinicalEncounter: React.FC<ClinicalEncounterProps> = ({ onClose, patientName, patientMrn, defaultTab = 'soap' }) => {
  const {
    patients, updatePatient, role, currentStaff,
    drugs, prescriptions, labOrders, labResults, surgeries, staff,
    addPrescription, addSurgery, addLabOrder, submitLabResult, addAppointment,
    createMedicationSchedule, addMedicalHistory, updateLabOrderStatus
  } = useEMR();

  const currentPatient = patientMrn
    ? patients.find(p => p.mrn === patientMrn)
    : patients.find(p => p.name === patientName);

  const [activeTab, setActiveTab] = useState<'soap' | 'imaging' | 'history'>(defaultTab);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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

  // --- Assessment (Lab Tests) local states ---
  const [selectedLabTest, setSelectedLabTest] = useState('Complete Blood Count (CBC)');
  const [labPriority, setLabPriority] = useState<'Normal' | 'Urgent'>('Normal');
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [resultInput, setResultInput] = useState({
    test: '',
    value: '',
    unit: '',
    range: '',
    status: 'Normal' as 'Normal' | 'Abnormal'
  });

  // --- Plan sub-tabs state ---
  const [planSubTab, setPlanSubTab] = useState<'prescription' | 'surgery' | 'admission' | 'followup' | 'general'>('prescription');

  // --- Plan (Prescription) inputs ---
  const [rxDrugId, setRxDrugId] = useState<string>(drugs && drugs[0] ? String(drugs[0].id) : '');
  const [rxDosage, setRxDosage] = useState('1 tablet');
  const [rxFrequency, setRxFrequency] = useState('BID (Twice daily)');
  const [rxDuration, setRxDuration] = useState('5 days');
  const [rxInstructions, setRxInstructions] = useState('Take after meals');

  // --- Drug search / filter / sort states ---
  const [drugSearch, setDrugSearch] = useState('');
  const [drugCategory, setDrugCategory] = useState('All');
  const [drugSort, setDrugSort] = useState<'name' | 'stock' | 'category'>('name');
  const [showDrugList, setShowDrugList] = useState(false);

  // Derived: unique categories
  const drugCategories = ['All', ...Array.from(new Set(drugs.map(d => d.category).filter(Boolean)))];

  // Derived: filtered + sorted drug list
  const filteredDrugs = drugs
    .filter(d => {
      const q = drugSearch.toLowerCase();
      const matchSearch = !q ||
        d.name.toLowerCase().includes(q) ||
        (d.category || '').toLowerCase().includes(q) ||
        (d.activeIngredient || '').toLowerCase().includes(q);
      const matchCat = drugCategory === 'All' || d.category === drugCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (drugSort === 'stock') return (b.stock ?? 0) - (a.stock ?? 0);
      if (drugSort === 'category') return (a.category || '').localeCompare(b.category || '');
      return a.name.localeCompare(b.name);
    });

  // --- Plan (Surgery) inputs ---
  const [surgName, setSurgName] = useState('Laparoscopic Cholecystectomy');
  const [surgSurgeonId, setSurgSurgeonId] = useState<string>(staff?.find(s => s.role.includes('Doctor')) ? String(staff.find(s => s.role.includes('Doctor'))?.id) : '');
  const [surgAnesthesia, setSurgAnesthesia] = useState('General');
  const [surgRoom, setSurgRoom] = useState('OR-1');
  const [surgStart, setSurgStart] = useState('');
  const [surgEnd, setSurgEnd] = useState('');

  // --- Plan (Admission) inputs ---
  const [requiresAdmission, setRequiresAdmission] = useState(false);
  const [admitWard, setAdmitWard] = useState('General Ward 3B');
  const [admitDate, setAdmitDate] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');

  // --- Plan (Follow-up) inputs ---
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpDocId, setFollowUpDocId] = useState<string>(staff?.find(s => s.role.includes('Doctor')) ? String(staff.find(s => s.role.includes('Doctor'))?.id) : '');
  const [followUpNotes, setFollowUpNotes] = useState('Routine follow-up');

  // --- Lab Actions ---
  const handleRequestLab = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    try {
      await addLabOrder({
        patientMrn: currentPatient.mrn,
        patientName: currentPatient.name,
        tests: [selectedLabTest],
        priority: labPriority,
        status: 'Pending'
      });
      alert(`Requested ${selectedLabTest} successfully.`);
    } catch (err) {
      alert('Failed to request lab test.');
    }
  };

  const handleSaveLabResult = async (orderId: number) => {
    if (!currentPatient) return;
    try {
      await submitLabResult(orderId, {
        patientMrn: currentPatient.mrn,
        patientName: currentPatient.name,
        test: resultInput.test,
        value: resultInput.value,
        unit: resultInput.unit,
        range: resultInput.range,
        status: resultInput.status
      });
      await updateLabOrderStatus(orderId, 'Completed');
      alert('Result recorded successfully.');
      setEditingOrderId(null);
      setResultInput({ test: '', value: '', unit: '', range: '', status: 'Normal' });
    } catch (err) {
      alert('Failed to record result.');
    }
  };

  // --- Prescription Actions ---
  const handleAddPrescription = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    const selectedDrug = drugs.find(d => d.id === Number(rxDrugId)) || drugs[0];
    if (!selectedDrug) {
      alert('No drugs available in stock.');
      return;
    }
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const daysCount = parseInt(rxDuration) || 5;
      const end = new Date();
      end.setDate(end.getDate() + daysCount);
      const endStr = end.toISOString().slice(0, 10);

      const newRx = await addPrescription({
        patientMrn: currentPatient.mrn,
        patientName: currentPatient.name,
        drug: selectedDrug.name,
        drugId: selectedDrug.id,
        dosage: rxDosage,
        frequency: rxFrequency,
        duration: rxDuration,
        instructions: rxInstructions,
        status: 'Pending',
        startDate: todayStr,
        endDate: endStr,
        prescribedBy: currentStaff?.name || 'Dr. Solomon'
      });

      if (createMedicationSchedule) {
        await createMedicationSchedule(newRx, selectedDrug);
      }
      alert(`Prescribed ${selectedDrug.name} successfully.`);
    } catch (err) {
      alert('Failed to add prescription.');
    }
  };

  // --- Surgery Actions ---
  const handleScheduleSurgery = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    try {
      await addSurgery({
        patientMrn: currentPatient.mrn,
        patientName: currentPatient.name,
        operationName: surgName,
        surgeonId: Number(surgSurgeonId),
        anesthesiaType: surgAnesthesia,
        roomNumber: surgRoom,
        startTime: surgStart,
        endTime: surgEnd,
        status: 'Scheduled'
      });
      alert('Surgery scheduled successfully.');
    } catch (err) {
      alert('Failed to schedule surgery.');
    }
  };

  // --- Final Submit SOAP ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPatient) {
      let compiledPlan = soap.plan;
      
      const pList = prescriptions.filter(p => p.patientMrn === currentPatient.mrn && p.status === 'Pending');
      if (pList.length > 0) {
        compiledPlan += (compiledPlan ? '\n\n' : '') + '[Prescriptions]:\n' + pList.map(p => `- ${p.drug} ${p.dosage} ${p.frequency} for ${p.duration}`).join('\n');
      }

      const sList = surgeries.filter(s => s.patientMrn === currentPatient.mrn && s.status === 'Scheduled');
      if (sList.length > 0) {
        compiledPlan += (compiledPlan ? '\n\n' : '') + '[Surgeries Scheduled]:\n' + sList.map(s => `- ${s.operationName} with Dr. ${staff.find(st => st.id === s.surgeonId)?.name || s.surgeonId} on ${s.startTime}`).join('\n');
      }

      if (requiresAdmission) {
        compiledPlan += (compiledPlan ? '\n\n' : '') + `[Admission Planned]:\n- Ward: ${admitWard}\n- Admission: ${admitDate}\n- Est. Discharge: ${dischargeDate}`;
      }

      if (requiresFollowUp && followUpDate) {
        compiledPlan += (compiledPlan ? '\n\n' : '') + `[Follow-up Outpatient Visit]:\n- Date: ${followUpDate}\n- Doctor: ${staff.find(st => st.id === Number(followUpDocId))?.name || followUpDocId}`;
      }

      const planArray = compiledPlan.split('\n').filter(line => line.trim() !== '');
      const today = new Date().toISOString().slice(0, 10);
      const docName = currentStaff?.name || role || 'Doctor';
      
      const encounterJson = JSON.stringify({
        date: today,
        doctor: docName,
        icd: soap.icd10_code,
        diagnosis: soap.diagnosis_description,
        subjective: soap.subjective,
        objective: soap.objective,
        notes: soap.assessment,
      });

      const updateData: Partial<Patient> = {
        diagnosisSummary: encounterJson,
        treatmentPlan: soap.publishToPortal ? planArray : (currentPatient.treatmentPlan ?? []),
      };

      if (requiresAdmission) {
        updateData.bedPlacementRequested = true;
        updateData.status = 'Inpatient';
        if (admitWard) updateData.ward = admitWard;
        if (admitDate) updateData.admissionDate = admitDate;
        if (dischargeDate) updateData.dischargeDate = dischargeDate;
      }

      await updatePatient(currentPatient.mrn, updateData);

      if (soap.publishToPortal) {
        await addMedicalHistory({
          patientMrn: currentPatient.mrn,
          date: today,
          doctor: docName,
          diagnosis: soap.diagnosis_description || 'Clinical Encounter',
          summary: `Clinical SOAP note finalized.\nSubjective: ${soap.subjective}\nObjective: ${soap.objective}\nAssessment: ${soap.assessment}\nPlan details: ${compiledPlan}`
        });
      }

      if (requiresFollowUp && followUpDate) {
        const start = new Date(followUpDate);
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + 15);
        await addAppointment({
          patientMrn: currentPatient.mrn,
          doctorId: Number(followUpDocId),
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          status: 'Scheduled',
          notes: 'Follow-up outpatient visit scheduled by attending physician'
        });
      }
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

      <div className="pharmacy-tabs" style={{ 
        background: '#f8fafc', 
        padding: isMobile ? '0.5rem 0.25rem 0' : '0.5rem 1rem 0', 
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        gap: isMobile ? '0.25rem' : '1rem',
        justifyContent: isMobile ? 'space-between' : 'flex-start'
      }}>
        <button className={`tab-btn ${activeTab === 'soap' ? 'active' : ''}`} onClick={() => setActiveTab('soap')} style={{ padding: isMobile ? '0.5rem 0.4rem' : '0.75rem 1.5rem', fontSize: isMobile ? '0.8rem' : 'inherit', gap: isMobile ? '0.25rem' : '0.75rem', whiteSpace: 'nowrap' }}>
          <FileText size={isMobile ? 14 : 18} /> {isMobile ? (
            <span>SOAP <span style={{ fontSize: '11px', fontWeight: 'normal' }}>(Consulting)</span></span>
          ) : (
            'Consultation (SOAP)'
          )}
        </button>
        <button className={`tab-btn ${activeTab === 'imaging' ? 'active' : ''}`} onClick={() => setActiveTab('imaging')} style={{ padding: isMobile ? '0.5rem 0.4rem' : '0.75rem 1.5rem', fontSize: isMobile ? '0.8rem' : 'inherit', gap: isMobile ? '0.25rem' : '0.75rem', whiteSpace: 'nowrap' }}>
          <ImageIcon size={isMobile ? 14 : 18} /> {isMobile ? 'PACS' : 'Imaging & PACS'}
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')} style={{ padding: isMobile ? '0.5rem 0.4rem' : '0.75rem 1.5rem', fontSize: isMobile ? '0.8rem' : 'inherit', gap: isMobile ? '0.25rem' : '0.75rem', whiteSpace: 'nowrap' }}>
          <History size={isMobile ? 14 : 18} /> {isMobile ? 'History' : 'Medical History'}
        </button>
      </div>

      <div className="encounter-body" style={{ padding: isMobile ? '0.75rem' : '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
        {activeTab === 'soap' ? (
          <form onSubmit={handleSubmit} className="encounter-form">
            <div className="soap-layout-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: isMobile ? '1rem' : '2rem', alignItems: 'start' }}>
              
              {/* Left Column: Diagnostics, SOAP details, Assessment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Subjective & Objective */}
                <div className="stat-card" style={{ padding: isMobile ? '0.85rem' : '1.5rem', height: 'auto', border: '1px solid #e2e8f0', background: 'white' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={18} /> Clinical Findings
                  </h3>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', display: 'block' }}>Subjective (Chief Complaint & History)</label>
                    <textarea rows={3} value={soap.subjective} onChange={e => setSoap({ ...soap, subjective: e.target.value })} placeholder="Patient symptoms, pain level, history..." style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}></textarea>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', display: 'block' }}>Objective (Physical Exam & Vitals)</label>
                    <textarea rows={3} value={soap.objective} onChange={e => setSoap({ ...soap, objective: e.target.value })} placeholder="Physical examination, lung sounds, heart rhythm..." style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}></textarea>
                  </div>
                </div>

                {/* Assessment (Diagnosis) & Lab Request */}
                <div className="stat-card" style={{ padding: isMobile ? '0.85rem' : '1.5rem', height: 'auto', border: '1px solid #e2e8f0', background: 'white' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#8b5cf6', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} /> Assessment & Lab Requests
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ flex: isMobile ? '0 0 70px' : '0 0 100px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>ICD-10</label>
                      <input type="text" placeholder="I10" value={soap.icd10_code} onChange={e => setSoap({ ...soap, icd10_code: e.target.value })} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Primary Diagnosis Description</label>
                      <input type="text" placeholder="Essential Hypertension" value={soap.diagnosis_description} onChange={e => setSoap({ ...soap, diagnosis_description: e.target.value })} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', display: 'block' }}>Assessment Notes</label>
                    <textarea rows={2} value={soap.assessment} onChange={e => setSoap({ ...soap, assessment: e.target.value })} placeholder="Attending clinician assessment/reasoning..." style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}></textarea>
                  </div>

                  {/* LAB TESTS GATED ORDER & RESULTS VIEW */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Beaker size={16} /> Lab Orders & Diagnostic PACS
                    </h4>

                    {/* Order Request Mini Form */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row', 
                      gap: '0.5rem', 
                      background: '#f8fafc', 
                      padding: '0.75rem', 
                      borderRadius: '0.75rem', 
                      border: '1px solid #e2e8f0', 
                      marginBottom: '1rem', 
                      alignItems: isMobile ? 'stretch' : 'flex-end' 
                    }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Select Lab/Imaging Test</label>
                        <select value={selectedLabTest} onChange={e => setSelectedLabTest(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: 'white', fontSize: '0.85rem' }}>
                          <option>Complete Blood Count (CBC)</option>
                          <option>Basic Metabolic Panel (BMP)</option>
                          <option>Liver Function Test (LFT)</option>
                          <option>Thyroid Panel (TSH)</option>
                          <option>Chest X-Ray PA View</option>
                          <option>Electrocardiogram (ECG)</option>
                          <option>Urinalysis</option>
                          <option>H. pylori Stool Antigen</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Priority</label>
                        <select value={labPriority} onChange={e => setLabPriority(e.target.value as 'Normal' | 'Urgent')} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: 'white', fontSize: '0.85rem' }}>
                          <option>Normal</option>
                          <option>Urgent</option>
                        </select>
                      </div>
                      <button type="button" onClick={handleRequestLab} className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                        <PlusCircle size={16} /> Request
                      </button>
                    </div>

                    {/* Pending/Completed Orders List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                      {labOrders.filter(o => o.patientMrn === currentPatient?.mrn).length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>No requested tests for this patient.</p>
                      ) : (
                        labOrders.filter(o => o.patientMrn === currentPatient?.mrn).map(order => {
                          const matchingResults = labResults.filter(r => r.patientMrn === currentPatient?.mrn && r.test === order.tests[0]);
                          return (
                            <div key={order.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.6rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1e293b' }}>{order.tests.join(', ')}</span>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '700', background: order.priority === 'Urgent' ? '#fef2f2' : '#f1f5f9', color: order.priority === 'Urgent' ? '#dc2626' : '#475569' }}>
                                    {order.priority}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '700', background: order.status === 'Completed' ? '#dcfce7' : '#fef9c3', color: order.status === 'Completed' ? '#15803d' : '#a16207' }}>
                                    {order.status}
                                  </span>
                                </div>
                              </div>

                              {/* Action to enter result inline if Pending */}
                              {order.status === 'Pending' && (
                                <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
                                  {editingOrderId === order.id ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '4px', width: '100%', marginTop: '0.25rem' }}>
                                      <input type="text" placeholder="Value" value={resultInput.value} onChange={e => setResultInput({ ...resultInput, test: order.tests[0], value: e.target.value })} style={{ flex: '1 1 60px', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                      <input type="text" placeholder="Unit" value={resultInput.unit} onChange={e => setResultInput({ ...resultInput, unit: e.target.value })} style={{ flex: '1 1 50px', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                      <input type="text" placeholder="Ref Range" value={resultInput.range} onChange={e => setResultInput({ ...resultInput, range: e.target.value })} style={{ flex: '1 1 70px', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                      <select value={resultInput.status} onChange={e => setResultInput({ ...resultInput, status: e.target.value as 'Normal' | 'Abnormal' })} style={{ flex: '1 1 70px', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white' }}>
                                        <option>Normal</option>
                                        <option>Abnormal</option>
                                      </select>
                                      <button type="button" onClick={() => handleSaveLabResult(order.id)} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Save</button>
                                      <button type="button" onClick={() => setEditingOrderId(null)} style={{ background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                                    </div>
                                  ) : (
                                    <button type="button" onClick={() => { setEditingOrderId(order.id); setResultInput({ test: order.tests[0], value: '', unit: '', range: '', status: 'Normal' }); }} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                      <PlusCircle size={12} /> Enter Result
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Display matching results if Completed */}
                              {order.status === 'Completed' && matchingResults.map(res => (
                                <div key={res.id} style={{ marginTop: '0.25rem', padding: '0.4rem', background: res.status === 'Abnormal' ? '#fef2f2' : '#f0fdf4', borderRadius: '4px', border: res.status === 'Abnormal' ? '1px dashed #fca5a5' : '1px dashed #bbf7d0', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: '600', color: res.status === 'Abnormal' ? '#991b1b' : '#166534' }}>Result: {res.value} {res.unit} ({res.status})</span>
                                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Ref: {res.range}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Advanced Plan & Treatment (Tabbed Interface) */}
              <div className="stat-card" style={{ padding: isMobile ? '0.85rem' : '1.5rem', height: 'auto', border: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PenTool size={18} /> Attending Treatment Plan
                </h3>

                {/* Sub-tabs inside Plan */}
                <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', gap: isMobile ? '0.2rem' : '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                  <button type="button" onClick={() => setPlanSubTab('prescription')} style={{ padding: isMobile ? '0.5rem 0.4rem' : '0.5rem 0.75rem', background: 'none', border: 'none', borderBottom: planSubTab === 'prescription' ? '3px solid #3b82f6' : '3px solid transparent', color: planSubTab === 'prescription' ? '#3b82f6' : '#64748b', fontWeight: '700', fontSize: isMobile ? '0.75rem' : '0.85rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <PillIcon size={12} /> {isMobile ? 'Presc' : 'Prescribe'}
                  </button>
                  <button type="button" onClick={() => setPlanSubTab('surgery')} style={{ padding: isMobile ? '0.5rem 0.4rem' : '0.5rem 0.75rem', background: 'none', border: 'none', borderBottom: planSubTab === 'surgery' ? '3px solid #8b5cf6' : '3px solid transparent', color: planSubTab === 'surgery' ? '#8b5cf6' : '#64748b', fontWeight: '700', fontSize: isMobile ? '0.75rem' : '0.85rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Activity size={12} /> {isMobile ? 'Surg' : 'Surgery'}
                  </button>
                  <button type="button" onClick={() => setPlanSubTab('admission')} style={{ padding: isMobile ? '0.5rem 0.4rem' : '0.5rem 0.75rem', background: 'none', border: 'none', borderBottom: planSubTab === 'admission' ? '3px solid #eab308' : '3px solid transparent', color: planSubTab === 'admission' ? '#a16207' : '#64748b', fontWeight: '700', fontSize: isMobile ? '0.75rem' : '0.85rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> {isMobile ? 'Audit' : 'Audit'}
                  </button>
                  <button type="button" onClick={() => setPlanSubTab('followup')} style={{ padding: isMobile ? '0.5rem 0.4rem' : '0.5rem 0.75rem', background: 'none', border: 'none', borderBottom: planSubTab === 'followup' ? '3px solid #22c55e' : '3px solid transparent', color: planSubTab === 'followup' ? '#166534' : '#64748b', fontWeight: '700', fontSize: isMobile ? '0.75rem' : '0.85rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} /> {isMobile ? 'Visit' : 'Visit'}
                  </button>
                </div>

                {/* Sub-tab Content wrapper */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', minHeight: '260px' }}>
                  
                  {/* Tab 1: Prescription */}
                  {planSubTab === 'prescription' && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.75rem' }}>Medication Outpatient Order</h4>

                      {/* ── Drug Search / Filter / Sort ── */}
                      <div style={{ marginBottom: '0.6rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Select Drug (Pharmacy Stock)</label>

                        {/* Search bar */}
                        <div style={{ position: 'relative', marginBottom: '0.4rem' }}>
                          <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
                          <input
                            type="text"
                            placeholder="Search by name, ingredient, or category..."
                            value={drugSearch}
                            onChange={e => { setDrugSearch(e.target.value); setShowDrugList(true); }}
                            onFocus={() => setShowDrugList(true)}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem 0.5rem 0.45rem 1.8rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                          />
                          {drugSearch && (
                            <button type="button" onClick={() => { setDrugSearch(''); setShowDrugList(false); }} style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.85rem' }}>✕</button>
                          )}
                        </div>

                        {/* Filter + Sort row */}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                          {/* Category filter */}
                          <select
                            value={drugCategory}
                            onChange={e => { setDrugCategory(e.target.value); setShowDrugList(true); }}
                            style={{ flex: '1 1 120px', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: 'white', fontSize: '0.78rem', fontWeight: '600', color: '#334155' }}
                          >
                            {drugCategories.map(c => <option key={c} value={c}>{c === 'All' ? '📂 All Categories' : c}</option>)}
                          </select>

                          {/* Sort */}
                          <select
                            value={drugSort}
                            onChange={e => setDrugSort(e.target.value as 'name' | 'stock' | 'category')}
                            style={{ flex: '1 1 100px', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: 'white', fontSize: '0.78rem', fontWeight: '600', color: '#334155' }}
                          >
                            <option value="name">↑ Name A–Z</option>
                            <option value="stock">↓ Stock (High)</option>
                            <option value="category">📁 Category</option>
                          </select>

                          {/* Toggle list */}
                          <button
                            type="button"
                            onClick={() => setShowDrugList(v => !v)}
                            style={{ padding: '0.35rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: showDrugList ? '#3b82f6' : 'white', color: showDrugList ? 'white' : '#334155', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            {showDrugList ? '▲ Hide' : '▼ Browse'}
                          </button>
                        </div>

                        {/* Currently selected drug badge */}
                        {rxDrugId && (() => {
                          const sel = drugs.find(d => String(d.id) === rxDrugId);
                          return sel ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '0.4rem 0.6rem', fontSize: '0.8rem', fontWeight: '700', color: '#1d4ed8', marginBottom: '0.4rem' }}>
                              <span>💊</span>
                              <span style={{ flex: 1 }}>{sel.name} — {sel.stock} in stock ({sel.category})</span>
                              <button type="button" onClick={() => setRxDrugId('')} style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                            </div>
                          ) : null;
                        })()}

                        {/* Drug result list */}
                        {showDrugList && (
                          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                            {filteredDrugs.length === 0 ? (
                              <div style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No drugs found matching your search.</div>
                            ) : filteredDrugs.map(d => {
                              const isSelected = String(d.id) === rxDrugId;
                              const lowStock = (d.stock ?? 0) <= 20;
                              return (
                                <div
                                  key={d.id}
                                  onClick={() => { setRxDrugId(String(d.id)); setShowDrugList(false); setDrugSearch(''); }}
                                  style={{
                                    padding: '0.5rem 0.75rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f1f5f9',
                                    background: isSelected ? '#eff6ff' : 'white',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.15s'
                                  }}
                                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'; }}
                                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'white'; }}
                                >
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: '700', fontSize: '0.82rem', color: isSelected ? '#1d4ed8' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {isSelected && '✓ '}{d.name}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '1px' }}>{d.category}{d.form ? ` · ${d.form}` : ''}{d.strength ? ` · ${d.strength}` : ''}</div>
                                  </div>
                                  <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', background: lowStock ? '#fef2f2' : '#f0fdf4', color: lowStock ? '#dc2626' : '#16a34a', whiteSpace: 'nowrap' }}>
                                    {d.stock} left
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Dosage</label>
                          <input type="text" value={rxDosage} onChange={e => setRxDosage(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Frequency</label>
                          <input type="text" value={rxFrequency} onChange={e => setRxFrequency(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '80px 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Duration</label>
                          <input type="text" value={rxDuration} onChange={e => setRxDuration(e.target.value)} placeholder="5 days" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Attending Instructions</label>
                          <input type="text" value={rxInstructions} onChange={e => setRxInstructions(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                        </div>
                      </div>
                      <button type="button" onClick={handleAddPrescription} className="btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                        <PillIcon size={16} /> Prescribe & Add Medication
                      </button>

                      {/* Display already pending prescriptions for this patient */}
                      <div style={{ marginTop: '0.75rem', maxHeight: '100px', overflowY: 'auto' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', marginBottom: '0.25rem' }}>Active Prescriptions:</div>
                        {prescriptions.filter(p => p.patientMrn === currentPatient?.mrn).map(p => (
                          <div key={p.id} style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', padding: '0.25rem', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontWeight: '600' }}>{p.drug} - {p.dosage} ({p.frequency})</span>
                            <span style={{ color: '#22c55e' }}>{p.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Surgery */}
                  {planSubTab === 'surgery' && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.75rem' }}>Surgery & OR Reservation</h4>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Operation Name</label>
                        <input type="text" value={surgName} onChange={e => setSurgName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Surgeon</label>
                          <select value={surgSurgeonId} onChange={e => setSurgSurgeonId(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: 'white', fontSize: '0.85rem' }}>
                            <option value="">-- Choose Surgeon --</option>
                            {staff.filter(s => s.role.includes('Doctor')).map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.specialization})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Anesthesia</label>
                          <input type="text" value={surgAnesthesia} onChange={e => setSurgAnesthesia(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr 1.2fr', gap: '0.4rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>OR Room</label>
                          <input type="text" value={surgRoom} onChange={e => setSurgRoom(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>Start Time</label>
                          <input type="datetime-local" value={surgStart} onChange={e => setSurgStart(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>End Time</label>
                          <input type="datetime-local" value={surgEnd} onChange={e => setSurgEnd(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                        </div>
                      </div>
                      <button type="button" onClick={handleScheduleSurgery} className="btn-primary" style={{ width: '100%', padding: '0.5rem', background: '#8b5cf6', borderColor: '#8b5cf6', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', marginTop: '0.5rem' }}>
                        <PlusCircle size={16} /> Schedule Operation Room
                      </button>
                    </div>
                  )}

                  {/* Tab 3: Admission */}
                  {planSubTab === 'admission' && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.75rem' }}>Inpatient Ward Admission Planning</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', marginBottom: '0.75rem' }}>
                        <input type="checkbox" id="admitCheck" checked={requiresAdmission} onChange={e => setRequiresAdmission(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                        <label htmlFor="admitCheck" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', cursor: 'pointer' }}>Register Patient for Inpatient Bed Placement</label>
                      </div>

                      {requiresAdmission && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Assigned Ward / Room Number</label>
                            <input type="text" value={admitWard} onChange={e => setAdmitWard(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                          </div>
                           <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.5rem' }}>
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Admission Date</label>
                              <input type="datetime-local" value={admitDate} onChange={e => setAdmitDate(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Est. Discharge Date</label>
                              <input type="datetime-local" value={dischargeDate} onChange={e => setDischargeDate(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Follow-up Outpatient Visit */}
                  {planSubTab === 'followup' && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.75rem' }}>Attending Follow-up Schedule</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', marginBottom: '0.75rem' }}>
                        <input type="checkbox" id="followCheck" checked={requiresFollowUp} onChange={e => setRequiresFollowUp(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                        <label htmlFor="followCheck" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', cursor: 'pointer' }}>Schedule Outpatient Follow-up Appointment</label>
                      </div>

                      {requiresFollowUp && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
                           <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: '0.5rem' }}>
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Attending Physician</label>
                              <select value={followUpDocId} onChange={e => setFollowUpDocId(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: 'white', fontSize: '0.85rem' }}>
                                <option value="">-- Choose Doctor --</option>
                                {staff.filter(s => s.role.includes('Doctor')).map(s => (
                                  <option key={s.id} value={s.id}>{s.name} ({s.specialization})</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Date & Time</label>
                              <input type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                            </div>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Follow-up Instructions / Notes</label>
                            <input type="text" value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 5: General Plan Notes removed and placed permanently below */}

                </div>

                {/* Permanent Notes Section */}
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FileText size={14} /> General Clinical Notes
                  </h4>
                  <textarea 
                    rows={isMobile ? 3 : 5} 
                    value={soap.plan} 
                    onChange={e => setSoap({ ...soap, plan: e.target.value })} 
                    placeholder="General nursing care instructions, dietary adjustments, physiotherapy planning, follow-up parameters..." 
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff', resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>

            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdfa', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #ccfbf1' }}>
               <input type="checkbox" id="publish" checked={soap.publishToPortal} onChange={e => setSoap({...soap, publishToPortal: e.target.checked})} style={{ width: '18px', height: '18px' }} />
               <label htmlFor="publish" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#134e4a', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                 <Eye size={16} /> Publish SOAP Diagnosis, Lab Orders and Treatment Plan to Patient Portal
               </label>
            </div>
            
            <div className="form-actions" style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={20} /> Finalize Chart & Sync Portal
              </button>
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
