import { NextResponse } from "next/server";
import { database } from "@/config/database";
import { doctors } from "@/config/userSchema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params; // ← await here

  if (!doctorId || isNaN(Number(doctorId)))
    return NextResponse.json({ error: "Invalid doctor ID" }, { status: 400 });

  try {
    const [row] = await database
      .select({ fee: doctors.fee })
      .from(doctors)
      .where(eq(doctors.id, Number(doctorId)));

    if (!row) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    console.error("❌ Failed to fetch doctor fee:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}