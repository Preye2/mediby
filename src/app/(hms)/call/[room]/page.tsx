// src/app/(hms)/call/[room]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import Video from "twilio-video";

export default function SharedCallPage() {
  const params = useParams();
  const { user } = useUser();

  /* room name comes from URL: /call/apt-123 */
  const [roomName, setRoomName] = useState<string>("");

  /* video / controls state */
  const [localEl, setLocalEl] = useState<HTMLMediaElement | null>(null);
  const [remoteEls, setRemoteEls] = useState<Record<string, HTMLMediaElement>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const localTrackRef = useRef<Video.LocalVideoTrack | null>(null);
  const roomObjRef = useRef<Video.Room | null>(null);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);

  /* unwrap params */
  useEffect(() => {
    (async () => {
      const { room: raw } = await params;
      const str = Array.isArray(raw) ? raw[0] : raw;
      if (str) setRoomName(str);
    })();
  }, [params]);

  /* 1. camera preview ------------------------------------ */
useEffect(() => {
  let localTrack: Video.LocalVideoTrack | undefined;
  Video.createLocalVideoTrack({ width: 640, height: 480, frameRate: 24 })
    .then((track) => {
      localTrack = track;
      localTrackRef.current = track;
      const el = track.attach();
      el.className = "rounded-xl w-full h-full object-cover";
      setLocalEl(el);
    })
    .catch((e) => setError("Camera error: " + e.message));
  return () => {
    localTrack?.stop(); // void
  };
}, []);

/* 2. connect room ------------------------------------ */
useEffect(() => {
  if (!user?.id || !roomName || !localTrackRef.current) return;
  let aborted = false;
  (async () => {
    try {
      const resp = await fetch(`/api/rooms/token?room=${encodeURIComponent(roomName)}&name=${encodeURIComponent(user.id)}`);
      if (!resp.ok) throw new Error(await resp.text());
      const { token } = await resp.json();
      if (aborted) return;
      const roomObj = await Video.connect(token, {
        name: roomName,
        tracks: localTrackRef.current ? [localTrackRef.current] : [],
        preferredVideoCodecs: [{ codec: "VP8", simulcast: true }],
        maxAudioBitrate: 16000,
      });
      if (aborted) return roomObj.disconnect();
      roomObjRef.current = roomObj;
      setConnected(true);
      const add = (p: Video.Participant) => {
        p.on("trackSubscribed", (track) => {
          if (track.kind === "video") {
            const el = track.attach();
            el.className = "rounded-xl w-full h-full object-cover";
            setRemoteEls((prev) => ({ ...prev, [p.sid]: el }));
          }
        });
      };
      roomObj.participants.forEach(add);
      roomObj.on("participantConnected", add);
    } catch (e: any) {
      setError(e.message || "Could not connect");
    }
  })();
  return () => {
    aborted = true;
    roomObjRef.current?.disconnect();
  };
}, [user, roomName]);

  /* control handlers */
  const toggleMic = () => {
    if (!localTrackRef.current) return;
    const track = localTrackRef.current.mediaStreamTrack;
    track.enabled = !track.enabled;
    setMic((m) => !m);
  };
  const toggleCam = () => {
    if (!localTrackRef.current) return;
    const track = localTrackRef.current.mediaStreamTrack;
    track.enabled = !track.enabled;
    setCam((c) => !c);
  };
  const switchCam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: cam ? "environment" : "user" },
    });
    const newTrack = stream.getVideoTracks()[0];
    if (!roomObjRef.current || !newTrack) return;
    const tvTrack = new Video.LocalVideoTrack(newTrack);
    roomObjRef.current.localParticipant.videoTracks.forEach((pub) => pub.unpublish());
    roomObjRef.current.localParticipant.publishTrack(tvTrack);
    localTrackRef.current = tvTrack;
    setCam(true);
  };
  const leaveRoom = () => {
    roomObjRef.current?.disconnect();
    window.location.href = "/";
  };

  /* UI */
  if (error)
    return (
      <div className="grid h-screen place-items-center text-white">
        <div className="glass p-6 rounded-2xl text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => location.reload()} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <main className="h-screen bg-slate-900 text-white flex flex-col md:flex-row">
      {/* BIG VIDEO AREA */}
      <section className="flex-1 relative flex items-center justify-center p-4">
        {Object.keys(remoteEls).length === 0 ? (
          <div className="w-full max-w-5xl bg-black rounded-2xl aspect-video flex items-center justify-center">
            <span className="text-white/70">Waiting for others to join…</span>
          </div>
        ) : (
          Object.entries(remoteEls).map(([rsid, el]) => (
            <div
              key={rsid}
              className="w-full max-w-5xl bg-black rounded-2xl aspect-video"
              ref={(n) => {
                if (n) n.appendChild(el);
              }}
            />
          ))
        )}
        <div className="absolute bottom-4 right-4 w-36 h-24 bg-black rounded-xl border-2 border-slate-700 overflow-hidden">
          {localEl && (
            <div
              ref={(n) => {
                if (n) n.appendChild(localEl);
              }}
              className="w-full h-full"
            />
          )}
        </div>
      </section>

      {/* CONTROL BAR */}
      <aside className="w-full md:w-60 bg-slate-800/50 flex md:flex-col items-center justify-around md:justify-center gap-4 p-4">
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full ${mic ? "bg-slate-600" : "bg-red-600"}`}
          title="Mute / Unmute mic"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V6a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        <button
          onClick={toggleCam}
          className={`p-3 rounded-full ${cam ? "bg-slate-600" : "bg-red-600"}`}
          title="Turn camera off / on"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          onClick={switchCam}
          className="p-3 rounded-full bg-slate-600"
          title="Switch camera"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>

        <button
          onClick={leaveRoom}
          className="p-3 rounded-full bg-red-600"
          title="End call"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </aside>
    </main>
  );
}