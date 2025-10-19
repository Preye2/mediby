// src/app/api/chat-session/route.ts
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { database } from "@/config/database";
import { SessionChatTable, users } from "@/config/userSchema";
import { eq, desc, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/* ----------  helper  ---------- */
function normaliseDoctor(input: unknown): { id: string; name: string } {
  if (typeof input === "string") return { id: input, name: input };
  if (
    typeof input === "object" &&
    input !== null &&
    "id" in input &&
    "name" in input
  )
    return input as { id: string; name: string };
  throw new Error("selectedDoctor must be string or {id,name}");
}

/* ----------  POST  ---------- */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { notes, selectedDoctor: rawDoctor } = body;

    if (!notes || !rawDoctor)
      return NextResponse.json(
        { error: "notes and selectedDoctor are required" },
        { status: 400 }
      );

    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    /* 1.  Safe user fetch + upsert */
    let email = `${userId}@clerk.user`;
    let name = "User";
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      email = user.emailAddresses[0]?.emailAddress ?? email;
      name =
        [user.firstName, user.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || email.split("@")[0];
    } catch {
      /* Clerk unavailable – use fallbacks */
    }

    await database
      .insert(users)
      .values({ clerkId: userId, email, name })
      .onConflictDoNothing();
    const [row] = await database
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);
    if (!row) throw new Error("User row still missing after upsert");

    /* 2.  Create session – JSON cast + Date */
    const sessionId = uuidv4();
    await database.insert(SessionChatTable).values({
      sessionId,
      note: notes,
      conversation: sql`${JSON.stringify([])}::jsonb`,
      selectedDoctor: sql`${JSON.stringify(normaliseDoctor(rawDoctor))}::jsonb`,
      report: sql`${JSON.stringify({})}::jsonb`,
      status: "active",
      userId,
      createdBy: email,
      createdOn: new Date(), // Date → timestamp
    });

    return NextResponse.json({ sessionId }, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/chat-session error:", err.message ?? err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* ----------  GET  ---------- */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId") ?? "all";
    const { userId } = await auth();

    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (sessionId === "check")
      return NextResponse.json({ ok: true, userId });

    if (sessionId === "all") {
      const rows = await database
        .select()
        .from(SessionChatTable)
        .where(eq(SessionChatTable.userId, userId))
        .orderBy(desc(SessionChatTable.createdOn))
        .limit(50);
      return NextResponse.json(rows);
    }

    const [row] = await database
      .select()
      .from(SessionChatTable)
      .where(
        and(
          eq(SessionChatTable.sessionId, sessionId),
          eq(SessionChatTable.userId, userId)
        )
      )
      .limit(1);

    if (!row)
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    return NextResponse.json(row);
  } catch (err: any) {
    console.error("❌ GET /api/chat-session error:", err.message ?? err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}