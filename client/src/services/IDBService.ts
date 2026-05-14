import type { Patient, StaffMember, Asset, VitalsRecord, Appointment, Drug, Prescription, LabOrder, LabResult, Surgery, GuardianUser, MedicalHistoryItem } from '../context/EMRContext';

/**
 * Database service interface.
 * Both SupabaseService and future ApiService (Express) implement this contract.
 * Swapping backends = change one line in services/index.ts.
 */
export interface IDBService {
  // patients
  fetchPatients(): Promise<Patient[]>;
  insertPatient(p: Patient): Promise<void>;
  updatePatient(mrn: string, changes: Partial<Patient>): Promise<void>;
  appendVitals(mrn: string, vitals: VitalsRecord): Promise<void>;
  fetchMedicalHistory(): Promise<MedicalHistoryItem[]>;
  deleteMedicalHistory(id: number): Promise<void>;
  // staff
  fetchStaff(): Promise<StaffMember[]>;
  insertStaff(s: Omit<StaffMember, 'id'>): Promise<StaffMember>;
  // assets
  fetchAssets(): Promise<Asset[]>;
  insertAsset(a: Asset): Promise<void>;
  updateAsset(id: string, changes: Partial<Asset>): Promise<void>;
  // appointments
  fetchAppointments(): Promise<Appointment[]>;
  insertAppointment(a: Omit<Appointment, 'id' | 'createdAt'>): Promise<void>;
  updateAppointment(id: number, changes: Partial<Appointment>): Promise<void>;
  // portal auth
  matchPatientRecord(name: string, dob: string, phone: string): Promise<Patient | null>;
  registerPortalUser(mrn: string, passwordHash: string): Promise<void>;
  loginPortalUser(name: string, passwordHash: string): Promise<Patient | null>;
  isPortalUserRegistered(mrn: string): Promise<boolean>;
  // pharmacy
  fetchDrugs(): Promise<Drug[]>;
  updateDrugStock(id: number, newStock: number): Promise<void>;
  fetchPrescriptions(): Promise<Prescription[]>;
  insertPrescription(p: Omit<Prescription, 'id' | 'createdAt'>): Promise<void>;
  updatePrescriptionStatus(id: number, status: string): Promise<void>;
  // lab
  fetchLabOrders(): Promise<LabOrder[]>;
  fetchLabResults(): Promise<LabResult[]>;
  insertLabResult(r: Omit<LabResult, 'id' | 'createdAt'>): Promise<void>;
  // surgery
  fetchSurgeries(): Promise<Surgery[]>;
  insertSurgery(s: Omit<Surgery, 'id' | 'createdAt'>): Promise<void>;
  updateSurgery(id: number, changes: Partial<Surgery>): Promise<void>;
  // guardian
  fetchGuardians(): Promise<GuardianUser[]>;
  insertGuardian(g: Omit<GuardianUser, 'id' | 'createdAt'>): Promise<void>;
  updateGuardianPrivacy(id: string, settings: GuardianUser['privacySettings']): Promise<void>;
  loginGuardian(name: string, passwordHash: string): Promise<GuardianUser | null>;
  // staff auth
  loginStaff(name: string, passwordHash: string): Promise<StaffMember | null>;
  // staff leave
  fetchStaffLeave(): Promise<StaffLeave[]>;
}
