// app/api/ai-medical-history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/config/database'
import { SessionChatTable } from '@/config/userSchema'
import { eq, desc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await db
      .select()
      .from(SessionChatTable)
      .where(eq(SessionChatTable.userId, userId))
      .orderBy(desc(SessionChatTable.createdOn))

    // lightweight shape
    const history = rows.map((r) => ({
      sessionId: r.sessionId,
      note: r.note,
      language: r.language,
      confidence: r.confidence,
      createdOn: r.createdOn,
      report: r.report,
      conversation: r.conversation,
    }))

    return NextResponse.json(history)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Unable to load history' }, { status: 500 })
  }
}