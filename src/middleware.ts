import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. Public pages – no auth required
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/(.*)",
]);

// 2. Role → dashboard map
const afterAuthMap: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  subadmin: "/sub-admin/dashboard",
  superadmin: "/admin/dashboard",
};

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const url = new URL(req.url);

  /* 3. KICK user OUT of any org-related path immediately */
  if (
    url.pathname.startsWith("/create-organization") ||
    url.pathname.startsWith("/select-organization") ||
    url.pathname.startsWith("/sign-in/tasks/choose-organization")
  ) {
    const role = (sessionClaims?.publicMetadata as any)?.role ?? "patient";
    return Response.redirect(new URL(afterAuthMap[role] ?? "/patient/dashboard", req.url));
  }

  /* 4. Protect private routes */
  if (!isPublicRoute(req)) await auth.protect();

  /* 5. After sign-up/in skip org screens */
  if (userId && (url.pathname === "/sign-up" || url.pathname === "/sign-in")) {
    const role = (sessionClaims?.publicMetadata as any)?.role ?? "patient";
    return Response.redirect(new URL(afterAuthMap[role] ?? "/patient/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};