// src/app/api/hms/hospitals/[hospitalId]/doctors/[doctorId]/slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { database } from "@/config/database";
import { appointments } from "@/config/userSchema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params; // ← await here
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!date) return NextResponse.json([], { status: 400 });

  try {
    const rows = await database
      .select({ timeSlot: appointments.timeSlot })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, Number(doctorId)),
          eq(appointments.date, date),
          eq(appointments.status, "approved") // or any status you want to block
        )
      );

    const busy = rows.map((r) => r.timeSlot);
    return NextResponse.json(busy);
  } catch (error) {
    console.error("❌ Failed to fetch busy slots:", error);
    return NextResponse.json([], { status: 500 });
  }
}