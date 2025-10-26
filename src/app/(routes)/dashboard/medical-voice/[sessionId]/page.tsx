// src/app/(routes)/dashboard/medical-voice/[sessionId]/page.tsx
"use client";

import { useAxios } from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AiDoctorAgent } from "../../_components/AiDoctorAgentCard";
import Image from "next/image";
import { Circle, Loader, PhoneCall, PhoneOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Vapi from "@vapi-ai/web";
import jsPDF from "jspdf";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Message = { role: string; text: string };

/* ---------- utility: safe medical JSON fallback ---------- */
function fallbackParseMedical(text: string) {
  const safeMatch = (regex: RegExp, defaultVal: any = "") =>
    text.match(regex)?.[1]?.trim().replace(/"/g, "") ?? defaultVal;
  const safeArrayMatch = (regex: RegExp): string[] => {
    const m = text.match(regex);
    if (!m) return [];
    try {
      return JSON.parse(m[1]);
    } catch {
      return m[1]
        .split(",")
        .map((s) => s.trim().replace(/"/g, ""))
        .filter(Boolean);
    }
  };
  return {
    mainComplaint: safeMatch(/"mainComplaint"\s*:\s*"([^"]+)"/, "Not specified"),
    symptoms: safeArrayMatch(/"symptoms"\s*:\s*(\[[^\]]*\])/),
    duration: safeMatch(/"duration"\s*:\s*"([^"]+)"/, "Not specified"),
    severity: (safeMatch(/"severity"\s*:\s*"(mild|moderate|severe)"/) ||
      "moderate") as "mild" | "moderate" | "severe",
    medicationsMentioned: safeArrayMatch(/"medicationsMentioned"\s*:\s*(\[[^\]]*\])/),
    recommendations: safeArrayMatch(/"recommendations"\s*:\s*(\[[^\]]*\])/),
    summary: safeMatch(/"summary"\s*:\s*"([^"]+)"/, "Consultation completed."),
  };
}

export default function MedicalVoice() {
  const axios = useAxios();
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [startCall, setStartCall] = useState(false);
  const [vapiInst, setVapiInst] = useState<Vapi | null>(null);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);

  /* ---------- session fetch + hydrate messages ---------- */
  useEffect(() => {
    if (!sessionId) return;
    axios
      .get(`/api/chat-session?sessionId=${sessionId}`)
      .then((r) => setSession(r.data))
      .catch(() => router.push("/dashboard"));
    const raw = sessionStorage.getItem(`msgs-${sessionId}`);
    if (raw) setMessages(JSON.parse(raw));
  }, [sessionId]);

  useEffect(() => {
    sessionStorage.setItem(`msgs-${sessionId}`, JSON.stringify(messages));
  }, [messages]);

  const handleMessage = (msg: any) => {
  if (msg.type === "transcript" && msg.transcriptType === "final") {
    setMessages((m) => [...m, { role: msg.role, text: msg.transcript }]);
  }
};

  /* ---------- start call ---------- */
  const startVapiCall = async () => {
    if (!session) return;
    const d = session.selectedDoctor;
    console.log("doctor obj", d);
    console.log("voiceId", d?.doctorVoiceId);

    if (!d?.doctorVoiceId?.trim()) {
      toast.error("Doctor voice ID missing");
      return;
    }
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      toast.error("Microphone access required");
      setLoading(false);
      return;
    }
    /* create call server-side */
    const createRes = await fetch("/api/vapi/create-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor: d }),
    });
    if (!createRes.ok) {
      toast.error("Failed to create assistant");
      setLoading(false);
      return;
    }
    const { assistantId } = await createRes.json(); // ← assign

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_API_KEY!);
setVapiInst(vapi);

vapi.on("call-start", () => {
  setStartCall(true);
  toast.success("Call started");
});
vapi.on("call-end", () => {
  setStartCall(false);
  generateReportAndExit();
});
vapi.on("message", handleMessage); // ✅ captures final text
vapi.on("error", (err: any) => console.error("❗ Vapi Error:", err));

await vapi.start(assistantId); // ← single call, no wrapper
setLoading(false);
  };

  /* ---------- end / mute ---------- */
  const endCall = () => vapiInst?.stop();
  const toggleMute = () => {
    if (!vapiInst) return;
    const next = !muted;
    setMuted(next);
    vapiInst.setMuted(next);
  };

  /* ---------- report ---------- */
  const generateReportAndExit = async () => {
    setLoading(true);
    try {
      const conversation = messages.map((m) => `${m.role}: ${m.text}`).join("\n");
      if (!conversation.trim()) {
        toast.error("No transcript to summarise");
        router.replace("/dashboard/history");
        setLoading(false);
        return;
      }
      const prompt = `
You are a medical AI. Extract the following JSON exactly:
{
  "mainComplaint": string,
  "symptoms": string[],
  "duration": string,
  "severity": "mild" | "moderate" | "severe",
  "medicationsMentioned": string[],
  "recommendations": string[],
  "summary": string
}
Conversation:
${conversation}`;
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.25,
          max_tokens: 1000,
        }),
      });
      if (!res.ok) throw new Error("Groq error");
      const json = await res.json();
      let content = json.choices[0].message.content;
      content = content.replace(/```json?|```/g, "").trim(); // strip markdown
      const extracted = JSON.parse(content);

      const report = {
        sessionId,
        agent: session.selectedDoctor.name,
        user: "Patient",
        timestamp: new Date().toLocaleString(),
        mainComplaint: extracted.mainComplaint || session.note || "Not specified",
        symptoms: extracted.symptoms || [],
        duration: extracted.duration || "Not specified",
        severity: extracted.severity || "moderate",
        medicationsMentioned: extracted.medicationsMentioned || [],
        recommendations: extracted.recommendations || [],
        summary: extracted.summary || "Consultation completed successfully.",
      };
      await axios.post("/api/medical-report", report);

      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text("MediBY Consultation Report", 20, 20);
      pdf.setFontSize(12);
      pdf.text(`Doctor: ${report.agent}`, 20, 35);
      pdf.text(`Date: ${report.timestamp}`, 20, 45);
      pdf.text(`Main Complaint: ${report.mainComplaint}`, 20, 55);
      pdf.text(`Severity: ${report.severity}`, 20, 65);
      pdf.text(`Duration: ${report.duration}`, 20, 75);
      pdf.text("Symptoms:", 20, 85);
      report.symptoms.forEach((s: string, i: number) => pdf.text(` • ${s}`, 25, 95 + i * 6));
      pdf.text("Medications Mentioned:", 20, 105 + report.symptoms.length * 6);
      report.medicationsMentioned.forEach((m: string, i: number) =>
        pdf.text(` • ${m}`, 25, 115 + report.symptoms.length * 6 + i * 6)
      );
      pdf.text("Recommendations:", 20, 135 + (report.symptoms.length + report.medicationsMentioned.length) * 6);
      report.recommendations.forEach((r: string, i: number) =>
        pdf.text(` • ${r}`, 25, 145 + (report.symptoms.length + report.medicationsMentioned.length) * 6 + i * 6)
      );
      pdf.text("Summary:", 20, 165 + (report.symptoms.length + report.medicationsMentioned.length + report.recommendations.length) * 6);
      pdf.text(report.summary, 20, 175 + (report.symptoms.length + report.medicationsMentioned.length + report.recommendations.length) * 6);

      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text("Full Transcript", 20, 20);
      pdf.setFontSize(10);
      const split = pdf.splitTextToSize(conversation, 170);
      split.forEach((line: string, i: number) => pdf.text(line, 20, 35 + i * 5));
      pdf.save(`consultation_${sessionId}.pdf`);
      toast.success("Report generated");
    } catch (e: any) {
      console.error("Report error", e);
      toast.error("Could not generate report");
    } finally {
      setLoading(false);
      router.replace("/dashboard/history");
    }
  };

  if (!session)
    return (
      <div className="grid h-screen place-items-center">
        <Loader className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );

  const doctor = session.selectedDoctor;

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2
        className="text-3xl font-bold mb-8 text-center bg-gradient-to-br from-purple-100 to-blue-200 bg-clip-text text-transparent"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Voice Consultation Session
      </motion.h2>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center"
          whileHover={{ scale: 1.02 }}
        >
          <Image
            src={doctor.image}
            alt={doctor.name}
            width={90}
            height={90}
            className="rounded-full border-4 border-blue-400 shadow-lg"
          />
          <h3 className="text-xl font-semibold mt-4 text-center">{doctor.name}</h3>
          <p className="text-sm text-gray-400">Specialty: {doctor.specialty}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-gray-400 text-sm">Created: {new Date(session.createdOn).toLocaleDateString()}</span>
            <span className="flex items-center gap-1 text-sm">
              <Circle className={`w-3 h-3 ${startCall ? "text-green-400" : "text-red-400"}`} />
              {startCall ? "Online" : "Offline"}
            </span>
          </div>
        </motion.div>
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
          <h4 className="text-lg font-semibold mb-3">Consultation Transcript</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {messages.slice(-6).map((m, idx) => (
              <motion.p
                key={idx}
                className="text-gray-300 text-sm"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <strong>{m.role}:</strong> {m.text}
              </motion.p>
            ))}
            {transcript && (
              <motion.p className="text-blue-400 font-medium">
                {speaking}: {transcript}
              </motion.p>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            {!startCall ? (
              <Button onClick={startVapiCall} disabled={loading}>
                {loading ? <Loader className="animate-spin" /> : <PhoneCall />} Start Consultation
              </Button>
            ) : (
              <>
                <Button variant="destructive" onClick={endCall} disabled={loading}>
                  {loading ? <Loader className="animate-spin" /> : <PhoneOff />} End Consultation
                </Button>
                <Button variant="outline" onClick={toggleMute} className="mt-2 text-gray-600">
                  {muted ? <MicOff /> : <Mic />} {muted ? "Unmute" : "Mute"}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => generateReportAndExit()} className="mt-2 text-gray-600">
              Export Report PDF
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}