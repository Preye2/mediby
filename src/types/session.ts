// src/types/session.ts
export type AiDoctorAgent = {
  id: number;
  name: string;
  specialty: string;
  description: string;
  image: string;
  agentPrompt: string;
  doctorVoiceId?: string;
};

export type Session = {
  id: number;
  note: string;
  sessionId: string;
  selectedDoctor: AiDoctorAgent;
  report?: {
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
  };
  createdOn: string;
  status: string;
};