import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/database";
import { doctors, appointments, hospitals } from "@/config/userSchema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { startOfWeek, endOfWeek } from "date-fns";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const doctor = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.clerkId, userId)).limit(1);
  if (!doctor.length) return new Response("Doctor not found", { status: 404 });

  const start = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split("T")[0];
  const end = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split("T")[0];

  const rows = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      timeSlot: appointments.timeSlot,
      status: appointments.status,
      patientEmail: appointments.patientEmail,
      hospitalName: hospitals.name,
    })
    .from(appointments)
    .innerJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
    .where(
      and(
        eq(appointments.doctorId, doctor[0].id),
        gte(appointments.date, start),
        lte(appointments.date, end),
        inArray(appointments.status, ["approved", "completed"])
      )
    )
    .orderBy(appointments.date, appointments.timeSlot);

  return Response.json(
    rows.map((r) => ({ ...r, patientName: r.patientEmail.split("@")[0].replace(".", " ") }))
  );
}