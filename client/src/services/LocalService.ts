import type { IDBService } from './IDBService';
import type { Patient, StaffMember, Asset, VitalsRecord } from '../context/EMRContext';
import { initialPatients, initialStaff, initialAssets } from '../context/EMRContext';

/**
 * In-memory fallback — used when Supabase env vars are not configured.
 * Data resets on page refresh. Behavior is identical to the old React state approach.
 * Swap to SupabaseService (or future ApiService) by updating services/index.ts.
 */
export class LocalService implements IDBService {
  private patients: Patient[] = initialPatients.map(p => ({ ...p, vitals: [] }));
  private staff: StaffMember[] = [...initialStaff];
  private assets: Asset[] = [...initialAssets];

  async fetchPatients() { return [...this.patients]; }

  async insertPatient(p: Patient) {
    this.patients = [...this.patients, p];
  }

  async updatePatient(mrn: string, changes: Partial<Patient>) {
    this.patients = this.patients.map(p => p.mrn === mrn ? { ...p, ...changes } : p);
  }

  async appendVitals(mrn: string, vitals: VitalsRecord) {
    this.patients = this.patients.map(p =>
      p.mrn === mrn ? { ...p, vitals: [...p.vitals, vitals] } : p
    );
  }

  async fetchStaff() { return [...this.staff]; }

  async insertStaff(s: Omit<StaffMember, 'id'>): Promise<StaffMember> {
    const newMember: StaffMember = { ...s, id: Date.now() };
    this.staff = [...this.staff, newMember];
    return newMember;
  }

  async fetchAssets() { return [...this.assets]; }

  async insertAsset(a: Asset) {
    this.assets = [...this.assets, a];
  }

  async updateAsset(id: string, changes: Partial<Asset>) {
    this.assets = this.assets.map(a => a.id === id ? { ...a, ...changes } : a);
  }
}
