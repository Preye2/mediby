// src/app/(routes)/dashboard/_components/AddNewSessionDialog.tsx
"use client";
import React, { useState, useRef } from "react";
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
import { useAxios } from "@/lib/axios";

type AiDoctorAgent = {
  id: number;
  name: string;
  specialty: string;
  description: string;
  image: string;
  agentPrompt: string;
  doctorVoiceId: string;
};

export default function AddNewSessionDialog() {
  const { isSignedIn } = useAuth();
  const axios = useAxios();
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [aiDoctors, setAiDoctors] = useState<AiDoctorAgent[]>();
  const [selectedDoctor, setSelectedDoctor] = useState<AiDoctorAgent>();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();

  /* ----------  fetch AI doctors  ---------- */
  const handleNext = async () => {
    if (!isSignedIn) {
      setShowSignInModal(true);
      return;
    }
    try {
      setLoading(true);
      console.log("🔍 Fetching AI doctors for notes:", note);
      const { data } = await axios.post("/api/suggested-ai-doctors", { notes: note });
      console.log("✅ Received AI doctors:", data);
      setAiDoctors(data);
    } catch (err: any) {
      console.error("❌ Fetch doctors:", err);
      console.error("Error details:", err.response?.data || err.message);
      alert("Could not load doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------  create chat session  ---------- */
  const handleStartConsultation = async () => {
    if (!isSignedIn) {
      setShowSignInModal(true);
      return;
    }
    if (!selectedDoctor) {
      alert("Please select a doctor.");
      return;
    }

    setLoading(true);

    try {
      console.log("🚀 Starting consultation with doctor:", selectedDoctor);

      // lightweight session ping - fix the URL
      console.log("🔍 Checking session validity...");
      const check = await axios.get("/api/chat-session?sessionId=check");
      console.log("✅ Session check response:", check.status, check.data);

      console.log("📤 Creating new session with data:", {
        notes: note,
        selectedDoctor: selectedDoctor
      });

      const { data } = await axios.post("/api/chat-session", {
        notes: note,
        selectedDoctor: selectedDoctor, // Send the full object
      });

      console.log("✅ Session created response:", data);
      const sessionId = data?.sessionId;
      
      if (!sessionId) {
        throw new Error("No session ID returned from server");
      }

      closeRef.current?.click();
      router.push(`/dashboard/medical-voice/${sessionId}`);
      
    } catch (err: any) {
      console.error("❌ Start consultation error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Error message:", err.message);

      if (err.response?.status === 401) {
        setShowSignInModal(true);
      } else {
        const errorMessage = err.response?.data?.error || err.message || "Failed to start consultation";
        alert(`Could not start consultation: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="btn-gradient">
          Start Consultation <IconArrowRight className="ml-2" />
        </Button>
      </DialogTrigger>

      <DialogContent className="glass border border-white/20 rounded-2xl shadow-2xl max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-wide">Add New Session</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-4">
              {!aiDoctors ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <p className="text-sm text-gray-400 mb-3">Tell us about your symptoms to match you with a virtual doctor.</p>
                  <Textarea
                    placeholder="Describe your symptoms..."
                    className="h-[160px] bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:ring-purple-500"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={loading}
                  />
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-h-[400px] overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {aiDoctors.map((doctor, index) => (
                      <motion.div key={index} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                        <div
                          onClick={() => setSelectedDoctor(doctor)}
                          className={`glass p-4 rounded-xl cursor-pointer transition ${selectedDoctor?.id === doctor.id ? "ring-2 ring-purple-500" : "hover:scale-[1.02]"}`}
                        >
                          <img src={doctor.image} alt={doctor.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                          <h3 className="font-bold text-white">{doctor.name}</h3>
                          <p className="text-sm text-gray-300">{doctor.specialty}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex justify-end space-x-3">
          <DialogClose asChild>
            <button ref={closeRef} className="hidden" />
          </DialogClose>

          <DialogClose asChild>
            <Button variant="ghost" className="border border-white/20 text-gray-300 hover:text-white">Cancel</Button>
          </DialogClose>

          {!aiDoctors ? (
            <Button onClick={handleNext} disabled={!note || loading} className="btn-gradient">
              {loading ? <div className="h-5 w-20 animate-pulse rounded-md bg-white/10" /> : <>Next <IconArrowRight className="ml-2" /></>}
            </Button>
          ) : (
            <Button onClick={handleStartConsultation} disabled={loading} className="btn-gradient !from-green-500 !to-emerald-500">
              {loading ? <div className="h-5 w-24 animate-pulse rounded-md bg-white/10" /> : <>Start Consultation <IconArrowRight className="ml-2" /></>}
            </Button>
          )}
        </DialogFooter>

        {showSignInModal && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 p-4 rounded-xl bg-white/10 border border-white/20 text-center">
            <p className="text-white mb-3">Please sign in to start a consultation.</p>
            <SignInButton mode="modal">
              <button className="btn-primary">Sign In</button>
            </SignInButton>
            <button onClick={() => setShowSignInModal(false)} className="ml-2 btn-secondary">Cancel</button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}