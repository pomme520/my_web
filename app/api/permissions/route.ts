import { NextResponse } from 'next/server';
import { PermissionName, Role, isRole, isPermissionName, permissionNames, roles } from '@/lib/permissions';
import { hasPermission, getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
  if (!(await hasPermission(user, PermissionName.managePermissions))) return NextResponse.json({ message: '沒有查看權限設定權限' }, { status: 403 });
  const rows = await prisma.permission.findMany();
  const settings = Object.fromEntries(roles.map((role) => [role, Object.fromEntries(permissionNames.map((name) => [name, false]))]));
  for (const row of rows) if (isRole(row.role) && isPermissionName(row.name)) settings[row.role][row.name] = row.enabled;
  return NextResponse.json({ currentRole: user.role, settings });
}

export async function PUT(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
  if (user.role !== Role.admin) return NextResponse.json({ message: '只有管理員可修改權限設定' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) return NextResponse.json({ message: '權限設定格式錯誤' }, { status: 400 });
  // 管理員必須保留權限管理能力，避免誤操作造成無人可修改權限
  const adminSettings = body.settings[Role.admin];
  const settingsInput = {
    ...body.settings,
    [Role.admin]: {
      ...(adminSettings && typeof adminSettings === 'object' && !Array.isArray(adminSettings) ? adminSettings : {}),
      [PermissionName.managePermissions]: true
    }
  };
  try {
  await prisma.$transaction(roles.flatMap((role) => permissionNames.map((name) => prisma.permission.upsert({ where: { role_name: { role, name } }, update: { enabled: settingsInput[role]?.[name] === true }, create: { role, name, enabled: settingsInput[role]?.[name] === true } }))));
  } catch {
    return NextResponse.json({ message: '儲存權限設定失敗，請稍後再試' }, { status: 500 });
  }
  return GET(request);
}
