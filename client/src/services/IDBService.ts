import type { Patient, StaffMember, Asset, VitalsRecord } from '../context/EMRContext';

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
  // staff
  fetchStaff(): Promise<StaffMember[]>;
  insertStaff(s: Omit<StaffMember, 'id'>): Promise<StaffMember>;
  // assets
  fetchAssets(): Promise<Asset[]>;
  insertAsset(a: Asset): Promise<void>;
  updateAsset(id: string, changes: Partial<Asset>): Promise<void>;
}
