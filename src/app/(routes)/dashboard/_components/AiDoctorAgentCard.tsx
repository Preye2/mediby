// src/app/(routes)/dashboard/_components/AiDoctorAgentCard.tsx
"use client";

import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { motion } from "framer-motion";

export type AiDoctorAgent = {
  id: number;
  name: string;
  specialty: string;
  description: string;
  image: string;
  agentPrompt: string;
  doctorVoiceId?: string;
};

type Props = { AiDoctorAgent: AiDoctorAgent };

export default function AiDoctorAgentCard({ AiDoctorAgent }: Props) {
  const router = useRouter();

  const startConsultation = async () => {
    try {
      const { data } = await axios.post<{ sessionId: string }>("/api/chat-session", {
        notes: "New consultation",
        selectedDoctor: AiDoctorAgent,
      });
      router.push(`/dashboard/medical-voice/${data.sessionId}`);
    } catch (err: any) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : "Unable to start consultation";
      alert(msg);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-[450px] flex flex-col rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black shadow-lg hover:shadow-2xl transition-shadow overflow-hidden"
    >
      <div className="relative w-full h-[300px]">
        <Image
          src={AiDoctorAgent.image || "/placeholder-doctor.webp"}
          alt={AiDoctorAgent.name}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          priority
          className="object-cover"
        />
      </div>

      <div className="p-5 text-white flex flex-col justify-between flex-grow">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">{AiDoctorAgent.name}</h2>
            <span className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-0.5 rounded-full shadow-md">
              {AiDoctorAgent.specialty}
            </span>
          </div>
          <p className="text-sm text-gray-300 line-clamp-2">{AiDoctorAgent.description}</p>
        </div>

        <div className="flex justify-center mt-4">
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-lg text-sm shadow-md transition-all"
            onClick={startConsultation}
          >
            Start Consultation
            <IconArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}