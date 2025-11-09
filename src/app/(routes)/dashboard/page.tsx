// src/app/(routes)/dashboard/page.tsx - Complete integration
import React from 'react'
import AddNewSessionDialog from './_components/AddNewSessionDialog'
import UserHistory from './_components/UserHistory'
import MedicalConsultation from './_components/MedicalConsultation'

export default function Dashboard() {
  return (
    <div className="space-y-8 min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-10">
        <AddNewSessionDialog/>
      </div>

      {/* Medical AI Consultation - Professional Integration */}
      <MedicalConsultation />

      {/* User History Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">📋 My Medical History</h2>
        <UserHistory />
      </div>
    </div>
  )
}