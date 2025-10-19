// src/app/api/suggested-ai-doctors/route.ts
import { openai } from '@/config/OpenAiModel';
import { AiDoctorList } from '@/shared/doctorList';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { notes } = await req.json();
    if (!notes || typeof notes !== 'string')
      return NextResponse.json({ error: 'Symptoms required' }, { status: 400 });

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a helpful medical assistant. Based on the user's symptoms, suggest which doctors from the following list are most relevant. Do not create new doctors. Only respond with doctors from this list:\n\n${JSON.stringify(
            AiDoctorList
          )}`,
        },
        {
          role: 'user',
          content: `User symptoms: ${notes.trim()}\n\nReturn ONLY a JSON array of relevant doctors from the provided list. Do not include explanations or markdown.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });

    const aiRaw = completion.choices[0]?.message?.content?.trim() ?? '';
    console.log('🤖 AI raw response:', aiRaw);

    /* ----------  tolerant JSON extractor  ---------- */
    // 1.  try to find [...] anywhere
    const match = aiRaw.match(/\[.*\]/);
    if (match) {
      const aiParsed = JSON.parse(match[0]);
      if (Array.isArray(aiParsed)) {
        const matched = AiDoctorList.filter((doc) => aiParsed.some((aiDoc: any) => aiDoc.name === doc.name));
        return NextResponse.json(matched, { status: 200 });
      }
    }

    // 2.  fallback: parse the whole thing
    try {
      const maybeArray = JSON.parse(aiRaw);
      if (Array.isArray(maybeArray)) {
        const matched = AiDoctorList.filter((doc) => maybeArray.some((aiDoc: any) => aiDoc.name === doc.name));
        return NextResponse.json(matched, { status: 200 });
      }
    } catch {
      /* ignore */
    }

    // 3.  nothing worked → empty list (no crash)
    return NextResponse.json([], { status: 200 });
  } catch (error: any) {
    console.error('❌ /api/suggested-ai-doctors:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.', message: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}