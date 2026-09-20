import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedPath = pathname.startsWith('/staff') || pathname.startsWith('/api/permissions');
  if (!protectedPath || request.cookies.has('session_token')) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ message: '未登入' }, { status: 401 });
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = { matcher: ['/staff/:path*', '/api/permissions/:path*'] };
