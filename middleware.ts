import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authStatus = request.cookies.get('auth_status');
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!authStatus && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authStatus && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
