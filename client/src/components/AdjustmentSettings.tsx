import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, Save } from 'lucide-react';

const ADJUSTMENT_STORAGE_KEY = 'emr_page_adjustments';

interface PageAdjustment {
  columns: number;
  itemsPerPage: number;
}

const DEFAULT_ADJUSTMENTS: Record<string, PageAdjustment> = {
  patients: { columns: 3, itemsPerPage: 12 },
  staff: { columns: 3, itemsPerPage: 12 },
  assets: { columns: 4, itemsPerPage: 16 },
  pharmacy: { columns: 3, itemsPerPage: 12 },
};

const AdjustmentSettings: React.FC = () => {
  const [selectedPage, setSelectedPage] = useState('patients');
  const [adjustments, setAdjustments] = useState<Record<string, PageAdjustment>>(DEFAULT_ADJUSTMENTS);

  useEffect(() => {
    const saved = localStorage.getItem(ADJUSTMENT_STORAGE_KEY);
    if (saved) {
      try {
        setAdjustments(JSON.parse(saved));
      } catch {
        setAdjustments(DEFAULT_ADJUSTMENTS);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(ADJUSTMENT_STORAGE_KEY, JSON.stringify(adjustments));
    alert('Settings saved!');
  };

  const updateAdjustment = (field: keyof PageAdjustment, value: number) => {
    setAdjustments(prev => ({
      ...prev,
      [selectedPage]: {
        ...prev[selectedPage],
        [field]: value
      }
    }));
  };

  const pageLabels: Record<string, string> = {
    patients: 'Patient Details',
    staff: 'HRM Members',
    assets: 'Assets Inventory',
    pharmacy: 'Drug Inventory',
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Display Adjustments</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Configure how list items are displayed across different pages</p>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem' }}>Select Page to Configure</label>
          <select 
            value={selectedPage} 
            onChange={(e) => setSelectedPage(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '1rem', color: '#1e293b', background: '#f8fafc' }}
          >
            {Object.keys(pageLabels).map(key => (
              <option key={key} value={key}>{pageLabels[key]}</option>
            ))}
          </select>
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem', textAlign: 'center' }}>
            {pageLabels[selectedPage]}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem' }}>
                <LayoutGrid size={16} /> Grid Columns
              </label>
              <select 
                value={adjustments[selectedPage]?.columns || 3}
                onChange={(e) => updateAdjustment('columns', parseInt(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '1rem' }}
              >
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Columns</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem' }}>
                <List size={16} /> Items Per Page
              </label>
              <select 
                value={adjustments[selectedPage]?.itemsPerPage || 12}
                onChange={(e) => updateAdjustment('itemsPerPage', parseInt(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '1rem' }}
              >
                {[5, 10, 12, 15, 20, 25, 30, 50].map(n => <option key={n} value={n}>{n} Items</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 2.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'all 0.2s' }}
            >
              <Save size={20} /> Save Configuration
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #dbeafe' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.5 }}>
          <strong>Note:</strong> These settings will be applied to the {pageLabels[selectedPage]} list view. 
          Some pages may have responsive limits that override these settings on smaller screens.
        </p>
      </div>
    </div>
  );
};

export default AdjustmentSettings;
