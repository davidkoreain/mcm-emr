import React from 'react';
import {
  LayoutDashboard, Users, CalendarDays, Bed, Beaker,
  Scissors, Pill, Package, CreditCard, Shield, RotateCcw,
} from 'lucide-react';
import { DEFAULT_PERMISSIONS, NON_ADMIN_ROLES, type AllPerms } from '../config/permissions';

const MENU_DISPLAY = [
  { key: 'dashboard', label: 'Flow Board',     icon: LayoutDashboard },
  { key: 'patients',  label: 'Patient Details', icon: Users           },
  { key: 'calendar',  label: 'Appointments',    icon: CalendarDays    },
  { key: 'inpatient', label: 'Inpatient Ward',  icon: Bed             },
  { key: 'staff',     label: 'HRM',             icon: Users           },
  { key: 'lab',       label: 'Laboratory',      icon: Beaker          },
  { key: 'operation', label: 'Operations',      icon: Scissors        },
  { key: 'pharmacy',  label: 'Pharmacy',         icon: Pill            },
  { key: 'assets',    label: 'Assets',           icon: Package         },
  { key: 'billing',   label: 'Billing',          icon: CreditCard      },
];

const ROLE_COLORS: Record<string, string> = {
  Doctor: '#3b82f6', Nurse: '#10b981', Pharmacist: '#8b5cf6',
  LabTech: '#f59e0b', Cashier: '#ef4444',
};

interface Props {
  permissions: AllPerms;
  onUpdate: (perms: AllPerms) => void;
}

const Toggle: React.FC<{ checked: boolean; onChange?: () => void; disabled?: boolean }> = ({
  checked, onChange, disabled,
}) => (
  <button
    onClick={disabled ? undefined : onChange}
    role="switch"
    aria-checked={checked}
    style={{
      width: '44px', height: '24px', borderRadius: '12px',
      background: checked ? '#10b981' : '#e2e8f0',
      border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative', transition: 'background 0.2s',
      opacity: disabled ? 0.45 : 1, flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: '2px',
      left: checked ? '22px' : '2px',
      width: '20px', height: '20px', borderRadius: '50%',
      background: 'white', transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
    }} />
  </button>
);

const RolePermissions: React.FC<Props> = ({ permissions, onUpdate }) => {
  const toggle = (role: string, key: string) => {
    onUpdate({
      ...permissions,
      [role]: { ...permissions[role], [key]: !permissions[role]?.[key] },
    });
  };

  const enabledCount = (role: string) =>
    MENU_DISPLAY.filter(m => permissions[role]?.[m.key]).length;

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
            <Shield size={22} color="#6366f1" />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
              Role Permissions
            </h2>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            사이드바 메뉴 접근 권한을 역할별로 설정합니다. Admin은 항상 전체 접근 권한을 가집니다.
          </p>
        </div>
        <button
          onClick={() => onUpdate(DEFAULT_PERMISSIONS)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '0.5rem',
            border: '1px solid #e2e8f0', background: 'white',
            cursor: 'pointer', fontSize: '0.8rem', color: '#64748b',
            fontWeight: '500', whiteSpace: 'nowrap',
          }}
        >
          <RotateCcw size={13} /> Reset to Defaults
        </button>
      </div>

      {/* Role summary badges */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ padding: '0.4rem 0.875rem', borderRadius: '2rem', background: '#eef2ff', border: '1px solid #c7d2fe', fontSize: '0.8rem', fontWeight: '600', color: '#6366f1' }}>
          Admin — Full Access
        </div>
        {NON_ADMIN_ROLES.map(r => (
          <div key={r} style={{
            padding: '0.4rem 0.875rem', borderRadius: '2rem',
            background: '#f8fafc', border: '1px solid #e2e8f0',
            fontSize: '0.8rem', fontWeight: '600', color: '#475569',
          }}>
            {r} — {enabledCount(r)}/{MENU_DISPLAY.length} menus
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', width: '190px' }}>
                  Menu
                </th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Admin
                </th>
                {NON_ADMIN_ROLES.map(r => (
                  <th key={r} style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', color: ROLE_COLORS[r] ?? '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MENU_DISPLAY.map(({ key, label, icon: Icon }, i) => (
                <tr
                  key={key}
                  style={{ borderBottom: i < MENU_DISPLAY.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.875rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <Icon size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{label}</span>
                    </div>
                  </td>
                  {/* Admin — always on */}
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Toggle checked disabled />
                    </div>
                  </td>
                  {NON_ADMIN_ROLES.map(r => (
                    <td key={r} style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Toggle
                          checked={permissions[r]?.[key] ?? false}
                          onChange={() => toggle(r, key)}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ marginTop: '0.875rem', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>
        변경사항은 즉시 저장됩니다
      </p>
    </div>
  );
};

export default RolePermissions;
