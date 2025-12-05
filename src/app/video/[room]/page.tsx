// src/app/video/[room]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Video from "twilio-video";

export default function VideoPage() {
  const { room } = useParams() as { room: string };
  const { user } = useUser();

  console.log("room:", room, "user.id:", user?.id); // ← HERE

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  /* video elements */
  const [localEl, setLocalEl] = useState<HTMLMediaElement | null>(null);
  const [remoteEls, setRemoteEls] = useState<Record<string, HTMLMediaElement>>({});

  useEffect(() => {
    if (!user) return;

    let roomObj: Video.Room | null = null;
    let aborted = false;

    (async () => {
      try {
        /* 1. token */
        const { token } = await fetch(
          `/api/rooms/token?room=${encodeURIComponent(room)}&name=${encodeURIComponent(user.id)}`
        ).then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)));
        if (aborted) return;

        /* 2. connect */
        roomObj = await Video.connect(token, {
          name: room,
          video: { width: 640, height: 480, frameRate: 24 },
          audio: true,
          preferredVideoCodecs: [{ codec: "VP8", simulcast: true }],
          maxAudioBitrate: 16000,
        });
        if (aborted) {
          roomObj.disconnect();
          return;
        }
        setConnected(true);

        /* 3. local video – attach after DOM flush */
        const localPub = Array.from(roomObj.localParticipant.videoTracks.values())[0];
        if (localPub?.track) {
          const el = localPub.track.attach();
          el.className = "rounded-xl w-full h-full object-cover";
          setLocalEl(el);
        }

        /* 4. remote videos */
        const addParticipant = (p: Video.Participant) => {
          p.on("trackSubscribed", (track) => {
            if (track.kind === "video") {
              const el = track.attach();
              el.className = "rounded-xl w-full h-full object-cover";
              setRemoteEls((prev) => ({ ...prev, [p.sid]: el }));
            }
          });
        };
        roomObj.participants.forEach(addParticipant);
        roomObj.on("participantConnected", addParticipant);
      } catch (e: any) {
        if (!aborted) setError(e.message || "Could not connect");
      }
    })();

    /* cleanup */
    return () => {
      aborted = true;
      roomObj?.disconnect();
    };
  }, [user, room]);

  return (
    <main className="h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="glass rounded-2xl p-6 w-full max-w-5xl">
        <h1 className="text-2xl font-bold mb-4">Consultation Room: {room}</h1>

        {error && (
          <p className="text-red-400 mb-4 text-center">{error}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LOCAL */}
          <div className="bg-black rounded-xl aspect-video">
            {localEl && (
              <div
                ref={(n) => {
                  if (n) n.appendChild(localEl);
                }}
              />
            )}
          </div>

          {/* REMOTE */}
          {Object.entries(remoteEls).map(([sid, el]) => (
            <div
              key={sid}
              className="bg-black rounded-xl aspect-video"
              ref={(n) => {
                if (n) n.appendChild(el);
              }}
            />
          ))}
        </div>

        {!connected && !error && (
          <p className="text-center mt-4">Connecting…</p>
        )}
      </div>
    </main>
  );
}