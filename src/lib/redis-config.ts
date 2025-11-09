// src/lib/redis-config.ts - Updated with error handling
import { Redis } from '@upstash/redis'

// Check if Redis credentials are available
const hasRedisCredentials = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

export const redis = hasRedisCredentials 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      retry: {
        retries: 3,
        backoff: (retryCount: number) => Math.min(retryCount * 1000, 5000)
      }
    })
  : null // Return null if no credentials

export const medicalCache = {
  async set(key: string, value: any, ttlSeconds = 3600) {
    if (!redis) return null
    // FIXED: Use proper Redis options
    return await redis.set(`mediby:${key}`, JSON.stringify(value), { ex: ttlSeconds })
  },
  
  async get(key: string) {
    if (!redis) return null
    const data = await redis.get(`mediby:${key}`)
    return data ? JSON.parse(data as string) : null
  },
  
  async invalidate(key: string) {
    if (!redis) return null
    return await redis.del(`mediby:${key}`)
  }
}

// Export default or null
export default redis