// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Add your protected routes here
    if (
      req.nextUrl.pathname.startsWith('/profile') ||
      req.nextUrl.pathname.startsWith('/api')
    ) {
      return NextResponse.next();
    }
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
  matcher: ['/profile/:path*', '/api/:path*'],
};