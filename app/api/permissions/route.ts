import { NextResponse } from 'next/server';
import { PermissionName, Role } from '@prisma/client';
import { hasPermission, getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const roles: Role[] = [Role.admin, Role.technician, Role.viewer];
const names: PermissionName[] = [PermissionName.queryOrders, PermissionName.updateStatus, PermissionName.managePermissions];

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
  if (!(await hasPermission(user, PermissionName.managePermissions))) return NextResponse.json({ message: '沒有查看權限設定權限' }, { status: 403 });
  const rows = await prisma.permission.findMany();
  const settings = Object.fromEntries(roles.map((role) => [role, Object.fromEntries(names.map((name) => [name, false]))]));
  for (const row of rows) settings[row.role][row.name] = row.enabled;
  return NextResponse.json({ currentRole: user.role, settings });
}

export async function PUT(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
  if (user.role !== Role.admin) return NextResponse.json({ message: '只有管理員可修改權限設定' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!body.settings) return NextResponse.json({ message: '權限設定格式錯誤' }, { status: 400 });
  await prisma.$transaction(roles.flatMap((role) => names.map((name) => prisma.permission.upsert({ where: { role_name: { role, name } }, update: { enabled: body.settings[role]?.[name] === true }, create: { role, name, enabled: body.settings[role]?.[name] === true } }))));
  return GET(request);
}
