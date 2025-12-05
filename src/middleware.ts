// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicPage = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/hms/paystack/webhook",
  "/api/hms/patient/appointments",
]);

const isProtectedApi = createRouteMatcher([
  "/api/vapi/assistant",
  "/api/vapi/call/assistant",
]);

const rolePath: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  subadmin: "/sub-admin/dashboard",
  superadmin: "/admin/dashboard",
};

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  /* 1. 401 on protected API if no session */
  if (isProtectedApi(req) && !userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  /* 2. Force sign-in for non-public pages */
  if (!isPublicPage(req) && !userId)
    return NextResponse.redirect(new URL("/sign-in", req.url));

  /* 3. Role-based redirect after sign-in/up 
if (userId && (req.nextUrl.pathname === "/sign-in" || req.nextUrl.pathname === "/sign-up")) {
  const role = ((sessionClaims?.publicMetadata as any)?.role as keyof typeof rolePath) ?? "patient";
  return NextResponse.redirect(new URL(rolePath[role], req.url));
}  */

return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};