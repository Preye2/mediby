// src/lib/summary.ts
import { groq } from './groq';

export async function generateSummary(conversation: string): Promise<{
  mainComplaint: string;
  symptoms: string[];
  duration: string;
  severity: 'mild' | 'moderate' | 'severe';
  medicationsMentioned: string[];
  recommendations: string[];
  summary: string;
}> {
  const prompt = `You are a medical AI. Extract the following JSON exactly:
{
  "mainComplaint": string,
  "symptoms": string[],
  "duration": string,
  "severity": "mild" | "moderate" | "severe",
  "medicationsMentioned": string[],
  "recommendations": string[],
  "summary": string
}
Conversation:\n${conversation}`;

  const content = await groq(prompt);
  return JSON.parse(content.replace(/```json?|```/g, '').trim());
}