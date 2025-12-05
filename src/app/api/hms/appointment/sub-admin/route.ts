// src/app/api/hms/sub-admin/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { database as db } from "@/config/database";
import { appointments, doctors, hospitals } from "@/config/userSchema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

/* ----------  GET  – scoped to sub-admin’s hospital ---------- */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "paid";

  const { sessionClaims } = await auth();
  const hospitalId = (sessionClaims?.publicMetadata as any)?.hospitalId;
  if (!hospitalId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const rows = await db
      .select({
        id: appointments.id,
        patientEmail: appointments.patientEmail,
        date: appointments.date,
        timeSlot: appointments.timeSlot,
        status: appointments.status,
        paystackRef: appointments.paystackRef,
        twilioRoomSid: appointments.twilioRoomSid, // ← renamed
        hospitalId: appointments.hospitalId,
        doctorId: appointments.doctorId,
        doctor: {
          fullName: doctors.fullName,
          specialization: doctors.specialization,
        },
      })
      .from(appointments)
      .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
      .where(and(eq(appointments.hospitalId, hospitalId), eq(appointments.status, status as any)));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("❌ GET /hms/sub-admin/appointments", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ----------  PATCH – approve / cancel ---------- */
const patchBody = z.object({
  appointmentId: z.number(),
  action: z.enum(["approve", "cancel"]),
});

export async function PATCH(req: NextRequest) {
  const { sessionClaims } = await auth();
  const hospitalId = (sessionClaims?.publicMetadata as any)?.hospitalId;
  if (!hospitalId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { appointmentId, action } = patchBody.parse(await req.json());

  /* verify the row belongs to this hospital and is still 'paid' */
  const [appt] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.hospitalId, hospitalId), eq(appointments.status, "paid")));

  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const roomName = action === "approve" ? `phy_consult_${appointmentId}` : null;

  await db
    .update(appointments)
    .set({
      status: action === "approve" ? "approved" : "cancelled",
      twilioRoomSid: roomName, // ← renamed
      approvedAt: action === "approve" ? new Date() : null,
      approvedBy: (sessionClaims?.sub as string) ?? null,
    })
    .where(eq(appointments.id, appointmentId));

  return NextResponse.json({ success: true, twilioRoomSid: roomName });
}