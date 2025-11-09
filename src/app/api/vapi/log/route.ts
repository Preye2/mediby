// app/api/vapi/log/route.ts
import { db } from "@/config/database";
import { SessionChatTable } from "@/config/userSchema";
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { sessionId, role, text } = await req.json();
  if (!sessionId || !text) return NextResponse.json({ ok: false }, { status: 400 });

  const newLine = JSON.stringify([{ role, text, ts: new Date().toISOString() }]);

  /*  cast column -> jsonb once, then append jsonb  */
  await db.execute(sql`
    UPDATE ${SessionChatTable}
    SET conversation = (conversation::jsonb) || ${newLine}::jsonb
    WHERE ${SessionChatTable.sessionId} = ${sessionId}
  `);

  return NextResponse.json({ ok: true });
}