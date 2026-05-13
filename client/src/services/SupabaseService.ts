/**
 * Supabase implementation of IDBService.
 *
 * Required SQL — run once in Supabase SQL Editor:
 * ─────────────────────────────────────────────────────────────────
 * CREATE TABLE patients (
 *   mrn TEXT PRIMARY KEY, name TEXT NOT NULL, amharic TEXT DEFAULT '',
 *   visit_type TEXT DEFAULT 'OPD', status TEXT DEFAULT 'Waiting',
 *   time TEXT DEFAULT '', registered_at TEXT DEFAULT '',
 *   gender TEXT DEFAULT 'Male', dob TEXT DEFAULT '', phone TEXT DEFAULT '',
 *   city TEXT DEFAULT 'Addis Ababa', woreda TEXT DEFAULT '', kebele TEXT DEFAULT '',
 *   vitals JSONB DEFAULT '[]'
 * );
 *
 * CREATE TABLE staff (
 *   id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, role TEXT DEFAULT '',
 *   shift TEXT DEFAULT 'Day', status TEXT DEFAULT 'On Duty',
 *   education TEXT DEFAULT '', license TEXT DEFAULT '', experience TEXT DEFAULT '',
 *   surgeries JSONB DEFAULT '[]', training JSONB DEFAULT '[]', awards JSONB DEFAULT '[]'
 * );
 *
 * CREATE TABLE assets (
 *   id TEXT PRIMARY KEY, name TEXT NOT NULL, serial TEXT DEFAULT '',
 *   qty INTEGER DEFAULT 1, weight TEXT DEFAULT '', supplier TEXT DEFAULT '',
 *   status TEXT DEFAULT 'Functional', location TEXT DEFAULT '', added_at TEXT DEFAULT '',
 *   rfid_tag TEXT, barcode TEXT, photo_url TEXT
 * );
 *
 * CREATE TABLE patient_users (
 *   patient_mrn TEXT PRIMARY KEY REFERENCES patients(mrn),
 *   password_hash TEXT NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * ─────────────────────────────────────────────────────────────────
 *
 * Migration path to Express + PostgreSQL:
 * Create ApiService implementing the same IDBService interface,
 * then swap the import in services/index.ts — no component changes needed.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { IDBService } from './IDBService';
import type { Patient, StaffMember, Asset, VitalsRecord, MedOrder, Appointment, Drug, Prescription, LabOrder, LabResult, Surgery, GuardianUser } from '../context/EMRContext';
import { initialPatients, initialStaff, initialAssets } from '../data/mockData';

// ── row ↔ type mappers ──────────────────────────────────────────

function rowToAppointment(r: Record<string, unknown>): Appointment {
  return {
    id: r.id as number,
    patientMrn: r.patient_mrn as string,
    doctorId: r.doctor_id as number,
    startTime: r.start_time as string,
    endTime: r.end_time as string,
    status: r.status as 'Scheduled' | 'Cancelled' | 'Completed',
    notes: r.notes as string,
    createdAt: r.created_at as string,
  };
}

function rowToDrug(r: Record<string, unknown>): Drug {
  return {
    id: r.id as number,
    name: r.name as string,
    form: r.form as string,
    strength: r.strength as string,
    stock: r.stock as number,
    price: r.price as string,
    addedAt: r.added_at as string,
  };
}

function rowToPrescription(r: Record<string, unknown>): Prescription {
  return {
    id: r.id as number,
    patientMrn: r.patient_mrn as string,
    patientName: r.patient_name as string,
    drug: r.drug as string,
    dosage: r.dosage as string,
    duration: r.duration as string,
    status: r.status as 'Pending' | 'Dispensed' | 'Cancelled',
    createdAt: r.created_at as string,
  };
}

function rowToLabOrder(r: Record<string, unknown>): LabOrder {
  return {
    id: r.id as number,
    patientMrn: r.patient_mrn as string,
    patientName: r.patient_name as string,
    tests: r.tests as string[],
    priority: r.priority as 'Urgent' | 'Normal',
    status: r.status as 'Pending' | 'Completed',
    createdAt: r.created_at as string,
  };
}

function rowToLabResult(r: Record<string, unknown>): LabResult {
  return {
    id: r.id as number,
    patientMrn: r.patient_mrn as string,
    patientName: r.patient_name as string,
    test: r.test as string,
    value: r.value as string,
    unit: r.unit as string,
    range: r.range as string,
    status: r.status as 'Normal' | 'Abnormal',
    createdAt: r.created_at as string,
  };
}

function rowToSurgery(r: Record<string, unknown>): Surgery {
  return {
    id: r.id as number,
    patientMrn: r.patient_mrn as string,
    patientName: r.patient_name as string,
    operationName: r.operation_name as string,
    surgeonId: r.surgeon_id as number,
    anesthesiaType: r.anesthesia_type as string,
    roomNumber: r.room_number as string,
    startTime: r.start_time as string,
    endTime: r.end_time as string,
    status: r.status as 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled',
    createdAt: r.created_at as string,
  };
}

function rowToGuardian(r: Record<string, unknown>): GuardianUser {
  return {
    id: r.id as string,
    patientMrn: r.patient_mrn as string,
    guardianName: r.guardian_name as string,
    relationship: r.relationship as string,
    phone: r.phone as string,
    passwordHash: r.password_hash as string,
    privacySettings: (r.privacy_settings as GuardianUser['privacySettings']) || {
      showNotes: true,
      showLabs: true,
      showSurgeries: true,
    },
    createdAt: r.created_at as string,
  };
}

function rowToPatient(r: Record<string, unknown>): Patient {
  return {
    mrn: r.mrn as string,
    name: r.name as string,
    amharic: (r.amharic as string) ?? '',
    visitType: (r.visit_type as string) ?? 'OPD',
    status: (r.status as string) ?? 'Waiting',
    time: (r.time as string) ?? '',
    registeredAt: (r.registered_at as string) ?? '',
    gender: (r.gender as string) ?? 'Male',
    dob: (r.dob as string) ?? '',
    phone: (r.phone as string) ?? '',
    city: (r.city as string) ?? '',
    woreda: (r.woreda as string) ?? '',
    kebele: (r.kebele as string) ?? '',
    vitals: (r.vitals as VitalsRecord[]) ?? [],
    medications: (r.medications as MedOrder[]) ?? [],
    ward: (r.ward as string) ?? '',
    photoUrl: (r.photo_url as string) || undefined,
    admissionDate: (r.admission_date as string) || undefined,
    dischargeDate: (r.discharge_date as string) || undefined,
    diagnosisSummary: (r.diagnosis_summary as string) || undefined,
    treatmentPlan: (r.treatment_plan as string[]) ?? [],
  };
}

function patientToRow(p: Patient) {
  return {
    mrn: p.mrn, name: p.name, amharic: p.amharic,
    visit_type: p.visitType, status: p.status, time: p.time,
    registered_at: p.registeredAt, gender: p.gender, dob: p.dob,
    phone: p.phone, city: p.city, woreda: p.woreda, kebele: p.kebele,
    vitals: p.vitals, medications: p.medications, ward: p.ward,
    ...(p.photoUrl !== undefined && { photo_url: p.photoUrl }),
    ...(p.admissionDate !== undefined && { admission_date: p.admissionDate }),
    ...(p.dischargeDate !== undefined && { discharge_date: p.dischargeDate }),
    ...(p.diagnosisSummary !== undefined && { diagnosis_summary: p.diagnosisSummary }),
    ...(p.treatmentPlan !== undefined && { treatment_plan: p.treatmentPlan }),
  };
}

function rowToStaff(r: Record<string, unknown>): StaffMember {
  return {
    id: r.id as number,
    name: r.name as string,
    role: (r.role as string) ?? '',
    specialization: (r.specialization as string) ?? 'General Medicine',
    gender: (r.gender as 'Male' | 'Female') ?? 'Male',
    age: (r.age as number) ?? 35,
    shift: (r.shift as string) ?? 'Day',
    status: (r.status as string) ?? 'On Duty',
    education: (r.education as string) ?? '',
    license: (r.license as string) ?? '',
    experience: (r.experience as string) ?? '',
    surgeries: (r.surgeries as string[]) ?? [],
    training: (r.training as string[]) ?? [],
    awards: (r.awards as string[]) ?? [],
    photoUrl: (r.photo_url as string) || undefined,
  };
}

function rowToAsset(r: Record<string, unknown>): Asset {
  return {
    id: r.id as string,
    name: r.name as string,
    serial: (r.serial as string) ?? '',
    qty: (r.qty as number) ?? 1,
    weight: (r.weight as string) ?? '',
    supplier: (r.supplier as string) ?? '',
    status: (r.status as string) ?? 'Functional',
    location: (r.location as string) ?? '',
    addedAt: (r.added_at as string) ?? '',
    rfidTag: (r.rfid_tag as string) || undefined,
    barcode: (r.barcode as string) || undefined,
    photoUrl: (r.photo_url as string) || undefined,
  };
}

function assetToRow(a: Asset) {
  return {
    id: a.id, name: a.name, serial: a.serial, qty: a.qty,
    weight: a.weight, supplier: a.supplier, status: a.status,
    location: a.location, added_at: a.addedAt,
    ...(a.rfidTag !== undefined && { rfid_tag: a.rfidTag }),
    ...(a.barcode !== undefined && { barcode: a.barcode }),
    ...(a.photoUrl !== undefined && { photo_url: a.photoUrl }),
  };
}

// ── service ────────────────────────────────────────────────────

export class SupabaseService implements IDBService {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  // Seeds tables with demo data on first connection (checks localStorage flag)
  private async seedIfEmpty(): Promise<void> {
    const SEED_KEY = 'mcm_db_seeded_v3';
    if (localStorage.getItem(SEED_KEY)) return;

    // Check if patients exist
    const { count } = await this.client.from('patients').select('*', { count: 'exact', head: true });
    if (count === 0) {
      await this.client.from('patients').insert(initialPatients.map(patientToRow));
    }

    // Check if staff exist
    const { count: staffCount } = await this.client.from('staff').select('*', { count: 'exact', head: true });
    if (staffCount === 0) {
      await this.client.from('staff').insert(initialStaff.map(s => ({
        id: s.id, name: s.name, role: s.role, specialization: s.specialization,
        gender: s.gender, age: s.age, shift: s.shift, status: s.status,
        education: s.education, license: s.license, experience: s.experience,
        surgeries: s.surgeries, training: s.training, awards: s.awards,
        photo_url: s.photoUrl
      })));
    }

    // Check if assets exist
    const { count: assetCount } = await this.client.from('assets').select('*', { count: 'exact', head: true });
    if (assetCount === 0) {
      await this.client.from('assets').insert(initialAssets.map(assetToRow));
    }

    localStorage.setItem(SEED_KEY, 'true');
  }

  async fetchPatients(): Promise<Patient[]> {
    await this.seedIfEmpty();
    const { data, error } = await this.client.from('patients').select('*').order('registered_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToPatient);
  }

  async insertPatient(p: Patient): Promise<void> {
    const { error } = await this.client.from('patients').insert(patientToRow(p));
    if (error) throw new Error(error.message);
  }

  async updatePatient(mrn: string, changes: Partial<Patient>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (changes.status !== undefined) row.status = changes.status;
    if (changes.visitType !== undefined) row.visit_type = changes.visitType;
    if (changes.time !== undefined) row.time = changes.time;
    if (changes.registeredAt !== undefined) row.registered_at = changes.registeredAt;
    if (changes.gender !== undefined) row.gender = changes.gender;
    if (changes.dob !== undefined) row.dob = changes.dob;
    if (changes.phone !== undefined) row.phone = changes.phone;
    if (changes.city !== undefined) row.city = changes.city;
    if (changes.woreda !== undefined) row.woreda = changes.woreda;
    if (changes.kebele !== undefined) row.kebele = changes.kebele;
    if (changes.vitals !== undefined) row.vitals = changes.vitals;
    if (changes.medications !== undefined) row.medications = changes.medications;
    if (changes.ward !== undefined) row.ward = changes.ward;
    if (changes.photoUrl !== undefined) row.photo_url = changes.photoUrl;
    if (changes.admissionDate !== undefined) row.admission_date = changes.admissionDate;
    if (changes.dischargeDate !== undefined) row.discharge_date = changes.dischargeDate;
    if (changes.diagnosisSummary !== undefined) row.diagnosis_summary = changes.diagnosisSummary;
    if (changes.treatmentPlan !== undefined) row.treatment_plan = changes.treatmentPlan;
    const { error } = await this.client.from('patients').update(row).eq('mrn', mrn);
    if (error) throw new Error(error.message);
  }

  async appendVitals(mrn: string, vitals: VitalsRecord): Promise<void> {
    const { data, error: fetchErr } = await this.client
      .from('patients').select('vitals').eq('mrn', mrn).single();
    if (fetchErr) throw new Error(fetchErr.message);
    const updated = [...((data?.vitals as VitalsRecord[]) ?? []), vitals];
    const { error } = await this.client.from('patients').update({ vitals: updated }).eq('mrn', mrn);
    if (error) throw new Error(error.message);
  }

  async fetchStaff(): Promise<StaffMember[]> {
    await this.seedIfEmpty();
    const { data, error } = await this.client.from('staff').select('*').order('id');
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToStaff);
  }

  async insertStaff(s: Omit<StaffMember, 'id'>): Promise<StaffMember> {
    const { data, error } = await this.client
      .from('staff')
      .insert({
        name: s.name, role: s.role, specialization: s.specialization,
        gender: s.gender, age: s.age,
        shift: s.shift, status: s.status,
        education: s.education, license: s.license, experience: s.experience,
        surgeries: s.surgeries, training: s.training, awards: s.awards,
        photo_url: s.photoUrl,
      })
      .select().single();
    if (error) throw new Error(error.message);
    return rowToStaff(data as Record<string, unknown>);
  }

  async fetchAssets(): Promise<Asset[]> {
    await this.seedIfEmpty();
    const { data, error } = await this.client.from('assets').select('*').order('added_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToAsset);
  }

  async insertAsset(a: Asset): Promise<void> {
    const { error } = await this.client.from('assets').insert(assetToRow(a));
    if (error) throw new Error(error.message);
  }

  async updateAsset(id: string, changes: Partial<Asset>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (changes.name !== undefined) row.name = changes.name;
    if (changes.status !== undefined) row.status = changes.status;
    if (changes.location !== undefined) row.location = changes.location;
    if (changes.qty !== undefined) row.qty = changes.qty;
    if (changes.supplier !== undefined) row.supplier = changes.supplier;
    if (changes.addedAt !== undefined) row.added_at = changes.addedAt;
    if (changes.rfidTag !== undefined) row.rfid_tag = changes.rfidTag;
    if (changes.barcode !== undefined) row.barcode = changes.barcode;
    if (changes.photoUrl !== undefined) row.photo_url = changes.photoUrl;
    const { error } = await this.client.from('assets').update(row).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async fetchAppointments(): Promise<Appointment[]> {
    const { data, error } = await this.client.from('appointments').select('*').order('start_time');
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToAppointment);
  }

  async insertAppointment(a: Omit<Appointment, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await this.client.from('appointments').insert({
      patient_mrn: a.patientMrn,
      doctor_id: a.doctorId,
      start_time: a.startTime,
      end_time: a.endTime,
      status: a.status,
      notes: a.notes,
    });
    if (error) throw new Error(error.message);
  }

  async updateAppointment(id: number, changes: Partial<Appointment>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (changes.status !== undefined) row.status = changes.status;
    if (changes.notes !== undefined) row.notes = changes.notes;
    if (changes.startTime !== undefined) row.start_time = changes.startTime;
    if (changes.endTime !== undefined) row.end_time = changes.endTime;
    const { error } = await this.client.from('appointments').update(row).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async matchPatientRecord(name: string, dob: string, phone: string): Promise<Patient | null> {
    const { data, error } = await this.client
      .from('patients')
      .select('*')
      .eq('name', name)
      .eq('dob', dob)
      .eq('phone', phone)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToPatient(data as Record<string, unknown>) : null;
  }

  async registerPortalUser(mrn: string, passwordHash: string): Promise<void> {
    const { error } = await this.client.from('patient_users').insert({
      patient_mrn: mrn,
      password_hash: passwordHash,
    });
    if (error) throw new Error(error.message);
  }

  async loginPortalUser(mrn: string, passwordHash: string): Promise<Patient | null> {
    const { data, error } = await this.client
      .from('patient_users')
      .select('*, patients(*)')
      .eq('patient_mrn', mrn)
      .eq('password_hash', passwordHash)
      .single();
    
    if (error || !data) return null;
    return rowToPatient(data.patients);
  }

  async isPortalUserRegistered(mrn: string): Promise<boolean> {
    const { count, error } = await this.client
      .from('patient_users')
      .select('*', { count: 'exact', head: true })
      .eq('patient_mrn', mrn);
    
    if (error) return false;
    return (count ?? 0) > 0;
  }

  // Pharmacy
  async fetchDrugs(): Promise<Drug[]> {
    const { data, error } = await this.client.from('drugs').select('*').order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToDrug);
  }

  async updateDrugStock(id: number, newStock: number): Promise<void> {
    const { error } = await this.client.from('drugs').update({ stock: newStock }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async fetchPrescriptions(): Promise<Prescription[]> {
    const { data, error } = await this.client.from('prescriptions').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToPrescription);
  }

  async insertPrescription(p: Omit<Prescription, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await this.client.from('prescriptions').insert({
      patient_mrn: p.patientMrn,
      patient_name: p.patientName,
      drug: p.drug,
      dosage: p.dosage,
      duration: p.duration,
      status: p.status,
    });
    if (error) throw new Error(error.message);
  }

  async updatePrescriptionStatus(id: number, status: string): Promise<void> {
    const { error } = await this.client.from('prescriptions').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  // Lab
  async fetchLabOrders(): Promise<LabOrder[]> {
    const { data, error } = await this.client.from('lab_orders').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToLabOrder);
  }

  async fetchLabResults(): Promise<LabResult[]> {
    const { data, error } = await this.client.from('lab_results').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToLabResult);
  }

  async insertLabResult(r: Omit<LabResult, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await this.client.from('lab_results').insert({
      patient_mrn: r.patientMrn,
      patient_name: r.patientName,
      test: r.test,
      value: r.value,
      unit: r.unit,
      range: r.range,
      status: r.status,
    });
    if (error) throw new Error(error.message);
  }

  // Surgery
  async fetchSurgeries(): Promise<Surgery[]> {
    const { data, error } = await this.client.from('surgeries').select('*').order('start_time');
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToSurgery);
  }

  async insertSurgery(s: Omit<Surgery, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await this.client.from('surgeries').insert({
      patient_mrn: s.patientMrn,
      patient_name: s.patientName,
      operation_name: s.operationName,
      surgeon_id: s.surgeonId,
      anesthesia_type: s.anesthesiaType,
      room_number: s.roomNumber,
      start_time: s.startTime,
      end_time: s.endTime,
      status: s.status,
    });
    if (error) throw new Error(error.message);
  }

  async updateSurgery(id: number, changes: Partial<Surgery>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (changes.status !== undefined) row.status = changes.status;
    if (changes.roomNumber !== undefined) row.room_number = changes.roomNumber;
    if (changes.startTime !== undefined) row.start_time = changes.startTime;
    if (changes.endTime !== undefined) row.end_time = changes.endTime;
    const { error } = await this.client.from('surgeries').update(row).eq('id', id);
    if (error) throw new Error(error.message);
  }

  // Guardian
  async fetchGuardians(): Promise<GuardianUser[]> {
    const { data, error } = await this.client.from('guardian_users').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToGuardian);
  }

  async insertGuardian(g: Omit<GuardianUser, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await this.client.from('guardian_users').insert({
      patient_mrn: g.patientMrn,
      guardian_name: g.guardianName,
      relationship: g.relationship,
      phone: g.phone,
      password_hash: g.passwordHash,
      privacy_settings: g.privacySettings,
    });
    if (error) throw new Error(error.message);
  }

  async updateGuardianPrivacy(id: string, settings: GuardianUser['privacySettings']): Promise<void> {
    const { error } = await this.client.from('guardian_users').update({
      privacy_settings: settings,
    }).eq('id', id);
    if (error) throw new Error(error.message);
  }
}
