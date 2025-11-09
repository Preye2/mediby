// src/app/page.tsx - Fixed version with no duplicates
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, useUser } from "@clerk/nextjs";
import { useState } from "react";

/* ----------  PROFESSIONAL NAVBAR  ---------- */
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
    { label: "Services", href: "#services" },
    { label: "Languages", href: "#languages" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <span className="font-bold text-xl text-gray-900">MediBY</span>
            <span className="text-xs text-gray-500 block">Hospital Management System</span>
          </div>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-gray-700 hover:text-blue-600 transition">
              {l.label}
            </Link>
          ))}

          <div className="flex items-center gap-3 ml-4">
            <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
              🏥 AI Doctor
            </Link>

            {isSignedIn ? (
              <Link href={dashboardLink} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="text-gray-700 hover:text-blue-600 font-medium transition">
                  Sign In
                </Link>
                <Link href="/sign-up" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <button onClick={() => setOpen(!open)} className="p-2 rounded-lg text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer - professional styling */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="md:hidden overflow-hidden bg-white border-t border-gray-200"
          >
            <div className="px-6 py-4 space-y-3">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-gray-700 hover:text-blue-600">
                  {l.label}
                </Link>
              ))}

              <div className="pt-4 space-y-3 border-t border-gray-200">
                <Link href="/dashboard" onClick={() => setOpen(false)} className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-center">
                  🏥 AI Doctor
                </Link>

                {isSignedIn ? (
                  <Link href={dashboardLink} onClick={() => setOpen(false)} className="block bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium text-center">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-in" onClick={() => setOpen(false)} className="block text-gray-700 hover:text-blue-600 font-medium text-center">
                      Sign In
                    </Link>
                    <Link href="/sign-up" onClick={() => setOpen(false)} className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-center">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

/* ----------  PROFESSIONAL HERO SECTION  ---------- */
const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <div className="relative z-10 max-w-5xl text-center space-y-8 px-8 py-12">
      {/* Professional logo section */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-2xl">M</span>
        </div>
        <div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900">
            MediBY
          </h1>
          <p className="text-lg text-gray-600">Hospital Management System</p>
        </div>
      </div>

      {/* Professional headline */}
      <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
        Healthcare That Speaks{" "}
        <span className="text-blue-600">Your Language</span>
      </h2>

      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        AI-powered hospital management with real-time translation in Yorùbá, Igbo, Hausa, 
        Pidgin & English. Book hospitals, consult AI doctors, and manage healthcare — 
        all in your mother tongue.
      </p>

      {/* Professional CTA buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg hover:shadow-xl">
          🏥 Consult AI Doctor
        </Link>
        <Link href="/patient/book" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg hover:shadow-xl">
          🧑‍⚕️ Book Hospital
        </Link>
        <Link href="/sign-up" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg hover:shadow-xl">
          👶 Create Account
        </Link>
      </div>

      {/* Trust indicators */}
      <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500 mt-8">
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span>HIPAA Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span>NDPR Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span>Paystack Secured</span>
        </div>
      </div>
    </div>
  </section>
);

/* ----------  ENHANCED FEATURES SECTION  ---------- */
const Features = () => (
  <section id="features" className="py-20 px-6 bg-gray-50">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Comprehensive Healthcare Solutions</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Everything you need for modern healthcare management, all in one platform
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* AI Doctor Consultation */}
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">AI Doctor Consultation</h3>
          <p className="text-gray-600 mb-6">
            Speak with our AI doctor in Yorùbá, Igbo, Hausa, Pidgin, or English. Get instant medical advice and recommendations.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Real-time AI translation
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              24/7 availability
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Cultural sensitivity
            </li>
          </ul>
          <Link href="/dashboard" className="mt-6 block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-center transition">
            Start AI Consultation
          </Link>
        </div>

        {/* Hospital Booking */}
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl">🏥</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Hospital Booking</h3>
          <p className="text-gray-600 mb-6">
            Book appointments with top hospitals across Nigeria. Compare prices, read reviews, and schedule instantly.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Nationwide coverage
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Price comparison
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Instant booking
            </li>
          </ul>
          <Link href="/patient/book" className="mt-6 block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold text-center transition">
            Book Hospital
          </Link>
        </div>

        {/* Video Consultations */}
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl">📹</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">HD Video Consultations</h3>
          <p className="text-gray-600 mb-6">
            Connect with doctors via HD video calls. Doctor joins with one click after your booking is approved.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              HD quality video
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              One-click joining
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Secure & private
            </li>
          </ul>
          <Link href="/dashboard" className="mt-6 block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold text-center transition">
            Start Video Call
          </Link>
        </div>
      </div>

      {/* Additional feature cards */}
      <div className="mt-16 grid md:grid-cols-4 gap-6">
        {[
          { icon: "💳", title: "Secure Payments", desc: "Paystack & bank transfers" },
          { icon: "🔒", title: "HIPAA Compliant", desc: "Highest security standards" },
          { icon: "🌍", title: "5 Languages", desc: "Yorùbá, Igbo, Hausa, Pidgin, English" },
          { icon: "⚡", title: "24/7 Support", desc: "Round-the-clock assistance" },
        ].map((f) => (
          <div key={f.title} className="text-center p-6 bg-white/50 rounded-xl">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h4 className="font-semibold text-gray-900 mb-2">{f.title}</h4>
            <p className="text-sm text-gray-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ----------  LANGUAGES SECTION WITH ENHANCED UI  ---------- */
const Languages = () => (
  <section id="languages" className="py-20 px-6 bg-gradient-to-br from-blue-50 to-purple-50">
    <div className="max-w-6xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Healthcare in Your Mother Tongue</h2>
        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
          Break down language barriers in healthcare. Communicate with doctors and AI in the language you're most comfortable with.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-5 gap-6">
        {[
          { flag: "🇳🇬", name: "Yorùbá", desc: "Southwest Nigeria", color: "from-green-500 to-green-600" },
          { flag: "🇳🇬", name: "Igbo", desc: "Southeast Nigeria", color: "from-red-500 to-red-600" },
          { flag: "🇳🇬", name: "Hausa", desc: "Northern Nigeria", color: "from-green-500 to-green-600" },
          { flag: "🇳🇬", name: "Pidgin", desc: "Pan-Nigerian", color: "from-blue-500 to-blue-600" },
          { flag: "🇬🇧", name: "English", desc: "Official Language", color: "from-purple-500 to-purple-600" },
        ].map((lang, i) => (
          <motion.div
            key={lang.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            viewport={{ once: true }}
            className="glass p-6 rounded-2xl text-center hover:scale-105 transition-all duration-300"
          >
            <div className={`w-16 h-16 bg-gradient-to-br ${lang.color} rounded-full flex items-center justify-center mb-4 mx-auto`}>
              <span className="text-2xl">{lang.flag}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{lang.name}</h3>
            <p className="text-sm text-gray-600">{lang.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Interactive demo section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mt-16"
      >
        <Link href="/dashboard" className="btn-gradient text-lg px-8 py-4 rounded-xl font-semibold transition shadow-lg hover:shadow-xl">
          Try AI Doctor in Your Language →
        </Link>
      </motion.div>
    </div>
  </section>
);

/* ----------  TRUST & CREDIBILITY SECTION  ---------- */
const TrustSection = () => (
  <section className="py-20 px-6 bg-white">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Healthcare Professionals</h2>
        <p className="text-xl text-gray-600">Meeting the highest standards of healthcare technology</p>
      </div>

      <div className="grid md:grid-cols-4 gap-8 text-center">
        {[
          { icon: "🔒", title: "HIPAA Compliant", desc: "Highest data protection standards" },
          { icon: "📋", title: "NDPR Compliant", desc: "Nigerian data protection regulations" },
          { icon: "💳", title: "Paystack Secured", desc: "Bank-grade payment security" },
          { icon: "🏥", title: "Hospital Partners", desc: "200+ hospitals nationwide" },
        ].map((item) => (
          <div key={item.title} className="p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">{item.icon}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Professional testimonials or hospital logos could go here */}
      <div className="mt-12 text-center">
        <p className="text-gray-600">
          Partnered with leading hospitals across Bayelsa and Nigeria
        </p>
      </div>
    </div>
  </section>
);

/* ----------  ENHANCED FOOTER  ---------- */
const Footer = () => (
  <footer id="contact" className="bg-gray-900 text-white">
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <span className="font-bold text-xl">MediBY</span>
              <span className="text-xs text-gray-400 block">Hospital Management System</span>
            </div>
          </div>
          <p className="text-gray-300 text-sm">
            Transforming healthcare delivery in Nigeria through technology and cultural sensitivity.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
          <div className="space-y-2 text-sm">
            <Link href="/dashboard" className="block text-gray-300 hover:text-white transition">🤖 AI Doctor</Link>
            <Link href="/patient/book" className="block text-gray-300 hover:text-white transition">🏥 Book Hospital</Link>
            <Link href="/sign-in" className="block text-gray-300 hover:text-white transition">🔐 Sign In</Link>
            <Link href="/sign-up" className="block text-gray-300 hover:text-white transition">👶 Sign Up</Link>
          </div>
        </div>

        {/* Services */}
        <div>
          <h4 className="font-semibold text-lg mb-4">Services</h4>
          <div className="space-y-2 text-sm">
            <Link href="/dashboard" className="block text-gray-300 hover:text-white transition">AI Consultations</Link>
            <Link href="/patient/book" className="block text-gray-300 hover:text-white transition">Hospital Booking</Link>
            <Link href="/dashboard" className="block text-gray-300 hover:text-white transition">Video Consultations</Link>
            <Link href="#" className="block text-gray-300 hover:text-white transition">Medical Records</Link>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
          <div className="space-y-2 text-sm text-gray-300">
            <a href="mailto:hello@mediby.ng" className="block hover:text-white transition">📧 hello@mediby.ng</a>
            <a href="tel:+2349012345678" className="block hover:text-white transition">📞 +234 901 234 5678</a>
            <a href="#" className="block hover:text-white transition">📍 Bayelsa, Nigeria</a>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Follow us:</p>
            <div className="flex gap-3">
              <a href="#" className="text-gray-300 hover:text-white transition">Twitter</a>
              <a href="#" className="text-gray-300 hover:text-white transition">LinkedIn</a>
              <a href="#" className="text-gray-300 hover:text-white transition">Facebook</a>
            </div>
          </div>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm text-gray-400">
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <span className="flex items-center gap-1"><span className="text-green-500">✓</span>HIPAA Compliant</span>
          <span className="flex items-center gap-1"><span className="text-green-500">✓</span>NDPR Compliant</span>
          <span className="flex items-center gap-1"><span className="text-green-500">✓</span>Paystack Secured</span>
          <span className="flex items-center gap-1"><span className="text-green-500">✓</span>24/7 Support</span>
        </div>
        <p className="text-xs">
          © 2025 MediBY. All rights reserved. | Built with ❤️ for the Bayelsa Community
        </p>
      </div>
    </div>
  </footer>
);

/* ----------  MAIN PAGE  ---------- */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800">
      {/* Global styles for professional look */}
      <style jsx global>{`
        .magic-bg {
          background-image: 
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 119, 255, 0.1) 0%, transparent 50%);
        }
      `}</style>

      <Nav />
      <Hero />
      <Features />
      <Languages />
      <Footer />
    </main>
  );
}