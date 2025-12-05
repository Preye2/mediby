// src/app/api/hms/doctor/schedule-approved/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/database";
import { appointments, doctors, hospitals, users } from "@/config/userSchema";
import { and, sql, eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const doctor = await db.query.doctors.findFirst({
    where: (d, { eq }) => eq(d.clerkId, userId),
  });
  if (!doctor) return Response.json({ error: "Doctor not found" }, { status: 404 });

  const rows = await db
  .select({
    id: appointments.id,
    date: appointments.date,
    timeSlot: appointments.timeSlot,
    status: appointments.status,
    patientName: appointments.patientEmail, // fallback until you add column
    hospitalName: sql`'-unknown-'`,         // fallback
    fee: sql`0`,                             // fallback
    twilioRoomSid: appointments.twilioRoomSid,
  })
  .from(appointments)
  .where(and(eq(appointments.doctorId, doctor.id), eq(appointments.status, "approved")))
  .orderBy(appointments.date, appointments.timeSlot);

  return Response.json(rows);
}