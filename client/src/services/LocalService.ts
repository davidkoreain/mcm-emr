import type { IDBService } from './IDBService';
import type { Patient, StaffMember, Asset, VitalsRecord, Appointment, Drug, Prescription, LabOrder, LabResult, Surgery, GuardianUser } from '../context/EMRContext';
import { initialPatients, initialStaff, initialAssets } from '../data/mockData';

export class LocalService implements IDBService {
  private patients: Patient[] = [...initialPatients];
  private staff: StaffMember[] = [...initialStaff];
  private assets: Asset[] = [...initialAssets];

  async fetchPatients() { return [...this.patients]; }
  async insertPatient(p: Patient) { this.patients.push(p); }
  async updatePatient(mrn: string, changes: Partial<Patient>) {
    this.patients = this.patients.map(p => p.mrn === mrn ? { ...p, ...changes } : p);
  }
  async appendVitals(mrn: string, vitals: VitalsRecord) {
    this.patients = this.patients.map(p => p.mrn === mrn ? { ...p, vitals: [...p.vitals, vitals] } : p);
  }

  async fetchStaff() { return [...this.staff]; }
  async insertStaff(s: Omit<StaffMember, 'id'>): Promise<StaffMember> {
    const n = { ...s, id: Date.now() };
    this.staff.push(n);
    return n;
  }

  async fetchAssets() { return [...this.assets]; }
  async insertAsset(a: Asset) { this.assets.push(a); }
  async updateAsset(id: string, changes: Partial<Asset>) {
    this.assets = this.assets.map(a => a.id === id ? { ...a, ...changes } : a);
  }

  // Missing implementations
  async fetchAppointments() { return []; }
  async insertAppointment(a: Omit<Appointment, 'id' | 'createdAt'>) {}
  async updateAppointment(id: number, changes: Partial<Appointment>) {}
  async matchPatientRecord(name: string, dob: string, phone: string) { return null; }
  async registerPortalUser(mrn: string, passwordHash: string) {}
  async fetchDrugs() { return []; }
  async updateDrugStock(id: number, newStock: number) {}
  async fetchPrescriptions() { return []; }
  async insertPrescription(p: Omit<Prescription, 'id' | 'createdAt'>) {}
  async updatePrescriptionStatus(id: number, status: string) {}
  async fetchLabOrders() { return []; }
  async fetchLabResults() { return []; }
  async insertLabResult(r: Omit<LabResult, 'id' | 'createdAt'>) {}
  async fetchSurgeries() { return []; }
  async insertSurgery(s: Omit<Surgery, 'id' | 'createdAt'>) {}
  async updateSurgery(id: number, changes: Partial<Surgery>) {}
  async fetchGuardians() { return []; }
  async insertGuardian(g: Omit<GuardianUser, 'id' | 'createdAt'>) {}
  async updateGuardianPrivacy(id: string, settings: any) {}
}
