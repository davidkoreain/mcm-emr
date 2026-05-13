import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services';

export type UserRole = 'Admin' | 'Doctor' | 'Nurse' | 'Pharmacist' | 'LabTech' | 'Cashier' | 'Patient' | 'Guardian';

export type Appointment = {
  id: number;
  patientMrn: string;
  doctorId: number;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'Cancelled' | 'Completed';
  notes?: string;
  createdAt: string;
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
  experience: string;
  surgeries: string[];
  training: string[];
  awards: string[];
  photoUrl?: string;
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
};

export type LabOrder = {
  id: number;
  patientMrn: string;
  patientName: string;
  tests: string[];
  priority: 'Urgent' | 'Normal';
  status: 'Pending' | 'Completed';
  createdAt: string;
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
  labOrders: LabOrder[];
  labResults: LabResult[];
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
  // Pharmacy
  dispenseMedication: (prescriptionId: number, drugId: number, qty: number) => Promise<void>;
  // Lab
  submitLabResult: (orderId: number, result: Omit<LabResult, 'id' | 'createdAt'>) => Promise<void>;
};

const EMRContext = createContext<EMRContextType | null>(null);

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
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [guardians, setGuardians] = useState<GuardianUser[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<Patient | null>(null);
  const [currentGuardian, setCurrentGuardian] = useState<GuardianUser | null>(null);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      const safeFetch = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => {
        try { return await promise; } catch (e) { console.warn("Fetch failed, using fallback:", e); return fallback; }
      };

      const [p, s, a, app, dr, rx, lo, lr, sur, gd] = await Promise.all([
        safeFetch(db.fetchPatients(), []),
        safeFetch(db.fetchStaff(), []),
        safeFetch(db.fetchAssets(), []),
        safeFetch(db.fetchAppointments(), []),
        safeFetch(db.fetchDrugs(), []),
        safeFetch(db.fetchPrescriptions(), []),
        safeFetch(db.fetchLabOrders(), []),
        safeFetch(db.fetchLabResults(), []),
        safeFetch(db.fetchSurgeries(), []),
        safeFetch(db.fetchGuardians(), [])
      ]);
      setPatients(p);
      setStaff(s);
      setAssets(a);
      setAppointments(app);
      setDrugs(dr);
      setPrescriptions(rx);
      setLabOrders(lo);
      setLabResults(lr);
      setSurgeries(sur);
      setGuardians(gd);
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

  const addStaff = async (s: Omit<StaffMember, 'id'>) => {
    await db.insertStaff(s);
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

  const dispenseMedication = async (prescriptionId: number, drugId: number, qty: number) => {
    const drug = drugs.find(d => d.id === drugId);
    if (drug) {
      await db.updateDrugStock(drugId, drug.stock - qty);
      await db.updatePrescriptionStatus(prescriptionId, 'Dispensed');
      await refreshData();
    }
  };

  const submitLabResult = async (orderId: number, result: Omit<LabResult, 'id' | 'createdAt'>) => {
    await db.insertLabResult(result);
    await refreshData();
  };

  return (
    <EMRContext.Provider value={{
      patients, staff, assets, appointments, surgeries, guardians, drugs, prescriptions, labOrders, labResults,
      loading, error, role, setRole,
      currentUser, setCurrentUser, currentGuardian, setCurrentGuardian, currentStaff, setCurrentStaff,
      addPatient, updatePatient, addVitals, addStaff, addAsset, updateAsset,
      addAppointment, updateAppointment, addSurgery, updateSurgery, registerGuardian, updatePrivacy, matchPatient, registerPatientUser, loginPortalUser, isPortalUserRegistered, loginStaff,
      dispenseMedication, submitLabResult
    }}>
      {children}
    </EMRContext.Provider>
  );
};
