// app/api/ai-medical-consultation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { medicalAIEnhanced } from '@/lib/medical-ai-enhanced'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/config/database'
import { SessionChatTable } from '@/config/userSchema'

export const runtime = 'nodejs' // stay on Node for pg / groq

/* -------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    /* 1. auth */
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    /* 2. parse body */
    const body = await req.json()
    const { symptoms, language = 'english', context, sessionId } = body

    if (!symptoms || typeof symptoms !== 'string') {
      return NextResponse.json({ error: 'Valid symptoms string is required' }, { status: 400 })
    }

    /* 3. language check */
    const supported = medicalAIEnhanced.getSupportedLanguages()
    const lang = language.toLowerCase()
    if (!supported.includes(lang)) {
      return NextResponse.json(
        { error: `Unsupported language. Supported: ${supported.join(', ')}` },
        { status: 400 }
      )
    }

    /* 4. build query object */
    const query = {
      symptoms: symptoms.trim(),
      language: lang as 'yoruba' | 'igbo' | 'hausa' | 'english' | 'pidgin',
      context: context?.trim(),
      patientId: userId,
    }

    /* 5. enhanced validation */
    const { valid, errors } = medicalAIEnhanced.validateQuery(query)
    if (!valid) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 })
    }

    /* 6. AI response */
    const result = await medicalAIEnhanced.generateMedicalResponse(query)


    /* 8. success */
    return NextResponse.json({
      response: result.response,
      confidence: result.confidence,
      language: lang,
      cached: result.cached,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('Medical AI API Error:', {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Unable to process medical consultation. Please try again later.' },
      { status: 500 }
    )
  }
}