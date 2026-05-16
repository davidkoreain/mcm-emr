import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, Save, Monitor, Smartphone } from 'lucide-react';

const ADJUSTMENT_STORAGE_KEY = 'emr_page_adjustments';

interface PageAdjustment {
  columns: number;
  itemsPerPage: number;
  mobileColumns: number;
  mobileItemsPerPage: number;
}

const DEFAULT_ADJUSTMENTS: Record<string, PageAdjustment> = {
  patients: { columns: 3, itemsPerPage: 12, mobileColumns: 1, mobileItemsPerPage: 6 },
  staff: { columns: 3, itemsPerPage: 12, mobileColumns: 1, mobileItemsPerPage: 6 },
  assets: { columns: 4, itemsPerPage: 16, mobileColumns: 1, mobileItemsPerPage: 8 },
  pharmacy: { columns: 3, itemsPerPage: 12, mobileColumns: 1, mobileItemsPerPage: 6 },
};

const AdjustmentSettings: React.FC = () => {
  const [selectedPage, setSelectedPage] = useState('patients');
  const [adjustments, setAdjustments] = useState<Record<string, PageAdjustment>>(DEFAULT_ADJUSTMENTS);
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    const saved = localStorage.getItem(ADJUSTMENT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure new fields exist
        const merged = { ...DEFAULT_ADJUSTMENTS };
        Object.keys(parsed).forEach(key => {
          merged[key] = { ...DEFAULT_ADJUSTMENTS[key], ...parsed[key] };
        });
        setAdjustments(merged);
      } catch {
        setAdjustments(DEFAULT_ADJUSTMENTS);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(ADJUSTMENT_STORAGE_KEY, JSON.stringify(adjustments));
    // Dispatch a storage event so other tabs/components can update
    window.dispatchEvent(new Event('storage'));
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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Display Adjustments</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Configure how list items are displayed on Desktop and Mobile</p>
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

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <button 
            onClick={() => setActiveTab('desktop')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', 
              border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '700',
              borderBottom: activeTab === 'desktop' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'desktop' ? '#2563eb' : '#64748b'
            }}
          >
            <Monitor size={20} /> Desktop View
          </button>
          <button 
            onClick={() => setActiveTab('mobile')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', 
              border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '700',
              borderBottom: activeTab === 'mobile' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'mobile' ? '#2563eb' : '#64748b'
            }}
          >
            <Smartphone size={20} /> Mobile View
          </button>
        </div>

        <div style={{ padding: '1rem 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '1rem' }}>
                <LayoutGrid size={18} /> {activeTab === 'desktop' ? 'Grid Columns' : 'Mobile Grid Columns'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.75rem' }}>
                {(activeTab === 'desktop' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3]).map(n => (
                  <button
                    key={n}
                    onClick={() => updateAdjustment(activeTab === 'desktop' ? 'columns' : 'mobileColumns', n)}
                    style={{
                      padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0',
                      background: (activeTab === 'desktop' ? adjustments[selectedPage]?.columns : adjustments[selectedPage]?.mobileColumns) === n ? '#eff6ff' : 'white',
                      borderColor: (activeTab === 'desktop' ? adjustments[selectedPage]?.columns : adjustments[selectedPage]?.mobileColumns) === n ? '#3b82f6' : '#e2e8f0',
                      color: (activeTab === 'desktop' ? adjustments[selectedPage]?.columns : adjustments[selectedPage]?.mobileColumns) === n ? '#2563eb' : '#475569',
                      fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '1rem' }}>
                <List size={18} /> Items Per Page
              </label>
              <select 
                value={activeTab === 'desktop' ? adjustments[selectedPage]?.itemsPerPage : adjustments[selectedPage]?.mobileItemsPerPage}
                onChange={(e) => updateAdjustment(activeTab === 'desktop' ? 'itemsPerPage' : 'mobileItemsPerPage', parseInt(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '1rem' }}
              >
                {(activeTab === 'desktop' ? [5, 10, 12, 15, 20, 25, 30, 50] : [3, 5, 6, 8, 10, 12, 15]).map(n => (
                  <option key={n} value={n}>{n} Items</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 3rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1.1rem', fontWeight: '700', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
            >
              <Save size={20} /> Save Configuration
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#eff6ff', borderRadius: '1rem', border: '1px solid #dbeafe', display: 'flex', gap: '1rem' }}>
        <div style={{ padding: '0.5rem', background: '#3b82f6', borderRadius: '0.5rem', color: 'white', height: 'fit-content' }}>
          <Monitor size={20} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af', lineHeight: 1.5 }}>
            <strong>Note:</strong> Settings for <strong>{pageLabels[selectedPage]}</strong> will be saved separately for Desktop and Mobile. 
            Mobile settings (width &lt; 768px) will automatically take effect on smartphones and tablets to ensure the interface remains organized and readable.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentSettings;

