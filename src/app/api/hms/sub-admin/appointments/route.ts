import { NextRequest, NextResponse } from "next/server";
import { database } from "@/config/database";
import { appointments, doctors } from "@/config/userSchema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "paid";

  try {
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
        },
      })
      .from(appointments)
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.status, status as "approved" | "cancelled" | "pending" | "paid" | "completed"))

    return NextResponse.json(rows);
  } catch (error) {
    console.error("❌ Failed to fetch appointments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}