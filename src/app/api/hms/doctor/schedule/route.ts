// src/app/api/hms/doctor/schedule/route.ts
import { db } from "@/config/database";
import { appointments, doctors, hospitals, users } from "@/config/userSchema";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return Response.json({ error: "Missing date" }, { status: 400 });

  const doctor = await db.query.doctors.findFirst({
    where: (d, { eq }) => eq(d.clerkId, userId),
  });
  if (!doctor) return Response.json({ error: "Doctor not found" }, { status: 404 });

  /* ---- no users join ---- */
  const rows = await db
  .select({
    id: appointments.id,
    date: appointments.date,
    timeSlot: appointments.timeSlot,
    status: appointments.status,
    patientName: users.name,          // ← from users
    hospitalName: hospitals.name,
    fee: doctors.fee,                 // ← from doctors
    twilioRoomSid: appointments.twilioRoomSid,
  })
  .from(appointments)
  .innerJoin(hospitals, eq(hospitals.id, appointments.hospitalId))
  .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
  .innerJoin(users, eq(users.clerkId, appointments.patientEmail)) // match clerk id
  .where(
    and(
      eq(appointments.doctorId, doctor.id),
      eq(appointments.date, date),
      inArray(appointments.status, ["approved", "completed"])
    )
  )
  .orderBy(appointments.timeSlot);

  return Response.json(rows);
}