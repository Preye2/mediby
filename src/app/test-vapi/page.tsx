"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"; 

const VAPI_PUBLIC = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_API_KEY!; // pk_...
const VAPI_PRIVATE = process.env.VAPI_PRIVATE_KEY!;                 // sk_...

export default function TestVapi() {
  const [log, setLog] = useState<string[]>([]);

  const add = (msg: string) => setLog((l) => [...l, msg]);

  /* ----------  1.  Assistant create (server-side)  ---------- */
  const createAssistant = async () => {
    add("⏳ Creating assistant with PRIVATE key...");
    const res = await fetch("https://api.vapi.ai/assistant", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_PRIVATE}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "TestDoc",
        firstMessage: "Hi",
        model: { provider: "groq", model: "llama3-8b-8192", messages: [] },
        voice: { provider: "playht", voiceId: "en-US-AriaNeural" },
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      add(`❌ Create failed: ${res.status} ${text}`);
      return null;
    }
    const { id } = JSON.parse(text);
    add(`✅ Assistant created: ${id}`);
    return id;
  };

  /* ----------  2.  Start call (browser)  ---------- */
  const startCall = async () => {
    const id = await createAssistant();
    if (!id) return;

    add("⏳ Starting call with PUBLIC key...");
    const Vapi = (await import("@vapi-ai/web")).default;
    const vapi = new Vapi(VAPI_PUBLIC);

    vapi.on("call-start", () => add("✅ Call started"));
    vapi.on("error", (e: any) => add(`❌ Vapi error: ${JSON.stringify(e)}`));
    vapi.on("call-end", () => add("✅ Call ended"));

    await vapi.start(id);
    add("🎤 Mic should be active now");
  };

  return (
    <div className="p-6">
      <Button onClick={startCall}>Test Vapi Flow</Button>
      <pre className="mt-4 text-xs bg-gray-100 p-3 rounded">{log.join("\n")}</pre>
    </div>
  );
}