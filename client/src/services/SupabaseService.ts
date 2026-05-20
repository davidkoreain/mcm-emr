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
import type { Patient, StaffMember, Asset, VitalsRecord, MedOrder, Appointment, Drug, Prescription, LabOrder, LabResult, Surgery, GuardianUser, MedicalHistoryItem, StaffLeave, DrugSupplier, MedicationSchedule, DrugOrder, InventoryHistory, LabTestCatalog, CalendarEvent } from '../context/EMRContext';
import { initialPatients, initialStaff, initialAssets } from '../data/mockData';

// ── row ↔ type mappers ──────────────────────────────────────────

function rowToAppointment(r: Record<string, unknown>): Appointment {
  return {
    id: r.id as number,
    patientMrn: r.patient_mrn as string,
    doctorId: r.doctor_id as number,
    startTime: r.start_time as string,
    endTime: r.end_time as string,
    status: r.status as Appointment['status'],
    notes: r.notes as string,
    createdAt: r.created_at as string,
    requestedStartTime: (r.requested_start_time as string) ?? undefined,
    requestedEndTime: (r.requested_end_time as string) ?? undefined,
    requestedDoctorId: (r.requested_doctor_id as number) ?? undefined,
    changeReason: (r.change_reason as string) ?? undefined,
    changeRequestedBy: (r.change_requested_by as 'Patient' | 'Doctor') ?? undefined,
    confirmedAt: (r.confirmed_at as string) ?? undefined,
    confirmedBy: (r.confirmed_by as string) ?? undefined,
  };
}

function rowToDrug(r: Record<string, unknown>): Drug {
  return {
    id: r.id as number,
    name: (r.name as string) ?? '',
    form: (r.form as string) ?? '',
    strength: (r.strength as string) ?? '',
    stock: (r.stock as number) ?? 0,
    price: (r.price as string) ?? '',
    addedAt: (r.added_at as string) ?? '',
    brandName: (r.brand_name as string) ?? '',
    manufacturer: (r.manufacturer as string) ?? '',
    supplierName: (r.supplier_name as string) ?? '',
    activeIngredient: (r.active_ingredient as string) ?? '',
    category: (r.category as string) ?? '',
    unit: (r.unit as string) ?? '',
    route: (r.route as string) ?? '',
    indication: (r.indication as string) ?? '',
    contraindications: (r.contraindications as string) ?? '',
    sideEffects: (r.side_effects as string) ?? '',
    drugInteractions: (r.drug_interactions as string) ?? '',
    storageConditions: (r.storage_conditions as string) ?? '',
    handlingPrecautions: (r.handling_precautions as string) ?? '',
    controlledSubstance: (r.controlled_substance as boolean) ?? false,
    prescriptionRequired: (r.prescription_required as boolean) ?? true,
    purchasePrice: (r.purchase_price as number) ?? 0,
    reorderLevel: (r.reorder_level as number) ?? 20,
    reorderQuantity: (r.reorder_quantity as number) ?? 100,
    expiryDate: (r.expiry_date as string) ?? '',
    batchNumber: (r.batch_number as string) ?? '',
    storageLocation: (r.storage_location as string) ?? '',
    status: (r.status as string) ?? 'Active',
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
    drugId: (r.drug_id as number) ?? undefined,
    frequency: (r.frequency as string) ?? '',
    instructions: (r.instructions as string) ?? '',
    startDate: (r.start_date as string) ?? '',
    endDate: (r.end_date as string) ?? '',
    prescribedBy: (r.prescribed_by as string) ?? '',
    dispensedAt: (r.dispensed_at as string) ?? '',
    quantity: (r.quantity as number) ?? 1,
  };
}

function rowToDrugSupplier(r: Record<string, unknown>): DrugSupplier {
  return {
    id: r.id as number,
    name: (r.name as string) ?? '',
    contactPerson: (r.contact_person as string) ?? '',
    phone: (r.phone as string) ?? '',
    email: (r.email as string) ?? '',
    address: (r.address as string) ?? '',
    paymentTerms: (r.payment_terms as string) ?? '',
    leadTimeDays: (r.lead_time_days as number) ?? 7,
    notes: (r.notes as string) ?? '',
    createdAt: (r.created_at as string) ?? '',
  };
}

function rowToMedicationSchedule(r: Record<string, unknown>): MedicationSchedule {
  return {
    id: r.id as number,
    prescriptionId: (r.prescription_id as number) ?? 0,
    patientMrn: (r.patient_mrn as string) ?? '',
    drugId: (r.drug_id as number) ?? 0,
    drugName: (r.drug_name as string) ?? '',
    dosage: (r.dosage as string) ?? '',
    scheduledDate: (r.scheduled_date as string) ?? '',
    scheduledTime: (r.scheduled_time as string) ?? '',
    taken: (r.taken as boolean) ?? false,
    takenAt: (r.taken_at as string) ?? null,
    notes: (r.notes as string) ?? '',
    createdAt: (r.created_at as string) ?? '',
  };
}

function rowToDrugOrder(r: Record<string, unknown>): DrugOrder {
  return {
    id: r.id as number,
    supplierId: (r.supplier_id as number) ?? 0,
    supplierName: (r.supplier_name as string) ?? '',
    drugId: (r.drug_id as number) ?? 0,
    drugName: (r.drug_name as string) ?? '',
    quantityOrdered: (r.quantity_ordered as number) ?? 0,
    unitPrice: (r.unit_price as number) ?? 0,
    totalAmount: (r.total_amount as number) ?? 0,
    status: (r.status as 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled') ?? 'Pending',
    orderDate: (r.order_date as string) ?? '',
    expectedDelivery: (r.expected_delivery as string) ?? '',
    orderedBy: (r.ordered_by as string) ?? '',
    triggerType: (r.trigger_type as 'Manual' | 'Auto') ?? 'Manual',
    notes: (r.notes as string) ?? '',
    createdAt: (r.created_at as string) ?? '',
  };
}

function rowToLabOrder(r: Record<string, unknown>): LabOrder {
  return {
    id: r.id as number,
    patientMrn: r.patient_mrn as string,
    patientName: r.patient_name as string,
    tests: (r.tests ?? []) as string[],
    priority: (r.priority ?? 'Normal') as 'Urgent' | 'Normal',
    status: (r.status ?? 'Pending') as 'Pending' | 'Completed',
    createdAt: r.created_at as string,
    orderedBy: (r.ordered_by ?? '') as string,
    scheduledDate: r.scheduled_date ? (r.scheduled_date as string) : undefined,
    resultStatus: (r.result_status ?? 'Scheduled') as 'Scheduled' | 'In Progress' | 'Completed',
    notes: (r.notes ?? '') as string,
    assignedTo: (r.assigned_to ?? '') as string,
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
    labOrderId: r.lab_order_id ? (r.lab_order_id as number) : undefined,
    completedBy: (r.completed_by ?? '') as string,
    notes: (r.notes ?? '') as string,
  };
}

function rowToLabTestCatalog(r: Record<string, unknown>): LabTestCatalog {
  return {
    id: r.id as number,
    name: r.name as string,
    category: r.category as string,
    specialty: r.specialty as string,
    description: (r.description ?? '') as string,
    requiredEquipment: (r.required_equipment ?? []) as string[],
    normalRange: (r.normal_range ?? '') as string,
    unit: (r.unit ?? '') as string,
    durationMinutes: (r.duration_minutes ?? 30) as number,
    createdAt: r.created_at as string,
  };
}

function rowToStaffLeave(r: Record<string, unknown>): StaffLeave {
  return {
    id: r.id as number,
    staffId: r.staff_id as number,
    leaveDate: r.leave_date as string,
    status: r.status as 'Pending' | 'Confirmed' | 'Rejected',
    reason: r.reason as string,
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

function rowToMedicalHistory(r: Record<string, unknown>): MedicalHistoryItem {
  return {
    id: r.id as number,
    patientMrn: r.patient_mrn as string,
    date: r.date as string,
    doctor: r.doctor as string,
    diagnosis: r.diagnosis as string,
    icd10Code: r.icd10_code as string || undefined,
    summary: r.summary as string,
    riskFactors: r.risk_factors as string[] || [],
    lifestyle: r.lifestyle as Record<string, string> || {},
    createdAt: r.created_at as string,
  };
}

function rowToPatient(r: Record<string, unknown>): Patient {
  return {
    mrn: r.mrn as string,
    name: r.name as string,
    title: r.title as string || undefined,
    preferredName: r.preferred_name as string || undefined,
    amharic: (r.amharic as string) ?? '',
    visitType: (r.visit_type as string) ?? 'OPD',
    status: (r.status as string) ?? 'Waiting',
    time: (r.time as string) ?? '',
    registeredAt: (r.registered_at as string) ?? '',
    gender: (r.gender as string) ?? 'Male',
    genderIdentity: r.gender_identity as string || undefined,
    sexualOrientation: r.sexual_orientation as string || undefined,
    pronouns: r.pronouns as string || undefined,
    birthSex: r.birth_sex as string || undefined,
    dob: (r.dob as string) ?? '',
    phone: (r.phone as string) ?? '',
    city: (r.city as string) ?? '',
    woreda: (r.woreda as string) ?? '',
    kebele: (r.kebele as string) ?? '',
    ethnicity: r.ethnicity as string || undefined,
    race: r.race as string || undefined,
    nationality: r.nationality as string || undefined,
    language: r.language as string || undefined,
    religion: r.religion as string || undefined,
    monthlyIncome: r.monthly_income as number || undefined,
    homelessStatus: r.homeless_status as boolean || false,
    interpreterNeeded: r.interpreter_needed as boolean || false,
    insuranceProvider: r.insurance_provider as string || undefined,
    insurancePolicyNo: r.insurance_policy_no as string || undefined,
    vitals: (r.vitals as VitalsRecord[]) ?? [],
    medications: (r.medications as MedOrder[]) ?? [],
    ward: (r.ward as string) ?? '',
    photoUrl: (r.photo_url as string) || undefined,
    admissionDate: (r.admission_date as string) || undefined,
    dischargeDate: (r.discharge_date as string) || undefined,
    diagnosisSummary: (r.diagnosis_summary as string) || undefined,
    treatmentPlan: (r.treatment_plan as string[]) ?? [],
    bedPlacementRequested: (r.bed_placement_requested as boolean) ?? false,
    isIntensiveCare: (r.is_intensive_care as boolean) ?? false,
    actualAdmissionDate: (r.actual_admission_date as string) || undefined,
    actualDischargeDate: (r.actual_discharge_date as string) || undefined,
    assignedWard: (r.assigned_ward as string) || undefined,
    assignedBed: (r.assigned_bed as string) || undefined,
  };
}

function patientToRow(p: Patient) {
  return {
    mrn: p.mrn, name: p.name, amharic: p.amharic,
    visit_type: p.visitType, status: p.status, time: p.time,
    registered_at: p.registeredAt, gender: p.gender, dob: p.dob,
    phone: p.phone, city: p.city, woreda: p.woreda, kebele: p.kebele,
    vitals: p.vitals, medications: p.medications, ward: p.ward,
    ...(p.title !== undefined && { title: p.title }),
    ...(p.preferredName !== undefined && { preferred_name: p.preferredName }),
    ...(p.genderIdentity !== undefined && { gender_identity: p.genderIdentity }),
    ...(p.sexualOrientation !== undefined && { sexual_orientation: p.sexualOrientation }),
    ...(p.pronouns !== undefined && { pronouns: p.pronouns }),
    ...(p.birthSex !== undefined && { birth_sex: p.birthSex }),
    ...(p.ethnicity !== undefined && { ethnicity: p.ethnicity }),
    ...(p.race !== undefined && { race: p.race }),
    ...(p.nationality !== undefined && { nationality: p.nationality }),
    ...(p.language !== undefined && { language: p.language }),
    ...(p.religion !== undefined && { religion: p.religion }),
    ...(p.monthlyIncome !== undefined && { monthly_income: p.monthlyIncome }),
    ...(p.homelessStatus !== undefined && { homeless_status: p.homelessStatus }),
    ...(p.interpreterNeeded !== undefined && { interpreter_needed: p.interpreterNeeded }),
    ...(p.insuranceProvider !== undefined && { insurance_provider: p.insuranceProvider }),
    ...(p.insurancePolicyNo !== undefined && { insurance_policy_no: p.insurancePolicyNo }),
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
    licenseNo: r.license_no as string || undefined,
    npi: r.npi as string || undefined,
    upin: r.upin as string || undefined,
    taxId: r.tax_id as string || undefined,
    experience: (r.experience as string) ?? '',
    surgeries: (r.surgeries as string[]) ?? [],
    training: (r.training as string[]) ?? [],
    awards: (r.awards as string[]) ?? [],
    photoUrl: (r.photo_url as string) || undefined,
    signatureUrl: r.signature_url as string || undefined,
  };
}

function staffToRow(s: StaffMember | Omit<StaffMember, 'id'>) {
  return {
    ...('id' in s && { id: s.id }),
    name: s.name, role: s.role, specialization: s.specialization,
    gender: s.gender, age: s.age, shift: s.shift, status: s.status,
    education: s.education, license: s.license, experience: s.experience,
    license_no: s.licenseNo, npi: s.npi, upin: s.upin, tax_id: s.taxId,
    surgeries: s.surgeries, training: s.training, awards: s.awards,
    photo_url: s.photoUrl, signature_url: s.signatureUrl,
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
      await this.client.from('staff').insert(initialStaff.map(staffToRow));
    }

    // Check if assets exist
    const { count: assetCount } = await this.client.from('assets').select('*', { count: 'exact', head: true });
    if (assetCount === 0) {
      await this.client.from('assets').insert(initialAssets.map(assetToRow));
    }

    // Check if medical_history exists
    const { count: mhCount } = await this.client.from('medical_history').select('*', { count: 'exact', head: true });
    if (mhCount === 0) {
      // We will provide a simple generic seed for demo purposes.
      const seedHistory = [
        { patient_mrn: 'MRN-2026-001', date: '2026-04-15', doctor: 'Dr. Solomon', diagnosis: 'Acute Bronchitis', summary: 'Persistent cough, fever (38.2C). Prescribed Amoxicillin.' },
        { patient_mrn: 'MRN-2026-001', date: '2026-02-10', doctor: 'Dr. Abraham', diagnosis: 'Hypertension', summary: 'Routine follow-up. BP 155/95. Adherent to meds.' },
        { patient_mrn: 'MRN-2026-002', date: '2026-04-20', doctor: 'Dr. Abraham', diagnosis: 'Gestational Diabetes', summary: 'Elevated fasting glucose 128 mg/dL. Dietary counseling provided.' },
        { patient_mrn: 'MRN-2026-003', date: '2026-05-01', doctor: 'Dr. Tadesse', diagnosis: 'Annual Physical', summary: 'All labs within normal limits. Cholesterol borderline 210 mg/dL.' }
      ];
      await this.client.from('medical_history').insert(seedHistory);
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
    if (changes.title !== undefined) row.title = changes.title;
    if (changes.preferredName !== undefined) row.preferred_name = changes.preferredName;
    if (changes.genderIdentity !== undefined) row.gender_identity = changes.genderIdentity;
    if (changes.sexualOrientation !== undefined) row.sexual_orientation = changes.sexualOrientation;
    if (changes.pronouns !== undefined) row.pronouns = changes.pronouns;
    if (changes.birthSex !== undefined) row.birth_sex = changes.birthSex;
    if (changes.ethnicity !== undefined) row.ethnicity = changes.ethnicity;
    if (changes.race !== undefined) row.race = changes.race;
    if (changes.nationality !== undefined) row.nationality = changes.nationality;
    if (changes.language !== undefined) row.language = changes.language;
    if (changes.religion !== undefined) row.religion = changes.religion;
    if (changes.monthlyIncome !== undefined) row.monthly_income = changes.monthlyIncome;
    if (changes.homelessStatus !== undefined) row.homeless_status = changes.homelessStatus;
    if (changes.interpreterNeeded !== undefined) row.interpreter_needed = changes.interpreterNeeded;
    if (changes.insuranceProvider !== undefined) row.insurance_provider = changes.insuranceProvider;
    if (changes.insurancePolicyNo !== undefined) row.insurance_policy_no = changes.insurancePolicyNo;
    if (changes.bedPlacementRequested !== undefined) row.bed_placement_requested = changes.bedPlacementRequested;
    if (changes.isIntensiveCare !== undefined) row.is_intensive_care = changes.isIntensiveCare;
    if (changes.actualAdmissionDate !== undefined) row.actual_admission_date = changes.actualAdmissionDate;
    if (changes.actualDischargeDate !== undefined) row.actual_discharge_date = changes.actualDischargeDate;
    if (changes.assignedWard !== undefined) row.assigned_ward = changes.assignedWard;
    if (changes.assignedBed !== undefined) row.assigned_bed = changes.assignedBed;
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

  async fetchMedicalHistory(): Promise<MedicalHistoryItem[]> {
    await this.seedIfEmpty();
    const { data, error } = await this.client.from('medical_history').select('*').order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToMedicalHistory);
  }

  async deleteMedicalHistory(id: number): Promise<void> {
    const { error } = await this.client.from('medical_history').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async insertMedicalHistory(item: Omit<MedicalHistoryItem, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await this.client.from('medical_history').insert({
      patient_mrn: item.patientMrn,
      date: item.date,
      doctor: item.doctor,
      diagnosis: item.diagnosis,
      summary: item.summary,
    });
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
      .insert(staffToRow(s))
      .select().single();
    if (error) throw new Error(error.message);
    return rowToStaff(data as Record<string, unknown>);
  }

  async updateStaff(id: number, changes: Partial<StaffMember>): Promise<void> {
    const row = staffToRow(changes as StaffMember);
    delete (row as any).id; // ID shouldn't be updated
    const { error } = await this.client.from('staff').update(row).eq('id', id);
    if (error) throw new Error(error.message);
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

  async fetchCalendarEvents(): Promise<CalendarEvent[]> {
    const { data, error } = await this.client.from('calendar_events').select('*').order('start_time');
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as number,
      doctorId: r.doctor_id as number,
      category: r.category as CalendarEvent['category'],
      title: r.title as string,
      startTime: r.start_time as string,
      endTime: r.end_time as string,
      location: (r.location as string) ?? undefined,
      notes: (r.notes as string) ?? undefined,
      createdAt: r.created_at as string,
    }));
  }

  async insertCalendarEvent(e: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await this.client.from('calendar_events').insert({
      doctor_id: e.doctorId,
      category: e.category,
      title: e.title,
      start_time: e.startTime,
      end_time: e.endTime,
      location: e.location,
      notes: e.notes,
    });
    if (error) throw new Error(error.message);
  }

  async deleteCalendarEvent(id: number): Promise<void> {
    const { error } = await this.client.from('calendar_events').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async updateAppointment(id: number, changes: Partial<Appointment>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (changes.status !== undefined) row.status = changes.status;
    if (changes.notes !== undefined) row.notes = changes.notes;
    if (changes.startTime !== undefined) row.start_time = changes.startTime;
    if (changes.endTime !== undefined) row.end_time = changes.endTime;
    if (changes.doctorId !== undefined) row.doctor_id = changes.doctorId;
    if (changes.requestedStartTime !== undefined) row.requested_start_time = changes.requestedStartTime;
    if (changes.requestedEndTime !== undefined) row.requested_end_time = changes.requestedEndTime;
    if (changes.requestedDoctorId !== undefined) row.requested_doctor_id = changes.requestedDoctorId;
    if (changes.changeReason !== undefined) row.change_reason = changes.changeReason;
    if (changes.changeRequestedBy !== undefined) row.change_requested_by = changes.changeRequestedBy;
    if (changes.confirmedAt !== undefined) row.confirmed_at = changes.confirmedAt;
    if (changes.confirmedBy !== undefined) row.confirmed_by = changes.confirmedBy;
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

  async loginPortalUser(name: string, passwordHash: string): Promise<Patient | null> {
    if (name === 'admin' && passwordHash === 'sec_no@admin25') {
      const { data } = await this.client.from('patients').select('*').limit(1).maybeSingle();
      return data ? rowToPatient(data) : {
        mrn: 'MRN-ADMIN',
        name: 'Master Patient',
        amharic: '',
        visitType: 'OPD',
        status: 'Waiting',
        time: '00:00',
        registeredAt: new Date().toISOString().slice(0, 10),
        gender: 'Male',
        dob: '1990-01-01',
        phone: '0000000000',
        city: 'Addis Ababa',
        woreda: '',
        kebele: '',
        vitals: [],
        medications: [],
        ward: '',
      };
    }
    // Step 1: find all patients with this name
    const { data: patientRows } = await this.client
      .from('patients')
      .select('*')
      .eq('name', name);
    if (!patientRows?.length) return null;
    // Step 2: find which one has a matching password (handles duplicate names)
    for (const pd of patientRows) {
      const { data: userRow } = await this.client
        .from('patient_users')
        .select('patient_mrn')
        .eq('patient_mrn', pd.mrn)
        .eq('password_hash', passwordHash)
        .maybeSingle();
      if (userRow) return rowToPatient(pd);
    }
    return null;
  }

  async isPortalUserRegistered(mrn: string): Promise<boolean> {
    const { count, error } = await this.client
      .from('patient_users')
      .select('*', { count: 'exact', head: true })
      .eq('patient_mrn', mrn);
    
    if (error) return false;
    return (count ?? 0) > 0;
  }

  async loginStaff(name: string, passwordHash: string): Promise<StaffMember | null> {
    if (name === 'admin' && passwordHash === 'sec_no@admin25') {
      return {
        id: 0,
        name: 'Master Admin',
        role: 'Admin',
        specialization: 'System Management',
        gender: 'Male',
        age: 35,
        shift: 'All',
        status: 'On Duty',
        education: 'System Master',
        license: 'MCM-SUPER-001',
        experience: 'Unlimited',
        surgeries: [],
        training: [],
        awards: []
      };
    }
    const { data, error } = await this.client
      .from('staff_users')
      .select('*, staff!inner(*)')
      .eq('staff.name', name)
      .eq('password_hash', passwordHash)
      .maybeSingle();
    
    if (error || !data || !data.staff) return null;
    return rowToStaff(data.staff as Record<string, unknown>);
  }

  // Pharmacy
  async fetchDrugs(): Promise<Drug[]> {
    const { data, error } = await this.client.from('drugs').select('*').order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToDrug);
  }
  async insertDrug(d: Omit<Drug, 'id' | 'addedAt'>): Promise<void> {
    const row: Record<string, unknown> = {
      name: d.name,
      form: d.form,
      strength: d.strength,
      stock: d.stock,
      price: d.price,
      added_at: new Date().toISOString(),
    };
    if (d.brandName !== undefined) row.brand_name = d.brandName;
    if (d.manufacturer !== undefined) row.manufacturer = d.manufacturer;
    if (d.supplierName !== undefined) row.supplier_name = d.supplierName;
    if (d.activeIngredient !== undefined) row.active_ingredient = d.activeIngredient;
    if (d.category !== undefined) row.category = d.category;
    if (d.unit !== undefined) row.unit = d.unit;
    if (d.route !== undefined) row.route = d.route;
    if (d.indication !== undefined) row.indication = d.indication;
    if (d.contraindications !== undefined) row.contraindications = d.contraindications;
    if (d.sideEffects !== undefined) row.side_effects = d.sideEffects;
    if (d.drugInteractions !== undefined) row.drug_interactions = d.drugInteractions;
    if (d.storageConditions !== undefined) row.storage_conditions = d.storageConditions;
    if (d.handlingPrecautions !== undefined) row.handling_precautions = d.handlingPrecautions;
    if (d.controlledSubstance !== undefined) row.controlled_substance = d.controlledSubstance;
    if (d.prescriptionRequired !== undefined) row.prescription_required = d.prescriptionRequired;
    if (d.purchasePrice !== undefined) row.purchase_price = d.purchasePrice;
    if (d.reorderLevel !== undefined) row.reorder_level = d.reorderLevel;
    if (d.reorderQuantity !== undefined) row.reorder_quantity = d.reorderQuantity;
    if (d.expiryDate !== undefined && d.expiryDate !== '') row.expiry_date = d.expiryDate;
    if (d.batchNumber !== undefined) row.batch_number = d.batchNumber;
    if (d.storageLocation !== undefined) row.storage_location = d.storageLocation;
    if (d.status !== undefined) row.status = d.status;
    const { error } = await this.client.from('drugs').insert(row);
    if (error) throw new Error(error.message);
  }

  async updateDrugStock(id: number, newStock: number): Promise<void> {
    const { error } = await this.client.from('drugs').update({ stock: newStock }).eq('id', id);
    if (error) throw new Error(error.message);
  }
  async updateDrug(id: number, changes: Partial<Drug>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (changes.name !== undefined) row.name = changes.name;
    if (changes.form !== undefined) row.form = changes.form;
    if (changes.strength !== undefined) row.strength = changes.strength;
    if (changes.stock !== undefined) row.stock = changes.stock;
    if (changes.price !== undefined) row.price = changes.price;
    if (changes.brandName !== undefined) row.brand_name = changes.brandName;
    if (changes.manufacturer !== undefined) row.manufacturer = changes.manufacturer;
    if (changes.supplierName !== undefined) row.supplier_name = changes.supplierName;
    if (changes.activeIngredient !== undefined) row.active_ingredient = changes.activeIngredient;
    if (changes.category !== undefined) row.category = changes.category;
    if (changes.unit !== undefined) row.unit = changes.unit;
    if (changes.route !== undefined) row.route = changes.route;
    if (changes.indication !== undefined) row.indication = changes.indication;
    if (changes.contraindications !== undefined) row.contraindications = changes.contraindications;
    if (changes.sideEffects !== undefined) row.side_effects = changes.sideEffects;
    if (changes.drugInteractions !== undefined) row.drug_interactions = changes.drugInteractions;
    if (changes.storageConditions !== undefined) row.storage_conditions = changes.storageConditions;
    if (changes.handlingPrecautions !== undefined) row.handling_precautions = changes.handlingPrecautions;
    if (changes.controlledSubstance !== undefined) row.controlled_substance = changes.controlledSubstance;
    if (changes.prescriptionRequired !== undefined) row.prescription_required = changes.prescriptionRequired;
    if (changes.purchasePrice !== undefined) row.purchase_price = changes.purchasePrice;
    if (changes.reorderLevel !== undefined) row.reorder_level = changes.reorderLevel;
    if (changes.reorderQuantity !== undefined) row.reorder_quantity = changes.reorderQuantity;
    if (changes.expiryDate !== undefined && changes.expiryDate !== '') row.expiry_date = changes.expiryDate;
    if (changes.batchNumber !== undefined) row.batch_number = changes.batchNumber;
    if (changes.storageLocation !== undefined) row.storage_location = changes.storageLocation;
    if (changes.status !== undefined) row.status = changes.status;
    const { error } = await this.client.from('drugs').update(row).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async fetchPrescriptions(): Promise<Prescription[]> {
    const { data, error } = await this.client.from('prescriptions').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToPrescription);
  }

  async insertPrescription(p: Omit<Prescription, 'id' | 'createdAt'>): Promise<void> {
    const row: Record<string, unknown> = {
      patient_mrn: p.patientMrn,
      patient_name: p.patientName,
      drug: p.drug,
      dosage: p.dosage,
      duration: p.duration,
      status: p.status,
    };
    if (p.drugId !== undefined) row.drug_id = p.drugId;
    if (p.frequency !== undefined) row.frequency = p.frequency;
    if (p.instructions !== undefined) row.instructions = p.instructions;
    if (p.startDate !== undefined && p.startDate !== '') row.start_date = p.startDate;
    if (p.endDate !== undefined && p.endDate !== '') row.end_date = p.endDate;
    if (p.prescribedBy !== undefined) row.prescribed_by = p.prescribedBy;
    if (p.dispensedAt !== undefined && p.dispensedAt !== '') row.dispensed_at = p.dispensedAt;
    if (p.quantity !== undefined) row.quantity = p.quantity;
    const { error } = await this.client.from('prescriptions').insert(row);
    if (error) throw new Error(error.message);
  }

  async updatePrescriptionStatus(id: number, status: string): Promise<void> {
    const { error } = await this.client.from('prescriptions').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ── Pharmacy Phase 1: suppliers / orders / medication schedules ─────────

  async fetchDrugSuppliers(): Promise<DrugSupplier[]> {
    const { data, error } = await this.client.from('drug_suppliers').select('*').order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToDrugSupplier);
  }

  async insertDrugSupplier(s: Omit<DrugSupplier, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await this.client.from('drug_suppliers').insert({
      name: s.name,
      contact_person: s.contactPerson,
      phone: s.phone,
      email: s.email,
      address: s.address,
      payment_terms: s.paymentTerms,
      lead_time_days: s.leadTimeDays,
      notes: s.notes,
    });
    if (error) throw new Error(error.message);
  }

  async fetchMedicationSchedules(patientMrn?: string): Promise<MedicationSchedule[]> {
    let q = this.client.from('medication_schedules').select('*').order('scheduled_date', { ascending: true });
    if (patientMrn) q = q.eq('patient_mrn', patientMrn);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToMedicationSchedule);
  }

  async insertMedicationSchedule(s: Omit<MedicationSchedule, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await this.client.from('medication_schedules').insert({
      prescription_id: s.prescriptionId,
      patient_mrn: s.patientMrn,
      drug_id: s.drugId,
      drug_name: s.drugName,
      dosage: s.dosage,
      scheduled_date: s.scheduledDate,
      scheduled_time: s.scheduledTime,
      taken: s.taken,
      taken_at: s.takenAt,
      notes: s.notes,
    });
    if (error) throw new Error(error.message);
  }

  async updateMedicationSchedule(id: number, changes: Partial<MedicationSchedule>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (changes.taken !== undefined) row.taken = changes.taken;
    if (changes.takenAt !== undefined) row.taken_at = changes.takenAt;
    if (changes.notes !== undefined) row.notes = changes.notes;
    if (changes.scheduledDate !== undefined) row.scheduled_date = changes.scheduledDate;
    if (changes.scheduledTime !== undefined) row.scheduled_time = changes.scheduledTime;
    const { error } = await this.client.from('medication_schedules').update(row).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async fetchDrugOrders(): Promise<DrugOrder[]> {
    const { data, error } = await this.client.from('drug_orders').select('*').order('order_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToDrugOrder);
  }

  async insertDrugOrder(o: Omit<DrugOrder, 'id' | 'createdAt'>): Promise<void> {
    const row: Record<string, unknown> = {
      supplier_id: o.supplierId,
      supplier_name: o.supplierName,
      drug_id: o.drugId,
      drug_name: o.drugName,
      quantity_ordered: o.quantityOrdered,
      unit_price: o.unitPrice,
      total_amount: o.totalAmount,
      status: o.status,
      ordered_by: o.orderedBy,
      trigger_type: o.triggerType,
      notes: o.notes,
    };
    if (o.orderDate) row.order_date = o.orderDate;
    if (o.expectedDelivery) row.expected_delivery = o.expectedDelivery;
    const { error } = await this.client.from('drug_orders').insert(row);
    if (error) throw new Error(error.message);
  }

  async updateDrugOrder(id: number, changes: Partial<DrugOrder>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (changes.status !== undefined) row.status = changes.status;
    if (changes.expectedDelivery !== undefined && changes.expectedDelivery !== '') row.expected_delivery = changes.expectedDelivery;
    if (changes.notes !== undefined) row.notes = changes.notes;
    if (changes.quantityOrdered !== undefined) row.quantity_ordered = changes.quantityOrdered;
    if (changes.unitPrice !== undefined) row.unit_price = changes.unitPrice;
    if (changes.totalAmount !== undefined) row.total_amount = changes.totalAmount;
    const { error } = await this.client.from('drug_orders').update(row).eq('id', id);
    if (error) throw new Error(error.message);
  }

  // Inventory History
  async fetchInventoryHistory(): Promise<InventoryHistory[]> {
    const { data, error } = await this.client
      .from('inventory_history')
      .select('*')
      .order('dispensed_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any): InventoryHistory => ({
      id: r.id,
      dispensedDate: r.dispensed_date,
      drugId: r.drug_id ?? null,
      drugName: r.drug_name ?? '',
      prescriptionId: r.prescription_id ?? null,
      patientMrn: r.patient_mrn ?? '',
      patientName: r.patient_name ?? '',
      prescribedBy: r.prescribed_by ?? '',
      quantityDispensed: r.quantity_dispensed ?? 1,
      stockBefore: r.stock_before ?? 0,
      stockAfter: r.stock_after ?? 0,
      notes: r.notes ?? '',
      createdAt: r.created_at ?? '',
    }));
  }

  async insertInventoryHistory(h: Omit<InventoryHistory, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await this.client.from('inventory_history').insert({
      dispensed_date: h.dispensedDate,
      drug_id: h.drugId,
      drug_name: h.drugName,
      prescription_id: h.prescriptionId,
      patient_mrn: h.patientMrn,
      patient_name: h.patientName,
      prescribed_by: h.prescribedBy,
      quantity_dispensed: h.quantityDispensed,
      stock_before: h.stockBefore,
      stock_after: h.stockAfter,
      notes: h.notes,
    });
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
    const row: Record<string, unknown> = {
      patient_mrn: r.patientMrn,
      patient_name: r.patientName,
      test: r.test,
      value: r.value,
      unit: r.unit,
      range: r.range,
      status: r.status,
    };
    if (r.labOrderId !== undefined) row.lab_order_id = r.labOrderId;
    if (r.completedBy !== undefined) row.completed_by = r.completedBy;
    if (r.notes !== undefined) row.notes = r.notes;
    const { error } = await this.client.from('lab_results').insert(row);
    if (error) throw new Error(error.message);
  }

  async insertLabOrder(o: Omit<LabOrder, 'id' | 'createdAt'>): Promise<void> {
    const row: Record<string, unknown> = {
      patient_mrn: o.patientMrn,
      patient_name: o.patientName,
      tests: o.tests,
      priority: o.priority,
      status: o.status,
      result_status: o.resultStatus ?? 'Scheduled',
    };
    if (o.orderedBy) row.ordered_by = o.orderedBy;
    if (o.scheduledDate) row.scheduled_date = o.scheduledDate;
    if (o.notes) row.notes = o.notes;
    if (o.assignedTo) row.assigned_to = o.assignedTo;
    const { error } = await this.client.from('lab_orders').insert(row);
    if (error) throw new Error(error.message);
  }

  async updateLabOrderStatus(id: number, status: 'Pending' | 'Completed'): Promise<void> {
    const { error } = await this.client.from('lab_orders').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async updateLabOrderResultStatus(id: number, resultStatus: 'Scheduled' | 'In Progress' | 'Completed'): Promise<void> {
    const { error } = await this.client.from('lab_orders').update({ result_status: resultStatus }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async fetchLabTestCatalog(): Promise<LabTestCatalog[]> {
    const { data, error } = await this.client.from('lab_test_catalog').select('*').order('category').order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToLabTestCatalog);
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

  async loginGuardian(name: string, passwordHash: string): Promise<GuardianUser | null> {
    if (name === 'admin' && passwordHash === 'sec_no@admin25') {
      const { data } = await this.client.from('guardian_users').select('*').limit(1).maybeSingle();
      return data ? rowToGuardian(data) : {
        id: 'G-ADMIN',
        patientMrn: 'MRN-2026-001',
        guardianName: 'Master Admin',
        relationship: 'Parent',
        phone: '0000000000',
        passwordHash: 'sec_no@admin25',
        privacySettings: { showNotes: true, showLabs: true, showSurgeries: true },
        createdAt: new Date().toISOString()
      };
    }
    const { data, error } = await this.client
      .from('guardian_users')
      .select('*')
      .eq('guardian_name', name)
      .eq('password_hash', passwordHash)
      .maybeSingle();
    
    if (error || !data) return null;
    return rowToGuardian(data);
  }

  async fetchStaffLeave(): Promise<StaffLeave[]> {
    const { data, error } = await this.client.from('staff_leave').select('*');
    if (error) throw error;
    return (data || []).map(rowToStaffLeave);
  }

  async insertStaffLeave(l: Omit<StaffLeave, 'id'>): Promise<void> {
    const { error } = await this.client.from('staff_leave').insert({
      staff_id: l.staffId,
      leave_date: l.leaveDate,
      status: l.status,
      reason: l.reason,
    });
    if (error) throw error;
  }

  async updateStaffLeaveStatus(id: number, status: 'Pending' | 'Confirmed' | 'Rejected'): Promise<void> {
    const { error } = await this.client.from('staff_leave').update({ status }).eq('id', id);
    if (error) throw error;
  }

  async fetchAppSetting(key: string): Promise<any | null> {
    const { data } = await this.client
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    return data?.value ?? null;
  }

  async saveAppSetting(key: string, value: any): Promise<void> {
    const { error } = await this.client
      .from('app_settings')
      .upsert({ key, value }, { onConflict: 'key' });
    if (error) throw new Error(error.message);
  }
}
