// src/app/api/hms/doctor/complete/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/database";
import { appointments } from "@/config/userSchema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { appointmentId, note } = await req.json();

  const [updated] = await db
    .update(appointments)
    .set({ status: "completed" }) // note removed
    .where(eq(appointments.id, appointmentId))
    .returning({ id: appointments.id });

  if (!updated) return new Response("Appointment not found", { status: 404 });
  return Response.json({ ok: true });
}