export type AllPerms = Record<string, Record<string, boolean>>;

export const NON_ADMIN_ROLES = ['Manager', 'Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Cashier'] as const;
export type NonAdminRole = typeof NON_ADMIN_ROLES[number];

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  children?: { key: string; label: string; icon?: string }[];
}

export const MENU_STRUCTURE: MenuItem[] = [
  { key: 'dashboard', label: 'Flow Board', icon: 'LayoutDashboard' },
  { key: 'my_schedule', label: 'My Schedule', icon: 'CalendarDays' },
  { key: 'patients',  label: 'Patient Details', icon: 'Users' },
  { key: 'calendar',  label: 'Appointments', icon: 'CalendarDays' },
  { key: 'inpatient', label: 'Inpatient Ward', icon: 'Bed' },
  { key: 'staff',     label: 'HRM', icon: 'Users', children: [
    { key: 'staff.portfolio',   label: 'Members' },
    { key: 'staff.leave',       label: 'Leave Mgmt' },
    { key: 'staff.performance', label: 'Performance' },
  ]},
  { key: 'lab',       label: 'Laboratory', icon: 'Beaker', children: [
    { key: 'lab.orders',  label: 'Pending Orders' },
    { key: 'lab.results', label: 'Results' },
  ]},
  { key: 'operation', label: 'Operations', icon: 'Scissors', children: [
    { key: 'operation.schedule',  label: 'OT Schedule' },
    { key: 'operation.resources', label: 'Resources' },
    { key: 'operation.supplies',  label: 'Supply Tracking' },
  ]},
  { key: 'pharmacy',  label: 'Pharmacy', icon: 'Pill', children: [
    { key: 'pharmacy.prescriptions', label: 'Prescriptions' },
    { key: 'pharmacy.inventory',     label: 'Drug Inventory' },
    { key: 'pharmacy.history',       label: 'Inventory History' },
  ]},
  { key: 'assets',    label: 'Assets', icon: 'Package', children: [
    { key: 'assets.inventory',   label: 'Inventory' },
    { key: 'assets.maintenance', label: 'Maintenance' },
    { key: 'assets.loss',        label: 'Loss & Damage' },
  ]},
  { key: 'billing',   label: 'Billing', icon: 'CreditCard' },
  { key: 'settings',  label: 'Settings', icon: 'Settings', children: [
    { key: 'settings.permissions', label: 'Permissions' },
    { key: 'settings.menu_config', label: 'Menu setting' },
    { key: 'settings.adjustment',  label: 'Adjustment' },
  ]}
];

export const PATIENT_PORTAL_MENU_STRUCTURE: MenuItem[] = [
  { key: 'info', label: 'Patient Information', icon: 'Info' },
  { key: 'records', label: 'Medical Records', icon: 'FileText' },
  { 
    key: 'appointments', 
    label: 'Appointments', 
    icon: 'CalendarDays', 
    children: [
      { key: 'step-1', label: 'Discovery' },
      { key: 'step-2', label: 'Application' },
      { key: 'step-3', label: 'Confirmation' },
      { key: 'step-4', label: 'Visit' },
      { key: 'step-5', label: 'Admission' },
      { key: 'step-6', label: 'Consultation' },
      { key: 'step-7', label: 'Examination' },
      { key: 'step-8', label: 'Results' },
      { key: 'step-9', label: 'Diagnosis' },
      { key: 'step-10', label: 'Treatment Plan' },
      { key: 'step-11', label: 'Therapy' },
      { key: 'step-12', label: 'Procedure' },
      { key: 'step-13', label: 'Monitoring' },
      { key: 'step-14', label: 'Feedback' },
    ] 
  },
  { key: 'schedule', label: 'My Schedule', icon: 'CalendarDays' },
  { key: 'settings', label: 'Settings', icon: 'Settings' }
];

export const DEFAULT_PERMISSIONS: AllPerms = {
  Admin: {
    dashboard: true, my_schedule: true, patients: true, calendar: true, inpatient: true, billing: true,
    staff: true, 'staff.portfolio': true, 'staff.leave': true, 'staff.performance': true,
    lab: true, 'lab.orders': true, 'lab.results': true,
    operation: true, 'operation.schedule': true, 'operation.resources': true, 'operation.supplies': true,
    pharmacy: true, 'pharmacy.prescriptions': true, 'pharmacy.inventory': true, 'pharmacy.history': true,
    assets: true, 'assets.inventory': true, 'assets.maintenance': true, 'assets.loss': true,
    settings: true, 'settings.permissions': true, 'settings.menu_config': true, 'settings.adjustment': true,
  },
  Manager: {
    dashboard: true, my_schedule: true, patients: true, calendar: true, inpatient: false, billing: false,
    staff: false, 'staff.portfolio': false, 'staff.leave': false, 'staff.performance': false,
    lab: false, 'lab.orders': false, 'lab.results': false,
    operation: false, 'operation.schedule': false, 'operation.resources': false, 'operation.supplies': false,
    pharmacy: false, 'pharmacy.prescriptions': false, 'pharmacy.inventory': false, 'pharmacy.history': false,
    assets: false, 'assets.inventory': false, 'assets.maintenance': false, 'assets.loss': false,
    settings: false, 'settings.permissions': false, 'settings.menu_config': false, 'settings.adjustment': false,
  },
  Doctor: {
    dashboard: true, my_schedule: true, patients: true, calendar: true, inpatient: true, billing: true,
    staff: false, 'staff.portfolio': false, 'staff.leave': false, 'staff.performance': false,
    lab: true, 'lab.orders': true, 'lab.results': true,
    operation: true, 'operation.schedule': true, 'operation.resources': false, 'operation.supplies': false,
    pharmacy: true, 'pharmacy.prescriptions': true, 'pharmacy.inventory': false, 'pharmacy.history': false,
    assets: false, 'assets.inventory': false, 'assets.maintenance': false, 'assets.loss': false,
    settings: false, 'settings.permissions': false, 'settings.menu_config': false, 'settings.adjustment': false,
  },
  Nurse: {
    dashboard: true, my_schedule: true, patients: true, calendar: true, inpatient: true, billing: false,
    staff: false, 'staff.portfolio': false, 'staff.leave': false, 'staff.performance': false,
    lab: true, 'lab.orders': false, 'lab.results': true,
    operation: false, 'operation.schedule': false, 'operation.resources': false, 'operation.supplies': false,
    pharmacy: true, 'pharmacy.prescriptions': true, 'pharmacy.inventory': false, 'pharmacy.history': false,
    assets: false, 'assets.inventory': false, 'assets.maintenance': false, 'assets.loss': false,
    settings: false, 'settings.permissions': false, 'settings.menu_config': false, 'settings.adjustment': false,
  },
  Pharmacist: {
    dashboard: true, my_schedule: true, patients: true, calendar: false, inpatient: false, billing: false,
    staff: false, 'staff.portfolio': false, 'staff.leave': false, 'staff.performance': false,
    lab: false, 'lab.orders': false, 'lab.results': false,
    operation: false, 'operation.schedule': false, 'operation.resources': false, 'operation.supplies': false,
    pharmacy: true, 'pharmacy.prescriptions': true, 'pharmacy.inventory': true, 'pharmacy.history': true,
    assets: false, 'assets.inventory': false, 'assets.maintenance': false, 'assets.loss': false,
    settings: false, 'settings.permissions': false, 'settings.menu_config': false, 'settings.adjustment': false,
  },
  LabTech: {
    dashboard: true, my_schedule: true, patients: true, calendar: false, inpatient: false, billing: false,
    staff: false, 'staff.portfolio': false, 'staff.leave': false, 'staff.performance': false,
    lab: true, 'lab.orders': true, 'lab.results': true,
    operation: false, 'operation.schedule': false, 'operation.resources': false, 'operation.supplies': false,
    pharmacy: false, 'pharmacy.prescriptions': false, 'pharmacy.inventory': false, 'pharmacy.history': false,
    assets: false, 'assets.inventory': false, 'assets.maintenance': false, 'assets.loss': false,
    settings: false, 'settings.permissions': false, 'settings.menu_config': false, 'settings.adjustment': false,
  },
  Cashier: {
    dashboard: true, my_schedule: true, patients: true, calendar: true, inpatient: false, billing: true,
    staff: false, 'staff.portfolio': false, 'staff.leave': false, 'staff.performance': false,
    lab: false, 'lab.orders': false, 'lab.results': false,
    operation: false, 'operation.schedule': false, 'operation.resources': false, 'operation.supplies': false,
    pharmacy: false, 'pharmacy.prescriptions': false, 'pharmacy.inventory': false, 'pharmacy.history': false,
    assets: false, 'assets.inventory': false, 'assets.maintenance': false, 'assets.loss': false,
    settings: false, 'settings.permissions': false, 'settings.menu_config': false, 'settings.adjustment': false,
  },
};

// v2: includes sub-menu keys
export const STORAGE_KEY = 'emr_role_permissions_v2';
