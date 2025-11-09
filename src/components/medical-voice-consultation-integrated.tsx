// src/components/medical-voice-consultation-integrated.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import MarkdownMini from '@/components/markdown-mini'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Loader2, Mic, MicOff, Send, Clock, Globe, ChevronDown, ChevronUp } from 'lucide-react'

type Language = 'yoruba' | 'igbo' | 'hausa' | 'english' | 'pidgin'

interface MedicalResponse {
  response: string
  confidence: number
  language: Language
  timestamp: string
}

interface History {
  sessionId: string
  note: string
  language: string
  confidence: number
  createdOn: string
  conversation: { role: string; text: string; ts: string }[]
  report: any
}

interface Props {
  sessionId?: string
}

export default function MedicalVoiceConsultationIntegrated({ sessionId }: Props) {
  const [symptoms, setSymptoms] = useState('')
  const [language, setLanguage] = useState<Language>('english')
  const [reply, setReply] = useState<MedicalResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [history, setHistory] = useState<History[]>([])
  const [openId, setOpenId] = useState<string | null>(null)

  /* ---------- load past chats ---------- */
  useEffect(() => {
    fetch('/api/ai-medical-history')
      .then((r) => r.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
  }, [])

  /* ---------- API call (client -> server) ---------- */
  async function askAI() {
    if (!symptoms.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai-medical-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, language, sessionId }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data: MedicalResponse = await res.json()
      setReply(data)
      // optionally append to history instantly
      setHistory((prev) => [
            {
              sessionId: sessionId ?? `instant-${Date.now()}`,
              note: symptoms,
              language,
              confidence: data.confidence,
              createdOn: new Date().toISOString(),
              conversation: [
                { role: 'user', text: symptoms, ts: new Date().toISOString() },
                { role: 'assistant', text: data.response, ts: data.timestamp },
              ],
              report: { summary: data.response },
            },
            ...prev,
          ])
    } catch (err) {
      console.error(err)
      setReply({
        response: 'Unable to reach AI service. Please try again later.',
        confidence: 0,
        language,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  /* ---------- voice placeholder ---------- */
  function toggleVoice() {
    setRecording(prev => !prev)
    // wire to your real speech-to-text engine
  }

  return (
    <Card className="p-6 bg-gray-900/50 border-gray-800">
      <div className="space-y-4">
        {/* language selector */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-300">Consultation language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-1 text-sm"
          >
            <option value="english">English</option>
            <option value="yoruba">Yorùbá</option>
            <option value="igbo">Igbo</option>
            <option value="hausa">Hausa</option>
            <option value="pidgin">Nigerian Pidgin</option>
          </select>
        </div>

        {/* input area */}
        <div className="relative">
          <Textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe your symptoms (min 5 characters)..."
            className="bg-gray-800 text-white border-gray-700 resize-none pr-24"
            rows={4}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleVoice}
              className={`h-8 w-8 rounded-full ${recording ? 'bg-red-600' : 'bg-blue-600'}`}
            >
              {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              onClick={askAI}
              disabled={loading || symptoms.trim().length < 5}
              className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* AI reply */}
        {reply && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-900/40 to-cyan-900/20 border border-cyan-700/50 rounded-xl p-4 text-sm text-gray-100 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-cyan-300">AI Response</span>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-600/70 text-white px-2 py-0.5 rounded">{reply.language}</span>
                <span className="text-xs bg-green-600/70 text-white px-2 py-0.5 rounded">{(reply.confidence * 100).toFixed(0)}% confidence</span>
                <button onClick={() => navigator.clipboard.writeText(reply.response)} className="text-xs underline text-cyan-300 hover:text-cyan-200">Copy</button>
              </div>
            </div>
            <MarkdownMini md={reply.response} />
          </motion.div>
        )}

        {/* ---------- Past Chats ---------- */}
{history.length > 0 && (
  <div className="mt-8 space-y-3">
    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
      <Clock className="h-5 w-5" /> Past AI Consultations
    </h3>
    {history.map((h) => (
      <Card
        key={`${h.sessionId}-${h.createdOn}`} // ✅ unique every time
        className="bg-gray-900/50 border-gray-800"
      >
        <button
          onClick={() => setOpenId(openId === h.sessionId ? null : h.sessionId)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div>
            <p className="text-white font-medium">{h.note.slice(0, 60)}...</p>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
              <Globe className="h-3 w-3" />
              <span>{h.language}</span>
              <span>{(h.confidence * 100).toFixed(0)}% confidence</span>
              <span>{new Date(h.createdOn).toLocaleString()}</span>
            </div>
          </div>
          {openId === h.sessionId ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        {openId === h.sessionId && (
          <div className="px-4 pb-4 border-t border-gray-800">
            <div className="mt-3 text-sm text-gray-300">
              <MarkdownMini md={h.report?.summary || h.conversation.map((c) => `**${c.role}:** ${c.text}`).join('\n')} />
            </div>
          </div>
        )}
      </Card>
    ))}
  </div>
)}
      </div>
    </Card>
  )
}