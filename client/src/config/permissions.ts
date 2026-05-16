export type AllPerms = Record<string, Record<string, boolean>>;

export const NON_ADMIN_ROLES = ['Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Cashier'] as const;
export type NonAdminRole = typeof NON_ADMIN_ROLES[number];

export interface MenuItem {
  key: string;
  label: string;
  children?: { key: string; label: string }[];
}

export const MENU_STRUCTURE: MenuItem[] = [
  { key: 'dashboard', label: 'Flow Board' },
  { key: 'patients',  label: 'Patient Details' },
  { key: 'calendar',  label: 'Appointments' },
  { key: 'inpatient', label: 'Inpatient Ward' },
  { key: 'staff',     label: 'HRM', children: [
    { key: 'staff.portfolio',   label: 'Members' },
    { key: 'staff.leave',       label: 'Leave Mgmt' },
    { key: 'staff.performance', label: 'Performance' },
  ]},
  { key: 'lab',       label: 'Laboratory', children: [
    { key: 'lab.orders',  label: 'Pending Orders' },
    { key: 'lab.results', label: 'Results' },
  ]},
  { key: 'operation', label: 'Operations', children: [
    { key: 'operation.schedule',  label: 'OT Schedule' },
    { key: 'operation.resources', label: 'Resources' },
    { key: 'operation.supplies',  label: 'Supply Tracking' },
  ]},
  { key: 'pharmacy',  label: 'Pharmacy', children: [
    { key: 'pharmacy.prescriptions', label: 'Prescriptions' },
    { key: 'pharmacy.inventory',     label: 'Drug Inventory' },
  ]},
  { key: 'assets',    label: 'Assets', children: [
    { key: 'assets.inventory',   label: 'Inventory' },
    { key: 'assets.maintenance', label: 'Maintenance' },
    { key: 'assets.loss',        label: 'Loss & Damage' },
  ]},
  { key: 'billing',   label: 'Billing' },
];

export const DEFAULT_PERMISSIONS: AllPerms = {
  Admin: {
    dashboard: true, patients: true, calendar: true, inpatient: true, billing: true,
    staff: true, 'staff.portfolio': true, 'staff.leave': true, 'staff.performance': true,
    lab: true, 'lab.orders': true, 'lab.results': true,
    operation: true, 'operation.schedule': true, 'operation.resources': true, 'operation.supplies': true,
    pharmacy: true, 'pharmacy.prescriptions': true, 'pharmacy.inventory': true,
    assets: true, 'assets.inventory': true, 'assets.maintenance': true, 'assets.loss': true,
  },
  Doctor: {
    dashboard: true, patients: true, calendar: true, inpatient: true, billing: true,
    staff: false, 'staff.portfolio': false, 'staff.leave': false, 'staff.performance': false,
    lab: true, 'lab.orders': true, 'lab.results': true,
    operation: true, 'operation.schedule': true, 'operation.resources': false, 'operation.supplies': false,
    pharmacy: true, 'pharmacy.prescriptions': true, 'pharmacy.inventory': false,
    assets: false, 'assets.inventory': false, 'assets.maintenance': false, 'assets.loss': false,
  },
  Nurse: {
    dashboard: true, patients: true, calendar: true, inpatient: true, billing: false,
    staff: false, 'staff.portfolio': false, 'staff.leave': false, 'staff.performance': false,
    lab: true, 'lab.orders': false, 'lab.results': true,
    operation: false, 'operation.schedule': false, 'operation.resources': false, 'operation.supplies': false,
    pharmacy: true, 'pharmacy.prescriptions': true, 'pharmacy.inventory': false,
    assets: false, 'assets.inventory': false, 'assets.maintenance': false, 'assets.loss': false,
  },
  Pharmacist: {
    dashboard: true, patients: true, calendar: false, inpatient: false, billing: false,
    staff: false, 'staff.portfolio': false, 'staff.leave': false, 'staff.performance': false,
    lab: false, 'lab.orders': false, 'lab.results': false,
    operation: false, 'operation.schedule': false, 'operation.resources': false, 'operation.supplies': false,
    pharmacy: true, 'pharmacy.prescriptions': true, 'pharmacy.inventory': true,
    assets: false, 'assets.inventory': false, 'assets.maintenance': false, 'assets.loss': false,
  },
  LabTech: {
    dashboard: true, patients: true, calendar: false, inpatient: false, billing: false,
    staff: false, 'staff.portfolio': false, 'staff.leave': false, 'staff.performance': false,
    lab: true, 'lab.orders': true, 'lab.results': true,
    operation: false, 'operation.schedule': false, 'operation.resources': false, 'operation.supplies': false,
    pharmacy: false, 'pharmacy.prescriptions': false, 'pharmacy.inventory': false,
    assets: false, 'assets.inventory': false, 'assets.maintenance': false, 'assets.loss': false,
  },
  Cashier: {
    dashboard: true, patients: true, calendar: true, inpatient: false, billing: true,
    staff: false, 'staff.portfolio': false, 'staff.leave': false, 'staff.performance': false,
    lab: false, 'lab.orders': false, 'lab.results': false,
    operation: false, 'operation.schedule': false, 'operation.resources': false, 'operation.supplies': false,
    pharmacy: false, 'pharmacy.prescriptions': false, 'pharmacy.inventory': false,
    assets: false, 'assets.inventory': false, 'assets.maintenance': false, 'assets.loss': false,
  },
};

// v2: includes sub-menu keys
export const STORAGE_KEY = 'emr_role_permissions_v2';
