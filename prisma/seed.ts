import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, getDefaultPermissionsForRole, roles } from '../lib/permissions';

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

  for (const role of roles) {
    for (const permission of getDefaultPermissionsForRole(role)) {
      await prisma.permission.upsert({
        where: { role_name: { role: permission.role, name: permission.name } },
        update: { enabled: permission.enabled },
        create: permission
      });
    }
  }
}

main().finally(() => prisma.$disconnect());
