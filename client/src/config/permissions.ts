export type AllPerms = Record<string, Record<string, boolean>>;

export const NON_ADMIN_ROLES = ['Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Cashier'] as const;
export type NonAdminRole = typeof NON_ADMIN_ROLES[number];

export const DEFAULT_PERMISSIONS: AllPerms = {
  Admin:      { dashboard: true,  patients: true,  calendar: true,  inpatient: true,  staff: true,  lab: true,  operation: true,  pharmacy: true,  assets: true,  billing: true  },
  Doctor:     { dashboard: true,  patients: true,  calendar: true,  inpatient: true,  staff: false, lab: true,  operation: true,  pharmacy: true,  assets: false, billing: true  },
  Nurse:      { dashboard: true,  patients: true,  calendar: true,  inpatient: true,  staff: false, lab: true,  operation: false, pharmacy: true,  assets: false, billing: false },
  Pharmacist: { dashboard: true,  patients: true,  calendar: false, inpatient: false, staff: false, lab: false, operation: false, pharmacy: true,  assets: false, billing: false },
  LabTech:    { dashboard: true,  patients: true,  calendar: false, inpatient: false, staff: false, lab: true,  operation: false, pharmacy: false, assets: false, billing: false },
  Cashier:    { dashboard: true,  patients: true,  calendar: true,  inpatient: false, staff: false, lab: false, operation: false, pharmacy: false, assets: false, billing: true  },
};

export const STORAGE_KEY = 'emr_role_permissions';
