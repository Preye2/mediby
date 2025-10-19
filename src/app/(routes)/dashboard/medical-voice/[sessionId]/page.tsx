"use client";
import { useAxios } from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AiDoctorAgent } from "../../_components/AiDoctorAgentCard";
import Image from "next/image";
import { Circle, Loader, PhoneCall, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Vapi from "@vapi-ai/web";
import jsPDF from "jspdf";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Message = { role: string; text: string };

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

  useEffect(() => {
    if (!sessionId) return;
    axios.get(`/api/chat-session?sessionId=${sessionId}`).then((r) => setSession(r.data)).catch(() => router.push("/dashboard"));
  }, [sessionId]);

  const handleMessage = (msg: any) => {
    if (msg.type === "transcript") {
      const { role, transcriptType, transcript: txt } = msg;
      if (transcriptType === "partial") {
        setTranscript(txt);
        setSpeaking(role);
      } else if (transcriptType === "final" && txt?.trim()) {
        setMessages((m) => [...m, { role, text: txt }]);
        setTranscript("");
        setSpeaking(null);
      }
    }
  };

  const startVapiCall = async () => {
    if (!session) return;
    const d = session.selectedDoctor;
    if (!d?.doctorVoiceId || typeof d.doctorVoiceId !== "string") {
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

    /* ---------- 1.  Create assistant (server-side)  ---------- */
  const createRes = await fetch("https://api.vapi.ai/assistant", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_VAPI_ASSISTANT_API_KEY}`, // ➜ PUBLIC key
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: d.name,
    firstMessage: `Hello, I'm ${d.name}, your ${d.specialty}. How can I help you today?`,
    model: { provider: "groq", model: "llama3-8b-8192", messages: [{ role: "system", content: d.agentPrompt }] },
    voice: { provider: "playht", voiceId: d.doctorVoiceId },
  }),
});
    if (!createRes.ok) {
      const text = await createRes.text();
      console.error("Assistant create error:", createRes.status, text);
      toast.error("Failed to create assistant");
      setLoading(false);
      return;
    }
    const { id: assistantId } = await createRes.json();

    /* ---------- 2.  Start call (browser)  ---------- */
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
    vapi.on("message", handleMessage);
    vapi.on("error", (err: any) => console.error("❗ Vapi Error:", JSON.stringify(err, null, 2)));

    await vapi.start(assistantId);
    setLoading(false);
  };

  const endCall = () => {
    if (!vapiInst) return;
    vapiInst.stop();
  };

  const generateReportAndExit = async () => {
    setLoading(true);
    try {
      const conversation = messages.map((m) => `${m.role}: ${m.text}`).join("\n");
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
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama3-8b-8192", messages: [{ role: "user", content: prompt }], temperature: 0.25, max_tokens: 1000 }),
      });
      if (!groqRes.ok) throw new Error("Groq error");
      const json = await groqRes.json();
      const extracted = JSON.parse(json.choices[0].message.content);
      const report = { sessionId, agent: session.selectedDoctor.name, user: "Patient", timestamp: new Date().toLocaleString(), ...extracted };
      await axios.post("/api/medical-report", report);
      setSession((prev: typeof session) => (prev ? { ...prev, report } : null));
      toast.success("Report generated");
    } catch (e: any) {
      console.error("report error", e);
      toast.error("Could not generate report");
    } finally {
      setLoading(false);
      router.replace("/dashboard/history");
    }
  };

  const exportTranscriptAsPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(14);
    pdf.text("Consultation Transcript", 10, 10);
    messages.forEach((m, i) => pdf.text(`${m.role.toUpperCase()}: ${m.text}`, 10, 20 + i * 10));
    pdf.save("consultation_transcript.pdf");
  };

  if (!session) return <div className="grid h-screen place-items-center"><Loader className="h-8 w-8 animate-spin text-purple-500" /></div>;

  const doctor = session.selectedDoctor;

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <motion.h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-br from-purple-100 to-blue-200 bg-clip-text text-transparent" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        Voice Consultation Session
      </motion.h2>
      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <motion.div className="bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center" whileHover={{ scale: 1.02 }}>
          <Image src={doctor.image} alt={doctor.name} width={90} height={90} className="rounded-full border-4 border-blue-400 shadow-lg" />
          <h3 className="text-xl font-semibold mt-4 text-center">{doctor.name}</h3>
          <p className="text-sm text-gray-400">Specialty: {doctor.specialty}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-gray-400 text-sm">Created: {new Date(session.createdOn).toLocaleDateString()}</span>
            <span className="flex items-center gap-1 text-sm"><Circle className={`w-3 h-3 ${startCall ? "text-green-400" : "text-red-400"}`} />{startCall ? "Online" : "Offline"}</span>
          </div>
        </motion.div>
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
          <h4 className="text-lg font-semibold mb-3">Consultation Transcript</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {messages.slice(-6).map((m, idx) => (
              <motion.p key={idx} className="text-gray-300 text-sm" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }}>
                <strong>{m.role}:</strong> {m.text}
              </motion.p>
            ))}
            {transcript && <motion.p className="text-blue-400 font-medium">{speaking}: {transcript}</motion.p>}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            {!startCall ? (
              <Button onClick={startVapiCall} disabled={loading}>
                {loading ? <Loader className="animate-spin" /> : <PhoneCall />} Start Consultation
              </Button>
            ) : (
              <Button variant="destructive" onClick={endCall} disabled={loading}>
                {loading ? <Loader className="animate-spin" /> : <PhoneOff />} End Consultation
              </Button>
            )}
            <Button variant="outline" onClick={exportTranscriptAsPDF} className="mt-2 text-gray-600">
              Export as PDF
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}