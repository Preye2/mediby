// src/app/(routes)/dashboard/_components/AddNewSessionDialog.tsx
"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, SignInButton } from "@clerk/nextjs";
import axios from "axios";

/* ----------  TYPES  ---------- */
type AiDoctorAgent = {
  id: number;
  name: string;
  specialty: string;
  description: string;
  image: string;
  agentPrompt: string;
  doctorVoiceId: string;
};

/* ----------  AXIOS INSTANCE  ---------- */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "",
  timeout: 15000,
});
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("🚨 API error", err.response?.data ?? err.message);
    return Promise.reject(err);
  }
);

/* ----------  COMPONENT  ---------- */
export default function AddNewSessionDialog() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiDoctors, setAiDoctors] = useState<AiDoctorAgent[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  /* ----------  FETCH AI DOCTORS  ---------- */
  const handleNext = async () => {
    if (!isSignedIn) return setShowSignIn(true);
    if (!note.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post<AiDoctorAgent[]>("/api/suggested-ai-doctors", { notes: note });
      setAiDoctors(data);
    } catch {
      alert("Could not load doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------  CREATE SESSION  ---------- */
  const handleStartConsultation = async () => {
    if (!isSignedIn) return setShowSignIn(true);
    if (!selectedId) return alert("Please select a doctor.");

    const doctor = aiDoctors.find((d) => d.id === selectedId)!;
    setLoading(true);

    try {
      const { data } = await api.post<{ sessionId: string }>("/api/chat-session", {
        notes: note,
        selectedDoctor: doctor,
      });
      closeRef.current?.click();
      router.push(`/dashboard/medical-voice/${data.sessionId}`);
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Failed to start consultation");
    } finally {
      setLoading(false);
    }
  };

  /* ----------  MEMOISED CARDS  ---------- */
  const DoctorCards = useMemo(
    () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
        <AnimatePresence>
          {aiDoctors.map((d) => (
            <motion.div
              key={d.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`glass p-4 rounded-xl cursor-pointer transition ${
                selectedId === d.id ? "ring-2 ring-purple-500" : "hover:scale-[1.02]"
              }`}
              onClick={() => setSelectedId(d.id)}
            >
              <img src={d.image} alt={d.name} className="w-full h-32 object-cover rounded-lg mb-3" />
              <h3 className="font-bold text-white">{d.name}</h3>
              <p className="text-sm text-gray-300">{d.specialty}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    ),
    [aiDoctors, selectedId]
  );

  /* ----------  RENDER  ---------- */
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="btn-gradient">
          Start Consultation <IconArrowRight className="ml-2" />
        </Button>
      </DialogTrigger>

      <DialogContent className="glass border border-white/20 rounded-2xl shadow-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-wide">Add New Session</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-4">
              {!aiDoctors.length ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-sm text-gray-400 mb-3">Describe your symptoms to match you with a virtual doctor.</p>
                  <Textarea
  placeholder="Describe your symptoms..."
  className="h-[160px] bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:ring-purple-500"
  value={note}
  onChange={(e) => setNote(e.target.value)}
  disabled={loading}
/>
                </motion.div>
              ) : (
                DoctorCards
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex justify-end space-x-3">
          <DialogClose asChild>
            <button ref={closeRef} className="hidden" />
          </DialogClose>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>

          {!aiDoctors.length ? (
            <Button onClick={handleNext} disabled={!note.trim() || loading} className="btn-gradient">
              {loading ? "Loading…" : "Next"}
              <IconArrowRight className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleStartConsultation}
              disabled={!selectedId || loading}
              className="btn-gradient !from-green-500 !to-emerald-500"
            >
              {loading ? "Starting…" : "Start Consultation"}
              <IconArrowRight className="ml-2" />
            </Button>
          )}
        </DialogFooter>

        {showSignIn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 rounded-xl bg-white/10 border border-white/20 text-center"
          >
            <p className="text-white mb-3">Please sign in to continue.</p>
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
            <Button variant="secondary" onClick={() => setShowSignIn(false)} className="ml-2">
              Cancel
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}