import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isAdminPage = pathname.startsWith('/admin');
  const isProtectedPage = isDashboardPage || isAdminPage;

  // 1. No token + trying to access protected page -> redirect to login
  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Has token + trying to access login / register -> redirect to their portal
  if (token && isAuthPage) {
    if (userRole === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/plans', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Super Admin trying to access shop /dashboard/* -> redirect to /admin/plans
  if (token && userRole === 'SUPER_ADMIN' && isDashboardPage) {
    return NextResponse.redirect(new URL('/admin/plans', request.url));
  }

  // 4. Shop User trying to access /admin/* -> redirect to /dashboard
  if (token && userRole && userRole !== 'SUPER_ADMIN' && isAdminPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};