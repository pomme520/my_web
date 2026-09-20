import { PrismaClient, PermissionName, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 12);
  const users = [
    { username: 'admin', role: Role.admin },
    { username: 'technician', role: Role.technician },
    { username: 'viewer', role: Role.viewer }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: { role: user.role, passwordHash },
      create: { username: user.username, role: user.role, passwordHash }
    });
  }

  const permissions = [
    [Role.admin, PermissionName.queryOrders, true],
    [Role.admin, PermissionName.updateStatus, true],
    [Role.admin, PermissionName.managePermissions, true],
    [Role.technician, PermissionName.queryOrders, true],
    [Role.technician, PermissionName.updateStatus, true],
    [Role.technician, PermissionName.managePermissions, false],
    [Role.viewer, PermissionName.queryOrders, true],
    [Role.viewer, PermissionName.updateStatus, false],
    [Role.viewer, PermissionName.managePermissions, false]
  ] as const;

  for (const [role, name, enabled] of permissions) {
    await prisma.permission.upsert({
      where: { role_name: { role, name } },
      update: { enabled },
      create: { role, name, enabled }
    });
  }
}

main().finally(() => prisma.$disconnect());
