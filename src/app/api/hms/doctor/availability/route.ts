// src/app/api/hms/doctor/availability/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/database";
import { doctors } from "@/config/userSchema";
import { eq } from "drizzle-orm";

/* ---------- POST: toggle availability ---------- */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { available } = await req.json();
  await db
    .update(doctors)
    .set({ available: available ? 1 : 0 })
    .where(eq(doctors.clerkId, userId));

  return NextResponse.json({ ok: true });
}

/* ---------- GET: current availability ---------- */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db
    .select({ available: doctors.available })
    .from(doctors)
    .where(eq(doctors.clerkId, userId));

  return NextResponse.json({ available: Boolean(row?.available ?? 0) });
}