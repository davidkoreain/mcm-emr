import React, { useState } from 'react';
import {
  LayoutDashboard, Users, CalendarDays, Bed, Beaker,
  Scissors, Pill, Package, CreditCard, Shield, RotateCcw,
  ChevronDown, ChevronRight, type LucideIcon,
} from 'lucide-react';
import { DEFAULT_PERMISSIONS, NON_ADMIN_ROLES, MENU_STRUCTURE, type AllPerms } from '../config/permissions';

const MENU_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  patients:  Users,
  calendar:  CalendarDays,
  inpatient: Bed,
  staff:     Users,
  lab:       Beaker,
  operation: Scissors,
  pharmacy:  Pill,
  assets:    Package,
  billing:   CreditCard,
};

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
      width: '40px', height: '22px', borderRadius: '11px',
      background: disabled ? '#e2e8f0' : checked ? '#10b981' : '#e2e8f0',
      border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative', transition: 'background 0.2s',
      opacity: disabled ? 0.4 : 1, flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: '2px',
      left: checked && !disabled ? '20px' : '2px',
      width: '18px', height: '18px', borderRadius: '50%',
      background: 'white', transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
    }} />
  </button>
);

const RolePermissions: React.FC<Props> = ({ permissions, onUpdate }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['lab', 'pharmacy']));

  const toggleExpand = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggle = (role: string, key: string, parentKey?: string) => {
    const rolePerms = { ...permissions[role] };
    const next = !rolePerms[key];
    rolePerms[key] = next;

    // Turning parent ON/OFF cascades to children
    if (!parentKey) {
      const item = MENU_STRUCTURE.find(m => m.key === key);
      if (item?.children) {
        for (const child of item.children) {
          rolePerms[child.key] = next;
        }
      }
    }

    onUpdate({ ...permissions, [role]: rolePerms });
  };

  const enabledCount = (role: string) =>
    MENU_STRUCTURE.filter(m => permissions[role]?.[m.key]).length;

  const colStyle: React.CSSProperties = {
    padding: '0.75rem 0.875rem', textAlign: 'center',
    fontSize: '0.75rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.35rem' }}>
            <Shield size={22} color="#6366f1" />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>Role Permissions</h2>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            역할별 사이드바 메뉴 접근 권한을 설정합니다. 1단계 메뉴를 클릭하면 2단계 메뉴가 펼쳐집니다.
          </p>
        </div>
        <button
          onClick={() => onUpdate(DEFAULT_PERMISSIONS)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '0.5rem',
            border: '1px solid #e2e8f0', background: 'white',
            cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', fontWeight: '500',
            whiteSpace: 'nowrap',
          }}
        >
          <RotateCcw size={13} /> Reset to Defaults
        </button>
      </div>

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.35rem 0.875rem', borderRadius: '2rem', background: '#eef2ff', border: '1px solid #c7d2fe', fontSize: '0.78rem', fontWeight: '600', color: '#6366f1' }}>
          Admin — Full Access
        </div>
        {NON_ADMIN_ROLES.map(r => (
          <div key={r} style={{ padding: '0.35rem 0.875rem', borderRadius: '2rem', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.78rem', fontWeight: '600', color: '#475569' }}>
            {r} — {enabledCount(r)}/{MENU_STRUCTURE.length} menus
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ ...colStyle, textAlign: 'left', padding: '0.875rem 1.25rem', color: '#94a3b8', width: '210px' }}>Menu</th>
                <th style={{ ...colStyle, color: '#6366f1' }}>Admin</th>
                {NON_ADMIN_ROLES.map(r => (
                  <th key={r} style={{ ...colStyle, color: ROLE_COLORS[r] }}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MENU_STRUCTURE.map((item, i) => {
                const Icon = MENU_ICONS[item.key];
                const hasChildren = !!(item.children?.length);
                const isExpanded = expanded.has(item.key);
                const isLast = i === MENU_STRUCTURE.length - 1;

                return (
                  <React.Fragment key={item.key}>
                    {/* Parent row */}
                    <tr
                      style={{ borderBottom: (!isExpanded || !hasChildren) && !isLast ? '1px solid #f1f5f9' : 'none', background: hasChildren ? '#fafbff' : 'white' }}
                      onMouseEnter={e => { if (!hasChildren) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (!hasChildren) (e.currentTarget as HTMLElement).style.background = 'white'; }}
                    >
                      <td style={{ padding: '0.8rem 1.25rem' }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: hasChildren ? 'pointer' : 'default' }}
                          onClick={() => hasChildren && toggleExpand(item.key)}
                        >
                          {hasChildren ? (
                            isExpanded
                              ? <ChevronDown size={14} color="#6366f1" style={{ flexShrink: 0 }} />
                              : <ChevronRight size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                          ) : (
                            <span style={{ width: '14px', flexShrink: 0 }} />
                          )}
                          {Icon && <Icon size={15} color={hasChildren ? '#6366f1' : '#94a3b8'} style={{ flexShrink: 0 }} />}
                          <span style={{ fontSize: '0.875rem', fontWeight: hasChildren ? '600' : '500', color: hasChildren ? '#1e293b' : '#374151' }}>
                            {item.label}
                          </span>
                        </div>
                      </td>
                      {/* Admin — always on */}
                      <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle checked disabled /></div>
                      </td>
                      {NON_ADMIN_ROLES.map(r => (
                        <td key={r} style={{ padding: '0.8rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Toggle
                              checked={permissions[r]?.[item.key] ?? false}
                              onChange={() => toggle(r, item.key)}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Child rows */}
                    {hasChildren && isExpanded && item.children!.map((child, ci) => {
                      const isLastChild = ci === item.children!.length - 1;
                      return (
                        <tr
                          key={child.key}
                          style={{ borderBottom: isLastChild && !isLast ? '1px solid #f1f5f9' : isLastChild ? 'none' : '1px solid #f8fafc', background: '#fdfeff' }}
                        >
                          <td style={{ padding: '0.65rem 1.25rem 0.65rem 2.75rem' }}>
                            <span style={{ fontSize: '0.825rem', fontWeight: '400', color: '#64748b' }}>{child.label}</span>
                          </td>
                          {/* Admin sub — always on */}
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle checked disabled /></div>
                          </td>
                          {NON_ADMIN_ROLES.map(r => {
                            const parentOn = permissions[r]?.[item.key] ?? false;
                            return (
                              <td key={r} style={{ padding: '0.65rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  <Toggle
                                    checked={parentOn && (permissions[r]?.[child.key] ?? false)}
                                    disabled={!parentOn}
                                    onChange={() => toggle(r, child.key, item.key)}
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>
        변경사항은 즉시 저장됩니다 · 1단계 메뉴를 끄면 하위 메뉴도 함께 꺼집니다
      </p>
    </div>
  );
};

export default RolePermissions;
