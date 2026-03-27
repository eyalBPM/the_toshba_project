import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const protectedPaths = [
  /^\/articles\/.*\/propose\/.*\/edit/,
  /^\/revisions\/.*\/edit/,
  /^\/verification\/request/,
  /^\/verification-requests/,
  /^\/drafts/,
  /^\/notifications/,
  /^\/print-lists/,
  /^\/admin/,
];

const authPaths = ['/login', '/register'];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  const isProtected = protectedPaths.some((p) => p.test(pathname));
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && req.auth) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
