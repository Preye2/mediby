// src/app/api/ussd/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* 1.  ENVIRONMENT  */
/* ------------------------------------------------------------------ */
const AT_USERNAME = process.env.AT_USERNAME ?? "sandbox";
const AT_API_KEY  = process.env.AT_API_KEY!;
const SMS_FROM    = process.env.SMS_SENDER ?? "MediBY";

if (!AT_API_KEY) {
  throw new Error("AT_API_KEY is missing in environment variables");
}

/* ------------------------------------------------------------------ */
/* 2.  SCHEMAS  */
/* ------------------------------------------------------------------ */
const UssdPayload = z.object({
  phoneNumber: z.string(),
  text: z.string(),
  sessionId: z.string(),
});

/* ------------------------------------------------------------------ */
/* 3.  SYMPTOM MAPPING  */
/* ------------------------------------------------------------------ */
const SYMPTOM_MAP: Record<string, string> = {
  "1": "chest pain",
  "2": "sharp pain",
  "3": "2 days",
  "4": "severe",
  "5": "mild fever",
  "6": "headache",
  "7": "cough",
  "8": "fatigue",
  "9": "nausea",
  "0": "shortness of breath",
};

/* ------------------------------------------------------------------ */
/* 4.  MAIN HANDLER  */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    /* ---- 4a. parse & validate ---- */
    const body = Object.fromEntries(await req.formData());
    const parse = UssdPayload.safeParse(body);
    if (!parse.success) {
      return new Response("END Invalid request", { status: 400 });
    }
    const { phoneNumber, text, sessionId } = parse.data;

    /* ---- 4b. build symptom string ---- */
    const choices = text.split("*").filter(Boolean);
    const symptom =
      choices.map((c) => SYMPTOM_MAP[c] || "").filter(Boolean).join(", ") || "general discomfort";

    /* ---- 4c. AI assessment ---- */
    const { medicalAIEnhanced } = await import("@/lib/medical-ai-enhanced");
    const aiReply = await medicalAIEnhanced.generateQuickAssessment(symptom, "english");
    const shortReply = aiReply.response.slice(0, 155);

    /* ---- 4d. send SMS ---- */
    await sendSMS(phoneNumber, `MediBY: ${shortReply} Ref:${sessionId.slice(-4)}`);

    /* ---- 4e. USSD termination ---- */
    return new Response("END Advice sent via SMS.", { status: 200 });
  } catch (err: any) {
    console.error("USSD error:", err);
    return new Response("END Server error. Try again later.", { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* 5.  SMS HELPER  */
/* ------------------------------------------------------------------ */
async function sendSMS(to: string, msg: string) {
  const clean = to.replace(/^\+?/, "").replace(/^0/, "234");

  const url = "https://api.sandbox.africastalking.com/version1/messaging";
  const params = new URLSearchParams({
    username: AT_USERNAME,
    to: clean,
    message: msg,
    from: SMS_FROM,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apiKey: AT_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AT SMS ${response.status} ${text}`);
  }
}