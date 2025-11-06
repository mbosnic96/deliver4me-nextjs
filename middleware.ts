import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;


    const adminRoutes = ['/vehicle-types', '/reports', '/cms'];
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    if (isAdminRoute && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/vehicles/:path*',
    '/vehicle-types/:path*',
    '/my-loads/:path*',
    '/my-wallet/:path*',
    '/messages/:path*',
    '/reports/:path*',
    '/users/:path*',
    '/load/:path*',
    
    '/cms/:path*',
  ],
};