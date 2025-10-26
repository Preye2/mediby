import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/* ---------- public pages ---------- */
const isPublicPage = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

/* ---------- protected API routes ---------- */
const isProtectedApi = createRouteMatcher([
  '/api/vapi/assistant',
  '/api/vapi/call/assistant',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const url = new URL(req.url);

  /* 1. 401 on protected API if no session */
  if (isProtectedApi(req) && !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  /* 2. Redirect unauthenticated users for non-public pages */
  if (!isPublicPage(req) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  /* 3. Skip org-picker after sign-in */
  if (userId && (url.pathname === '/sign-in' || url.pathname === '/sign-up')) {
    const rolePath = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      subadmin: '/sub-admin/dashboard',
      superadmin: '/admin/dashboard',
    };
    const role = ((sessionClaims?.publicMetadata as any)?.role as keyof typeof rolePath) ?? 'patient';
    return NextResponse.redirect(new URL(rolePath[role], req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
};