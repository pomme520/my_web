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

  const technician = await prisma.user.findUnique({ where: { username: 'technician' } });
  const samples = [
    { orderNumber: 'R-DEMO0001', customerName: '王小明', phone: '0912345678', email: 'demo1@example.com', department: '資訊處', deviceType: '筆記型電腦', issueType: '無法開機', description: '按下電源鍵無反應', status: '待確認' },
    { orderNumber: 'R-DEMO0002', customerName: '林小華', phone: '0923456789', email: '', department: '人事室', deviceType: '印表機', issueType: '卡紙', description: '列印時持續卡紙', status: '處理中', assignedTechnicianId: technician?.id ?? null, assignedAt: technician ? new Date() : null },
    { orderNumber: 'R-DEMO0003', customerName: '陳小美', phone: '0934567890', email: '', department: '會計室', deviceType: '桌上型電腦', issueType: '網路異常', description: '無法連線內部網路', status: '已完成' }
  ];
  for (const sample of samples) {
    await prisma.repairOrder.upsert({ where: { orderNumber: sample.orderNumber }, update: {}, create: sample });
  }
}

main().finally(() => prisma.$disconnect());
