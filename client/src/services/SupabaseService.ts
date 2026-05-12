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
 *   status TEXT DEFAULT 'Functional', location TEXT DEFAULT '', added_at TEXT DEFAULT ''
 * );
 * ─────────────────────────────────────────────────────────────────
 *
 * Migration path to Express + PostgreSQL:
 * Create ApiService implementing the same IDBService interface,
 * then swap the import in services/index.ts — no component changes needed.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { IDBService } from './IDBService';
import type { Patient, StaffMember, Asset, VitalsRecord, MedOrder } from '../context/EMRContext';
import { initialPatients, initialStaff, initialAssets } from '../context/EMRContext';

// ── row ↔ type mappers ──────────────────────────────────────────

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
  };
}

function rowToStaff(r: Record<string, unknown>): StaffMember {
  return {
    id: r.id as number,
    name: r.name as string,
    role: (r.role as string) ?? '',
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
  };
}

function assetToRow(a: Asset) {
  return {
    id: a.id, name: a.name, serial: a.serial, qty: a.qty,
    weight: a.weight, supplier: a.supplier, status: a.status,
    location: a.location, added_at: a.addedAt,
    ...(a.rfidTag !== undefined && { rfid_tag: a.rfidTag }),
    ...(a.barcode !== undefined && { barcode: a.barcode }),
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
    if (localStorage.getItem('emr_seeded')) return;
    const { count } = await this.client
      .from('patients').select('*', { count: 'exact', head: true });
    if ((count ?? 0) > 0) { localStorage.setItem('emr_seeded', '1'); return; }
    await this.client.from('patients').insert(initialPatients.map(patientToRow));
    await this.client.from('staff').insert(
      initialStaff.map(({ id: _id, ...s }) => ({
        name: s.name, role: s.role, shift: s.shift, status: s.status,
        education: s.education, license: s.license, experience: s.experience,
        surgeries: s.surgeries, training: s.training, awards: s.awards,
      }))
    );
    await this.client.from('assets').insert(initialAssets.map(assetToRow));
    localStorage.setItem('emr_seeded', '1');
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
    const { data, error } = await this.client.from('staff').select('*').order('id');
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToStaff);
  }

  async insertStaff(s: Omit<StaffMember, 'id'>): Promise<StaffMember> {
    const { data, error } = await this.client
      .from('staff')
      .insert({
        name: s.name, role: s.role, shift: s.shift, status: s.status,
        education: s.education, license: s.license, experience: s.experience,
        surgeries: s.surgeries, training: s.training, awards: s.awards,
      })
      .select().single();
    if (error) throw new Error(error.message);
    return rowToStaff(data as Record<string, unknown>);
  }

  async fetchAssets(): Promise<Asset[]> {
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
    const { error } = await this.client.from('assets').update(row).eq('id', id);
    if (error) throw new Error(error.message);
  }
}
