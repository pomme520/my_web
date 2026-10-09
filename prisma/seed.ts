import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, getDefaultPermissionsForRole, roles } from '../lib/permissions';

const prisma = new PrismaClient();

async function main() {
  const isProd = process.env.NODE_ENV === 'production';
  const initialPassword = process.env.SEED_ADMIN_PASSWORD ?? (isProd ? '' : '123456');
  if (!initialPassword || (isProd && initialPassword.length < 12)) {
    throw new Error('Production seeding requires SEED_ADMIN_PASSWORD (min 12 chars).');
  }
  const passwordHash = await bcrypt.hash(initialPassword, 12);
  const users = isProd
    ? [{ username: 'admin', role: Role.admin }]
    : [
        { username: 'admin', role: Role.admin },
        { username: 'technician', role: Role.technician },
        { username: 'viewer', role: Role.viewer }
      ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: isProd ? {} : { role: user.role, passwordHash },
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

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
