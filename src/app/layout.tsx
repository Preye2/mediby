

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"
import Provider from "./provider"
import MotionWrapper from "@/components/MotionWrapper" 
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "MediBY",
  description: "Multilingual AI doctor, book hospitals, pay with Paystack, join video calls — all in Nigerian languages!",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={`
${geistSans.variable} ${geistMono.variable} antialiased 
bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 
text-white min-h-screen
`}
        >
          <Provider>
            <MotionWrapper>{children}</MotionWrapper>
            <Toaster/>
          </Provider>
        </body>
      </html>
    </ClerkProvider>
  )
}
