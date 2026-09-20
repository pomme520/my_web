export const Role = {
  admin: 'admin',
  technician: 'technician',
  viewer: 'viewer'
} as const;

export type Role = (typeof Role)[keyof typeof Role];
export const roles: Role[] = [Role.admin, Role.technician, Role.viewer];

export const PermissionName = {
  queryOrders: 'queryOrders',
  updateStatus: 'updateStatus',
  managePermissions: 'managePermissions'
} as const;

export type PermissionName = (typeof PermissionName)[keyof typeof PermissionName];
export const permissionNames: PermissionName[] = [
  PermissionName.queryOrders,
  PermissionName.updateStatus,
  PermissionName.managePermissions
];

const defaultRolePermissions: Record<Role, Record<PermissionName, boolean>> = {
  [Role.admin]: {
    [PermissionName.queryOrders]: true,
    [PermissionName.updateStatus]: true,
    [PermissionName.managePermissions]: true
  },
  [Role.technician]: {
    [PermissionName.queryOrders]: true,
    [PermissionName.updateStatus]: true,
    [PermissionName.managePermissions]: false
  },
  [Role.viewer]: {
    [PermissionName.queryOrders]: true,
    [PermissionName.updateStatus]: false,
    [PermissionName.managePermissions]: false
  }
};

export function getDefaultPermissionsForRole(role: Role) {
  return permissionNames.map((name) => ({
    role,
    name,
    enabled: defaultRolePermissions[role][name]
  }));
}
