// src/app/(routes)/dashboard/medical-voice/[sessionId]/page.tsx
"use client";

import { useAxios } from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Circle, Loader, PhoneCall, PhoneOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Vapi from "@vapi-ai/web";
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);

  /* ----------  hydrate session + transcript  ---------- */
  useEffect(() => {
    if (!sessionId) return;
    axios.get(`/api/chat-session?sessionId=${sessionId}`).then((r) => setSession(r.data));
    const raw = sessionStorage.getItem(`msgs-${sessionId}`);
    if (raw) setMessages(JSON.parse(raw));
  }, [sessionId]);

  useEffect(() => {
    sessionStorage.setItem(`msgs-${sessionId}`, JSON.stringify(messages));
  }, [messages]);

  /* ----------  push every transcript line to server  ---------- */
  const handleMessage = async (msg: any) => {
    if (msg.type !== "transcript") return;
    const text = msg.transcript;
    setMessages((m) => [...m, { role: msg.role, text }]);

    // durability: send to server (webhook will use it)
    await axios.post("/api/vapi/log", { sessionId, role: msg.role, text, isFinal: msg.transcriptType === "final" });
  };

  /* ----------  start Vapi call  ---------- */
  const startVapiCall = async () => {
    if (!session) return;
    const d = session.selectedDoctor;
    if (!d?.doctorVoiceId?.trim()) return toast.error("Doctor voice ID missing");

    setLoading(true);
    try {
      const createRes = await fetch(`/api/vapi/create-call?sessionId=${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor: d }),
      });
      if (!createRes.ok) throw new Error("create call failed");
      const { assistant } = await createRes.json();

      const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_API_KEY!);
      setVapiInst(vapi);

      vapi.on("call-start", () => {
        setStartCall(true);
        toast.success("Call started");
      });
      vapi.on("call-end", () => {
        setStartCall(false);
        toast.success("Call ended – report will appear shortly");
        setTimeout(() => router.replace("/dashboard/history"), 1500);
      });
      vapi.on("message", handleMessage);
      vapi.on("error", (e: any) => toast.error("Vapi error"));

      await vapi.start(assistant);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ----------  mute / unmute  ---------- */
  const toggleMute = () => {
  if (!vapiInst || !startCall) return; // double guard
  const next = !muted;
  setMuted(next);
  vapiInst.setMuted(next);
};

  /* ----------  optimistic PDF download  ---------- */
  const downloadReport = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/medical-report?sessionId=${sessionId}`);
      if (data.pdfUrl) window.open(data.pdfUrl, "_blank");
      else toast.info("Report still cooking – check again in a few seconds");
    } catch {
      toast.error("Could not fetch report");
    } finally {
      setLoading(false);
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
        {/* doctor card */}
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
            <span className="text-gray-400 text-sm">
              Created: {new Date(session.createdOn).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1 text-sm">
              <Circle className={`w-3 h-3 ${startCall ? "text-green-400" : "text-red-400"}`} />
              {startCall ? "Online" : "Offline"}
            </span>
          </div>
        </motion.div>

        {/* transcript + controls */}
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
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {!startCall ? (
              <Button onClick={startVapiCall} disabled={loading}>
                {loading ? <Loader className="animate-spin" /> : <PhoneCall />} Start Consultation
              </Button>
            ) : (
              <>
                <Button variant="destructive" onClick={() => vapiInst?.stop()} disabled={loading}>
                  <PhoneOff /> End Consultation
                </Button>
                <Button
                  variant="outline"
                  onClick={toggleMute}
                  disabled={!startCall} // ← disable until call is active
                  className="mt-2 text-gray-600"
                >
                  {muted ? <MicOff /> : <Mic />} {muted ? "Unmute" : "Mute"}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={downloadReport} className="mt-2 text-gray-600">
              Download Report PDF
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}