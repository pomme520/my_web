export const Role = {
  admin: 'admin',
  technician: 'technician',
  viewer: 'viewer'
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const PermissionName = {
  queryOrders: 'queryOrders',
  updateStatus: 'updateStatus',
  managePermissions: 'managePermissions'
} as const;

export type PermissionName = (typeof PermissionName)[keyof typeof PermissionName];
