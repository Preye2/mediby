import { NextResponse } from "next/server";
import { database } from "@/config/database";
import { doctors } from "@/config/userSchema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ hospitalId: string }> }
) {
  const { hospitalId } = await params; // ← MUST see await here

  try {
    const rows = await database
      .select()
      .from(doctors)
      .where(eq(doctors.hospitalId, Number(hospitalId)));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("❌ Failed to fetch doctors:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}