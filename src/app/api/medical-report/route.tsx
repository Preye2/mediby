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
// app/api/medical-report/route.ts
import { database } from "@/config/database";
import { openai } from "@/config/OpenAiModel";
import { SessionChatTable } from "@/config/userSchema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { generatePdf } from "@/lib/pdf";
import { uploadToS3 } from "@/lib/s3";

const REPORT_PROMPT = `You are a medical report assistant. Generate a concise and professional report based on the user's conversation with the AI medical assistant.
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

Only include valid JSON. Do not include explanations or extra text.`;

/* ----------  shape after AI  ---------- */
interface AIReport {
  sessionId: string;
  agent: string;
  user: string;
  timestamp: string;
  mainComplaint: string;
  symptoms: string[];
  summary: string;
  duration: string;
  severity: string;
  medicationsMentioned: string[];
  recommendations: string[];
}

export async function POST(req: NextRequest) {
  const { sessionId, sessionParams, messages } = await req.json();

  try {
    /* 1.  ask LLM  */
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: REPORT_PROMPT },
        {
          role: "user",
          content:
            "AI medical assistant info: " +
            JSON.stringify(sessionParams) +
            ", Conversation: " +
            JSON.stringify(messages),
        },
      ],
    });

    /* 2.  clean AI response  */
    const aiRaw = completion.choices[0].message?.content?.trim() || "";
    const cleaned = aiRaw.replace(/```json?|```/g, "").trim();
    const aiParsed: AIReport = JSON.parse(cleaned);

    /* 3.  cast severity to literal union  */
    const severity =
      aiParsed.severity === "mild" || aiParsed.severity === "moderate" || aiParsed.severity === "severe"
        ? aiParsed.severity
        : "moderate";

    /* 4.  build final report  */
    const report = { ...aiParsed, severity };

   /* 5.  generate PDF & upload  */
const pdfBuffer = await generatePdf({ ...report, conversation: messages });
const pdfUrl = await uploadToS3(pdfBuffer, `reports/${sessionId}.pdf`);

/* 6.  final shape WITH pdfUrl  */
const reportForDb = { ...report, pdfUrl }; // <-- extra field added here

await database
  .update(SessionChatTable)
  .set({
    report: sql`${JSON.stringify(reportForDb)}::jsonb`, // raw JSONB literal
    needsSummary: 0,
    status: 'completed',
  })
  .where(eq(SessionChatTable.sessionId, sessionId));

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Medical-report error:', error);
    return NextResponse.json({ error: error.message || 'Unexpected error.' }, { status: 500 });
  }
}