export const Role = {
  admin: 'admin',
  technician: 'technician',
  viewer: 'viewer'
} as const;

export type Role = (typeof Role)[keyof typeof Role];
export const ROLES = [Role.admin, Role.technician, Role.viewer] as const;

export const PermissionName = {
  queryOrders: 'queryOrders',
  updateStatus: 'updateStatus',
  managePermissions: 'managePermissions'
} as const;

export type PermissionName = (typeof PermissionName)[keyof typeof PermissionName];
export const PERMISSION_NAMES = [PermissionName.queryOrders, PermissionName.updateStatus, PermissionName.managePermissions] as const;

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function isPermissionName(value: string): value is PermissionName {
  return (PERMISSION_NAMES as readonly string[]).includes(value);
}
