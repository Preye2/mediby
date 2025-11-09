// src/lib/groq.ts
import axios from 'axios';

export async function groq(prompt: string): Promise<string> {
  const { data } = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions', 
    {
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.25,
      max_tokens: 1000,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 
        'Content-Type': 'application/json',
      },
    }
  );
  return data.choices[0].message.content;
}