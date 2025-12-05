// src/app/api/hms/doctor/appointments/[id]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/database";
import { appointments } from "@/config/userSchema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { note = "" } = await req.json();

  // ensure doctor owns this appointment
  const doctor = await db.query.doctors.findFirst({
    where: (d, { eq }) => eq(d.clerkId, userId),
  });
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const [updated] = await db
    .update(appointments)
    .set({
      status: "completed",
      note,
      approvedAt: new Date(), // reuse field or add completedAt
    })
    .where(and(eq(appointments.id, Number(id)), eq(appointments.doctorId, doctor.id)))
    .returning({ id: appointments.id });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}