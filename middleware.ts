import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith('/api');
  const isNextInternal = pathname.startsWith('/_next');
  const isStaticAsset = /\.(.*)$/.test(pathname);

  // Allow API routes, Next.js internals, and static assets to pass through
  if (isApiRoute || isNextInternal || isStaticAsset) {
    return NextResponse.next();
  }

  // If user is on the login page
  if (pathname === '/login') {
    // If they have a session, redirect to dashboard
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise, let them see the login page
    return NextResponse.next();
  }

  // For any other page, if there is no session, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If a session exists, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
