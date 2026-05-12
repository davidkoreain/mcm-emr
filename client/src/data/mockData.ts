import type { Patient, StaffMember, Asset } from '../context/EMRContext';

export const initialPatients: Patient[] = [
  {
    mrn: 'MRN-2026-001',
    name: 'Abebe Bikila',
    amharic: 'አበበ ቢቂላ',
    visitType: 'Outpatient',
    status: 'In Consultation',
    time: '09:00 AM',
    registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    gender: 'Male',
    dob: '1980-05-15',
    phone: '+251 911 000000',
    city: 'Addis Ababa',
    woreda: 'Kirkos',
    kebele: '02',
    vitals: [{
      temperature: '37.2', heartRate: '82', respiratoryRate: '18',
      bpSystolic: '120', bpDiastolic: '80', weightKg: '70', heightCm: '175',
      spo2: '98', recordedAt: new Date().toISOString()
    }],
    medications: [],
    ward: '',
    photoUrl: 'https://i.pravatar.cc/150?u=MRN-2026-001',
    diagnosisSummary: 'Routine checkup. Normal vitals.',
    treatmentPlan: ['Maintain healthy diet', 'Exercise regularly']
  },
  {
    mrn: 'MRN-2026-002',
    name: 'Tirunesh Dibaba',
    amharic: 'ጥሩነሽ ዲባባ',
    visitType: 'Emergency',
    status: 'Awaiting Results',
    time: '09:45 AM',
    registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    gender: 'Female',
    dob: '1985-10-01',
    phone: '+251 922 111111',
    city: 'Addis Ababa',
    woreda: 'Bole',
    kebele: '05',
    vitals: [{
      temperature: '38.5', heartRate: '110', respiratoryRate: '22',
      bpSystolic: '135', bpDiastolic: '85', weightKg: '58', heightCm: '165',
      spo2: '95', recordedAt: new Date().toISOString()
    }],
    medications: [],
    ward: 'ER',
    photoUrl: 'https://i.pravatar.cc/150?u=MRN-2026-002',
  },
  {
    mrn: 'MRN-2026-003',
    name: 'Kenenisa Bekele',
    amharic: 'ቀነኒሳ በቀለ',
    visitType: 'Inpatient',
    status: 'Inpatient',
    time: '11:00 AM',
    registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    gender: 'Male',
    dob: '1982-06-13',
    phone: '+251 933 222222',
    city: 'Addis Ababa',
    woreda: 'Arada',
    kebele: '09',
    vitals: [{
      temperature: '36.8', heartRate: '75', respiratoryRate: '16',
      bpSystolic: '115', bpDiastolic: '75', weightKg: '65', heightCm: '170',
      spo2: '99', recordedAt: new Date().toISOString()
    }],
    medications: [],
    ward: 'Surgical Ward',
    photoUrl: 'https://i.pravatar.cc/150?u=MRN-2026-003',
  }
];

export const initialStaff: StaffMember[] = [
  {
    id: 1, name: 'Tewodros Alemu', role: 'Doctor', specialization: 'Cardiology',
    gender: 'Male', age: 45, shift: 'Morning', status: 'Active',
    education: 'MD, Addis Ababa University', license: 'ETH-MD-1001',
    experience: '15 Years', surgeries: ['CABG', 'Valve Replacement'],
    training: ['Advanced Cardiac Life Support'], awards: ['Best Doctor 2025'],
    photoUrl: 'https://i.pravatar.cc/150?u=doctor-1'
  },
  {
    id: 2, name: 'Saba Tadesse', role: 'Doctor', specialization: 'Neurology',
    gender: 'Female', age: 38, shift: 'Night', status: 'Active',
    education: 'MD, Jimma University', license: 'ETH-MD-2002',
    experience: '10 Years', surgeries: [],
    training: ['Neurocritical Care'], awards: [],
    photoUrl: 'https://i.pravatar.cc/150?u=doctor-2'
  },
  {
    id: 3, name: 'Hirut Yohannes', role: 'Nurse', specialization: 'ER',
    gender: 'Female', age: 32, shift: 'Morning', status: 'Active',
    education: 'BSc Nursing, Hawassa University', license: 'ETH-RN-3003',
    experience: '8 Years', surgeries: [],
    training: ['Trauma Care'], awards: [],
    photoUrl: 'https://i.pravatar.cc/150?u=nurse-1'
  }
];

export const initialAssets: Asset[] = [
  {
    id: 'EQ-001', name: 'GE MRI Scanner', serial: 'GE-MRI-X100', qty: 1,
    weight: '3500kg', supplier: 'GE Healthcare', status: 'Active',
    location: 'Radiology Dept', addedAt: new Date().toISOString(),
    photoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'EQ-002', name: 'Philips Patient Monitor', serial: 'PH-PM-200', qty: 15,
    weight: '3kg', supplier: 'Philips Medical', status: 'Maintenance',
    location: 'ICU', addedAt: new Date().toISOString(),
    photoUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=200'
  }
];
