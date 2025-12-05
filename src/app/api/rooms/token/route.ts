// src/app/api/rooms/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import AccessToken from "twilio/lib/jwt/AccessToken";

export const runtime = "nodejs";

const REQUIRED = ["TWILIO_ACCOUNT_SID", "TWILIO_API_KEY_SID", "TWILIO_API_KEY_SECRET"];
REQUIRED.forEach((k) => {
  if (!process.env[k]) throw new Error(`Missing ${k}`);
});

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room");
  if (!room) return NextResponse.json({ error: "Missing room" }, { status: 400 });

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY_SID!,
    process.env.TWILIO_API_KEY_SECRET!,
    { identity: `${userId}_${Date.now()}`, ttl: 3600 }
  );

  token.addGrant(new AccessToken.VideoGrant({ room }));

  return NextResponse.json(
    { token: token.toJwt(), room },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_URL!,
      },
    }
  );
}