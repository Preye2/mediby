// app/api/vapi/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@/config/database';   
import { SessionChatTable } from '@/config/userSchema';
import { eq, sql } from 'drizzle-orm';
import { generateSummary } from '@/lib/summary';     
import { generatePdf } from '@/lib/pdf';              
import { uploadToS3 } from '@/lib/s3';               

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { call, status } = body;

    // Vapi only sends "ended" when the call is really finished
    if (status !== 'ended') return NextResponse.json({ ok: true });

    const sessionId = call.metadata?.sessionId;
    if (!sessionId) {
      return NextResponse.json({ ok: false, reason: 'missing sessionId' }, { status: 400 });
    }

    /* 1.  Grab session & build conversation */
    const rows = await db
      .select()
      .from(SessionChatTable)
      .where(eq(SessionChatTable.sessionId, sessionId))
      .limit(1);

    if (!rows.length) {
      return NextResponse.json({ ok: false, reason: 'session not found' }, { status: 404 });
    }

    const session = rows[0];
    const conversation = (session.conversation as any[])
      .map((m) => `${m.role}: ${m.text}`)
      .join('\n');

    if (!conversation.trim()) {
      return NextResponse.json({ ok: false, reason: 'empty transcript' }, { status: 400 });
    }

    /* 2.  Generate medical summary */
    const extracted = await generateSummary(conversation);

    /* 3.  Build PDF buffer */
    const pdfBuffer = await generatePdf({ ...extracted, conversation });

    /* 4.  Upload to S3 (or local stub) */
    const pdfUrl = await uploadToS3(pdfBuffer, `reports/${sessionId}.pdf`);

    /* 5.  Persist summary + URL + mark completed */
    await db
      .update(SessionChatTable)
      .set({
        report: extracted,
        needsSummary: 0,
        status: 'completed',
      })
      .where(eq(SessionChatTable.sessionId, sessionId));

    return NextResponse.json({ ok: true, pdfUrl });
  } catch (err: any) {
    console.error('Vapi webhook error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}