import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/config/database";
import { users } from "@/config/userSchema";
import { eq } from "drizzle-orm";

export async function POST() {
  console.log("🔑 onboard POST hit");
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await clerkClient();
  const u = await client.users.getUser(userId);
  const email = u.primaryEmailAddress?.emailAddress ?? "";
  const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "User";

  await db
    .insert(users)
    .values({ clerkId: userId, email, name: fullName })
    .onConflictDoUpdate({ target: users.clerkId, set: { email, name: fullName } });

  const role = ((u.publicMetadata as any)?.role as string) ?? "patient";
  const rolePath: Record<string, string> = {
    patient: "/patient/dashboard",
    doctor: "/doctor/dashboard",
    subadmin: "/sub-admin/dashboard",
    superadmin: "/admin/dashboard",
  };

  return NextResponse.json({ role, destination: rolePath[role] ?? "/patient/dashboard" });
}