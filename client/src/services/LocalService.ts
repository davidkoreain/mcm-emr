import type { IDBService } from './IDBService';
import type { Patient, StaffMember, Asset, VitalsRecord, Appointment, Drug, Prescription, LabOrder, LabResult, Surgery, GuardianUser, MedicalHistoryItem, StaffLeave } from '../context/EMRContext';
import { initialPatients, initialStaff, initialAssets } from '../data/mockData';

export class LocalService implements IDBService {
  private patients: Patient[] = [...initialPatients];
  private staff: StaffMember[] = [...initialStaff];
  private assets: Asset[] = [...initialAssets];
  private medicalHistory: MedicalHistoryItem[] = [];
  private drugs: Drug[] = [];
  private prescriptions: Prescription[] = [];
  private labOrders: LabOrder[] = [];
  private labResults: LabResult[] = [];
  private surgeries: Surgery[] = [];

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

  async insertMedicalHistory(item: Omit<MedicalHistoryItem, 'id' | 'createdAt'>): Promise<void> {
    this.medicalHistory.push({ ...item, id: Date.now(), createdAt: new Date().toISOString() } as MedicalHistoryItem);
  }

  async fetchStaff() { return [...this.staff]; }
  async insertStaff(s: Omit<StaffMember, 'id'>): Promise<StaffMember> {
    const n = { ...s, id: Date.now() };
    this.staff.push(n);
    return n;
  }
  async updateStaff(id: number, changes: Partial<StaffMember>) {
    this.staff = this.staff.map(s => s.id === id ? { ...s, ...changes } : s);
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
  async fetchDrugs() { return [...this.drugs]; }
  async insertDrug(d: Omit<Drug, 'id' | 'addedAt'>) {
    this.drugs.push({ ...d, id: Date.now(), addedAt: new Date().toISOString() } as Drug);
  }
  async updateDrugStock(id: number, newStock: number) {
    this.drugs = this.drugs.map(d => d.id === id ? { ...d, stock: newStock } : d);
  }
  async updateDrug(id: number, changes: Partial<Drug>) {
    this.drugs = this.drugs.map(d => d.id === id ? { ...d, ...changes } : d);
  }
  async fetchPrescriptions() { return [...this.prescriptions]; }
  async insertPrescription(p: Omit<Prescription, 'id' | 'createdAt'>) {
    this.prescriptions.push({ ...p, id: Date.now(), createdAt: new Date().toISOString() } as Prescription);
  }
  async updatePrescriptionStatus(id: number, status: string) {
    this.prescriptions = this.prescriptions.map(p => p.id === id ? { ...p, status: status as any } : p);
  }
  async fetchLabOrders() { return [...this.labOrders]; }
  async insertLabOrder(o: Omit<LabOrder, 'id' | 'createdAt'>) {
    this.labOrders.push({ ...o, id: Date.now(), createdAt: new Date().toISOString() } as LabOrder);
  }
  async fetchLabResults() { return [...this.labResults]; }
  async insertLabResult(r: Omit<LabResult, 'id' | 'createdAt'>) {
    this.labResults.push({ ...r, id: Date.now(), createdAt: new Date().toISOString() } as LabResult);
  }
  async updateLabOrderStatus(id: number, status: 'Pending' | 'Completed') {
    this.labOrders = this.labOrders.map(o => o.id === id ? { ...o, status } : o);
  }
  async fetchSurgeries() { return [...this.surgeries]; }
  async insertSurgery(s: Omit<Surgery, 'id' | 'createdAt'>) {
    this.surgeries.push({ ...s, id: Date.now(), createdAt: new Date().toISOString() } as Surgery);
  }
  async updateSurgery(id: number, changes: Partial<Surgery>) {
    this.surgeries = this.surgeries.map(s => s.id === id ? { ...s, ...changes } : s);
  }
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
        licenseNo: '',
        npi: '',
        upin: '',
        taxId: '',
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

  async fetchStaffLeave(): Promise<StaffLeave[]> { return []; }
}
