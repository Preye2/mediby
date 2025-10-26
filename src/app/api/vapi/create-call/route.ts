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

  const assistantPayload = {
    name: doctor.name,
    firstMessage: `Hello, I'm ${doctor.name}, your ${doctor.specialty}. How can I help you today?`,
    model: { provider: "groq", model: "llama3-8b-8192", messages: [{ role: "system", content: doctor.agentPrompt }] },
    voice: {
      provider: "cartesia",
      voiceId: doctor.doctorVoiceId,
      model: "sonic",
    },
  };

  // 1.  Create assistant  →  USE PRIVATE KEY
  const res = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(assistantPayload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Vapi assistant error:", res.status, text);
    return NextResponse.json({ error: "Vapi assistant error" }, { status: 500 });
  }

  const assistant = await res.json();

  // 2.  Create call  →  USE PUBLIC KEY
  const callRes = await fetch("https://api.vapi.ai/call/web", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_VAPI_ASSISTANT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ assistantId: assistant.id }),
  });

  if (!callRes.ok) {
    const text = await callRes.text();
    console.error("Vapi call error:", callRes.status, text);
    return NextResponse.json({ error: "Vapi call error" }, { status: 500 });
  }

  const call = await callRes.json();
  return NextResponse.json({ assistantId: assistant.id }); 
}