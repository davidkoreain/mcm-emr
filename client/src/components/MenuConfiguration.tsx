import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, ArrowDown, Plus, Trash2, Save, RotateCcw, 
  LayoutDashboard, Users, CalendarDays, Bed, Beaker, 
  Scissors, Pill, Package, CreditCard, Shield, Settings, HelpCircle
} from 'lucide-react';
import { MENU_STRUCTURE, type MenuItem } from '../config/permissions';

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Users, CalendarDays, Bed, Beaker, 
  Scissors, Pill, Package, CreditCard, Shield, Settings
};

const STORAGE_KEY = 'emr_custom_menu_structure';

const MenuConfiguration: React.FC = () => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [icons] = useState(Object.keys(ICON_MAP));

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMenus(JSON.parse(saved));
      } catch {
        setMenus(MENU_STRUCTURE);
      }
    } else {
      setMenus(MENU_STRUCTURE);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(menus));
    alert('Menu structure saved! Please refresh the page to apply changes.');
    window.location.reload();
  };

  const handleReset = () => {
    if (window.confirm('Reset to default menu structure?')) {
      localStorage.removeItem(STORAGE_KEY);
      setMenus(MENU_STRUCTURE);
      window.location.reload();
    }
  };

  const moveMenu = (index: number, direction: 'up' | 'down') => {
    const newMenus = [...menus];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newMenus.length) return;
    
    [newMenus[index], newMenus[targetIndex]] = [newMenus[targetIndex], newMenus[index]];
    setMenus(newMenus);
  };

  const updateMenu = (index: number, field: keyof MenuItem, value: any) => {
    const newMenus = [...menus];
    newMenus[index] = { ...newMenus[index], [field]: value };
    setMenus(newMenus);
  };

  const addMenu = () => {
    const newMenu: MenuItem = {
      key: `new_menu_${Date.now()}`,
      label: 'New Menu',
      icon: 'HelpCircle'
    };
    setMenus([...menus, newMenu]);
  };

  const deleteMenu = (index: number) => {
    if (window.confirm('Delete this menu and all its submenus?')) {
      const newMenus = menus.filter((_, i) => i !== index);
      setMenus(newMenus);
    }
  };

  const toggleSubmenu = (index: number, subIndex: number, field: string, value: any) => {
    const newMenus = [...menus];
    const children = [...(newMenus[index].children || [])];
    (children[subIndex] as any)[field] = value;
    newMenus[index].children = children;
    setMenus(newMenus);
  };

  const addSubmenu = (index: number) => {
    const newMenus = [...menus];
    const children = [...(newMenus[index].children || [])];
    children.push({ key: `sub_${Date.now()}`, label: 'New Submenu' });
    newMenus[index].children = children;
    setMenus(newMenus);
  };

  const deleteSubmenu = (index: number, subIndex: number) => {
    const newMenus = [...menus];
    const children = (newMenus[index].children || []).filter((_, i) => i !== subIndex);
    newMenus[index].children = children;
    setMenus(newMenus);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Menu Configuration</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Customize your sidebar navigation structure</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {menus.map((menu, index) => (
          <div key={menu.key} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button onClick={() => moveMenu(index, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', color: index === 0 ? '#cbd5e1' : '#64748b' }}><ArrowUp size={18} /></button>
                <button onClick={() => moveMenu(index, 'down')} disabled={index === menus.length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: index === menus.length - 1 ? '#cbd5e1' : '#64748b' }}><ArrowDown size={18} /></button>
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.35rem' }}>Label</label>
                  <input 
                    value={menu.label} 
                    onChange={(e) => updateMenu(index, 'label', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.35rem' }}>Key</label>
                  <input 
                    value={menu.key} 
                    onChange={(e) => updateMenu(index, 'key', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.35rem' }}>Icon</label>
                  <select 
                    value={menu.icon || ''} 
                    onChange={(e) => updateMenu(index, 'icon', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                  >
                    {icons.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    <option value="HelpCircle">Other</option>
                  </select>
                </div>
              </div>

              <button onClick={() => deleteMenu(index)} style={{ padding: '0.5rem', color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '0.375rem', cursor: 'pointer' }}><Trash2 size={18} /></button>
            </div>

            {/* Submenus */}
            <div style={{ marginTop: '1rem', paddingLeft: '2.5rem', borderLeft: '2px solid #f1f5f9' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(menu.children || []).map((sub, subIndex) => (
                  <div key={sub.key} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <input 
                        placeholder="Submenu Label"
                        value={sub.label} 
                        onChange={(e) => toggleSubmenu(index, subIndex, 'label', e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                      />
                      <input 
                        placeholder="Submenu Key"
                        value={sub.key} 
                        onChange={(e) => toggleSubmenu(index, subIndex, 'key', e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                      />
                    </div>
                    <button onClick={() => deleteSubmenu(index, subIndex)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                ))}
                <button 
                  onClick={() => addSubmenu(index)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', width: 'fit-content', padding: '0.25rem 0' }}
                >
                  <Plus size={14} /> Add Submenu
                </button>
              </div>
            </div>
          </div>
        ))}
        <button 
          onClick={addMenu}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', border: '2px dashed #e2e8f0', borderRadius: '0.75rem', color: '#64748b', background: 'none', cursor: 'pointer', fontWeight: '600' }}
        >
          <Plus size={20} /> Add New 1st Level Menu
        </button>
      </div>
    </div>
  );
};

export default MenuConfiguration;
