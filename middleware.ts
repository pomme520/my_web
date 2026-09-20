import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'session_token';

export function middleware(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  return NextResponse.json({ message: '未登入' }, { status: 401 });
}

export const config = { matcher: ['/api/permissions/:path*'] };
