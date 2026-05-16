import React, { useState, useMemo } from 'react';
import {
  Pill, ClipboardList, AlertTriangle, Plus, X, CheckCircle2, Eye, Edit2, RefreshCw,
  Search, Calendar, Package, ShieldAlert, BadgeCheck, FileText, Beaker
} from 'lucide-react';
import CSVImportModal from './CSVImportModal';
import { useEMR, type Drug, type Prescription } from '../context/EMRContext';

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
  const {
    drugs, prescriptions, drugSuppliers, dispenseMedication,
    addDrug, updateDrug, role, loading
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

  // Prescription tab state (kept similar to legacy implementation)
  const [rxSearch, setRxSearch] = useState('');
  const [rxStatus, setRxStatus] = useState('');

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

  const filteredRx = useMemo(() => {
    const q = rxSearch.toLowerCase();
    return prescriptions.filter((p) => {
      if (q && !p.patientName.toLowerCase().includes(q) && !p.drug.toLowerCase().includes(q)) return false;
      if (rxStatus && p.status !== rxStatus) return false;
      return true;
    });
  }, [prescriptions, rxSearch, rxStatus]);

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

  const handleDispenseAction = async (rx: Prescription) => {
    const drug = drugs.find(d => d.name.toLowerCase() === rx.drug.toLowerCase());
    if (!drug) { toast.error('Drug not found in inventory.'); return; }
    if (drug.stock <= 0) { toast.error('Out of stock!'); return; }
    try {
      await dispenseMedication(rx.id, drug.id, 1);
      toast.success('Medication dispensed successfully.');
    } catch (err: any) {
      toast.error('Failed to dispense: ' + err.message);
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

      <div className="pharmacy-content">
        {activeTab === 'prescriptions' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={22} color="#3b82f6" />
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Prescriptions</div>
              </div>
              <button className="btn-secondary" onClick={() => setActiveTab('inventory')}>
                <Pill size={16} /> Switch to Inventory
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 220 }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={rxSearch} onChange={e => setRxSearch(e.target.value)} placeholder="Search by patient or drug..." style={{ ...inputStyle, paddingLeft: '2rem' }} />
              </div>
              <select value={rxStatus} onChange={e => setRxStatus(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }}>
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Dispensed">Dispensed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Medication</th><th>Dosage</th><th>Duration</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredRx.map(rx => (
                    <tr key={rx.id}>
                      <td><strong>{rx.patientName}</strong><div style={{ fontSize: '0.75rem', color: '#64748b' }}>{rx.patientMrn}</div></td>
                      <td>{rx.drug}</td>
                      <td>{rx.dosage}</td>
                      <td>{rx.duration}</td>
                      <td><span className={`status-badge ${rx.status === 'Dispensed' ? 'status-active' : 'status-pending'}`}>{rx.status}</span></td>
                      <td>
                        {rx.status === 'Pending' && (
                          <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleDispenseAction(rx)}>Dispense</button>
                        )}
                        {rx.status === 'Dispensed' && <CheckCircle2 size={18} color="#16a34a" />}
                      </td>
                    </tr>
                  ))}
                  {filteredRx.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No prescriptions match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {/* Header: title + stat cards + actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Pill size={24} color="#3b82f6" />
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>Drug Inventory</div>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={openAddDrug}><Plus size={16} /> Add Drug</button>
                  <button className="btn-secondary" onClick={() => setShowCSVModal(true)}><ClipboardList size={16} /> Import CSV</button>
                  <button className="btn-secondary" onClick={() => setActiveTab('prescriptions')}><FileText size={16} /> Prescriptions</button>
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
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {filteredDrugs.map(d => {
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
