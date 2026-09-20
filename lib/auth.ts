import crypto from 'crypto';
import { cookies } from 'next/headers';
import { PermissionName, Role } from '@prisma/client';
import { prisma } from './prisma';

export type AppUser = { id: number; username: string; role: Role };
export const SESSION_COOKIE = 'session_token';

export async function getUserFromRequest(request: Request): Promise<AppUser | null> {
  const token = request.headers.get('cookie')?.split(';').map((v) => v.trim()).find((v) => v.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!token) return null;
  const session = await prisma.session.findFirst({ where: { token: decodeURIComponent(token), expiresAt: { gt: new Date() } }, include: { user: true } });
  return session ? { id: session.user.id, username: session.user.username, role: session.user.role } : null;
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findFirst({ where: { token, expiresAt: { gt: new Date() } }, include: { user: true } });
  return session ? { id: session.user.id, username: session.user.username, role: session.user.role } : null;
}

export async function hasPermission(user: AppUser | null, permission: PermissionName) {
  if (!user) return false;
  const record = await prisma.permission.findUnique({ where: { role_name: { role: user.role, name: permission } } });
  return record?.enabled === true;
}

export function newSessionToken() { return crypto.randomBytes(32).toString('hex'); }
