import { NextResponse } from "next/server";
import { database } from "@/config/database";
import { hospitals } from "@/config/userSchema";

// GET /api/hms/hospitals
export async function GET() {
  try {
    const rows = await database.select().from(hospitals);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("❌ Failed to fetch hospitals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}