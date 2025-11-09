// src/components/ai-chat-history.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Clock, Globe } from 'lucide-react'
import MarkdownMini from '@/components/markdown-mini'

type History = {
  sessionId: string
  note: string
  language: string
  confidence: number
  createdOn: string
  conversation: { role: string; text: string; ts: string }[]
  report: any
}

export default function AIChatHistory() {
  const [history, setHistory] = useState<History[]>([])
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ai-medical-history')
      .then((r) => r.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
  }, [])

  if (history.length === 0) return null

  return (
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
  )
}