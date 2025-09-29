"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, useUser } from "@clerk/nextjs";
import { useState } from "react";

/* ----------  SUB-COMPONENTS  ---------- */
const Nav = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const role = (user?.publicMetadata as any)?.role ?? "patient";
  const dashboardLink = {
    patient: "/patient/dashboard",
    doctor: "/doctor/dashboard",
    subadmin: "/sub-admin/dashboard",
    superadmin: "/admin/dashboard",
  }[role as "patient" | "doctor" | "subadmin" | "superadmin"] ?? "/patient/dashboard";

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Languages", href: "#languages" },
    { label: "Contact", href: "#footer" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <span className="font-bold text-xl text-purple-700">MediBY</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-purple-700 transition">
              {l.label}
            </Link>
          ))}

          {/* AI Doctor quick entry */}
          <Link href="/dashboard" className="btn-gradient !py-2 !px-4">
            🤖 AI Doctor
          </Link>

          {isSignedIn ? (
            <Link href={dashboardLink} className="btn-primary !py-2 !px-4">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="btn-secondary !py-2 !px-4">
                Sign In
              </Link>
              <Link href="/sign-up" className="btn-primary !py-2 !px-4">
                Patient Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <button onClick={() => setOpen(!open)} className="btn-secondary !p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="md:hidden overflow-hidden glass border-t border-white/20"
          >
            <div className="px-6 py-4 space-y-3">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block hover:text-purple-700">
                  {l.label}
                </Link>
              ))}

              <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-gradient !py-2 !px-4 w-full text-center">
                🤖 AI Doctor
              </Link>

              {isSignedIn ? (
                <Link href={dashboardLink} onClick={() => setOpen(false)} className="btn-primary !py-2 !px-4 w-full text-center">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 w-full text-center">
                    Sign In
                  </Link>
                  <Link href="/sign-up" onClick={() => setOpen(false)} className="btn-primary !py-2 !px-4 w-full text-center">
                    Patient Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

/* ----------  HERO  ---------- */
const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center px-6 pt-24">
    {/* floating emojis – keep your carnival */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {["🏥", "💊", "🩺", "💉", "🌡️", "❤️"].map((emoji, i) => (
        <motion.div
          key={i}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 800, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 12 + i * 2, repeat: Infinity, delay: i * 1.5 }}
          className="absolute left-1/2 top-0 text-3xl"
          style={{ left: `${20 + i * 12}%` }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>

    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="glass relative z-10 max-w-4xl text-center space-y-6 p-8"
    >
      <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
        🏥 MediBY
      </h1>
      <p className="text-lg md:text-xl text-gray-700">
        Multilingual AI doctor, book hospitals, pay with Paystack, join video calls — all in Nigerian languages!
      </p>
      <div className="mx-auto w-64">
        <Image src="/doctor-hero.svg" alt="doctor" width={250} height={250} className="drop-shadow-lg" />
      </div>

      {/* NEW: AI Doctor + Book + Sign buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/dashboard" className="btn-gradient">
          🤖 AI Doctor
        </Link>
        <Link href="/patient/book" className="btn-gradient !from-emerald-500 !to-teal-500">
          🧑‍⚕️ Book Hospital
        </Link>
        <Link href="/sign-up" className="btn-gradient !from-pink-500 !to-rose-500">
          👶 Patient Sign Up
        </Link>
        <Link href="/sign-in" className="btn-secondary">
          🔐 Sign In
        </Link>
      </div>
    </motion.div>
  </section>
);

/* ----------  REST OF SECTIONS (unchanged)  ---------- */
const Features = () => (
  <section id="features" className="py-20 px-6 bg-white/30">
    <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center">
      {[
        { icon: "🗣️", title: "Speak Yorùbá, Igbo, Hausa, Pidgin", desc: "Real-time AI translation in chat & video." },
        { icon: "💳", title: "Pay with Paystack", desc: "Secure, instant, nationwide." },
        { icon: "📹", title: "HD Video Calls", desc: "Doctor joins with one click after approval." },
      ].map((f) => (
        <div key={f.title} className="glass p-6 rounded-2xl">
          <div className="text-5xl mb-4">{f.icon}</div>
          <h3 className="text-xl font-bold mb-2">{f.title}</h3>
          <p className="text-sm text-gray-600">{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

const Languages = () => (
  <section id="languages" className="py-20 px-6">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-3xl font-bold mb-4">🌍 Speak Your Mother-Tongue</h2>
      <div className="flex flex-wrap justify-center gap-3 text-2xl">
        {["Yorùbá", "Igbo", "Hausa", "Pidgin", "English"].map((l) => (
          <span key={l} className="glass px-4 py-2 rounded-full text-sm font-medium">
            {l}
          </span>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer id="footer" className="glass border-t border-white/20 text-xs text-gray-600">
    <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-6">
      <div>
        <p className="font-bold text-purple-700 mb-2">🏥 MediBY</p>
        <p>Bayelsa Community Telemedicine Platform</p>
      </div>
      <div>
        <p className="font-bold mb-2">Quick Links</p>
        <div className="space-y-1">
          <Link href="/dashboard">🤖 AI Doctor</Link>
          <Link href="/patient/book">Book Hospital</Link>
          <Link href="/sign-in">Sign In</Link>
          <Link href="/sign-up">Sign Up</Link>
        </div>
      </div>
      <div>
        <p className="font-bold mb-2">Contact</p>
        <p>Email: hello@mediby.ng</p>
        <p>Phone: +234 901 234 5678</p>
      </div>
    </div>
    <div className="text-center pb-4">
      ✨ Built for the Bayelsa Community | AI + Telemedicine + Nigerian Languages
    </div>
  </footer>
);

/* ----------  MAIN PAGE  ---------- */
export default function HomePage() {
  return (
    <main className="magic-bg text-gray-800">
      <Nav />
      <Hero />
      <Features />
      <Languages />
      <Footer />
    </main>
  );
}