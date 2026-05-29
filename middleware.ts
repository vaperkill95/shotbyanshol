import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Login + setup must be reachable without a session.
  if (path === '/admin/login' || path === '/admin/setup') {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    // For API routes return 401 instead of redirecting.
    if (path.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
