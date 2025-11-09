// src/lib/medical-ai.ts
import 'server-only'
import OpenAI from 'openai'

/* ---------- server-side singleton ---------- */
let openai: OpenAI | undefined

function getOpenAI(): OpenAI {
  if (openai) return openai

  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error(
      'OPENAI_API_KEY is missing. Please add it to your environment variables.'
    )
  }
  openai = new OpenAI({
    apiKey: key,
    baseURL: 'https://api.groq.com/openai/v1', // ← fixed: removed trailing space
  })
  return openai
}

/* ---------- types ---------- */
export interface MedicalQuery {
  symptoms: string
  language: 'yoruba' | 'igbo' | 'hausa' | 'english' | 'pidgin'
  context?: string
  patientId?: string
}

export interface MedicalResponse {
  response: string
  confidence: number
  cached: boolean
}

/* ---------- implementation ---------- */
export class MedicalAI {
  private readonly MAX_TOKENS  = 1000
  private readonly TEMPERATURE = 0.3

  private readonly GROQ_MODELS = {
    medical: 'llama-3.1-70b-versatile',
    fast:    'llama-3.1-8b-instant',
  } as const

  /* ---- main method ---- */
  async generateMedicalResponse(query: MedicalQuery): Promise<MedicalResponse> {
    const openai = getOpenAI()

    const systemPrompt = this.buildSystemPrompt(query.language)
    const userPrompt   = this.buildUserPrompt(query)

    try {
      const response = await openai.chat.completions.create({
        model:       this.GROQ_MODELS.medical,
        messages:    [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        max_tokens:  this.MAX_TOKENS,
        temperature: this.TEMPERATURE,
      })

      const generatedText =
        response.choices[0]?.message?.content ||
        'Sorry, I could not generate a response.'

      return {
        response:  generatedText,
        confidence: this.calculateConfidence(generatedText),
        cached:    false,
      }
    } catch (err: any) {
      console.error('MedicalAI error:', err)
      throw new Error('Medical AI service temporarily unavailable')
    }
  }

  /* ---- helpers ---- */
  private buildSystemPrompt(language: string): string {
  const base: Record<MedicalQuery['language'], string> = { // ✅ fixed
    yoruba:  `Ẹ jọ̀ọ́, ẹ jẹ́ kí n ràn ẹ lọ́wọ́ pẹ̀lú ìtúpalẹ̀ àìsàn. Ẹ jọ́wọ́ ṣàpèjúwe àwọn àmì àìsàn yín.`,
    igbo:    `Biko, ka m nyere gị aka n'ịtụle ọrịa. Biko gwa m ihe na-egosi na ọrịa.`,
    hausa:   `Da fatan za ka iya taimaka mini da binciken cutar. Don Allah, bayyana min alamun cutarka.`,
    english: `You are MediBY, a medical AI assistant for Nigerian patients. Analyze symptoms and provide helpful medical information.`,
    pidgin:  `You be MediBY, medical AI assistant for Nigerian people. Analyze symptoms well-well and give better medical information.`,
  }

  const selected = base[language as MedicalQuery['language']] ?? base.english

  return `You are MediBY, a medical AI assistant powered by Groq.
Language: ${language}
${selected}

Guidelines:
- Provide helpful medical information
- Always recommend seeing a doctor for proper diagnosis
- Be culturally sensitive and use simple, clear language
- Powered by Groq's advanced AI technology`
}

  private buildUserPrompt(query: MedicalQuery): string {
    return `Patient Symptoms: ${query.symptoms}
Additional Context: ${query.context || 'None provided'}
Language: ${query.language}`
  }

  private calculateConfidence(response: string): number {
    const keywords = [
      'doctor', 'symptom', 'medicine', 'treatment',
      'pain', 'fever', 'headache', 'diagnosis',
    ]
    const hasTerms = keywords.some(k => response.toLowerCase().includes(k))
    return Math.min(hasTerms ? 0.85 : 0.65, 0.95)
  }

  /* ---- utilities ---- */
  async generateQuickResponse(
    symptoms: string,
    language: MedicalQuery['language']
  ): Promise<string> {
    const res = await this.generateMedicalResponse({ symptoms, language })
    return res.response
  }

  validateSymptoms(symptoms: string): boolean {
    const len = symptoms.length
    return len >= 5 && len <= 500
  }

  getSupportedLanguages(): MedicalQuery['language'][] {
    return ['yoruba', 'igbo', 'hausa', 'english', 'pidgin']
  }
}

/* ---------- singleton ---------- */
export const medicalAI = new MedicalAI()