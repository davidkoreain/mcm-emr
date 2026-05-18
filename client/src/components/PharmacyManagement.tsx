import React, { useState, useMemo } from 'react';
import {
  Pill, ClipboardList, AlertTriangle, Plus, X, CheckCircle2, Eye, Edit2, RefreshCw,
  Search, Calendar, Package, ShieldAlert, BadgeCheck, FileText, Beaker,
  Users, Clock, XCircle, User, Hash, ChevronLeft, ChevronRight, LayoutGrid, List
} from 'lucide-react';
import CSVImportModal from './CSVImportModal';
import { useEMR, type Drug, type Prescription } from '../context/EMRContext';
import { usePageAdjustments } from '../hooks/usePageAdjustments';
import { useViewMode } from '../hooks/useViewMode';

// Simple toast shim (matches existing pattern in this file)
const toast = { success: (m: string) => alert(m), error: (m: string) => alert(m) };

// --- Constants ----------------------------------------------------------
const CATEGORIES: string[] = [
  'Analgesic', 'Antibiotic', 'Antihypertensive', 'Antidiabetic', 'Antimalarial',
  'Antiretroviral', 'Anti-TB', 'Antifungal', 'Antiparasitic', 'Cardiovascular',
  'Respiratory', 'Gastrointestinal', 'Neurological', 'Vitamins/Supplements',
  'Hormonal', 'Ophthalmology', 'Controlled Substance'
];

const FORMS: string[] = [
  'Tablet', 'Capsule', 'Injection', 'Syrup', 'Suspension', 'Inhaler',
  'Eye Drops', 'Ointment', 'Cream', 'Sachet', 'Suppository'
];

const ROUTES: string[] = [
  'Oral', 'IV', 'IM', 'IV/IM', 'IV/IM/SC', 'Subcutaneous', 'Inhalation',
  'Topical', 'Ophthalmic', 'Rectal', 'Sublingual'
];

const STATUSES: string[] = ['Active', 'Discontinued', 'Recalled'];

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  Analgesic: { bg: '#dbeafe', fg: '#1d4ed8' },
  Antibiotic: { bg: '#dcfce7', fg: '#166534' },
  Antihypertensive: { bg: '#fef3c7', fg: '#92400e' },
  Antidiabetic: { bg: '#fce7f3', fg: '#9d174d' },
  Antimalarial: { bg: '#fee2e2', fg: '#991b1b' },
  Antiretroviral: { bg: '#ede9fe', fg: '#5b21b6' },
  'Anti-TB': { bg: '#fef9c3', fg: '#854d0e' },
  Antifungal: { bg: '#cffafe', fg: '#155e75' },
  Antiparasitic: { bg: '#e0e7ff', fg: '#3730a3' },
  Cardiovascular: { bg: '#fee2e2', fg: '#b91c1c' },
  Respiratory: { bg: '#e0f2fe', fg: '#0369a1' },
  Gastrointestinal: { bg: '#f1f5f9', fg: '#334155' },
  Neurological: { bg: '#f3e8ff', fg: '#6b21a8' },
  'Vitamins/Supplements': { bg: '#ecfccb', fg: '#3f6212' },
  Hormonal: { bg: '#fde2e7', fg: '#9f1239' },
  Ophthalmology: { bg: '#d1fae5', fg: '#065f46' },
  'Controlled Substance': { bg: '#1e293b', fg: '#fbbf24' },
};

// --- Helpers ------------------------------------------------------------
const daysUntil = (iso?: string): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
};

const stockColor = (d: Drug): string => {
  const r = d.reorderLevel ?? 20;
  if (d.stock < 10) return '#dc2626';
  if (d.stock < r) return '#ea580c';
  return '#16a34a';
};

const expiryColor = (iso?: string): string | null => {
  const days = daysUntil(iso);
  if (days === null) return null;
  if (days <= 30) return '#dc2626';
  if (days <= 90) return '#ea580c';
  return '#64748b';
};

// --- Form state types ---------------------------------------------------
type DrugFormState = {
  name: string;
  brandName: string;
  manufacturer: string;
  supplierName: string;
  activeIngredient: string;
  category: string;
  form: string;
  strength: string;
  unit: string;
  route: string;
  indication: string;
  contraindications: string;
  sideEffects: string;
  drugInteractions: string;
  storageConditions: string;
  storageLocation: string;
  handlingPrecautions: string;
  controlledSubstance: boolean;
  prescriptionRequired: boolean;
  stock: string;
  purchasePrice: string;
  price: string;
  reorderLevel: string;
  reorderQuantity: string;
  expiryDate: string;
  batchNumber: string;
  status: string;
};

const emptyForm: DrugFormState = {
  name: '', brandName: '', manufacturer: '', supplierName: '', activeIngredient: '',
  category: 'Analgesic', form: 'Tablet', strength: '', unit: 'tablet', route: 'Oral',
  indication: '', contraindications: '', sideEffects: '', drugInteractions: '',
  storageConditions: 'Below 25C; dry', storageLocation: '', handlingPrecautions: '',
  controlledSubstance: false, prescriptionRequired: true,
  stock: '0', purchasePrice: '0', price: '', reorderLevel: '20', reorderQuantity: '100',
  expiryDate: '', batchNumber: '', status: 'Active'
};

const drugToForm = (d: Drug): DrugFormState => ({
  name: d.name || '',
  brandName: d.brandName || '',
  manufacturer: d.manufacturer || '',
  supplierName: d.supplierName || '',
  activeIngredient: d.activeIngredient || '',
  category: d.category || 'Analgesic',
  form: d.form || 'Tablet',
  strength: d.strength || '',
  unit: d.unit || 'tablet',
  route: d.route || 'Oral',
  indication: d.indication || '',
  contraindications: d.contraindications || '',
  sideEffects: d.sideEffects || '',
  drugInteractions: d.drugInteractions || '',
  storageConditions: d.storageConditions || '',
  storageLocation: d.storageLocation || '',
  handlingPrecautions: d.handlingPrecautions || '',
  controlledSubstance: !!d.controlledSubstance,
  prescriptionRequired: d.prescriptionRequired !== false,
  stock: String(d.stock ?? 0),
  purchasePrice: String(d.purchasePrice ?? 0),
  price: d.price || '',
  reorderLevel: String(d.reorderLevel ?? 20),
  reorderQuantity: String(d.reorderQuantity ?? 100),
  expiryDate: d.expiryDate || '',
  batchNumber: d.batchNumber || '',
  status: d.status || 'Active',
});

// --- Prescription form state -------------------------------------------
const FREQUENCIES = ['OD', 'BD', 'TDS', 'QDS', 'PRN', 'Stat', 'Weekly', 'Monthly'] as const;
const DURATION_UNITS = ['days', 'weeks', 'months'] as const;

type RxFormState = {
  patientMrn: string;
  patientName: string;
  drug: string;
  drugId: number | undefined;
  dosage: string;
  frequency: string;
  durationValue: string;
  durationUnit: string;
  quantity: string;
  instructions: string;
  startDate: string;
  prescribedBy: string;
};

const emptyRxForm: RxFormState = {
  patientMrn: '', patientName: '', drug: '', drugId: undefined,
  dosage: '', frequency: 'OD', durationValue: '7', durationUnit: 'days',
  quantity: '7', instructions: '', startDate: new Date().toISOString().slice(0, 10), prescribedBy: '',
};

const freqPerDay: Record<string, number> = {
  OD: 1, BD: 2, TDS: 3, QDS: 4, Weekly: 1 / 7, Monthly: 1 / 30, PRN: 0, Stat: 1,
};

const calcQty = (freq: string, durVal: string, durUnit: string): string => {
  const f = freqPerDay[freq];
  if (!f || freq === 'PRN') return '';
  const days = durUnit === 'weeks' ? Number(durVal) * 7 : durUnit === 'months' ? Number(durVal) * 30 : Number(durVal);
  return String(Math.ceil(f * days));
};

const formToDrug = (f: DrugFormState): Omit<Drug, 'id' | 'addedAt'> => ({
  name: f.name.trim(),
  form: f.form,
  strength: f.strength,
  stock: parseInt(f.stock, 10) || 0,
  price: f.price,
  brandName: f.brandName,
  manufacturer: f.manufacturer,
  supplierName: f.supplierName,
  activeIngredient: f.activeIngredient,
  category: f.category,
  unit: f.unit,
  route: f.route,
  indication: f.indication,
  contraindications: f.contraindications,
  sideEffects: f.sideEffects,
  drugInteractions: f.drugInteractions,
  storageConditions: f.storageConditions,
  storageLocation: f.storageLocation,
  handlingPrecautions: f.handlingPrecautions,
  controlledSubstance: f.controlledSubstance,
  prescriptionRequired: f.prescriptionRequired,
  purchasePrice: parseFloat(f.purchasePrice) || 0,
  reorderLevel: parseInt(f.reorderLevel, 10) || 20,
  reorderQuantity: parseInt(f.reorderQuantity, 10) || 100,
  expiryDate: f.expiryDate,
  batchNumber: f.batchNumber,
  status: f.status,
});

// --- Reusable presentational sub-components -----------------------------
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0',
  borderRadius: '0.5rem', fontSize: '0.875rem', color: '#1e293b', background: 'white',
};
const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.3rem',
};

const Field: React.FC<{ label: string; children: React.ReactNode; full?: boolean }> = ({ label, children, full }) => (
  <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

const Pill_Badge: React.FC<{ color?: string; bg?: string; children: React.ReactNode; title?: string }> = ({ color = '#1e293b', bg = '#f1f5f9', children, title }) => (
  <span title={title} style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem',
    fontWeight: 600, background: bg, color, whiteSpace: 'nowrap'
  }}>{children}</span>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: string; bg: string }> = ({ icon, label, value, color, bg }) => (
  <div style={{
    flex: 1, minWidth: 180, background: 'white', border: '1px solid #e2e8f0',
    borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
  }}>
    <div style={{ background: bg, color, borderRadius: '0.5rem', padding: '0.6rem', display: 'flex' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.1 }}>{value}</div>
    </div>
  </div>
);

// --- Main component -----------------------------------------------------
const PharmacyManagement: React.FC<{ activeTab?: 'inventory' | 'prescriptions' }> = ({ activeTab: initialTab = 'inventory' }) => {
  // Adjustment Settings
  const { columns, itemsPerPage, isMobile } = usePageAdjustments('pharmacy');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useViewMode('pharmacy', 'grid');
  const {
    drugs, prescriptions, drugSuppliers, patients,
    dispenseMedication, cancelPrescription, addPrescription,
    addDrug, updateDrug, role, loading, currentStaff,
  } = useEMR();

  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>(initialTab);

  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const [showCSVModal, setShowCSVModal] = useState(false);

  const CSV_DRUG_HEADERS = [
    'name','brand_name','manufacturer','supplier_name','active_ingredient','category',
    'form','strength','unit','route','indication','contraindications','side_effects',
    'drug_interactions','storage_conditions','handling_precautions','controlled_substance',
    'prescription_required','stock','purchase_price','price','reorder_level',
    'reorder_quantity','expiry_date','batch_number','storage_location','status',
  ];

  const handleCSVImport = async (rows: Record<string, string>[]): Promise<{ imported: number; errors: string[] }> => {
    let imported = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        if (!row.name?.trim()) { errors.push(`Row skipped: missing drug name`); continue; }
        await addDrug({
          name:                row.name?.trim() || '',
          brandName:           row.brand_name?.trim() || '',
          manufacturer:        row.manufacturer?.trim() || '',
          supplierName:        row.supplier_name?.trim() || '',
          activeIngredient:    row.active_ingredient?.trim() || '',
          category:            row.category?.trim() || 'Other',
          form:                row.form?.trim() || 'Tablet',
          strength:            row.strength?.trim() || '',
          unit:                row.unit?.trim() || 'Tablet',
          route:               row.route?.trim() || 'Oral',
          indication:          row.indication?.trim() || '',
          contraindications:   row.contraindications?.trim() || '',
          sideEffects:         row.side_effects?.trim() || '',
          drugInteractions:    row.drug_interactions?.trim() || '',
          storageConditions:   row.storage_conditions?.trim() || 'Store at room temperature',
          handlingPrecautions: row.handling_precautions?.trim() || '',
          controlledSubstance: row.controlled_substance?.toLowerCase() === 'true',
          prescriptionRequired: row.prescription_required?.toLowerCase() !== 'false',
          stock:               parseInt(row.stock) || 0,
          purchasePrice:       parseFloat(row.purchase_price) || 0,
          price:               row.price?.trim() || '0 ETB',
          reorderLevel:        parseInt(row.reorder_level) || 20,
          reorderQuantity:     parseInt(row.reorder_quantity) || 100,
          expiryDate:          row.expiry_date?.trim() || '',
          batchNumber:         row.batch_number?.trim() || '',
          storageLocation:     row.storage_location?.trim() || '',
          status:              (row.status?.trim() as 'Active' | 'Discontinued' | 'Recalled') || 'Active',
        });
        imported++;
      } catch (err: any) {
        errors.push(`"${row.name}": ${err.message}`);
      }
    }
    return { imported, errors };
  };

  // Inventory tab state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterForm, setFilterForm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'expiry'>('name');

  // Modal state
  const [drugModal, setDrugModal] = useState<{ mode: 'add' | 'edit'; data?: Drug } | null>(null);
  const [formState, setFormState] = useState<DrugFormState>(emptyForm);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'clinical' | 'storage' | 'inventory'>('basic');
  const [detailDrug, setDetailDrug] = useState<Drug | null>(null);
  const [stockModalDrug, setStockModalDrug] = useState<Drug | null>(null);
  const [stockValue, setStockValue] = useState('');

  // Prescription tab state
  const [rxSearch, setRxSearch] = useState('');
  const [rxStatus, setRxStatus] = useState('');
  const [rxDateFilter, setRxDateFilter] = useState<'' | 'today' | 'week' | 'month'>('');
  const [rxSort, setRxSort] = useState<'newest' | 'oldest' | 'patient'>('newest');

  // Prescription modals
  const [newRxOpen, setNewRxOpen] = useState(false);
  const [dispenseRx, setDispenseRx] = useState<Prescription | null>(null);
  const [detailRx, setDetailRx] = useState<Prescription | null>(null);
  const [dispenseQty, setDispenseQty] = useState('');
  const [rxSaving, setRxSaving] = useState(false);

  // New prescription form
  const [rxForm, setRxForm] = useState<RxFormState>(emptyRxForm);
  const [rxPatientSearch, setRxPatientSearch] = useState('');
  const [rxDrugSearch, setRxDrugSearch] = useState('');

  // --- Derived data ---------------------------------------------------
  const lowStockCount = useMemo(
    () => drugs.filter(d => d.stock < (d.reorderLevel ?? 20)).length,
    [drugs]
  );

  const expiringSoonCount = useMemo(
    () => drugs.filter(d => {
      const days = daysUntil(d.expiryDate);
      return days !== null && days >= 0 && days <= 90;
    }).length,
    [drugs]
  );

  const filteredDrugs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = drugs.filter((d) => {
      if (q) {
        const hay = `${d.name} ${d.brandName || ''} ${d.activeIngredient || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterCategory && d.category !== filterCategory) return false;
      if (filterForm && d.form !== filterForm) return false;
      if (filterStatus && (d.status || 'Active') !== filterStatus) return false;
      if (filterStock === 'low' && d.stock >= (d.reorderLevel ?? 20)) return false;
      if (filterStock === 'critical' && d.stock >= 10) return false;
      if (filterStock === 'in_stock' && d.stock < (d.reorderLevel ?? 20)) return false;
      return true;
    });
    return [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'stock') return a.stock - b.stock;
      if (sortBy === 'expiry') {
        const av = a.expiryDate ? Date.parse(a.expiryDate) : Infinity;
        const bv = b.expiryDate ? Date.parse(b.expiryDate) : Infinity;
        return av - bv;
      }
      return 0;
    });
  }, [drugs, search, filterCategory, filterForm, filterStatus, filterStock, sortBy]);

  const paginatedDrugs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDrugs.slice(start, start + itemsPerPage);
  }, [filteredDrugs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDrugs.length / itemsPerPage);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory, filterForm, filterStatus, filterStock, sortBy]);

  const rxStats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return {
      total: prescriptions.length,
      pending: prescriptions.filter(p => p.status === 'Pending').length,
      dispensedToday: prescriptions.filter(p => p.status === 'Dispensed' && (p.dispensedAt || p.createdAt || '').slice(0, 10) === todayStr).length,
      cancelled: prescriptions.filter(p => p.status === 'Cancelled').length,
    };
  }, [prescriptions]);

  const filteredRx = useMemo(() => {
    const q = rxSearch.toLowerCase();
    const now = new Date();
    return prescriptions.filter((p) => {
      if (q && !p.patientName.toLowerCase().includes(q) && !p.patientMrn.toLowerCase().includes(q) && !p.drug.toLowerCase().includes(q)) return false;
      if (rxStatus && p.status !== rxStatus) return false;
      if (rxDateFilter) {
        const d = new Date(p.createdAt);
        if (rxDateFilter === 'today' && d.toDateString() !== now.toDateString()) return false;
        if (rxDateFilter === 'week' && (now.getTime() - d.getTime()) > 7 * 86400000) return false;
        if (rxDateFilter === 'month' && (now.getTime() - d.getTime()) > 30 * 86400000) return false;
      }
      return true;
    }).sort((a, b) => {
      if (rxSort === 'patient') return a.patientName.localeCompare(b.patientName);
      if (rxSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [prescriptions, rxSearch, rxStatus, rxDateFilter, rxSort]);

  // --- Handlers -------------------------------------------------------
  const openAddDrug = () => {
    setFormState(emptyForm);
    setActiveFormTab('basic');
    setDrugModal({ mode: 'add' });
  };

  const openEditDrug = (d: Drug) => {
    setFormState(drugToForm(d));
    setActiveFormTab('basic');
    setDrugModal({ mode: 'edit', data: d });
  };

  const closeDrugModal = () => {
    setDrugModal(null);
    setFormState(emptyForm);
  };

  const saveDrug = async () => {
    if (!formState.name.trim()) {
      toast.error('Drug name is required.');
      return;
    }
    try {
      const payload = formToDrug(formState);
      if (drugModal?.mode === 'edit' && drugModal.data) {
        await updateDrug(drugModal.data.id, payload);
        toast.success('Drug updated.');
      } else {
        await addDrug(payload);
        toast.success('Drug added to inventory.');
      }
      closeDrugModal();
    } catch (err: any) {
      toast.error('Save failed: ' + (err?.message || 'unknown error'));
    }
  };

  const saveStock = async () => {
    if (!stockModalDrug) return;
    const n = parseInt(stockValue, 10);
    if (Number.isNaN(n) || n < 0) {
      toast.error('Enter a valid stock quantity.');
      return;
    }
    try {
      await updateDrug(stockModalDrug.id, { stock: n });
      toast.success('Stock updated.');
      setStockModalDrug(null);
      setStockValue('');
    } catch (err: any) {
      toast.error('Stock update failed: ' + (err?.message || 'unknown error'));
    }
  };

  const openDispenseModal = (rx: Prescription) => {
    setDispenseRx(rx);
    setDispenseQty(String(rx.quantity ?? 1));
  };

  const handleDispenseWithQty = async () => {
    if (!dispenseRx) return;
    const qty = parseInt(dispenseQty, 10);
    if (isNaN(qty) || qty <= 0) { toast.error('Enter a valid quantity.'); return; }
    const drug = drugs.find(d => d.id === dispenseRx.drugId || d.name.toLowerCase() === dispenseRx.drug.toLowerCase());
    if (!drug) { toast.error('Drug not found in inventory.'); return; }
    if (drug.stock < qty) { toast.error(`Insufficient stock. Available: ${drug.stock}`); return; }
    setRxSaving(true);
    try {
      await dispenseMedication(dispenseRx.id, drug.id, qty);
      toast.success('Medication dispensed successfully.');
      setDispenseRx(null);
      setDispenseQty('');
    } catch (err: any) {
      toast.error('Failed to dispense: ' + err.message);
    } finally {
      setRxSaving(false);
    }
  };

  const handleCancelRx = async (rx: Prescription) => {
    if (!window.confirm(`Cancel prescription for ${rx.drug} (${rx.patientName})?`)) return;
    try {
      await cancelPrescription(rx.id);
      toast.success('Prescription cancelled.');
    } catch (err: any) {
      toast.error('Failed to cancel: ' + err.message);
    }
  };

  const openNewRx = () => {
    setRxForm({
      ...emptyRxForm,
      startDate: new Date().toISOString().slice(0, 10),
      prescribedBy: currentStaff?.name ?? '',
    });
    setRxPatientSearch('');
    setRxDrugSearch('');
    setNewRxOpen(true);
  };

  const saveNewRx = async () => {
    if (!rxForm.patientMrn) { toast.error('Select a patient.'); return; }
    if (!rxForm.drug) { toast.error('Select a drug.'); return; }
    if (!rxForm.dosage) { toast.error('Enter dosage.'); return; }
    setRxSaving(true);
    try {
      const duration = `${rxForm.durationValue} ${rxForm.durationUnit}`;
      await addPrescription({
        patientMrn: rxForm.patientMrn,
        patientName: rxForm.patientName,
        drug: rxForm.drug,
        drugId: rxForm.drugId,
        dosage: rxForm.dosage,
        frequency: rxForm.frequency,
        duration,
        quantity: rxForm.quantity ? parseInt(rxForm.quantity, 10) : undefined,
        instructions: rxForm.instructions,
        startDate: rxForm.startDate,
        prescribedBy: rxForm.prescribedBy,
        status: 'Pending',
      });
      toast.success('Prescription created.');
      setNewRxOpen(false);
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    } finally {
      setRxSaving(false);
    }
  };

  // --- Styles ---------------------------------------------------------
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000, padding: '1.5rem'
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading pharmacy data...</div>;

  // --- Modals ---------------------------------------------------------
  const renderFormTab = () => {
    if (activeFormTab === 'basic') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
          <Field label="Generic Name *" full>
            <input style={inputStyle} value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} placeholder="e.g. Amoxicillin" />
          </Field>
          <Field label="Brand Name">
            <input style={inputStyle} value={formState.brandName} onChange={e => setFormState({ ...formState, brandName: e.target.value })} placeholder="e.g. Amoxil" />
          </Field>
          <Field label="Active Ingredient">
            <input style={inputStyle} value={formState.activeIngredient} onChange={e => setFormState({ ...formState, activeIngredient: e.target.value })} />
          </Field>
          <Field label="Manufacturer">
            <input style={inputStyle} value={formState.manufacturer} onChange={e => setFormState({ ...formState, manufacturer: e.target.value })} />
          </Field>
          <Field label="Supplier">
            <select style={inputStyle} value={formState.supplierName} onChange={e => setFormState({ ...formState, supplierName: e.target.value })}>
              <option value="">— Select —</option>
              {drugSuppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select style={inputStyle} value={formState.category} onChange={e => setFormState({ ...formState, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Form">
            <select style={inputStyle} value={formState.form} onChange={e => setFormState({ ...formState, form: e.target.value })}>
              {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Strength">
            <input style={inputStyle} value={formState.strength} onChange={e => setFormState({ ...formState, strength: e.target.value })} placeholder="e.g. 500mg" />
          </Field>
          <Field label="Unit">
            <input style={inputStyle} value={formState.unit} onChange={e => setFormState({ ...formState, unit: e.target.value })} placeholder="e.g. tablet, vial" />
          </Field>
          <Field label="Route">
            <select style={inputStyle} value={formState.route} onChange={e => setFormState({ ...formState, route: e.target.value })}>
              {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
      );
    }
    if (activeFormTab === 'clinical') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <Field label="Indication">
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={formState.indication} onChange={e => setFormState({ ...formState, indication: e.target.value })} />
          </Field>
          <Field label="Contraindications">
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={formState.contraindications} onChange={e => setFormState({ ...formState, contraindications: e.target.value })} />
          </Field>
          <Field label="Side Effects">
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={formState.sideEffects} onChange={e => setFormState({ ...formState, sideEffects: e.target.value })} />
          </Field>
          <Field label="Drug Interactions">
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={formState.drugInteractions} onChange={e => setFormState({ ...formState, drugInteractions: e.target.value })} />
          </Field>
        </div>
      );
    }
    if (activeFormTab === 'storage') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
          <Field label="Storage Conditions" full>
            <input style={inputStyle} value={formState.storageConditions} onChange={e => setFormState({ ...formState, storageConditions: e.target.value })} placeholder="e.g. Below 25°C, dry" />
          </Field>
          <Field label="Storage Location" full>
            <input style={inputStyle} value={formState.storageLocation} onChange={e => setFormState({ ...formState, storageLocation: e.target.value })} placeholder="e.g. Ward A Pharmacy, Cold Storage Room" />
          </Field>
          <Field label="Handling Precautions" full>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={formState.handlingPrecautions} onChange={e => setFormState({ ...formState, handlingPrecautions: e.target.value })} />
          </Field>
          <Field label="Controlled Substance">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#1e293b' }}>
              <input type="checkbox" checked={formState.controlledSubstance} onChange={e => setFormState({ ...formState, controlledSubstance: e.target.checked })} />
              Requires controlled-drugs register
            </label>
          </Field>
          <Field label="Prescription Required">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#1e293b' }}>
              <input type="checkbox" checked={formState.prescriptionRequired} onChange={e => setFormState({ ...formState, prescriptionRequired: e.target.checked })} />
              Rx-only (not OTC)
            </label>
          </Field>
        </div>
      );
    }
    // inventory tab
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
        <Field label="Stock Quantity">
          <input type="number" style={inputStyle} value={formState.stock} onChange={e => setFormState({ ...formState, stock: e.target.value })} />
        </Field>
        <Field label="Status">
          <select style={inputStyle} value={formState.status} onChange={e => setFormState({ ...formState, status: e.target.value })}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Purchase Price (ETB)">
          <input type="number" step="0.01" style={inputStyle} value={formState.purchasePrice} onChange={e => setFormState({ ...formState, purchasePrice: e.target.value })} />
        </Field>
        <Field label="Selling Price (ETB)">
          <input style={inputStyle} value={formState.price} onChange={e => setFormState({ ...formState, price: e.target.value })} placeholder="e.g. 15.00 ETB" />
        </Field>
        <Field label="Reorder Level">
          <input type="number" style={inputStyle} value={formState.reorderLevel} onChange={e => setFormState({ ...formState, reorderLevel: e.target.value })} />
        </Field>
        <Field label="Reorder Quantity">
          <input type="number" style={inputStyle} value={formState.reorderQuantity} onChange={e => setFormState({ ...formState, reorderQuantity: e.target.value })} />
        </Field>
        <Field label="Expiry Date">
          <input type="date" style={inputStyle} value={formState.expiryDate} onChange={e => setFormState({ ...formState, expiryDate: e.target.value })} />
        </Field>
        <Field label="Batch Number">
          <input style={inputStyle} value={formState.batchNumber} onChange={e => setFormState({ ...formState, batchNumber: e.target.value })} />
        </Field>
      </div>
    );
  };

  return (
    <div className="pharmacy-container">
      {showCSVModal && <CSVImportModal title="Drugs Inventory" onClose={() => setShowCSVModal(false)} onImport={handleCSVImport} templateHeaders={CSV_DRUG_HEADERS} />}

      {/* Drug Detail Modal */}
      {detailDrug && (
        <div style={overlayStyle} onClick={() => setDetailDrug(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: '1rem', padding: 0, width: 'min(880px, 100%)',
            maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{detailDrug.name}</div>
                {detailDrug.brandName && <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{detailDrug.brandName}</div>}
              </div>
              <button onClick={() => setDetailDrug(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={22} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Flags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {detailDrug.category && (
                  <Pill_Badge bg={(CATEGORY_COLORS[detailDrug.category]?.bg) || '#f1f5f9'} color={(CATEGORY_COLORS[detailDrug.category]?.fg) || '#1e293b'}>{detailDrug.category}</Pill_Badge>
                )}
                <Pill_Badge bg="#f1f5f9" color="#1e293b">{detailDrug.form} / {detailDrug.route || 'Oral'}</Pill_Badge>
                {detailDrug.controlledSubstance && (
                  <Pill_Badge bg="#1e293b" color="#fbbf24" title="Controlled drug — requires register"><ShieldAlert size={12} /> Controlled</Pill_Badge>
                )}
                {detailDrug.prescriptionRequired === false ? (
                  <Pill_Badge bg="#dcfce7" color="#166534">OTC</Pill_Badge>
                ) : (
                  <Pill_Badge bg="#dbeafe" color="#1d4ed8"><BadgeCheck size={12} /> Rx Required</Pill_Badge>
                )}
                <Pill_Badge bg="#fef3c7" color="#92400e">{detailDrug.status || 'Active'}</Pill_Badge>
              </div>

              <Section title="Basic Info" icon={<FileText size={16} />}>
                <KV k="Generic Name" v={detailDrug.name} />
                <KV k="Brand Name" v={detailDrug.brandName || '—'} />
                <KV k="Manufacturer" v={detailDrug.manufacturer || '—'} />
                <KV k="Supplier" v={detailDrug.supplierName || '—'} />
                <KV k="Active Ingredient" v={detailDrug.activeIngredient || '—'} />
              </Section>

              <Section title="Clinical Info" icon={<Beaker size={16} />}>
                <KV k="Category" v={detailDrug.category || '—'} />
                <KV k="Form" v={detailDrug.form || '—'} />
                <KV k="Strength" v={detailDrug.strength || '—'} />
                <KV k="Route" v={detailDrug.route || '—'} />
                <KV k="Unit" v={detailDrug.unit || '—'} />
                <KV k="Indication" v={detailDrug.indication || '—'} full />
              </Section>

              <Section title="Safety" icon={<ShieldAlert size={16} />}>
                <KV k="Contraindications" v={detailDrug.contraindications || '—'} full />
                <KV k="Side Effects" v={detailDrug.sideEffects || '—'} full />
                <KV k="Drug Interactions" v={detailDrug.drugInteractions || '—'} full />
                <KV k="Handling Precautions" v={detailDrug.handlingPrecautions || '—'} full />
              </Section>

              <Section title="Storage" icon={<Package size={16} />}>
                <KV k="Storage Conditions" v={detailDrug.storageConditions || '—'} />
                <KV k="Storage Location" v={detailDrug.storageLocation || '—'} />
                <KV k="Batch Number" v={detailDrug.batchNumber || '—'} />
                <KV k="Expiry Date" v={detailDrug.expiryDate || '—'} />
              </Section>

              <Section title="Inventory" icon={<ClipboardList size={16} />}>
                <KV k="Current Stock" v={String(detailDrug.stock)} />
                <KV k="Reorder Level" v={String(detailDrug.reorderLevel ?? 20)} />
                <KV k="Reorder Quantity" v={String(detailDrug.reorderQuantity ?? 100)} />
                <KV k="Purchase Price" v={detailDrug.purchasePrice ? `${detailDrug.purchasePrice.toFixed(2)} ETB` : '—'} />
                <KV k="Selling Price" v={detailDrug.price || '—'} />
              </Section>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Drug Modal */}
      {drugModal && (
        <div style={overlayStyle} onClick={closeDrugModal}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: '1rem', padding: 0, width: 'min(720px, 100%)',
            maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                {drugModal.mode === 'add' ? 'Add Drug' : 'Edit Drug'}
              </div>
              <button onClick={closeDrugModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={22} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
              {(['basic', 'clinical', 'storage', 'inventory'] as const).map(tab => {
                const labels: Record<typeof tab, string> = { basic: 'Basic Info', clinical: 'Clinical Info', storage: 'Storage & Safety', inventory: 'Inventory' };
                const active = activeFormTab === tab;
                return (
                  <button key={tab} onClick={() => setActiveFormTab(tab)} style={{
                    padding: '0.45rem 0.9rem', borderRadius: '0.5rem', fontSize: '0.82rem',
                    fontWeight: 600, cursor: 'pointer', border: '1px solid transparent',
                    background: active ? '#3b82f6' : '#f1f5f9', color: active ? 'white' : '#475569'
                  }}>{labels[tab]}</button>
                );
              })}
            </div>
            <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', flex: 1 }}>
              {renderFormTab()}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={closeDrugModal}>Cancel</button>
              <button className="btn-primary" onClick={saveDrug}>
                {drugModal.mode === 'add' ? 'Add Drug' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {stockModalDrug && (
        <div style={overlayStyle} onClick={() => setStockModalDrug(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: '1rem', padding: '1.5rem', width: 'min(420px, 100%)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>Update Stock</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Drug: <strong style={{ color: '#1e293b' }}>{stockModalDrug.name}</strong>
              {' '}(current: {stockModalDrug.stock})
            </div>
            <input type="number" value={stockValue} onChange={e => setStockValue(e.target.value)} placeholder="New stock quantity" style={inputStyle} autoFocus />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn-secondary" onClick={() => { setStockModalDrug(null); setStockValue(''); }}>Cancel</button>
              <button className="btn-primary" onClick={saveStock}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* New Prescription Modal */}
      {newRxOpen && (
        <div style={overlayStyle} onClick={() => setNewRxOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '1rem', width: 'min(640px, 100%)', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="#3b82f6" /> New Prescription
              </div>
              <button onClick={() => setNewRxOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={22} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Patient search */}
              <Field label="Patient *" full>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input style={{ ...inputStyle, paddingLeft: '2rem' }} placeholder="Search by name or MRN..." value={rxPatientSearch}
                    onChange={e => { setRxPatientSearch(e.target.value); setRxForm(f => ({ ...f, patientMrn: '', patientName: '' })); }} />
                </div>
                {rxPatientSearch.length >= 1 && !rxForm.patientMrn && (() => {
                  const q = rxPatientSearch.toLowerCase();
                  const matches = patients.filter(p => p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q)).slice(0, 8);
                  return (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.25rem', background: 'white', maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                      {matches.length === 0
                        ? <div style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>No patients found</div>
                        : matches.map(p => (
                          <div key={p.mrn} onClick={() => { setRxForm(f => ({ ...f, patientMrn: p.mrn, patientName: p.name })); setRxPatientSearch(p.name); }}
                            style={{ padding: '0.6rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{p.name}</span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MRN: {p.mrn}</span>
                          </div>
                        ))}
                    </div>
                  );
                })()}
                {rxForm.patientMrn && <div style={{ marginTop: '0.25rem', fontSize: '0.78rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={13} /> MRN: {rxForm.patientMrn}</div>}
              </Field>

              {/* Drug search */}
              <Field label="Drug *" full>
                <div style={{ position: 'relative' }}>
                  <Pill size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input style={{ ...inputStyle, paddingLeft: '2rem' }} placeholder="Search drug name or brand..." value={rxDrugSearch}
                    onChange={e => { setRxDrugSearch(e.target.value); setRxForm(f => ({ ...f, drug: '', drugId: undefined, dosage: '' })); }} />
                </div>
                {rxDrugSearch.length >= 1 && !rxForm.drug && (() => {
                  const q = rxDrugSearch.toLowerCase();
                  const matches = drugs.filter(d => (d.status || 'Active') === 'Active' && (d.name.toLowerCase().includes(q) || (d.brandName || '').toLowerCase().includes(q))).slice(0, 8);
                  return (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.25rem', background: 'white', maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                      {matches.length === 0
                        ? <div style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>No drugs found</div>
                        : matches.map(d => (
                          <div key={d.id} onClick={() => { setRxForm(f => ({ ...f, drug: d.name, drugId: d.id, dosage: d.strength || '' })); setRxDrugSearch(`${d.name}${d.strength ? ` ${d.strength}` : ''}`); }}
                            style={{ padding: '0.6rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <div>
                              <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{d.name}</span>
                              {d.strength && <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '0.5rem' }}>{d.strength}</span>}
                              {d.brandName && <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: '0.4rem' }}>({d.brandName})</span>}
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: d.stock < 10 ? '#dc2626' : '#16a34a', flexShrink: 0 }}>Stock: {d.stock}</span>
                          </div>
                        ))}
                    </div>
                  );
                })()}
                {rxForm.drug && <div style={{ marginTop: '0.25rem', fontSize: '0.78rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={13} /> {rxForm.drug}</div>}
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                <Field label="Dosage *">
                  <input style={inputStyle} value={rxForm.dosage} placeholder="e.g. 500mg"
                    onChange={e => setRxForm(f => ({ ...f, dosage: e.target.value }))} />
                </Field>
                <Field label="Frequency">
                  <select style={inputStyle} value={rxForm.frequency} onChange={e => {
                    const freq = e.target.value;
                    setRxForm(f => ({ ...f, frequency: freq, quantity: calcQty(freq, f.durationValue, f.durationUnit) }));
                  }}>
                    {FREQUENCIES.map(fr => <option key={fr} value={fr}>{fr}</option>)}
                  </select>
                </Field>
                <Field label="Duration">
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input type="number" min="1" style={{ ...inputStyle, flex: 1 }} value={rxForm.durationValue}
                      onChange={e => { const v = e.target.value; setRxForm(f => ({ ...f, durationValue: v, quantity: calcQty(f.frequency, v, f.durationUnit) })); }} />
                    <select style={{ ...inputStyle, flex: 1.4 }} value={rxForm.durationUnit} onChange={e => {
                      const u = e.target.value;
                      setRxForm(f => ({ ...f, durationUnit: u, quantity: calcQty(f.frequency, f.durationValue, u) }));
                    }}>
                      {DURATION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </Field>
                <Field label="Quantity (units)">
                  <input type="number" min="1" style={inputStyle} value={rxForm.quantity}
                    onChange={e => setRxForm(f => ({ ...f, quantity: e.target.value }))} placeholder="auto-calculated" />
                </Field>
                <Field label="Start Date">
                  <input type="date" style={inputStyle} value={rxForm.startDate}
                    onChange={e => setRxForm(f => ({ ...f, startDate: e.target.value }))} />
                </Field>
                <Field label="Prescribed By">
                  <input style={inputStyle} value={rxForm.prescribedBy} placeholder="Doctor name"
                    onChange={e => setRxForm(f => ({ ...f, prescribedBy: e.target.value }))} />
                </Field>
              </div>
              <Field label="Instructions" full>
                <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={rxForm.instructions}
                  placeholder="e.g. Take after food, avoid sunlight..."
                  onChange={e => setRxForm(f => ({ ...f, instructions: e.target.value }))} />
              </Field>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setNewRxOpen(false)} disabled={rxSaving}>Cancel</button>
              <button className="btn-primary" onClick={saveNewRx} disabled={rxSaving}>{rxSaving ? 'Saving...' : 'Create Prescription'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Dispense Confirmation Modal */}
      {dispenseRx && (() => {
        const drug = drugs.find(d => d.id === dispenseRx.drugId || d.name.toLowerCase() === dispenseRx.drug.toLowerCase());
        const stock = drug?.stock ?? 0;
        const qty = parseInt(dispenseQty, 10) || 0;
        const insufficient = qty > stock;
        return (
          <div style={overlayStyle} onClick={() => { setDispenseRx(null); setDispenseQty(''); }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', width: 'min(460px, 100%)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} color="#16a34a" /> Dispense Medication
                </div>
                <button onClick={() => { setDispenseRx(null); setDispenseQty(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={22} /></button>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.3rem' }}>{dispenseRx.drug}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Patient: <strong style={{ color: '#1e293b' }}>{dispenseRx.patientName}</strong> · MRN: {dispenseRx.patientMrn}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {dispenseRx.dosage}{dispenseRx.frequency ? ` · ${dispenseRx.frequency}` : ''} · {dispenseRx.duration}
                  {dispenseRx.quantity ? ` · Prescribed qty: ${dispenseRx.quantity}` : ''}
                </div>
                <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Available stock:</span>
                  <span style={{ fontWeight: 700, color: stock < 10 ? '#dc2626' : stock < 20 ? '#ea580c' : '#16a34a', fontSize: '0.95rem' }}>{stock} units</span>
                </div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Quantity to Dispense</label>
                <input type="number" min="1" value={dispenseQty} onChange={e => setDispenseQty(e.target.value)}
                  style={{ ...inputStyle, border: `1px solid ${insufficient ? '#fca5a5' : '#e2e8f0'}` }} autoFocus />
                {insufficient && (
                  <div style={{ marginTop: '0.4rem', color: '#dc2626', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertTriangle size={13} /> Exceeds available stock ({stock})
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => { setDispenseRx(null); setDispenseQty(''); }}>Cancel</button>
                <button className="btn-primary" onClick={handleDispenseWithQty} disabled={rxSaving || insufficient || qty <= 0}>
                  {rxSaving ? 'Dispensing...' : 'Confirm Dispense'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Prescription Detail Modal */}
      {detailRx && (
        <div style={overlayStyle} onClick={() => setDetailRx(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '1rem', width: 'min(580px, 100%)', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Prescription Details</div>
              <button onClick={() => setDetailRx(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={22} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                {detailRx.status === 'Dispensed' && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>Dispensed</span>}
                {detailRx.status === 'Pending' && <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>Pending</span>}
                {detailRx.status === 'Cancelled' && <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>Cancelled</span>}
              </div>
              <Section title="Patient" icon={<Users size={16} />}>
                <KV k="Name" v={detailRx.patientName} />
                <KV k="MRN" v={detailRx.patientMrn} />
              </Section>
              <Section title="Medication" icon={<Pill size={16} />}>
                <KV k="Drug" v={detailRx.drug} />
                <KV k="Dosage" v={detailRx.dosage} />
                <KV k="Frequency" v={detailRx.frequency || '—'} />
                <KV k="Duration" v={detailRx.duration} />
                <KV k="Quantity" v={detailRx.quantity ? String(detailRx.quantity) : '—'} />
                {detailRx.instructions && <KV k="Instructions" v={detailRx.instructions} full />}
              </Section>
              <Section title="Timeline" icon={<Clock size={16} />}>
                <KV k="Prescribed By" v={detailRx.prescribedBy || '—'} />
                <KV k="Start Date" v={detailRx.startDate || '—'} />
                <KV k="Created" v={new Date(detailRx.createdAt).toLocaleString()} />
                {detailRx.dispensedAt && <KV k="Dispensed At" v={new Date(detailRx.dispensedAt).toLocaleString()} />}
              </Section>
            </div>
          </div>
        </div>
      )}

      <div className="pharmacy-content">
        {activeTab === 'prescriptions' ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={24} color="#3b82f6" />
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>Prescriptions</div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {(role === 'Admin' || role === 'Doctor' || role === 'Pharmacist') && (
                  <button className="btn-primary" onClick={openNewRx}><Plus size={16} /> New Prescription</button>
                )}
                <button className="btn-secondary" onClick={() => setActiveTab('inventory')}><Pill size={16} /> Drug Inventory</button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <StatCard icon={<ClipboardList size={20} />} label="Total" value={rxStats.total} color="#1d4ed8" bg="#dbeafe" />
              <StatCard icon={<Clock size={20} />} label="Pending" value={rxStats.pending} color="#92400e" bg="#fef3c7" />
              <StatCard icon={<CheckCircle2 size={20} />} label="Dispensed Today" value={rxStats.dispensedToday} color="#166534" bg="#dcfce7" />
              <StatCard icon={<XCircle size={20} />} label="Cancelled" value={rxStats.cancelled} color="#475569" bg="#f1f5f9" />
            </div>

            {/* Filter bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) repeat(3, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={rxSearch} onChange={e => setRxSearch(e.target.value)} placeholder="Patient name, MRN, or drug..." style={{ ...inputStyle, paddingLeft: '2rem' }} />
              </div>
              <select value={rxStatus} onChange={e => setRxStatus(e.target.value)} style={inputStyle}>
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Dispensed">Dispensed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select value={rxDateFilter} onChange={e => setRxDateFilter(e.target.value as any)} style={inputStyle}>
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <select value={rxSort} onChange={e => setRxSort(e.target.value as any)} style={inputStyle}>
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="patient">Sort: Patient A→Z</option>
              </select>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem' }}>
              Showing {filteredRx.length} of {prescriptions.length} prescriptions
            </div>

            {/* Card grid */}
            {filteredRx.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0' }}>
                <FileText size={40} style={{ marginBottom: '0.75rem', opacity: 0.35 }} />
                <p style={{ fontWeight: 600 }}>No prescriptions match the current filters.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {filteredRx.map(rx => {
                  const sc = rx.status === 'Dispensed'
                    ? { bg: '#dcfce7', fg: '#166534', border: '#16a34a' }
                    : rx.status === 'Cancelled'
                    ? { bg: '#f1f5f9', fg: '#475569', border: '#94a3b8' }
                    : { bg: '#fef3c7', fg: '#92400e', border: '#f59e0b' };
                  return (
                    <div key={rx.id} style={{ background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0', borderLeft: `4px solid ${sc.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      {/* Card header: patient + status */}
                      <div style={{ padding: '0.875rem 1rem 0.625rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>{rx.patientName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.1rem' }}>
                            <Hash size={10} /> {rx.patientMrn}
                          </div>
                        </div>
                        <span style={{ background: sc.bg, color: sc.fg, padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{rx.status}</span>
                      </div>

                      {/* Drug info */}
                      <div style={{ padding: '0.75rem 1rem', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                          <Pill size={14} color="#3b82f6" />
                          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>{rx.drug}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '0.2rem 0.4rem' }}>
                          <span>{rx.dosage}</span>
                          {rx.frequency && <><span style={{ color: '#cbd5e1' }}>·</span><span>{rx.frequency}</span></>}
                          <span style={{ color: '#cbd5e1' }}>·</span><span>{rx.duration}</span>
                          {rx.quantity && <><span style={{ color: '#cbd5e1' }}>·</span><span>Qty: {rx.quantity}</span></>}
                        </div>
                        {rx.instructions && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>"{rx.instructions}"</div>
                        )}
                      </div>

                      {/* Meta row */}
                      <div style={{ padding: '0.4rem 1rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', fontSize: '0.7rem', color: '#94a3b8', display: 'flex', flexWrap: 'wrap', gap: '0.2rem 0.4rem', alignItems: 'center' }}>
                        {rx.prescribedBy && <><User size={10} style={{ flexShrink: 0 }} /><span>{rx.prescribedBy}</span><span style={{ color: '#cbd5e1' }}>·</span></>}
                        <span>{new Date(rx.createdAt).toLocaleDateString()}</span>
                        {rx.dispensedAt && <><span style={{ color: '#cbd5e1' }}>·</span><span style={{ color: '#16a34a' }}>Dispensed {new Date(rx.dispensedAt).toLocaleDateString()}</span></>}
                      </div>

                      {/* Actions */}
                      <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => setDetailRx(rx)} style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', padding: '0.45rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Eye size={13} /> Details
                        </button>
                        {rx.status === 'Pending' && (
                          <>
                            <button onClick={() => openDispenseModal(rx)} style={{ flex: 1, background: '#dcfce7', border: 'none', color: '#166534', padding: '0.45rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <CheckCircle2 size={13} /> Dispense
                            </button>
                            <button onClick={() => handleCancelRx(rx)} style={{ flex: 1, background: '#fee2e2', border: 'none', color: '#991b1b', padding: '0.45rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <XCircle size={13} /> Cancel
                            </button>
                          </>
                        )}
                        {rx.status === 'Dispensed' && (
                          <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#16a34a', fontSize: '0.78rem', fontWeight: 600 }}>
                            <CheckCircle2 size={14} /> Dispensed
                          </div>
                        )}
                        {rx.status === 'Cancelled' && (
                          <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
                            <XCircle size={14} /> Cancelled
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Header: title + stat cards + actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'stretch' : 'center', 
                gap: '1rem' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: isMobile ? 'space-between' : 'flex-start',
                  width: isMobile ? '100%' : 'auto',
                  gap: '0.75rem' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Pill size={24} color="#3b82f6" />
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>Drug Inventory</div>
                  </div>
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.375rem', overflow: 'hidden' }}>
                    <button 
                      onClick={() => setViewMode('grid')}
                      style={{ background: viewMode === 'grid' ? '#e2e8f0' : 'white', border: 'none', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      title="Grid View"
                    >
                      <LayoutGrid size={16} color={viewMode === 'grid' ? '#0f172a' : '#64748b'} />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      style={{ background: viewMode === 'list' ? '#e2e8f0' : 'white', border: 'none', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      title="List View"
                    >
                      <List size={16} color={viewMode === 'list' ? '#0f172a' : '#64748b'} />
                    </button>
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '0.6rem', 
                  flexWrap: 'wrap',
                  width: isMobile ? '100%' : 'auto'
                }}>
                  <button className="btn-primary" style={{ flex: isMobile ? 1 : 'none', display: 'inline-flex', justifyContent: 'center' }} onClick={openAddDrug}><Plus size={16} /> Add Drug</button>
                  <button className="btn-secondary" style={{ flex: isMobile ? 1 : 'none', display: 'inline-flex', justifyContent: 'center' }} onClick={() => setShowCSVModal(true)}><ClipboardList size={16} /> Import CSV</button>
                  <button className="btn-secondary" style={{ flex: isMobile ? '100%' : 'none', display: 'inline-flex', justifyContent: 'center' }} onClick={() => setActiveTab('prescriptions')}><FileText size={16} /> Prescriptions</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <StatCard icon={<Pill size={20} />} label="Total Drugs" value={drugs.length} color="#1d4ed8" bg="#dbeafe" />
                <StatCard icon={<AlertTriangle size={20} />} label="Low Stock" value={lowStockCount} color="#b45309" bg="#fef3c7" />
                <StatCard icon={<Calendar size={20} />} label="Expiring within 90 days" value={expiringSoonCount} color="#b91c1c" bg="#fee2e2" />
              </div>
            </div>

            {/* Filter bar */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'minmax(220px, 1.5fr) repeat(5, minmax(140px, 1fr))',
              gap: '0.6rem', marginBottom: '1rem'
            }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / brand / ingredient..." style={{ ...inputStyle, paddingLeft: '2rem' }} />
              </div>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={inputStyle}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterForm} onChange={e => setFilterForm(e.target.value)} style={inputStyle}>
                <option value="">All Forms</option>
                {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterStock} onChange={e => setFilterStock(e.target.value)} style={inputStyle}>
                <option value="">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="critical">Critical (&lt;10)</option>
                <option value="in_stock">In Stock</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as 'name' | 'stock' | 'expiry')} style={inputStyle}>
                <option value="name">Sort: Name A→Z</option>
                <option value="stock">Sort: Stock low→high</option>
                <option value="expiry">Sort: Expiry soonest</option>
              </select>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.6rem' }}>
              Showing {filteredDrugs.length} of {drugs.length} drugs
            </div>

            {/* Drug card grid */}
            {filteredDrugs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0' }}>
                <Pill size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>No drugs match the current filters.</p>
              </div>
            ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '1rem' }}>
                {paginatedDrugs.map(d => {
                  const cat = d.category || '';
                  const colors = CATEGORY_COLORS[cat] || { bg: '#f1f5f9', fg: '#1e293b' };
                  const days = daysUntil(d.expiryDate);
                  const exColor = expiryColor(d.expiryDate);
                  const sColor = stockColor(d);
                  return (
                    <div key={d.id} style={{
                      background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column',
                      overflow: 'hidden', transition: 'box-shadow 0.2s',
                    }}>
                      {/* Card header */}
                      <div style={{ padding: '1rem 1rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.3 }}>{d.name}</div>
                            {d.brandName && <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '1px' }}>{d.brandName}</div>}
                          </div>
                          <span className={`status-badge ${(d.status || 'Active') === 'Active' ? 'status-active' : 'status-pending'}`} style={{ flexShrink: 0, fontSize: '0.7rem' }}>
                            {d.status || 'Active'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {cat && <Pill_Badge bg={colors.bg} color={colors.fg}>{cat}</Pill_Badge>}
                          <Pill_Badge bg="#f1f5f9" color="#475569">{d.form}{d.route ? ` · ${d.route}` : ''}</Pill_Badge>
                          {d.controlledSubstance && <Pill_Badge bg="#1e293b" color="#fbbf24"><ShieldAlert size={10} /> Controlled</Pill_Badge>}
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '0.75rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', flex: 1 }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strength</div>
                          <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>{d.strength || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</div>
                          <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>{d.price || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock</div>
                          <div style={{ fontSize: '1rem', color: sColor, fontWeight: 700 }}>{d.stock}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>reorder @ {d.reorderLevel ?? 20}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiry</div>
                          {d.expiryDate ? (
                            <>
                              <div style={{ fontSize: '0.82rem', color: exColor || '#1e293b', fontWeight: exColor ? 700 : 500 }}>{d.expiryDate}</div>
                              <div style={{ fontSize: '0.68rem', color: exColor || '#94a3b8' }}>{days === null ? '' : days < 0 ? 'EXPIRED' : `${days}d left`}</div>
                            </>
                          ) : <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>—</div>}
                        </div>
                      </div>

                      {/* Card actions */}
                      <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => setDetailDrug(d)}
                          style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', padding: '0.45rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        >
                          <Eye size={13} /> Details
                        </button>
                        <button
                          onClick={() => { setStockModalDrug(d); setStockValue(String(d.stock)); }}
                          style={{ flex: 1, background: '#eff6ff', border: 'none', color: '#1d4ed8', padding: '0.45rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        >
                          <RefreshCw size={13} /> Stock
                        </button>
                        {role === 'Admin' && (
                          <button
                            onClick={() => openEditDrug(d)}
                            style={{ flex: 1, background: '#fffbeb', border: 'none', color: '#92400e', padding: '0.45rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Batch No.</th>
                      <th>Name / Generic Name</th>
                      <th>Category</th>
                      <th>Form / Route</th>
                      <th>Strength</th>
                      <th>Price</th>
                      <th>Stock Qty</th>
                      <th>Expiry</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDrugs.map((d) => {
                      const cat = d.category || '';
                      const colors = CATEGORY_COLORS[cat] || { bg: '#f1f5f9', fg: '#1e293b' };
                      const days = daysUntil(d.expiryDate);
                      const exColor = expiryColor(d.expiryDate);
                      const sColor = stockColor(d);
                      return (
                        <tr key={d.id} style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6366f1' }}>{d.batchNumber || d.id || '—'}</span>
                          </td>
                          <td>
                            <div>
                              <div style={{ fontWeight: 700, color: '#1e293b' }}>{d.name}</div>
                              {d.brandName && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.brandName}</div>}
                            </div>
                          </td>
                          <td>
                            {cat ? (
                              <Pill_Badge bg={colors.bg} color={colors.fg}>{cat}</Pill_Badge>
                            ) : '—'}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                              {d.form}{d.route ? ` · ${d.route}` : ''}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{d.strength || '—'}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{d.price || '—'}</span>
                          </td>
                          <td>
                            <div>
                              <div style={{ fontSize: '0.95rem', color: sColor, fontWeight: 700 }}>{d.stock}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>min: {d.reorderLevel ?? 20}</div>
                            </div>
                          </td>
                          <td>
                            {d.expiryDate ? (
                              <div>
                                <div style={{ fontSize: '0.85rem', color: exColor || '#1e293b', fontWeight: exColor ? 700 : 500 }}>{d.expiryDate}</div>
                                <div style={{ fontSize: '0.7rem', color: exColor || '#94a3b8' }}>{days === null ? '' : days < 0 ? 'EXPIRED' : `${days}d left`}</div>
                              </div>
                            ) : <span style={{ color: '#94a3b8' }}>—</span>}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => setDetailDrug(d)}><Eye size={12} /> Details</button>
                              <button className="btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => { setStockModalDrug(d); setStockValue(String(d.stock)); }}><RefreshCw size={12} /> Stock</button>
                              {role === 'Admin' && (
                                <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#fffbeb', border: 'none', color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => openEditDrug(d)}><Edit2 size={12} /> Edit</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- Small layout helpers used inside the detail modal -----------------
const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.6rem', padding: '0.9rem 1rem' }}>
    <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.6rem' }}>
      {icon}{title}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
      {children}
    </div>
  </div>
);

const KV: React.FC<{ k: string; v: string; full?: boolean }> = ({ k, v, full }) => (
  <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{k}</div>
    <div style={{ fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'pre-wrap' }}>{v}</div>
  </div>
);

export default PharmacyManagement;
