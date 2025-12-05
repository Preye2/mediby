// src/app/api/hms/sub-admin/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { database } from "@/config/database";
import { users, doctors, hospitals, appointments } from "@/config/userSchema";
import { eq, and, sql } from "drizzle-orm";
import { sendNotification } from "@/lib/hms/notifySubAdmin";

/* ---------- GET (list paid bookings for this hospital) ---------- */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "paid";

  /* 1. identify sub-admin from Clerk */
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dbUser] = await database
    .select({ clerkId: users.clerkId, email: users.email })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  /* 2. pull hospitalId (force number) */
  const rawId = (user.publicMetadata as any)?.hospitalId;
  const hospitalId = Number(rawId);
  if (!hospitalId) {
    console.warn("sub-admin has no hospitalId in publicMetadata");
    return NextResponse.json([]);
  }

  /* 3. build filter – local override below can be removed after testing */
  const filterHospital = hospitalId
    ? eq(appointments.hospitalId, hospitalId)
    : sql`true`; // REMOVE this line once you confirm data is returned

  const rows = await database
    .select({
      id: appointments.id,
      patientEmail: appointments.patientEmail,
      date: appointments.date,
      timeSlot: appointments.timeSlot,
      status: appointments.status,
      paystackRef: appointments.paystackRef,
      hospitalId: appointments.hospitalId,
      doctorId: appointments.doctorId,
      doctor: {
        fullName: doctors.fullName,
        specialization: doctors.specialization,
        fee: doctors.fee,
      },
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .where(and(eq(appointments.status, status as any), filterHospital));

  console.log("paid appointments count:", rows.length);
  return NextResponse.json(rows);
}

/* ---------- PATCH (approve / reject) ---------- */
export async function PATCH(req: NextRequest) {
  const { appointmentId, action } = await req.json();
  if (!["approve", "reject"].includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const [row] = await database
    .select({
      appointment: appointments,
      doctor: { fullName: doctors.fullName },
      hospital: { name: hospitals.name },
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
    .where(eq(appointments.id, appointmentId));

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newStatus = action === "approve" ? "approved" : "cancelled";
  await database.update(appointments).set({ status: newStatus }).where(eq(appointments.id, appointmentId));

  await sendNotification({
    toEmail: row.appointment.patientEmail,
    patientName: row.appointment.patientEmail.split("@")[0],
    doctorName: row.doctor?.fullName ?? "Doctor",
    date: row.appointment.date,
    timeSlot: row.appointment.timeSlot,
    hospitalName: row.hospital?.name ?? "Hospital",
    action: newStatus === "approved" ? "approved" : "rejected",
  });

  return NextResponse.json({ success: true });
}