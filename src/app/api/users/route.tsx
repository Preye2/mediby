import { database } from "@/config/database";
import { users, SessionChatTable } from "@/config/userSchema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const existing = await database
      .select()
      .from(users)
      .where(eq(users.email, user.primaryEmailAddress!.emailAddress));

    if (existing.length === 0) {
      const [inserted] = await database
        .insert(users)
        .values({
          clerkId: user.id,
          name:  [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username!,
          email: user.primaryEmailAddress!.emailAddress,
        })
        .returning();
      return NextResponse.json(inserted);
    }
    return NextResponse.json(existing[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const user = await currentUser();
  if (!user || !sessionId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  try {
    const rows = await database
      .select()
      .from(SessionChatTable)
      .where(
        and(
          eq(SessionChatTable.sessionId, sessionId),
          eq(SessionChatTable.userId, user.id)
        )
      );

    if (!rows.length) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}