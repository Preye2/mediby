// src/lib/medical-ai-cached.ts - Medical AI with Redis caching
import { MedicalAI } from './medical-ai'
import { Redis } from '@upstash/redis'
import * as crypto from 'crypto'

// Redis client for caching
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

export interface CachedMedicalResponse {
  response: string
  confidence: number
  cached: boolean
  cacheHit: boolean
}

export class MedicalAICached extends MedicalAI {
  private hashQuery(query: any): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify({ symptoms: query.symptoms, language: query.language }))
      .digest('hex')
  }

  async generateMedicalResponseWithCache(query: any): Promise<CachedMedicalResponse> {
    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.log('⚠️  Redis not configured - using direct API calls')
      const result = await this.generateMedicalResponse(query)
      return { ...result, cacheHit: false }
    }

    const cacheKey = `medical:${query.language}:${this.hashQuery(query)}`
    
    try {
      // Check cache first
      const cached = await redis.get(cacheKey)
      if (cached) {
        console.log('✅ Cache hit for:', query.language)
        return { 
          response: cached as string, 
          confidence: 0.95, 
          cached: true,
          cacheHit: true 
        }
      }

      console.log('🔄 Cache miss - calling API')
      
      // Get fresh response
      const result = await this.generateMedicalResponse(query)
      
      // Cache for 1 hour
      await redis.set(cacheKey, result.response, { ex: 3600 })
      console.log('💾 Cached response for 1 hour')
      
      return { ...result, cacheHit: false }
      
    } catch (cacheError) {
      console.error('Cache error:', cacheError)
      // Fallback to direct API call
      const result = await this.generateMedicalResponse(query)
      return { ...result, cacheHit: false }
    }
  }
}