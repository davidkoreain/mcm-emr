import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services';

export type UserRole = 'Admin' | 'Manager' | 'Doctor' | 'Nurse' | 'Pharmacist' | 'LabTech' | 'Cashier' | 'Patient' | 'Guardian';

export type AppointmentStatus =
  | 'Applied'
  | 'Confirmed'
  | 'ChangeApplied'
  | 'ChangeConfirmed'
  | 'Cancelled'
  | 'Completed'
  // legacy value kept for backward-compatibility with existing rows
  | 'Scheduled';

export type Appointment = {
  id: number;
  patientMrn: string;
  doctorId: number;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  // Change-request fields: populated when patient requests to change a Confirmed appointment
  requestedStartTime?: string;
  requestedEndTime?: string;
  requestedDoctorId?: number;
  changeReason?: string;
  confirmedAt?: string;
  confirmedBy?: string;
};

export type PatientUser = {
  id: string;
  patientMrn: string;
  passwordHash: string;
  lastLogin?: string;
  createdAt: string;
};

export type GuardianUser = {
  id: string;
  patientMrn: string;
  guardianName: string;
  relationship: string;
  phone: string;
  passwordHash: string;
  privacySettings: {
    showNotes: boolean;
    showLabs: boolean;
    showSurgeries: boolean;
  };
  createdAt: string;
};

export type MedicalHistoryItem = {
  id: number;
  patientMrn: string;
  date: string;
  doctor: string;
  diagnosis: string;
  icd10Code?: string;
  summary: string;
  riskFactors?: string[];
  lifestyle?: Record<string, string>;
  createdAt?: string;
};

export type MedOrder = {
  id: string;
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  prescribedAt: string;
  status?: 'Pending' | 'Dispensed';
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
  title?: string;
  preferredName?: string;
  amharic: string;
  visitType: string;
  status: string;
  time: string;
  registeredAt: string;
  gender: string;
  genderIdentity?: string;
  sexualOrientation?: string;
  pronouns?: string;
  birthSex?: string;
  dob: string;
  phone: string;
  city: string;
  woreda: string;
  kebele: string;
  ethnicity?: string;
  race?: string;
  nationality?: string;
  language?: string;
  religion?: string;
  monthlyIncome?: number;
  homelessStatus?: boolean;
  interpreterNeeded?: boolean;
  insuranceProvider?: string;
  insurancePolicyNo?: string;
  vitals: VitalsRecord[];
  medications: MedOrder[];
  ward: string;
  photoUrl?: string;
  admissionDate?: string;
  dischargeDate?: string;
  diagnosisSummary?: string;
  treatmentPlan?: string[];
};

export type StaffMember = {
  id: number;
  name: string;
  role: string;
  specialization: string;
  gender: 'Male' | 'Female';
  age: number;
  shift: string;
  status: string;
  education: string;
  license: string;
  licenseNo?: string;
  npi?: string;
  upin?: string;
  taxId?: string;
  experience: string;
  surgeries: string[];
  training: string[];
  awards: string[];
  photoUrl?: string;
  signatureUrl?: string;
};

export type Surgery = {
  id: number;
  patientMrn: string;
  patientName: string;
  operationName: string;
  surgeonId: number;
  anesthesiaType: string;
  roomNumber: string;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
};

export type StaffLeave = {
  id: number;
  staffId: number;
  leaveDate: string;
  status: 'Pending' | 'Confirmed' | 'Rejected';
  reason?: string;
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
  photoUrl?: string;
};

// --- Pharmacy & Lab Types ---

export type Drug = {
  id: number;
  name: string;
  form: string;
  strength: string;
  stock: number;
  price: string;
  addedAt: string;
  // Extended pharmacy metadata (Phase 1)
  brandName?: string;
  manufacturer?: string;
  supplierName?: string;
  activeIngredient?: string;
  category?: string;
  unit?: string;
  route?: string;
  indication?: string;
  contraindications?: string;
  sideEffects?: string;
  drugInteractions?: string;
  storageConditions?: string;
  handlingPrecautions?: string;
  controlledSubstance?: boolean;
  prescriptionRequired?: boolean;
  purchasePrice?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  expiryDate?: string;
  batchNumber?: string;
  storageLocation?: string;
  status?: string;
};

export type Prescription = {
  id: number;
  patientMrn: string;
  patientName: string;
  drug: string;
  dosage: string;
  duration: string;
  status: 'Pending' | 'Dispensed' | 'Cancelled';
  createdAt: string;
  // Phase 1 extensions
  drugId?: number;
  frequency?: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
  prescribedBy?: string;
  dispensedAt?: string;
  quantity?: number;
};

export type DrugSupplier = {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  leadTimeDays: number;
  notes: string;
  createdAt: string;
};

export type MedicationSchedule = {
  id: number;
  prescriptionId: number;
  patientMrn: string;
  drugId: number;
  drugName: string;
  dosage: string;
  scheduledDate: string;
  scheduledTime: string;
  taken: boolean;
  takenAt: string | null;
  notes: string;
  createdAt: string;
};

export type DrugOrder = {
  id: number;
  supplierId: number;
  supplierName: string;
  drugId: number;
  drugName: string;
  quantityOrdered: number;
  unitPrice: number;
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';
  orderDate: string;
  expectedDelivery: string;
  orderedBy: string;
  triggerType: 'Manual' | 'Auto';
  notes: string;
  createdAt: string;
};

export type InventoryHistory = {
  id: number;
  dispensedDate: string;
  drugId: number | null;
  drugName: string;
  prescriptionId: number | null;
  patientMrn: string;
  patientName: string;
  prescribedBy: string;
  quantityDispensed: number;
  stockBefore: number;
  stockAfter: number;
  notes: string;
  createdAt: string;
};

export type LabOrder = {
  id: number;
  patientMrn: string;
  patientName: string;
  tests: string[];
  priority: 'Urgent' | 'Normal';
  status: 'Pending' | 'Completed';
  createdAt: string;
  // Extended fields
  orderedBy?: string;
  scheduledDate?: string;
  resultStatus?: 'Scheduled' | 'In Progress' | 'Completed';
  notes?: string;
  assignedTo?: string;
};

export type LabResult = {
  id: number;
  patientMrn: string;
  patientName: string;
  test: string;
  value: string;
  unit: string;
  range: string;
  status: 'Normal' | 'Abnormal';
  createdAt: string;
  labOrderId?: number;
  completedBy?: string;
  notes?: string;
};

export type LabTestCatalog = {
  id: number;
  name: string;
  category: string;
  specialty: string;
  description: string;
  requiredEquipment: string[];
  normalRange: string;
  unit: string;
  durationMinutes: number;
  createdAt: string;
};

type EMRContextType = {
  patients: Patient[];
  staff: StaffMember[];
  assets: Asset[];
  appointments: Appointment[];
  surgeries: Surgery[];
  guardians: GuardianUser[];
  drugs: Drug[];
  prescriptions: Prescription[];
  drugSuppliers: DrugSupplier[];
  medicationSchedules: MedicationSchedule[];
  drugOrders: DrugOrder[];
  inventoryHistory: InventoryHistory[];
  labOrders: LabOrder[];
  labResults: LabResult[];
  medicalHistory: MedicalHistoryItem[];
  staffLeave: StaffLeave[];
  loading: boolean;
  error: string | null;
  role: UserRole | null;
  currentUser: Patient | null;
  currentGuardian: GuardianUser | null;
  currentStaff: StaffMember | null;
  setRole: (role: UserRole | null) => void;
  setCurrentUser: (user: Patient | null) => void;
  setCurrentGuardian: (g: GuardianUser | null) => void;
  setCurrentStaff: (s: StaffMember | null) => void;
  addPatient: (p: Patient) => Promise<void>;
  updatePatient: (mrn: string, changes: Partial<Patient>) => Promise<void>;
  addVitals: (mrn: string, v: VitalsRecord) => Promise<void>;
  deleteMedicalHistory: (id: number) => Promise<void>;
  addStaff: (s: Omit<StaffMember, 'id'>) => Promise<void>;
  addAsset: (a: Asset) => Promise<void>;
  updateAsset: (id: string, changes: Partial<Asset>) => Promise<void>;
  addAppointment: (app: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointment: (id: number, changes: Partial<Appointment>) => Promise<void>;
  // Surgeries
  addSurgery: (s: Omit<Surgery, 'id' | 'createdAt'>) => Promise<void>;
  updateSurgery: (id: number, changes: Partial<Surgery>) => Promise<void>;
  // Guardians
  registerGuardian: (g: Omit<GuardianUser, 'id' | 'createdAt'>) => Promise<void>;
  updatePrivacy: (guardianId: string, settings: GuardianUser['privacySettings']) => Promise<void>;
  matchPatient: (name: string, dob: string, phone: string) => Promise<Patient | null>;
  registerPatientUser: (mrn: string, passwordHash: string) => Promise<void>;
  loginPortalUser: (mrn: string, passwordHash: string) => Promise<Patient | null>;
  isPortalUserRegistered: (mrn: string) => Promise<boolean>;
  loginStaff: (name: string, passwordHash: string) => Promise<StaffMember | null>;
  loginGuardian: (name: string, passwordHash: string) => Promise<GuardianUser | null>;
  fetchAppSetting: (key: string) => Promise<any | null>;
  saveAppSetting: (key: string, value: any) => Promise<void>;
  updateStaff: (id: number, changes: Partial<StaffMember>) => Promise<void>;
  addDrug: (d: Omit<Drug, 'id' | 'addedAt'>) => Promise<void>;
  updateDrug: (id: number, changes: Partial<Drug>) => Promise<void>;
  dispenseMedication: (prescriptionId: number, drugId: number, qty: number) => Promise<void>;
  cancelPrescription: (id: number) => Promise<void>;
  addPrescription: (rx: Omit<Prescription, 'id' | 'createdAt'>) => Promise<Prescription>;
  addDrugSupplier: (s: Omit<DrugSupplier, 'id' | 'createdAt'>) => Promise<void>;
  createDrugOrder: (o: Omit<DrugOrder, 'id' | 'createdAt'>) => Promise<void>;
  markMedicationTaken: (scheduleId: number, taken: boolean) => Promise<void>;
  createMedicationSchedule: (rx: Prescription, drug: Drug) => Promise<void>;
  labTestCatalog: LabTestCatalog[];
  // Lab
  submitLabResult: (orderId: number, result: Omit<LabResult, 'id' | 'createdAt'>) => Promise<void>;
  addLabOrder: (o: Omit<LabOrder, 'id' | 'createdAt'>) => Promise<void>;
  updateLabOrderStatus: (id: number, status: 'Pending' | 'Completed') => Promise<void>;
  updateLabOrderResultStatus: (id: number, resultStatus: 'Scheduled' | 'In Progress' | 'Completed') => Promise<void>;
  addMedicalHistory: (item: Omit<MedicalHistoryItem, 'id' | 'createdAt'>) => Promise<void>;
};

const EMRContext = createContext<EMRContextType | null>(null);

export const DEMO_PATIENTS: Patient[] = [
  { 
    mrn: 'MRN-2026-001', name: 'Abebe Bikila', amharic: 'አበበ ቢቂላ', visitType: 'OPD', status: 'Waiting', time: '08:30 AM', 
    registeredAt: '2026-05-13', gender: 'Male', dob: '1992-04-15', phone: '+251 911 223344', city: 'Addis Ababa', 
    woreda: '03', kebele: '12', vitals: [], medications: [], ward: 'OPD-1', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100'
  },
  { 
    mrn: 'MRN-2026-002', name: 'Sara Tekle', amharic: 'ሳራ ተክለ', visitType: 'Emergency', status: 'Consulting', time: '09:15 AM', 
    registeredAt: '2026-05-13', gender: 'Female', dob: '1995-11-20', phone: '+251 922 334455', city: 'Bishoftu', 
    woreda: '01', kebele: '05', vitals: [], medications: [], ward: 'ER-A', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100'
  },
  { 
    mrn: 'MRN-2026-003', name: 'Dawit Lema', amharic: 'ዳዊት ለማ', visitType: 'Follow-up', status: 'Waiting', time: '10:00 AM', 
    registeredAt: '2026-05-12', gender: 'Male', dob: '1988-07-30', phone: '+251 933 445566', city: 'Adama', 
    woreda: '05', kebele: '08', vitals: [], medications: [], ward: 'OPD-2', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100'
  },
  { 
    mrn: 'MRN-2026-004', name: 'Helina Yoseph', amharic: 'ሄሊና ዮሴፍ', visitType: 'Inpatient', status: 'In Progress', time: '11:45 AM', 
    registeredAt: '2026-05-11', gender: 'Female', dob: '2000-02-14', phone: '+251 944 556677', city: 'Hawassa', 
    woreda: '02', kebele: '03', vitals: [], medications: [], ward: 'Ward-B', photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100'
  },
  { 
    mrn: 'MRN-2026-005', name: 'Martha Kassa', amharic: 'ማርታ ካሳ', visitType: 'OPD', status: 'Completed', time: '02:30 PM', 
    registeredAt: '2026-05-10', gender: 'Female', dob: '1985-09-05', phone: '+251 955 667788', city: 'Gondar', 
    woreda: '04', kebele: '10', vitals: [], medications: [], ward: 'OPD-1', photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'
  }
];

export const DEMO_APPOINTMENTS: Appointment[] = [
  { id: 101, patientMrn: 'MRN-2026-001', doctorId: 1, startTime: '2026-05-13T08:00:00Z', endTime: '2026-05-13T09:00:00Z', status: 'Scheduled', createdAt: '2026-05-10' },
  { id: 102, patientMrn: 'MRN-2026-002', doctorId: 1, startTime: '2026-05-13T07:30:00Z', endTime: '2026-05-13T08:00:00Z', status: 'Scheduled', createdAt: '2026-05-10' },
  { id: 103, patientMrn: 'MRN-2026-003', doctorId: 1, startTime: '2026-05-14T08:45:00Z', endTime: '2026-05-14T09:15:00Z', status: 'Scheduled', createdAt: '2026-05-10' },
  { id: 104, patientMrn: 'MRN-2026-002', doctorId: 1, startTime: '2026-05-15T09:30:00Z', endTime: '2026-05-15T10:00:00Z', status: 'Scheduled', createdAt: '2026-05-10' },
  { id: 105, patientMrn: 'MRN-2026-005', doctorId: 1, startTime: '2026-05-16T11:30:00Z', endTime: '2026-05-16T12:00:00Z', status: 'Scheduled', createdAt: '2026-05-10' },
];

export const useEMR = (): EMRContextType => {
  const ctx = useContext(EMRContext);
  if (!ctx) throw new Error('useEMR must be used within EMRProvider');
  return ctx;
};

export const EMRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [drugSuppliers, setDrugSuppliers] = useState<DrugSupplier[]>([]);
  const [medicationSchedules, setMedicationSchedules] = useState<MedicationSchedule[]>([]);
  const [drugOrders, setDrugOrders] = useState<DrugOrder[]>([]);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [labTestCatalog, setLabTestCatalog] = useState<LabTestCatalog[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [guardians, setGuardians] = useState<GuardianUser[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryItem[]>([]);
  const [staffLeave, setStaffLeave] = useState<StaffLeave[]>([]);

  // Cookie Helpers for Session-only state (shared across tabs)
  const getSessionCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };
  const setSessionCookie = (name: string, value: string) => {
    document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
  };
  const removeSessionCookie = (name: string) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  };

  const [role, setRoleState] = useState<UserRole | null>(() => {
    const sessionActive = getSessionCookie('emr_session_active');
    if (!sessionActive) {
      // Browser was closed, clear persisted data
      localStorage.removeItem('emr_role');
      localStorage.removeItem('emr_user');
      localStorage.removeItem('emr_guardian');
      localStorage.removeItem('emr_staff');
      return null;
    }
    const saved = localStorage.getItem('emr_role');
    return saved ? (saved as UserRole) : null;
  });

  const [currentUser, setCurrentUserState] = useState<Patient | null>(() => {
    if (!getSessionCookie('emr_session_active')) return null;
    const saved = localStorage.getItem('emr_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentGuardian, setCurrentGuardianState] = useState<GuardianUser | null>(() => {
    if (!getSessionCookie('emr_session_active')) return null;
    const saved = localStorage.getItem('emr_guardian');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentStaff, setCurrentStaffState] = useState<StaffMember | null>(() => {
    if (!getSessionCookie('emr_session_active')) return null;
    const saved = localStorage.getItem('emr_staff');
    return saved ? JSON.parse(saved) : null;
  });

  const setRole = (r: UserRole | null) => {
    setRoleState(r);
    if (r) {
      setSessionCookie('emr_session_active', 'true');
      localStorage.setItem('emr_role', r);
    } else {
      removeSessionCookie('emr_session_active');
      localStorage.removeItem('emr_role');
    }
  };

  const setCurrentUser = (u: Patient | null) => {
    setCurrentUserState(u);
    if (u) localStorage.setItem('emr_user', JSON.stringify(u));
    else localStorage.removeItem('emr_user');
  };

  const setCurrentGuardian = (g: GuardianUser | null) => {
    setCurrentGuardianState(g);
    if (g) localStorage.setItem('emr_guardian', JSON.stringify(g));
    else localStorage.removeItem('emr_guardian');
  };

  const setCurrentStaff = (s: StaffMember | null) => {
    setCurrentStaffState(s);
    if (s) localStorage.setItem('emr_staff', JSON.stringify(s));
    else localStorage.removeItem('emr_staff');
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      const safeFetch = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => {
        try { return await promise; } catch (e) { console.warn("Fetch failed, using fallback:", e); return fallback; }
      };

      const [p, s, a, app, dr, rx, lo, lr, sur, gd, mh, l, dsup, msch, dord, invh, ltc] = await Promise.all([
        safeFetch(db.fetchPatients(), []),
        safeFetch(db.fetchStaff(), []),
        safeFetch(db.fetchAssets(), []),
        safeFetch(db.fetchAppointments(), []),
        safeFetch(db.fetchDrugs(), []),
        safeFetch(db.fetchPrescriptions(), []),
        safeFetch(db.fetchLabOrders(), []),
        safeFetch(db.fetchLabResults(), []),
        safeFetch(db.fetchSurgeries(), []),
        safeFetch(db.fetchGuardians(), []),
        safeFetch(db.fetchMedicalHistory(), []),
        safeFetch(db.fetchStaffLeave(), []),
        safeFetch(db.fetchDrugSuppliers ? db.fetchDrugSuppliers() : Promise.resolve([] as DrugSupplier[]), [] as DrugSupplier[]),
        safeFetch(db.fetchMedicationSchedules ? db.fetchMedicationSchedules() : Promise.resolve([] as MedicationSchedule[]), [] as MedicationSchedule[]),
        safeFetch(db.fetchDrugOrders ? db.fetchDrugOrders() : Promise.resolve([] as DrugOrder[]), [] as DrugOrder[]),
        safeFetch(db.fetchInventoryHistory ? db.fetchInventoryHistory() : Promise.resolve([] as InventoryHistory[]), [] as InventoryHistory[]),
        safeFetch(db.fetchLabTestCatalog ? db.fetchLabTestCatalog() : Promise.resolve([] as LabTestCatalog[]), [] as LabTestCatalog[]),
      ]);
      
      // Always merge demo data to ensure a rich demo experience
      const mergedPatients = [...p, ...DEMO_PATIENTS];
      const uniquePatients = mergedPatients.filter((v, i, a) => a.findIndex(t => t.mrn === v.mrn) === i);
      
      setPatients(uniquePatients);
      setStaff(s);
      setAssets(a);
      
      const mergedApps = [...app, ...DEMO_APPOINTMENTS];
      const uniqueApps = mergedApps.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      
      setAppointments(uniqueApps);
      setDrugs(dr);
      setPrescriptions(rx);
      setLabOrders(lo);
      setLabResults(lr);
      setSurgeries(sur);
      setGuardians(gd);
      setMedicalHistory(mh);
      setStaffLeave(l);
      setDrugSuppliers(dsup);
      setMedicationSchedules(msch);
      setDrugOrders(dord);
      setInventoryHistory(invh);
      setLabTestCatalog(ltc);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addPatient = async (p: Patient) => {
    await db.insertPatient(p);
    await refreshData();
  };

  const updatePatient = async (mrn: string, changes: Partial<Patient>) => {
    await db.updatePatient(mrn, changes);
    await refreshData();
  };

  const addVitals = async (mrn: string, vitals: VitalsRecord) => {
    await db.appendVitals(mrn, vitals);
    await refreshData();
  };

  const deleteMedicalHistory = async (id: number) => {
    await db.deleteMedicalHistory(id);
    await refreshData();
  };

  const addStaff = async (s: Omit<StaffMember, 'id'>) => {
    await db.insertStaff(s);
    await refreshData();
  };
  const updateStaff = async (id: number, changes: Partial<StaffMember>) => {
    await db.updateStaff(id, changes);
    await refreshData();
  };

  const addAsset = async (a: Asset) => {
    await db.insertAsset(a);
    await refreshData();
  };

  const updateAsset = async (id: string, changes: Partial<Asset>) => {
    await db.updateAsset(id, changes);
    await refreshData();
  };

  const addAppointment = async (app: Omit<Appointment, 'id' | 'createdAt'>) => {
    await db.insertAppointment(app);
    await refreshData();
  };

  const updateAppointment = async (id: number, changes: Partial<Appointment>) => {
    await db.updateAppointment(id, changes);
    await refreshData();
  };

  const matchPatient = async (name: string, dob: string, phone: string) => {
    return await db.matchPatientRecord(name, dob, phone);
  };

  const registerPatientUser = async (mrn: string, passwordHash: string) => {
    await db.registerPortalUser(mrn, passwordHash);
  };

  const loginPortalUser = async (mrn: string, passwordHash: string) => {
    return await db.loginPortalUser(mrn, passwordHash);
  };

  const isPortalUserRegistered = async (mrn: string) => {
    return await db.isPortalUserRegistered(mrn);
  };

  const loginStaff = async (name: string, passwordHash: string) => {
    return await db.loginStaff(name, passwordHash);
  };

  const addSurgery = async (s: Omit<Surgery, 'id' | 'createdAt'>) => {
    await db.insertSurgery(s);
    await refreshData();
  };

  const updateSurgery = async (id: number, changes: Partial<Surgery>) => {
    await db.updateSurgery(id, changes);
    await refreshData();
  };

  const registerGuardian = async (g: Omit<GuardianUser, 'id' | 'createdAt'>) => {
    await db.insertGuardian(g);
    await refreshData();
  };

  const updatePrivacy = async (guardianId: string, settings: GuardianUser['privacySettings']) => {
    await db.updateGuardianPrivacy(guardianId, settings);
    await refreshData();
  };

  const loginGuardian = async (name: string, passwordHash: string) => {
    return await db.loginGuardian(name, passwordHash);
  };

  const fetchAppSetting = async (key: string): Promise<any | null> => {
    return db.fetchAppSetting ? await db.fetchAppSetting(key) : null;
  };

  const saveAppSetting = async (key: string, value: any): Promise<void> => {
    if (db.saveAppSetting) await db.saveAppSetting(key, value);
  };

  const dispenseMedication = async (prescriptionId: number, drugId: number, qty: number) => {
    const drug = drugs.find(d => d.id === drugId);
    if (drug) {
      const stockBefore = drug.stock;
      const stockAfter = drug.stock - qty;
      await db.updateDrugStock(drugId, stockAfter);
      await db.updatePrescriptionStatus(prescriptionId, 'Dispensed');
      const rx = prescriptions.find(p => p.id === prescriptionId);
      if (db.insertInventoryHistory) {
        await db.insertInventoryHistory({
          dispensedDate: new Date().toISOString().slice(0, 10),
          drugId,
          drugName: drug.name,
          prescriptionId,
          patientMrn: rx?.patientMrn ?? '',
          patientName: rx?.patientName ?? '',
          prescribedBy: rx?.prescribedBy ?? '',
          quantityDispensed: qty,
          stockBefore,
          stockAfter,
          notes: '',
        });
      }
      await refreshData();
    }
  };

  const submitLabResult = async (labOrderId: number, result: Omit<LabResult, 'id' | 'createdAt'>) => {
    await db.insertLabResult({ ...result, labOrderId });
    if (db.updateLabOrderResultStatus) {
      await db.updateLabOrderResultStatus(labOrderId, 'Completed');
    }
    await db.updateLabOrderStatus(labOrderId, 'Completed');
    await refreshData();
  };

  const updateLabOrderResultStatus = async (id: number, resultStatus: 'Scheduled' | 'In Progress' | 'Completed') => {
    if (db.updateLabOrderResultStatus) {
      await db.updateLabOrderResultStatus(id, resultStatus);
    }
    if (resultStatus === 'Completed') await db.updateLabOrderStatus(id, 'Completed');
    await refreshData();
  };

  const addLabOrder = async (o: Omit<LabOrder, 'id' | 'createdAt'>) => {
    await db.insertLabOrder(o);
    await refreshData();
  };

  const updateLabOrderStatus = async (id: number, status: 'Pending' | 'Completed') => {
    await db.updateLabOrderStatus(id, status);
    await refreshData();
  };

  const addMedicalHistory = async (item: Omit<MedicalHistoryItem, 'id' | 'createdAt'>) => {
    await db.insertMedicalHistory(item);
    await refreshData();
  };
  const addDrug = async (d: Omit<Drug, 'id' | 'addedAt'>) => {
    await db.insertDrug(d);
    await refreshData();
  };
  const updateDrug = async (id: number, changes: Partial<Drug>) => {
    await db.updateDrug(id, changes);
    await refreshData();
  };

  const addPrescription = async (rx: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription> => {
    await db.insertPrescription(rx);
    const updated = await db.fetchPrescriptions();
    const newRx = updated[0];
    await refreshData();
    return newRx;
  };

  const cancelPrescription = async (id: number) => {
    await db.updatePrescriptionStatus(id, 'Cancelled');
    await refreshData();
  };

  const addDrugSupplier = async (s: Omit<DrugSupplier, 'id' | 'createdAt'>) => {
    if (db.insertDrugSupplier) {
      await db.insertDrugSupplier(s);
      await refreshData();
    }
  };

  const createDrugOrder = async (o: Omit<DrugOrder, 'id' | 'createdAt'>) => {
    if (db.insertDrugOrder) {
      await db.insertDrugOrder(o);
      await refreshData();
    }
  };

  const markMedicationTaken = async (scheduleId: number, taken: boolean) => {
    if (db.updateMedicationSchedule) {
      await db.updateMedicationSchedule(scheduleId, { taken, takenAt: taken ? new Date().toISOString() : null });
      await refreshData();
    }
  };

  const createMedicationSchedule = async (rx: Prescription, drug: Drug) => {
    if (!db.insertMedicationSchedule) return;
    // Build a simple schedule based on the prescription's frequency/duration.
    // Default: 1 dose per day for the requested duration (e.g. "5 days").
    const days = (() => {
      const m = (rx.duration || '').match(/(\d+)/);
      const n = m ? parseInt(m[1], 10) : 5;
      return Math.max(1, Math.min(30, n));
    })();
    const dosesPerDay = (() => {
      const f = (rx.frequency || '').toLowerCase();
      if (f.includes('qid') || f.includes('four')) return 4;
      if (f.includes('tid') || f.includes('three') || f.includes('8h')) return 3;
      if (f.includes('bid') || f.includes('twice') || f.includes('12h')) return 2;
      if (f.includes('qd') || f.includes('once') || f.includes('daily')) return 1;
      return 2;
    })();
    const slots = ['08:00', '14:00', '20:00', '02:00'].slice(0, dosesPerDay);
    const start = rx.startDate ? new Date(rx.startDate) : new Date();
    for (let day = 0; day < days; day++) {
      const d = new Date(start);
      d.setDate(d.getDate() + day);
      const dateStr = d.toISOString().slice(0, 10);
      for (const t of slots) {
        await db.insertMedicationSchedule({
          prescriptionId: rx.id,
          patientMrn: rx.patientMrn,
          drugId: drug.id,
          drugName: drug.name,
          dosage: rx.dosage,
          scheduledDate: dateStr,
          scheduledTime: t,
          taken: false,
          takenAt: null,
          notes: rx.instructions || '',
        });
      }
    }
    await refreshData();
  };

  return (
    <EMRContext.Provider value={{
      patients, staff, assets, appointments, surgeries, guardians, drugs, prescriptions,
      drugSuppliers, medicationSchedules, drugOrders, inventoryHistory,
      labOrders, labResults, labTestCatalog, medicalHistory, staffLeave,
      loading, error, role, setRole,
      currentUser, setCurrentUser, currentGuardian, setCurrentGuardian, currentStaff, setCurrentStaff,
      addPatient, updatePatient, addVitals, addStaff, updateStaff, addAsset, updateAsset, addDrug, updateDrug,
      addAppointment, updateAppointment, addSurgery, updateSurgery, registerGuardian, updatePrivacy, matchPatient, registerPatientUser, loginPortalUser, isPortalUserRegistered, loginStaff, loginGuardian, fetchAppSetting, saveAppSetting,
      dispenseMedication, cancelPrescription, addPrescription, addDrugSupplier, createDrugOrder, markMedicationTaken, createMedicationSchedule,
      submitLabResult, deleteMedicalHistory, addLabOrder, updateLabOrderStatus, updateLabOrderResultStatus, addMedicalHistory
    }}>
      {children}
    </EMRContext.Provider>
  );
};
