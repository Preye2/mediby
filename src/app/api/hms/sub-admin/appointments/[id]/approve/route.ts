// src/app/api/hms/sub-admin/appointments/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/config/database";
import { appointments } from "@/config/userSchema";
import { eq, and } from "drizzle-orm";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_API_KEY_SID!,
  process.env.TWILIO_API_KEY_SECRET!,
  { accountSid: process.env.TWILIO_ACCOUNT_SID! }
);

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ promise wrapper
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  if (me.publicMetadata?.role !== "sub-admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params; // ✅ await here
  const apptId = Number(id);

  /* approve */
  const [updated] = await db
    .update(appointments)
    .set({ status: "approved", approvedAt: new Date(), approvedBy: userId })
    .where(and(eq(appointments.id, apptId), eq(appointments.status, "paid")))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found or not paid" }, { status: 404 });

  /* Twilio room */
  const room = await twilioClient.video.rooms.create({
    uniqueName: `consult_${apptId}`,
    maxParticipants: 2,
    emptyRoomTimeout: 30,
  });

  /* store SID */
  await db
    .update(appointments)
    .set({ twilioRoomSid: room.sid })
    .where(eq(appointments.id, apptId));

  return NextResponse.json({ success: true, twilioRoomSid: room.sid });
}