// src/app/api/hms/doctor/[doctorId]/route.ts
import { NextResponse } from "next/server";
import { database as db } from "@/config/database";
import { doctors } from "@/config/userSchema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ doctorId: string }> } // ← Promise wrapper
) {
  const { doctorId } = await params;                     // ← await
  const id = Number(doctorId);

  if (!doctorId || Number.isNaN(id))
    return NextResponse.json({ error: "Invalid doctor ID" }, { status: 400 });

  try {
    const [row] = await db
      .select({
        fee: doctors.fee,
        fullName: doctors.fullName,
        specialization: doctors.specialization,
      })
      .from(doctors)
      .where(eq(doctors.id, id));

    if (!row) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    console.error("❌ Failed to fetch doctor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}