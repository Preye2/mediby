// src/app/(routes)/dashboard/_components/MedicalConsultation.tsx
'use client'

import MedicalVoiceConsultationIntegrated from '@/components/medical-voice-consultation-integrated'
import { motion } from 'framer-motion'

export default function MedicalConsultation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🤖 AI Medical Consultation</h2>
          <p className="text-gray-400">Powered by N-ATLaS - Speak in your language</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg text-sm">
          🌍 5 Languages Available
        </div>
      </div>

      <MedicalVoiceConsultationIntegrated sessionId="user-medical-session" />
    </motion.div>
  )
}