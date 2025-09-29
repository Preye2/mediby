import { NextRequest, NextResponse } from "next/server";
import { database } from "@/config/database";
import { appointments, doctors, hospitals } from "@/config/userSchema";
import { eq } from "drizzle-orm";
import { sendNotification } from "@/lib/hms/notifySubAdmin";

export async function POST(req: NextRequest) {
  const { appointmentId, action } = await req.json();

  if (!["approve", "reject"].includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  try {
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
    await database
      .update(appointments)
      .set({ status: newStatus })
      .where(eq(appointments.id, appointmentId));

    await sendNotification({
      toEmail: row.appointment.patientEmail,
      toPhone: undefined, // add phone later
      patientName: row.appointment.patientEmail.split("@")[0],
      doctorName: row.doctor?.fullName ?? "Doctor",
      date: row.appointment.date,
      timeSlot: row.appointment.timeSlot,
      hospitalName: row.hospital?.name ?? "Hospital",
      action: newStatus === "approved" ? "approved" : "rejected",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("❌ Action failed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}