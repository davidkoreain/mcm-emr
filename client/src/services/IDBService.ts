import type { Patient, StaffMember, Asset, VitalsRecord, Appointment, Drug, Prescription, LabOrder, LabResult, Surgery, GuardianUser, MedicalHistoryItem, StaffLeave, DrugSupplier, MedicationSchedule, DrugOrder, InventoryHistory, LabTestCatalog, CalendarEvent } from '../context/EMRContext';

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
  // medical history
  fetchMedicalHistory(): Promise<MedicalHistoryItem[]>;
  deleteMedicalHistory(id: number): Promise<void>;
  insertMedicalHistory(item: Omit<MedicalHistoryItem, 'id' | 'createdAt'>): Promise<void>;
  // staff
  fetchStaff(): Promise<StaffMember[]>;
  insertStaff(s: Omit<StaffMember, 'id'>): Promise<StaffMember>;
  updateStaff(id: number, changes: Partial<StaffMember>): Promise<void>;
  // assets
  fetchAssets(): Promise<Asset[]>;
  insertAsset(a: Asset): Promise<void>;
  updateAsset(id: string, changes: Partial<Asset>): Promise<void>;
  // appointments
  fetchAppointments(): Promise<Appointment[]>;
  insertAppointment(a: Omit<Appointment, 'id' | 'createdAt'>): Promise<void>;
  updateAppointment(id: number, changes: Partial<Appointment>): Promise<void>;
  // calendar events (doctor personal schedule)
  fetchCalendarEvents?(): Promise<CalendarEvent[]>;
  insertCalendarEvent?(e: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<void>;
  deleteCalendarEvent?(id: number): Promise<void>;
  // portal auth
  matchPatientRecord(name: string, dob: string, phone: string): Promise<Patient | null>;
  registerPortalUser(mrn: string, passwordHash: string): Promise<void>;
  loginPortalUser(name: string, passwordHash: string): Promise<Patient | null>;
  isPortalUserRegistered(mrn: string): Promise<boolean>;
  // pharmacy
  fetchDrugs(): Promise<Drug[]>;
  insertDrug(d: Omit<Drug, 'id' | 'addedAt'>): Promise<void>;
  updateDrugStock(id: number, newStock: number): Promise<void>;
  updateDrug(id: number, changes: Partial<Drug>): Promise<void>;
  fetchPrescriptions(): Promise<Prescription[]>;
  insertPrescription(p: Omit<Prescription, 'id' | 'createdAt'>): Promise<void>;
  updatePrescriptionStatus(id: number, status: string): Promise<void>;
  // pharmacy phase 1
  fetchDrugSuppliers?(): Promise<DrugSupplier[]>;
  insertDrugSupplier?(s: Omit<DrugSupplier, 'id' | 'createdAt'>): Promise<void>;
  fetchMedicationSchedules?(patientMrn?: string): Promise<MedicationSchedule[]>;
  insertMedicationSchedule?(s: Omit<MedicationSchedule, 'id' | 'createdAt'>): Promise<void>;
  updateMedicationSchedule?(id: number, changes: Partial<MedicationSchedule>): Promise<void>;
  fetchDrugOrders?(): Promise<DrugOrder[]>;
  insertDrugOrder?(o: Omit<DrugOrder, 'id' | 'createdAt'>): Promise<void>;
  updateDrugOrder?(id: number, changes: Partial<DrugOrder>): Promise<void>;
  // inventory history
  fetchInventoryHistory?(): Promise<InventoryHistory[]>;
  insertInventoryHistory?(h: Omit<InventoryHistory, 'id' | 'createdAt'>): Promise<void>;
  // lab
  fetchLabOrders(): Promise<LabOrder[]>;
  fetchLabResults(): Promise<LabResult[]>;
  insertLabResult(r: Omit<LabResult, 'id' | 'createdAt'>): Promise<void>;
  insertLabOrder(o: Omit<LabOrder, 'id' | 'createdAt'>): Promise<void>;
  updateLabOrderStatus(id: number, status: 'Pending' | 'Completed'): Promise<void>;
  updateLabOrderResultStatus?(id: number, resultStatus: 'Scheduled' | 'In Progress' | 'Completed'): Promise<void>;
  fetchLabTestCatalog?(): Promise<LabTestCatalog[]>;
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
  // app-wide settings (persisted to server so all devices share the same config)
  fetchAppSetting?(key: string): Promise<any | null>;
  saveAppSetting?(key: string, value: any): Promise<void>;
}
