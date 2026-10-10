import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { newSessionToken, SESSION_COOKIE } from '@/lib/auth';

const MAX_FAILURES = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, number[]>();

function recentFailures(key: string) {
  const now = Date.now();
  const recent = (failures.get(key) ?? []).filter((time) => now - time < LOCK_WINDOW_MS);
  if (recent.length) failures.set(key, recent);
  else failures.delete(key);
  return recent;
}

export async function POST(request: Request) {
  const bodyRaw = await request.json().catch(() => ({}));
  const body = typeof bodyRaw === 'object' && bodyRaw ? bodyRaw : {};
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password || username.length > 64 || password.length > 200) {
    return NextResponse.json({ message: '請輸入帳號與密碼' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = `${ip}:${username.toLowerCase()}`;
  if (recentFailures(key).length >= MAX_FAILURES) {
    return NextResponse.json({ message: '登入失敗次數過多，請 15 分鐘後再試。' }, { status: 429 });
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { username } });
  } catch {
    return NextResponse.json({ message: '系統暫時無法登入，請確認資料庫已初始化。' }, { status: 503 });
  }
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    failures.set(key, [...recentFailures(key), Date.now()]);
    return NextResponse.json({ message: '帳號或密碼錯誤' }, { status: 401 });
  }
  failures.delete(key);
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => undefined);
  const token = newSessionToken();
  await prisma.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) } });
  const response = NextResponse.json({ user: { username: user.username, role: user.role } });
  response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 8 * 60 * 60 });
  return response;
}
