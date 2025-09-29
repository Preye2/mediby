import { NextRequest, NextResponse } from "next/server";
import { database } from "@/config/database";
import { appointments, doctors, hospitals } from "@/config/userSchema";
import { eq } from "drizzle-orm";
import { alertSubAdminAfterPayment } from "@/lib/hms/notifySubAdmin";

export async function POST(req: NextRequest) {
  const { hospitalId, doctorId, date, timeSlot, paystackRef, patientEmail } = await req.json();
  console.log("💰 Paystack webhook hit:", { hospitalId, doctorId, date, timeSlot, paystackRef, patientEmail });

  try {
    const [updated] = await database
      .update(appointments)
      .set({ status: "paid", paystackRef })
      .where(eq(appointments.paystackRef, paystackRef))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [doctor] = await database.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);
    const [hospital] = await database.select().from(hospitals).where(eq(hospitals.id, hospitalId)).limit(1);

    if (!doctor || !hospital) return NextResponse.json({ success: true });

    await alertSubAdminAfterPayment(
      hospital.contactEmail ?? "no-reply@yourdomain.com",
      hospital.contactPhone ?? undefined,
      patientEmail,
      doctor.fullName,
      date,
      timeSlot,
      hospital.name
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Pay webhook failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}