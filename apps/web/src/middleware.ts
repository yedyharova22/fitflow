import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthPage = PUBLIC_PATHS.includes(pathname);
  const isJoinPage = pathname.startsWith('/join/');
  const hasAccessToken = !!req.cookies.get('accessToken')?.value;
  const hasRefreshToken = !!req.cookies.get('refreshToken')?.value;
  const isAuthenticated = hasAccessToken || hasRefreshToken;

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (!isAuthPage && !isJoinPage && pathname.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (!isAuthPage && pathname.startsWith('/profile') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (!isAuthPage && pathname.startsWith('/bookings') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (!isAuthPage && pathname.startsWith('/discover') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/bookings/:path*',
    '/discover/:path*',
    '/login',
    '/register',
    '/join/:path*',
  ],
};
