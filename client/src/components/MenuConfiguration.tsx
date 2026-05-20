import React, { useState, useEffect } from 'react';
import {
  ArrowUp, ArrowDown, Plus, Trash2, Save, RotateCcw,
  LayoutDashboard, Users, CalendarDays, Bed, Beaker,
  Scissors, Pill, Package, CreditCard, Shield, Settings, HelpCircle,
  Info, FileText, Heart, Activity
} from 'lucide-react';
import { MENU_STRUCTURE, PATIENT_PORTAL_MENU_STRUCTURE, mergeMenuStructures, type MenuItem } from '../config/permissions';
import { useEMR } from '../context/EMRContext';

const tryParse = <T,>(json: string, fallback: T): T => {
  try { return JSON.parse(json); } catch { return fallback; }
};

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Users, CalendarDays, Bed, Beaker, 
  Scissors, Pill, Package, CreditCard, Shield, Settings,
  Info, FileText, Heart, Activity, HelpCircle
};

const MenuConfiguration: React.FC = () => {
  const { fetchAppSetting, saveAppSetting } = useEMR();
  const [activeTab, setActiveTab] = useState<'main' | 'patient'>('main');
  const [mainMenus, setMainMenus] = useState<MenuItem[]>([]);
  const [patientMenus, setPatientMenus] = useState<MenuItem[]>([]);
  const [icons] = useState(Object.keys(ICON_MAP));

  useEffect(() => {
    const loadMenus = async () => {
      // Load from localStorage first (instant), then override with Supabase (authoritative)
      const localMain = localStorage.getItem('emr_custom_menu_structure');
      setMainMenus(localMain ? mergeMenuStructures(tryParse(localMain, MENU_STRUCTURE), MENU_STRUCTURE) : MENU_STRUCTURE);
      const localPatient = localStorage.getItem('emr_patient_portal_menu_structure');
      setPatientMenus(localPatient ? tryParse(localPatient, PATIENT_PORTAL_MENU_STRUCTURE) : PATIENT_PORTAL_MENU_STRUCTURE);

      const [remoteMain, remotePatient] = await Promise.all([
        fetchAppSetting('emr_custom_menu_structure'),
        fetchAppSetting('emr_patient_portal_menu_structure'),
      ]);
      if (remoteMain) {
        const remoteParsed = Array.isArray(remoteMain) ? remoteMain : [];
        const merged = mergeMenuStructures(remoteParsed, MENU_STRUCTURE);
        setMainMenus(merged);
        localStorage.setItem('emr_custom_menu_structure', JSON.stringify(merged));
      }
      if (remotePatient) { setPatientMenus(remotePatient); localStorage.setItem('emr_patient_portal_menu_structure', JSON.stringify(remotePatient)); }
    };
    loadMenus();
  }, []);

  const currentMenus = activeTab === 'main' ? mainMenus : patientMenus;
  const setCurrentMenus = activeTab === 'main' ? setMainMenus : setPatientMenus;
  const storageKey = activeTab === 'main' ? 'emr_custom_menu_structure' : 'emr_patient_portal_menu_structure';
  const defaultStructure = activeTab === 'main' ? MENU_STRUCTURE : PATIENT_PORTAL_MENU_STRUCTURE;

  const handleSave = async () => {
    localStorage.setItem(storageKey, JSON.stringify(currentMenus));
    try {
      await saveAppSetting(storageKey, currentMenus);
    } catch {
      // Supabase save failed — local save still succeeded
    }
    alert(`${activeTab === 'main' ? 'Main App' : 'Patient Portal'} menu settings saved successfully! Please refresh the page to apply.`);
    window.location.reload();
  };

  const handleReset = () => {
    if (window.confirm(`Reset to default ${activeTab === 'main' ? 'Main App' : 'Patient Portal'} menu configuration?`)) {
      localStorage.removeItem(storageKey);
      setCurrentMenus(defaultStructure);
      window.location.reload();
    }
  };

  const moveMenu = (index: number, direction: 'up' | 'down') => {
    const newMenus = [...currentMenus];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newMenus.length) return;
    
    [newMenus[index], newMenus[targetIndex]] = [newMenus[targetIndex], newMenus[index]];
    setCurrentMenus(newMenus);
  };

  const updateMenu = (index: number, field: keyof MenuItem, value: any) => {
    const newMenus = [...currentMenus];
    newMenus[index] = { ...newMenus[index], [field]: value };
    setCurrentMenus(newMenus);
  };

  const addMenu = () => {
    const newMenu: MenuItem = {
      key: `new_menu_${Date.now()}`,
      label: 'New Menu Item',
      icon: 'HelpCircle'
    };
    setCurrentMenus([...currentMenus, newMenu]);
  };

  const deleteMenu = (index: number) => {
    if (window.confirm('Delete this menu item and all its submenus?')) {
      const newMenus = currentMenus.filter((_, i) => i !== index);
      setCurrentMenus(newMenus);
    }
  };

  const toggleSubmenu = (index: number, subIndex: number, field: string, value: any) => {
    const newMenus = [...currentMenus];
    const children = [...(newMenus[index].children || [])];
    (children[subIndex] as any)[field] = value;
    newMenus[index].children = children;
    setCurrentMenus(newMenus);
  };

  const addSubmenu = (index: number) => {
    const newMenus = [...currentMenus];
    const children = [...(newMenus[index].children || [])];
    children.push({ key: `sub_${Date.now()}`, label: 'New Submenu Item' });
    newMenus[index].children = children;
    setCurrentMenus(newMenus);
  };

  const deleteSubmenu = (index: number, subIndex: number) => {
    const newMenus = [...currentMenus];
    const children = (newMenus[index].children || []).filter((_, i) => i !== subIndex);
    newMenus[index].children = children;
    setCurrentMenus(newMenus);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>Menu setting</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: '500' }}>Configure sidebar menus, orders, and submenus for MCM Clinical System</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.2rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '700', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}>
            <RotateCcw size={16} /> Reset defaults
          </button>
          <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '800', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; }}>
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div style={{ display: 'flex', background: '#e2e8f0', padding: '0.35rem', borderRadius: '0.85rem', width: 'fit-content', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('main')} 
          style={{ 
            padding: '0.6rem 1.5rem', 
            borderRadius: '0.6rem', 
            border: 'none', 
            fontWeight: '800', 
            fontSize: '0.875rem', 
            cursor: 'pointer', 
            background: activeTab === 'main' ? 'white' : 'transparent', 
            color: activeTab === 'main' ? '#1e293b' : '#64748b', 
            transition: 'all 0.2s',
            boxShadow: activeTab === 'main' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
          }}
        >
          Main App Menu
        </button>
        <button 
          onClick={() => setActiveTab('patient')} 
          style={{ 
            padding: '0.6rem 1.5rem', 
            borderRadius: '0.6rem', 
            border: 'none', 
            fontWeight: '800', 
            fontSize: '0.875rem', 
            cursor: 'pointer', 
            background: activeTab === 'patient' ? 'white' : 'transparent', 
            color: activeTab === 'patient' ? '#1e293b' : '#64748b', 
            transition: 'all 0.2s',
            boxShadow: activeTab === 'patient' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
          }}
        >
          Patient Portal Menu
        </button>
      </div>

      {/* Main List Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {currentMenus.map((menu, index) => (
          <div key={menu.key} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              {/* Order Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: '#f8fafc', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid #f1f5f9' }}>
                <button onClick={() => moveMenu(index, 'up')} disabled={index === 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? '#cbd5e1' : '#475569', borderRadius: '0.25rem' }}
                  onMouseEnter={(e) => { if(index !== 0) e.currentTarget.style.background = '#e2e8f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}><ArrowUp size={16} /></button>
                <button onClick={() => moveMenu(index, 'down')} disabled={index === currentMenus.length - 1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'none', border: 'none', cursor: index === currentMenus.length - 1 ? 'not-allowed' : 'pointer', color: index === currentMenus.length - 1 ? '#cbd5e1' : '#475569', borderRadius: '0.25rem' }}
                  onMouseEnter={(e) => { if(index !== currentMenus.length - 1) e.currentTarget.style.background = '#e2e8f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}><ArrowDown size={16} /></button>
              </div>

              {/* Menu Details Form */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menu Label</label>
                  <input 
                    value={menu.label} 
                    onChange={(e) => updateMenu(index, 'label', e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', transition: 'all 0.2s' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key / Route</label>
                  <input 
                    value={menu.key} 
                    onChange={(e) => updateMenu(index, 'key', e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: '500', color: '#64748b', transition: 'all 0.2s' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sidebar Icon</label>
                  <select 
                    value={menu.icon || ''} 
                    onChange={(e) => updateMenu(index, 'icon', e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', background: 'white', cursor: 'pointer' }}
                  >
                    {icons.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    <option value="HelpCircle">Other Icon</option>
                  </select>
                </div>
              </div>

              {/* Delete Menu */}
              <button onClick={() => deleteMenu(index)} style={{ padding: '0.6rem', color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', alignSelf: 'center' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#b91c1c'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}><Trash2 size={18} /></button>
            </div>

            {/* Submenus Configuration */}
            <div style={{ marginTop: '1.25rem', paddingLeft: '2.5rem', borderLeft: '2px solid #f1f5f9' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submenus / Journey steps</span>
                {(menu.children || []).map((sub, subIndex) => (
                  <div key={sub.key} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <input 
                        placeholder="Submenu Label"
                        value={sub.label} 
                        onChange={(e) => toggleSubmenu(index, subIndex, 'label', e.target.value)}
                        style={{ padding: '0.5rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}
                      />
                      <input 
                        placeholder="Submenu Key"
                        value={sub.key} 
                        onChange={(e) => toggleSubmenu(index, subIndex, 'key', e.target.value)}
                        style={{ padding: '0.5rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#64748b' }}
                      />
                    </div>
                    <button onClick={() => deleteSubmenu(index, subIndex)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}><Trash2 size={16} /></button>
                  </div>
                ))}
                <button 
                  onClick={() => addSubmenu(index)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '800', width: 'fit-content', padding: '0.25rem 0', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#1d4ed8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#2563eb'; }}
                >
                  <Plus size={14} /> Add Submenu / Journey Step
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Top Level Menu */}
        <button 
          onClick={addMenu}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.25rem', border: '2px dashed #cbd5e1', borderRadius: '1rem', color: '#475569', background: '#f8fafc', cursor: 'pointer', fontWeight: '800', fontSize: '0.95rem', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        >
          <Plus size={20} /> Add New 1st Level Menu
        </button>
      </div>
    </div>
  );
};

export default MenuConfiguration;
