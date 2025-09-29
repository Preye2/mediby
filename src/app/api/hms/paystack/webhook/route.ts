import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { database } from "@/config/database";
import { appointments } from "@/config/userSchema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("x-paystack-signature") as string;
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET!)
    .update(body)
    .digest("hex");

  if (sig !== expected) return NextResponse.json({ error: "Bad signature" }, { status: 400 });

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const ref = event.data.reference;
    // Mark appointment paid
    await database
      .update(appointments)
      .set({ status: "paid" })
      .where(eq(appointments.paystackRef, ref));

    // TODO: send email/WS to sub-admin (next step)
    console.log("✅ Payment confirmed, appointment paid ->", ref);
  }

  return NextResponse.json({ received: true });
}