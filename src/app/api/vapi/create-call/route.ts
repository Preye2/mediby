// src/app/api/vapi/create-call/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const doctorSchema = z.object({
  name: z.string(),
  specialty: z.string(),
  agentPrompt: z.string(),
  doctorVoiceId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const doctor = doctorSchema.parse(body.doctor);

  const payload = {
    assistant: {
      name: doctor.name,
      firstMessage: `Hello, I'm ${doctor.name}, your ${doctor.specialty}. How can I help you today?`,
      model: { provider: "groq", model: "llama3-8b-8192", messages: [{ role: "system", content: doctor.agentPrompt }] },
      voice: { provider: "cartesia", voiceId: doctor.doctorVoiceId, model: "sonic" },
      // transcriber: { provider: "deepgram", language: "en", model: "nova-2", smartFormat: true },
    },
  };

  const res = await fetch("https://api.vapi.ai/call/web", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_VAPI_ASSISTANT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Vapi call error:", res.status, text);
    return NextResponse.json({ error: "Vapi call error" }, { status: 500 });
  }

  const call = await res.json();
  return NextResponse.json({ assistant: payload.assistant }); // ← object
}