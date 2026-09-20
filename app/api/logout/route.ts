import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: Request) {
  const token = request.headers.get('cookie')?.split(';').map((v) => v.trim()).find((v) => v.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (token) await prisma.session.deleteMany({ where: { token: decodeURIComponent(token) } });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
