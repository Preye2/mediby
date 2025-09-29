'use client'

import { motion } from 'framer-motion'
import React from 'react'

export default function MotionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen"
    >
      {children}
    </motion.main>
  )
}
