import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services';

export type MedOrder = {
  id: string;
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  prescribedAt: string;
};

export type VitalsRecord = {
  temperature: string;
  heartRate: string;
  respiratoryRate: string;
  bpSystolic: string;
  bpDiastolic: string;
  weightKg: string;
  heightCm: string;
  spo2: string;
  recordedAt: string;
};

export type Patient = {
  mrn: string;
  name: string;
  amharic: string;
  visitType: string;
  status: string;
  time: string;
  registeredAt: string;
  gender: string;
  dob: string;
  phone: string;
  city: string;
  woreda: string;
  kebele: string;
  vitals: VitalsRecord[];
  medications: MedOrder[];
  ward: string;
  photoUrl?: string;
};

export type StaffMember = {
  id: number;
  name: string;
  role: string;
  shift: string;
  status: string;
  education: string;
  license: string;
  experience: string;
  surgeries: string[];
  training: string[];
  awards: string[];
  photoUrl?: string;
};

export type Asset = {
  id: string;
  name: string;
  serial: string;
  qty: number;
  weight: string;
  supplier: string;
  status: string;
  location: string;
  addedAt: string;
  rfidTag?: string;
  barcode?: string;
};

const DEMO_MEDS: MedOrder[] = [
  { id: 'rx-demo-1', drug: 'Amoxicillin', dose: '500mg', frequency: 'TID', duration: '7 days', route: 'Oral', prescribedAt: '2026-05-09T08:00:00Z' },
  { id: 'rx-demo-2', drug: 'Paracetamol', dose: '1g', frequency: 'QID PRN', duration: '5 days', route: 'Oral', prescribedAt: '2026-05-09T08:00:00Z' },
  { id: 'rx-demo-3', drug: 'Metronidazole', dose: '400mg', frequency: 'TID', duration: '5 days', route: 'Oral', prescribedAt: '2026-05-09T08:00:00Z' },
];

export const initialStaff: StaffMember[] = [
  { id: 1, name: 'Dr. Solomon Tsegaye', role: 'Chief MD / Surgeon', shift: 'Day', status: 'On Duty', education: 'MD from Addis Ababa University, Specialization in General Surgery', license: 'ETH-MD-9982 (Valid until 2028)', experience: '15 years (MCM Hospital, Black Lion Hospital)', surgeries: ['Appendectomy (240)', 'Hernia Repair (180)', 'Hip Replacement (45)'], training: ['Advanced Trauma Life Support (ATLS)', 'Robotic Surgery Fundamentals'], awards: ['Physician of the Year 2026', 'Outstanding Surgeon 2024'], photoUrl: 'https://randomuser.me/api/portraits/men/50.jpg' },
  { id: 2, name: 'Nurse Martha Kassa', role: 'Head Nurse', shift: 'Night', status: 'Off Duty', education: 'BSc in Nursing from Jimma University', license: 'ETH-RN-4451 (Valid until 2027)', experience: "10 years (MCM Hospital, St. Paul's Hospital)", surgeries: ['Surgical Assisting (500+)', 'ICU Care Management'], training: ['Critical Care Nursing Certification', 'Hygiene Control Protocol'], awards: ['Excellence in Nursing 2025'], photoUrl: 'https://randomuser.me/api/portraits/women/67.jpg' },
  { id: 3, name: 'Dr. Fitsum Ayele', role: 'Internal Medicine', shift: 'Day', status: 'On Duty', education: 'MD, MSc Internal Medicine, AAU', license: 'ETH-MD-7721 (Valid until 2027)', experience: '8 years (MCM Hospital)', surgeries: ['Bronchoscopy (30)', 'Endoscopy (60)'], training: ['ACLS Certification', 'Diabetes Management CME'], awards: [], photoUrl: 'https://randomuser.me/api/portraits/men/36.jpg' },
  { id: 4, name: 'Nurse Tigist Hailu', role: 'Staff Nurse', shift: 'Night', status: 'On Duty', education: 'Diploma in Nursing, Mekelle University', license: 'ETH-RN-5520 (Valid until 2026)', experience: '5 years (MCM Hospital)', surgeries: ['Surgical Assisting (120+)'], training: ['Basic Life Support', 'Wound Care'], awards: [], photoUrl: 'https://randomuser.me/api/portraits/women/22.jpg' },
];

const E = (extra: Partial<Patient> = {}): Partial<Patient> => ({ vitals: [], medications: [], ward: '', ...extra });

export const initialPatients: Patient[] = [
  { mrn: 'MRN-2026-001', name: 'Abebe Bikila',  amharic: 'አበበ ቢቂላ', visitType: 'OPD',      status: 'In Progress', time: '10:30 AM', registeredAt: '2026-05-12', gender: 'Male',   dob: '1990-03-15', phone: '+251911001001', city: 'Addis Ababa', woreda: '05', kebele: '12', ...E({ photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg' }) } as Patient,
  { mrn: 'MRN-2026-002', name: 'Mulu Worku',    amharic: 'ሙሉ ወርቁ',   visitType: 'Emergency', status: 'Waiting',     time: '11:15 AM', registeredAt: '2026-05-12', gender: 'Female', dob: '1985-07-22', phone: '+251922002002', city: 'Addis Ababa', woreda: '03', kebele: '08', ...E({ photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg' }) } as Patient,
  { mrn: 'MRN-2026-003', name: 'Kassa Tessema', amharic: 'ካሳ ተሰማ',   visitType: 'Follow-up', status: 'Consulting',  time: '11:45 AM', registeredAt: '2026-05-11', gender: 'Male',   dob: '1978-11-05', phone: '+251933003003', city: 'Addis Ababa', woreda: '07', kebele: '03', ...E({ photoUrl: 'https://randomuser.me/api/portraits/men/56.jpg' }) } as Patient,
  { mrn: 'MRN-2026-004', name: 'Selam Adane',   amharic: 'ሰላም አዳነ',  visitType: 'OPD',      status: 'Completed',  time: '09:00 AM', registeredAt: '2026-05-10', gender: 'Female', dob: '2000-01-30', phone: '+251944004004', city: 'Addis Ababa', woreda: '01', kebele: '15', ...E({ photoUrl: 'https://randomuser.me/api/portraits/women/12.jpg' }) } as Patient,
  { mrn: 'MRN-2026-005', name: 'Tigist Hailu',  amharic: 'ትግስት ኃይሉ', visitType: 'Inpatient', status: 'Inpatient',  time: '08:00 AM', registeredAt: '2026-05-09', gender: 'Female', dob: '1995-06-18', phone: '+251955005005', city: 'Addis Ababa', woreda: '10', kebele: '06', ...E({ medications: DEMO_MEDS, ward: 'General Ward A', photoUrl: 'https://randomuser.me/api/portraits/women/33.jpg' }) } as Patient,
  { mrn: 'MRN-2026-006', name: 'Biruk Alemu',   amharic: 'ብሩክ አለሙ',  visitType: 'Emergency', status: 'Completed',  time: '07:30 AM', registeredAt: '2026-05-08', gender: 'Male',   dob: '1992-09-11', phone: '+251966006006', city: 'Addis Ababa', woreda: '04', kebele: '09', ...E({ photoUrl: 'https://randomuser.me/api/portraits/men/8.jpg' }) } as Patient,
  { mrn: 'MRN-2026-007', name: 'Dawit Mesfin',  amharic: 'ዳዊት መስፍን', visitType: 'Follow-up', status: 'Waiting',    time: '12:00 PM', registeredAt: '2026-05-07', gender: 'Male',   dob: '1988-02-28', phone: '+251977007007', city: 'Addis Ababa', woreda: '06', kebele: '11', ...E({ photoUrl: 'https://randomuser.me/api/portraits/men/40.jpg' }) } as Patient,
  { mrn: 'MRN-2026-008', name: 'Hana Bekele',   amharic: 'ሃና በቀለ',   visitType: 'OPD',      status: 'Consulting', time: '12:30 PM', registeredAt: '2026-05-06', gender: 'Female', dob: '2003-12-04', phone: '+251988008008', city: 'Addis Ababa', woreda: '02', kebele: '07', ...E({ photoUrl: 'https://randomuser.me/api/portraits/women/19.jpg' }) } as Patient,
];

export const initialAssets: Asset[] = [
  { id: 'AST-001', name: 'GE Healthcare MRI System',        serial: 'GE99283-X',   qty: 1,  weight: '1200kg', supplier: 'GE Healthcare Ethiopia', status: 'Functional',           location: 'Radiology Dept',  addedAt: '2025-01-10', rfidTag: 'RF-A001-MRI',  barcode: '8934567890001' },
  { id: 'AST-002', name: 'Ventilator - Puritan Bennett 980', serial: 'PB-2026-044', qty: 5,  weight: '45kg',   supplier: 'Medtronic Africa',        status: 'Maintenance Required', location: 'ICU',             addedAt: '2025-03-15', rfidTag: 'RF-A002-VNT',  barcode: '8934567890002' },
  { id: 'AST-003', name: 'Patient Monitor B40',             serial: 'M-1122-A',    qty: 12, weight: '4.5kg',  supplier: 'Philips Medical',         status: 'Functional',           location: 'General Ward A',  addedAt: '2024-11-20', rfidTag: 'RF-A003-MON',  barcode: '8934567890003' },
  { id: 'AST-004', name: 'ECG Machine 12-Lead',             serial: 'ECG-3301',    qty: 3,  weight: '8kg',    supplier: 'GE Healthcare Ethiopia', status: 'Functional',           location: 'Cardiology Dept', addedAt: '2025-06-05', rfidTag: 'RF-A004-ECG',  barcode: '8934567890004' },
  { id: 'AST-005', name: 'Infusion Pump Set',               serial: 'INF-7890',    qty: 20, weight: '1.2kg',  supplier: 'B. Braun Ethiopia',       status: 'Maintenance Required', location: 'ICU',             addedAt: '2025-08-10', rfidTag: 'RF-A005-INF',  barcode: '8934567890005' },
  { id: 'AST-045', name: 'Laparoscopic Tower',              serial: 'LAP-2045-X',  qty: 1,  weight: '85kg',   supplier: 'Karl Storz',              status: 'In Use (OT 1)',        location: 'OT Suite',        addedAt: '2024-08-15', rfidTag: 'RF-A045-LAP',  barcode: '8934567890045' },
  { id: 'AST-088', name: 'C-Arm X-Ray',                    serial: 'CARM-088',    qty: 1,  weight: '120kg',  supplier: 'Siemens Healthineers',    status: 'Functional',           location: 'OT Suite',        addedAt: '2024-10-01', rfidTag: 'RF-A088-CAR',  barcode: '8934567890088' },
];

type EMRContextType = {
  patients: Patient[];
  staffList: StaffMember[];
  assets: Asset[];
  loading: boolean;
  error: string | null;
  addPatient(p: Patient): Promise<void>;
  updatePatient(mrn: string, changes: Partial<Patient>): Promise<void>;
  appendPatientVitals(mrn: string, vitals: VitalsRecord): Promise<void>;
  addStaff(s: Omit<StaffMember, 'id'>): Promise<void>;
  addAsset(a: Asset): Promise<void>;
  updateAsset(id: string, changes: Partial<Asset>): Promise<void>;
};

const EMRContext = createContext<EMRContextType | null>(null);

export const useEMR = (): EMRContextType => {
  const ctx = useContext(EMRContext);
  if (!ctx) throw new Error('useEMR must be used within EMRProvider');
  return ctx;
};

export const EMRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([db.fetchPatients(), db.fetchStaff(), db.fetchAssets()])
      .then(([p, s, a]) => {
        // Merge hardcoded photos when photo_url column not yet in DB
        const pMerged = p.map(pt => ({
          ...pt,
          photoUrl: pt.photoUrl ?? initialPatients.find(ip => ip.mrn === pt.mrn)?.photoUrl,
        }));
        const sMerged = s.map(st => ({
          ...st,
          photoUrl: st.photoUrl ?? initialStaff.find(is => is.name === st.name)?.photoUrl,
        }));
        setPatients(pMerged);
        setStaffList(sMerged);
        setAssets(a);
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const addPatient = async (p: Patient) => {
    await db.insertPatient(p);
    setPatients(prev => [...prev, p]);
  };

  const updatePatient = async (mrn: string, changes: Partial<Patient>) => {
    await db.updatePatient(mrn, changes);
    setPatients(prev => prev.map(p => p.mrn === mrn ? { ...p, ...changes } : p));
  };

  const appendPatientVitals = async (mrn: string, vitals: VitalsRecord) => {
    await db.appendVitals(mrn, vitals);
    setPatients(prev => prev.map(p => p.mrn === mrn ? { ...p, vitals: [...p.vitals, vitals] } : p));
  };

  const addStaff = async (s: Omit<StaffMember, 'id'>) => {
    const newMember = await db.insertStaff(s);
    setStaffList(prev => [...prev, newMember]);
  };

  const addAsset = async (a: Asset) => {
    await db.insertAsset(a);
    setAssets(prev => [...prev, a]);
  };

  const updateAsset = async (id: string, changes: Partial<Asset>) => {
    await db.updateAsset(id, changes);
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...changes } : a));
  };

  return (
    <EMRContext.Provider value={{ patients, staffList, assets, loading, error, addPatient, updatePatient, appendPatientVitals, addStaff, addAsset, updateAsset }}>
      {children}
    </EMRContext.Provider>
  );
};
