// src/app/api/hms/paystack/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { database } from "@/config/database";
import { appointments, doctors, hospitals } from "@/config/userSchema";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { alertSubAdminAfterPayment } from "@/lib/hms/notifySubAdmin";

export async function POST(req: NextRequest) {
  /* ---------- 1.  verify signature ---------- */
  const body = await req.text();
  const sig = req.headers.get("x-paystack-signature") as string;
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET!)
    .update(body)
    .digest("hex");

  if (sig !== expected) return NextResponse.json({ error: "Bad signature" }, { status: 400 });

  const event = JSON.parse(body);
  if (event.event !== "charge.success") return NextResponse.json({ received: true });

  const ref = event.data.reference;

  /* ---------- 2.  mark appointment paid ---------- */
  const [updated] = await database
    .update(appointments)
    .set({
      status: "paid",
      hospitalId: event.data.metadata?.hospitalId,
      doctorId: event.data.metadata?.doctorId,
    })
    .where(eq(appointments.paystackRef, ref))
    .returning();

  if (!updated) {
    console.warn("⚠️  Paystack ref not found:", ref);
    return NextResponse.json({ received: true });
  }

  /* ---------- 3.  assign Twilio room name ---------- */
  const roomName = `phy_consult_${updated.id}`;
  await database
    .update(appointments)
    .set({ twilioRoomSid: roomName })
    .where(eq(appointments.id, updated.id));

  /* ---------- 4.  fetch doctor & hospital for e-mail ---------- */
  const [doctorRow] = await database.select().from(doctors).where(eq(doctors.id, updated.doctorId!));
  const [hospitalRow] = await database.select().from(hospitals).where(eq(hospitals.id, updated.hospitalId!));

  /* ---------- 5.  notify sub-admins ---------- */
  if (doctorRow && hospitalRow) {
    const client = await clerkClient();
    const allUsers = await client.users.getUserList({ limit: 100 });
    const targets = allUsers.data.filter(
      (u) =>
        u.publicMetadata?.role === "sub-admin" &&
        (u.publicMetadata?.hospitalId as number) === updated.hospitalId
    );

    for (const u of targets) {
      const email = u.emailAddresses[0]?.emailAddress;
      if (email)
        await alertSubAdminAfterPayment(
          email,
          updated.patientEmail,
          doctorRow.fullName,
          updated.date,
          updated.timeSlot,
          hospitalRow.name
        );
    }
  }

  console.log("✅ Payment confirmed, room name assigned, sub-admins alerted ->", ref);
  return NextResponse.json({ received: true });
}