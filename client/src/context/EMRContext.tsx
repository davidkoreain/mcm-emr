import React, { createContext, useContext, useState } from 'react';

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
};

const initialStaff: StaffMember[] = [
  { id: 1, name: 'Dr. Solomon Tsegaye', role: 'Chief MD / Surgeon', shift: 'Day', status: 'On Duty', education: 'MD from Addis Ababa University, Specialization in General Surgery', license: 'ETH-MD-9982 (Valid until 2028)', experience: '15 years (MCM Hospital, Black Lion Hospital)', surgeries: ['Appendectomy (240)', 'Hernia Repair (180)', 'Hip Replacement (45)'], training: ['Advanced Trauma Life Support (ATLS)', 'Robotic Surgery Fundamentals'], awards: ['Physician of the Year 2026', 'Outstanding Surgeon 2024'] },
  { id: 2, name: 'Nurse Martha Kassa', role: 'Head Nurse', shift: 'Night', status: 'Off Duty', education: 'BSc in Nursing from Jimma University', license: 'ETH-RN-4451 (Valid until 2027)', experience: "10 years (MCM Hospital, St. Paul's Hospital)", surgeries: ['Surgical Assisting (500+)', 'ICU Care Management'], training: ['Critical Care Nursing Certification', 'Hygiene Control Protocol'], awards: ['Excellence in Nursing 2025'] },
  { id: 3, name: 'Dr. Fitsum Ayele', role: 'Internal Medicine', shift: 'Day', status: 'On Duty', education: 'MD, MSc Internal Medicine, AAU', license: 'ETH-MD-7721 (Valid until 2027)', experience: '8 years (MCM Hospital)', surgeries: ['Bronchoscopy (30)', 'Endoscopy (60)'], training: ['ACLS Certification', 'Diabetes Management CME'], awards: [] },
  { id: 4, name: 'Nurse Tigist Hailu', role: 'Staff Nurse', shift: 'Night', status: 'On Duty', education: 'Diploma in Nursing, Mekelle University', license: 'ETH-RN-5520 (Valid until 2026)', experience: '5 years (MCM Hospital)', surgeries: ['Surgical Assisting (120+)'], training: ['Basic Life Support', 'Wound Care'], awards: [] },
];

const initialAssets: Asset[] = [
  { id: 'AST-001', name: 'GE Healthcare MRI System', serial: 'GE99283-X', qty: 1, weight: '1200kg', supplier: 'GE Healthcare Ethiopia', status: 'Functional', location: 'Radiology Dept', addedAt: '2025-01-10' },
  { id: 'AST-002', name: 'Ventilator - Puritan Bennett 980', serial: 'PB-2026-044', qty: 5, weight: '45kg', supplier: 'Medtronic Africa', status: 'Maintenance Required', location: 'ICU', addedAt: '2025-03-15' },
  { id: 'AST-003', name: 'Patient Monitor B40', serial: 'M-1122-A', qty: 12, weight: '4.5kg', supplier: 'Philips Medical', status: 'Functional', location: 'General Ward A', addedAt: '2024-11-20' },
  { id: 'AST-004', name: 'ECG Machine 12-Lead', serial: 'ECG-3301', qty: 3, weight: '8kg', supplier: 'GE Healthcare Ethiopia', status: 'Functional', location: 'Cardiology Dept', addedAt: '2025-06-05' },
  { id: 'AST-005', name: 'Infusion Pump Set', serial: 'INF-7890', qty: 20, weight: '1.2kg', supplier: 'B. Braun Ethiopia', status: 'Maintenance Required', location: 'ICU', addedAt: '2025-08-10' },
  { id: 'AST-045', name: 'Laparoscopic Tower', serial: 'LAP-2045-X', qty: 1, weight: '85kg', supplier: 'Karl Storz', status: 'In Use (OT 1)', location: 'OT Suite', addedAt: '2024-08-15' },
  { id: 'AST-088', name: 'C-Arm X-Ray', serial: 'CARM-088', qty: 1, weight: '120kg', supplier: 'Siemens Healthineers', status: 'Functional', location: 'OT Suite', addedAt: '2024-10-01' },
];

type EMRContextType = {
  staffList: StaffMember[];
  setStaffList: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
};

const EMRContext = createContext<EMRContextType | null>(null);

export const useEMR = (): EMRContextType => {
  const ctx = useContext(EMRContext);
  if (!ctx) throw new Error('useEMR must be used within EMRProvider');
  return ctx;
};

export const EMRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  return (
    <EMRContext.Provider value={{ staffList, setStaffList, assets, setAssets }}>
      {children}
    </EMRContext.Provider>
  );
};
