// src/lib/medical-ai-enhanced.ts - Use current stable models
import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is missing from .env file')
}

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.groq.com/openai/v1',
})

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

export class MedicalAIEnhanced {
  private readonly MAX_TOKENS = 1000  // Reduced for current models
  private readonly TEMPERATURE = 0.3  // Adjusted for stability

  // Current stable Groq models as of November 2025
  private readonly GROQ_MODELS = {
    primary: 'llama-3.1-8b-instant',     // Most stable and available
    backup: 'mixtral-8x7b-32768',         // Alternative if primary fails
    fallback: 'gemma2-9b-it'              // Third option for reliability
  } as const

  async generateMedicalResponse(query: MedicalQuery): Promise<MedicalResponse> {
    if (!openai) {
      throw new Error('Medical AI is not configured')
    }

    const systemPrompt = this.buildEnhancedSystemPrompt(query.language)
    const userPrompt = this.buildEnhancedUserPrompt(query)
    const selectedModel = this.selectModel(query)
    
    try {
      const response = await openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.MAX_TOKENS,
        temperature: this.TEMPERATURE,
      })

      const generatedText = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
      
      return { 
        response: generatedText, 
        confidence: this.calculateEnhancedConfidence(generatedText),
        cached: false 
      }
    } catch (error: any) {
      console.error('Groq Medical AI Error:', error)
      
      // Try backup models based on error type
      if (error.code === 'model_not_found' || error.code === 'model_decommissioned') {
        console.log('🔄 Trying backup models...')
        return this.tryBackupModels(query, systemPrompt, userPrompt)
      }
      
      return this.getFallbackResponse()
    }
  }

  private async tryBackupModels(query: MedicalQuery, systemPrompt: string, userPrompt: string): Promise<MedicalResponse> {
    const models = [this.GROQ_MODELS.backup, this.GROQ_MODELS.fallback]
    
    for (const model of models) {
      try {
        console.log(`🔄 Trying model: ${model}`)
        const response = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: this.MAX_TOKENS,
          temperature: this.TEMPERATURE,
        })

        const generatedText = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
        
        return { 
          response: generatedText, 
          confidence: this.calculateEnhancedConfidence(generatedText) * 0.95,
          cached: false 
        }
      } catch (modelError) {
        console.error(`Model ${model} failed:`, modelError)
        continue
      }
    }
    
    return this.getFallbackResponse()
  }

  private getFallbackResponse(): MedicalResponse {
    return {
      response: 'I apologize, but I\'m unable to provide medical advice at the moment. Please consult with a healthcare professional directly.',
      confidence: 0.5,
      cached: false
    }
  }

  private selectModel(query: MedicalQuery): string {
    // Simple model selection based on query complexity
    const complexityScore = this.calculateQueryComplexity(query)
    
    if (complexityScore > 0.8) {
      return this.GROQ_MODELS.primary // Use primary for complex queries
    }
    
    return this.GROQ_MODELS.primary // Default to primary for consistency
  }

  private calculateQueryComplexity(query: MedicalQuery): number {
    const symptomCount = query.symptoms.split(',').length
    const wordCount = query.symptoms.split(' ').length
    const hasContext = query.context ? 1 : 0
    
    // Simple complexity calculation
    const complexity = Math.min((symptomCount * 0.1) + (wordCount * 0.02) + (hasContext * 0.2), 1)
    return complexity
  }

  private buildEnhancedSystemPrompt(language: string): string {
  const base: Record<MedicalQuery['language'], string> = {
    yoruba: `Ẹ jọ̀ọ́, ẹ jẹ́ kí n ràn ẹ lọ́wọ́ pẹ̀lú ìtúpalẹ̀ àìsàn. Ẹ jọ́wọ́ ṣàpèjúwe àwọn àmì àìsàn yín.`,
    igbo: `Biko, ka m nyere gị aka n'ịtụle ọrịa. Biko gwa m ihe na-egosi na ọrịa.`,
    hausa: `Da fatan za ka iya taimaka mini da binciken cutar. Don Allah, bayyana min alamun cutarka.`,
    english: `You are MediBY, a medical AI assistant for Nigerian patients.`,
    pidgin: `You be MediBY, medical AI assistant for Nigerian people.`,
  }

  const selected = base[language as MedicalQuery['language']] ?? base.english

  return `You are MediBY, an advanced medical AI assistant.
Language: ${language}
${selected}

OUTPUT RULES (strict Markdown):
1. Start with a short **summary** heading:  \n## Summary\n...
2. Add  \n## Possible Causes\n- Cause 1\n- Cause 2
3. Add  \n## Recommendations\n- Rec 1\n- Rec 2
4. Add  \n## When to See a Doctor\n- Bullet list
5. Keep sentences **short** and use **bold** for emphasis.
6. Never repeat the prompt; only output the Markdown.`
}

  private buildEnhancedUserPrompt(query: MedicalQuery): string {
    const complexityInfo = this.calculateQueryComplexity(query) > 0.7 ? 
      'This appears to be a complex case requiring detailed analysis.' : 
      'This appears to be a standard consultation.';

    return `Patient Information:
- Symptoms: ${query.symptoms}
- Language: ${query.language}
- Duration: ${query.context || 'Not specified'}
- Additional Context: ${query.context || 'None provided'}
- Query Complexity: ${complexityInfo}

Please provide:
1. Analysis of symptoms
2. Potential causes (with cultural context)
3. Recommended next steps
4. When to see a doctor
5. Any immediate concerns to watch for`
  }

  private calculateEnhancedConfidence(response: string): number {
    const medicalKeywords = [
      'doctor', 'symptom', 'medicine', 'treatment', 'pain', 'fever', 'headache', 
      'diagnosis', 'professional', 'medical', 'health', 'malaria', 'typhoid',
      'consultation', 'examination', 'prescription', 'therapy', 'condition',
      'urgent', 'emergency', 'specialist', 'clinic', 'hospital', 'laboratory'
    ]
    
    const keywordMatches = medicalKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    ).length
    
    const lengthScore = Math.min(response.length / 500, 0.2)
    const keywordScore = Math.min(keywordMatches * 0.05, 0.7)
    const structureScore = response.includes('1.') || response.includes('-') ? 0.1 : 0
    
    return Math.min(keywordScore + lengthScore + structureScore, 0.95)
  }

  // Enhanced utility methods
  async generateQuickAssessment(symptoms: string, language: 'yoruba' | 'igbo' | 'hausa' | 'english' | 'pidgin'): Promise<MedicalResponse> {
    const query: MedicalQuery = { symptoms, language }
    return this.generateMedicalResponse(query)
  }

  validateQuery(query: MedicalQuery): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!query.symptoms || query.symptoms.trim().length < 5) {
      errors.push('Symptoms must be at least 5 characters long')
    }
    
    if (!this.getSupportedLanguages().includes(query.language)) {
      errors.push(`Unsupported language: ${query.language}`)
    }
    
    if (query.context && query.context.length > 1000) {
      errors.push('Context must be less than 1000 characters')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  getSupportedLanguages(): string[] {
    return ['yoruba', 'igbo', 'hausa', 'english', 'pidgin']
  }

  getModelInfo(): object {
    return {
      primary: this.GROQ_MODELS.primary,
      backup: this.GROQ_MODELS.backup,
      fallback: this.GROQ_MODELS.fallback,
      maxTokens: this.MAX_TOKENS,
      temperature: this.TEMPERATURE
    }
  }
}

// Export a singleton instance
export const medicalAIEnhanced = new MedicalAIEnhanced()