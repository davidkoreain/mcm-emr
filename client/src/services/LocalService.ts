import type { IDBService } from './IDBService';
import type { Patient, StaffMember, Asset, VitalsRecord, Appointment, Drug, Prescription, LabOrder, LabResult, Surgery, GuardianUser, MedicalHistoryItem } from '../context/EMRContext';
import { initialPatients, initialStaff, initialAssets } from '../data/mockData';

export class LocalService implements IDBService {
  private patients: Patient[] = [...initialPatients];
  private staff: StaffMember[] = [...initialStaff];
  private assets: Asset[] = [...initialAssets];
  private medicalHistory: MedicalHistoryItem[] = [];

  async fetchPatients() { return [...this.patients]; }
  async insertPatient(p: Patient) { this.patients.push(p); }
  async updatePatient(mrn: string, changes: Partial<Patient>) {
    this.patients = this.patients.map(p => p.mrn === mrn ? { ...p, ...changes } : p);
  }
  async appendVitals(mrn: string, vitals: VitalsRecord) {
    this.patients = this.patients.map(p => p.mrn === mrn ? { ...p, vitals: [...p.vitals, vitals] } : p);
  }

  async fetchMedicalHistory(): Promise<MedicalHistoryItem[]> {
    return [...this.medicalHistory];
  }

  async deleteMedicalHistory(id: number): Promise<void> {
    this.medicalHistory = this.medicalHistory.filter(x => x.id !== id);
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
  async isPortalUserRegistered(mrn: string) { return false; }
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
  async loginStaff(name: string, passwordHash: string) { 
    if (name === 'admin' && passwordHash === 'sec_no@admin25') {
      return { 
        id: 0, 
        name: 'Master Admin', 
        role: 'Admin' as const, 
        specialization: 'IT',
        gender: 'Male' as const,
        age: 30,
        shift: 'Day', 
        status: 'On Duty' as const, 
        education: '', 
        license: '', 
        experience: '', 
        surgeries: [], 
        training: [], 
        awards: [] 
      };
    }
    return null; 
  }
  async loginGuardian(name: string, passwordHash: string) { 
    if (name === 'admin' && passwordHash === 'sec_no@admin25') {
      return { 
        id: 'G-ADMIN', 
        patientMrn: 'MRN-2026-001', 
        guardianName: 'Master Admin', 
        relationship: 'Parent', 
        phone: '0000000', 
        passwordHash: '', 
        privacySettings: { showNotes: true, showLabs: true, showSurgeries: true }, 
        createdAt: new Date().toISOString() 
      };
    }
    return null; 
  }
  async loginPortalUser(name: string, passwordHash: string) {
    if (name === 'admin' && passwordHash === 'sec_no@admin25') {
      return this.patients[0] || null;
    }
    return null;
  }
}
