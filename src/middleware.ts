import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/(.*)",
]);

const roleMap: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  subadmin: "/sub-admin/dashboard",
  superadmin: "/admin/dashboard",
};

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const url = new URL(req.url);

  /* 1. BANISH any org path (sign-in OR sign-up) instantly */
  if (
    url.pathname.includes("choose-organization") ||
    url.pathname.includes("create-organization") ||
    url.pathname.includes("select-organization")
  ) {
    const role = (sessionClaims?.publicMetadata as any)?.role ?? "patient";
    return Response.redirect(new URL(roleMap[role] ?? "/patient/dashboard", req.url));
  }

  /* 2. Protect private routes */
  if (!isPublicRoute(req)) await auth.protect();

  /* 3. After sign-in/up skip org screens */
  if (userId && (url.pathname === "/sign-in" || url.pathname === "/sign-up")) {
    const role = (sessionClaims?.publicMetadata as any)?.role ?? "patient";
    return Response.redirect(new URL(roleMap[role] ?? "/patient/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};