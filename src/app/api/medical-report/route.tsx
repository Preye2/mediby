// import { database } from "@/config/database";
// import { openai } from "@/config/OpenAiModel";
// import { SessionChatTable } from "@/config/userSchema";
// import { eq } from "drizzle-orm";
// import { NextRequest, NextResponse } from "next/server";

// const REPORT_PROMPT = `
// You are a medical report assistant. Generate a concise and professional report based on the user's conversation with the AI medical assistant.

// Use the following fields:

// 1. sessionId: a unique session identifier
// 2. agent: the medical assistant’s name and specialty (e.g. "Dr. John Smith, Specialty: Cardiology")
// 3. user: name of the patient (or use "Anonymous" if not provided)
// 4. timestamp: current date and time in ISO format
// 5. mainComplaint: one-sentence summary of the user's main health concern
// 6. symptoms: list of symptoms mentioned by the user
// 7. summary: 3–4 sentence summary of the conversation and medical advice
// 8. duration: how long the user has experienced the symptoms
// 9. severity: one of ["mild", "moderate", "severe"]
// 10. medicationsMentioned: list of medications discussed or prescribed (if any)
// 11. recommendations: list of AI recommendations (e.g., "get rest", "consult a doctor", etc.)

// Return your response **only** as a valid JSON object using this format:

// {
//   "sessionId": "string",
//   "agent": "string",
//   "user": "string",
//   "timestamp": "string",
//   "mainComplaint": "string",
//   "symptoms": ["string"],
//   "summary": "string",
//   "duration": "string",
//   "severity": "string",
//   "medicationsMentioned": ["string"],
//   "recommendations": ["string"]
// }

// Only include valid JSON. Do not include explanations or extra text.

// Base your answer entirely on the doctor's profile and the conversation between the user and assistant.
// `;


// export async function POST(req: NextRequest) {
//   const { sessionId, sessionParams, messages } = await req.json();

//   try {
//     const user = "AI medical assistant info:" + JSON.stringify(sessionParams) + ", Conversation:" + JSON.stringify(messages);

//     const completion = await openai.chat.completions.create({
//       model: "meta-llama/llama-4-scout-17b-16e-instruct",
//       messages: [
//         {
//           role: "system",
//           content: REPORT_PROMPT
//         },
//         {
//           role: "user",
//           content: user
//         }
//       ]
//     });

//     const aiRaw = completion.choices[0].message?.content?.trim() || '';
//     console.log("🤖 AI raw response:", aiRaw); 

//     const aiParsed = JSON.parse(aiRaw);

//     const result = await database.update(SessionChatTable).set({
//       report: aiParsed,
//       conversation: messages
//     }).where(eq(SessionChatTable.sessionId, sessionId));

//     return NextResponse.json(aiParsed);

//   } catch (error:any) {
//     console.error("❌ Error generating report:", error);
//     return NextResponse.json({ error: error.message || error });
//   }
// }
import { database } from "@/config/database";
import { openai } from "@/config/OpenAiModel";
import { SessionChatTable } from "@/config/userSchema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const REPORT_PROMPT = `
You are a medical report assistant. Generate a concise and professional report based on the user's conversation with the AI medical assistant.

Use the following fields:

1. sessionId: a unique session identifier
2. agent: the medical assistant’s name and specialty (e.g. "Dr. John Smith, Specialty: Cardiology")
3. user: name of the patient (or use "Anonymous" if not provided)
4. timestamp: current date and time in ISO format
5. mainComplaint: one-sentence summary of the user's main health concern
6. symptoms: list of symptoms mentioned by the user
7. summary: 3–4 sentence summary of the conversation and medical advice
8. duration: how long the user has experienced the symptoms
9. severity: one of ["mild", "moderate", "severe"]
10. medicationsMentioned: list of medications discussed or prescribed (if any)
11. recommendations: list of AI recommendations (e.g., "get rest", "consult a doctor", etc.)

Return your response **only** as a valid JSON object using this format:

{
"sessionId": "string",
"agent": "string",
"user": "string",
"timestamp": "string",
"mainComplaint": "string",
"symptoms": ["string"],
"summary": "string",
"duration": "string",
"severity": "string",
"medicationsMentioned": ["string"],
"recommendations": ["string"]
}

Only include valid JSON. Do not include explanations or extra text.

Base your answer entirely on the doctor's profile and the conversation between the user and assistant.
`;

// TypeScript interface (optional)
interface ReportType {
  sessionId: string
  agent: string
  user: string
  timestamp: string
  mainComplaint: string
  symptoms: string[]
  summary: string
  duration: string
  severity: string
  medicationsMentioned: string[]
  recommendations: string[]
}

function validateReport(data: any): data is ReportType {
  return (
    typeof data?.sessionId === 'string' &&
    typeof data?.agent === 'string' &&
    typeof data?.user === 'string' &&
    typeof data?.timestamp === 'string' &&
    typeof data?.mainComplaint === 'string' &&
    Array.isArray(data?.symptoms) &&
    typeof data?.summary === 'string' &&
    typeof data?.duration === 'string' &&
    typeof data?.severity === 'string' &&
    Array.isArray(data?.medicationsMentioned) &&
    Array.isArray(data?.recommendations)
  )
}

export async function POST(req: NextRequest) {
  const { sessionId, sessionParams, messages } = await req.json();

  try {
    // Compose user input for the model
    const promptUserMessage =
      "AI medical assistant info: " +
      JSON.stringify(sessionParams) +
      ", Conversation: " +
      JSON.stringify(messages);

    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: REPORT_PROMPT },
        { role: "user", content: promptUserMessage }
      ]
    });

    const aiRaw = completion.choices[0].message?.content?.trim() || '';
    console.log("AI raw response:", aiRaw);

    let aiParsed;
    try {
      aiParsed = JSON.parse(aiRaw);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON format from AI response." },
        { status: 500 }
      );
    }

    if (!validateReport(aiParsed)) {
      return NextResponse.json(
        { error: "AI returned an invalid report structure." },
        { status: 400 }
      );
    }

    await database
      .update(SessionChatTable)
      .set({
        report: aiParsed,
        conversation: messages
      })
      .where(eq(SessionChatTable.sessionId, sessionId));

    return NextResponse.json(aiParsed);
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error." },
      { status: 500 }
    );
  }
}
