import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { database as db } from "@/config/database";
import { appointments, doctors } from "@/config/userSchema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const { sessionClaims } = await auth();
  const meta = sessionClaims?.publicMetadata as Record<string, any>;
  const hospitalId = meta?.hospital_id as number | undefined;

  if (!hospitalId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({
      id: appointments.id,
      patientEmail: appointments.patientEmail,
      doctorName: doctors.fullName,
      date: appointments.date,
      timeSlot: appointments.timeSlot,
      fee: doctors.fee,
      status: appointments.status,
    })
    .from(appointments)
    .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
    .where(and(eq(appointments.hospitalId, hospitalId), eq(appointments.status, "paid")));

  return NextResponse.json(rows);
}