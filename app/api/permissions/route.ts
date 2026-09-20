import { NextResponse } from 'next/server';
import { PERMISSION_NAMES, PermissionName, ROLES, Role, isPermissionName, isRole } from '@/lib/permissions';
import { hasPermission, getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
  if (!(await hasPermission(user, PermissionName.managePermissions))) return NextResponse.json({ message: '沒有查看權限設定權限' }, { status: 403 });
  const rows = await prisma.permission.findMany();
  const settings = Object.fromEntries(ROLES.map((role) => [role, Object.fromEntries(PERMISSION_NAMES.map((name) => [name, false]))])) as Record<Role, Record<PermissionName, boolean>>;
  for (const row of rows) {
    if (isRole(row.role) && isPermissionName(row.name)) settings[row.role][row.name] = row.enabled;
  }
  return NextResponse.json({ currentRole: user.role, settings });
}

export async function PUT(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
  if (user.role !== Role.admin) return NextResponse.json({ message: '只有管理員可修改權限設定' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!body.settings) return NextResponse.json({ message: '權限設定格式錯誤' }, { status: 400 });
  await prisma.$transaction(ROLES.flatMap((role) => PERMISSION_NAMES.map((name) => prisma.permission.upsert({ where: { role_name: { role, name } }, update: { enabled: body.settings[role]?.[name] === true }, create: { role, name, enabled: body.settings[role]?.[name] === true } }))));
  return GET(request);
}
