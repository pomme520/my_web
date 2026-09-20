import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { newSessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username ?? '').trim();
  const password = String(body.password ?? '');
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ message: '帳號或密碼錯誤' }, { status: 401 });
  const token = newSessionToken();
  await prisma.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) } });
  const response = NextResponse.json({ user: { username: user.username, role: user.role } });
  response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 8 * 60 * 60 });
  return response;
}
