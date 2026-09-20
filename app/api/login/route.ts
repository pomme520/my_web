import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { newSessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');
    if (!username || !password) return NextResponse.json({ message: '請輸入帳號與密碼' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ message: '帳號或密碼錯誤' }, { status: 401 });
    const token = newSessionToken();
    await prisma.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) } });
    const response = NextResponse.json({ user: { username: user.username, role: user.role } });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 8 * 60 * 60 });
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ message: '資料庫尚未初始化，請先執行 Prisma 初始化指令。' }, { status: 503 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ message: '資料庫作業失敗，請稍後再試。' }, { status: 503 });
    }
    console.error('Login API unexpected error', error);
    return NextResponse.json({ message: '登入服務暫時無法使用，請稍後再試。' }, { status: 500 });
  }
}
