import { NextRequest, NextResponse } from "next/server";
import { database } from "@/config/database";
import { appointments } from "@/config/userSchema";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { patientEmail, hospitalId, doctorId, date, timeSlot } = await req.json();
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // unique reference for this appointment
  const paystackRef = `apt-${Date.now()}`;

  const [row] = await database
    .insert(appointments)
    .values({
      patientEmail,
      hospitalId,
      doctorId,
      date,
      timeSlot,
      status: "pending",
      paystackRef,
    })
    .returning({ id: appointments.id, paystackRef: appointments.paystackRef });

  return NextResponse.json(row);
}