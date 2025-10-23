import React, { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { RSLSection } from './components/RSLSection'
import { HowItWorks } from './components/HowItWorks'
import { Testimonials } from './components/Testimonials'
import { CTA } from './components/CTA'
import { Footer } from './components/Footer'
import { WelcomeModal } from './components/WelcomeModal'
import { FloatingAction } from './components/FloatingAction'
import { motion, AnimatePresence } from 'framer-motion'
export function Landing() {
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [])
  return (
    <AnimatePresence>
      {isLoading ? (
        <motion.div
          key="loader"
          initial={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          className="fixed inset-0 bg-white flex items-center justify-center z-50"
        >
          <motion.div
            initial={{
              scale: 0.8,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              rotate: 0,
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="flex items-center"
          >
            <div className="text-3xl font-bold text-primary-600 flex items-center">
              <motion.span
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                  },
                }}
                className="inline-block"
              >
                S
              </motion.span>
              <motion.span
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 1.5,
                    delay: 0.1,
                    repeat: Infinity,
                  },
                }}
                className="inline-block"
              >
                c
              </motion.span>
              <motion.span
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 1.5,
                    delay: 0.2,
                    repeat: Infinity,
                  },
                }}
                className="inline-block"
              >
                h
              </motion.span>
              <motion.span
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 1.5,
                    delay: 0.3,
                    repeat: Infinity,
                  },
                }}
                className="inline-block"
              >
                o
              </motion.span>
              <motion.span
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 1.5,
                    delay: 0.4,
                    repeat: Infinity,
                  },
                }}
                className="inline-block"
              >
                l
              </motion.span>
              <motion.span
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 1.5,
                    delay: 0.5,
                    repeat: Infinity,
                  },
                }}
                className="inline-block"
              >
                a
              </motion.span>
              <motion.span
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 1.5,
                    delay: 0.6,
                    repeat: Infinity,
                  },
                }}
                className="inline-block"
              >
                r
              </motion.span>
              <motion.span
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 1.5,
                    delay: 0.7,
                    repeat: Infinity,
                  },
                }}
                className="inline-block text-secondary-600"
              >
                D
              </motion.span>
              <motion.span
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 1.5,
                    delay: 0.8,
                    repeat: Infinity,
                  },
                }}
                className="inline-block text-secondary-600"
              >
                o
              </motion.span>
              <motion.span
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 1.5,
                    delay: 0.9,
                    repeat: Infinity,
                  },
                }}
                className="inline-block text-secondary-600"
              >
                r
              </motion.span>
              <motion.span
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 1.5,
                    delay: 1.0,
                    repeat: Infinity,
                  },
                }}
                className="inline-block text-secondary-600"
              >
                m
              </motion.span>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900"
        >
          <Header />
          <main>
            <Hero />
            <Features />
            <RSLSection />
            <HowItWorks />
            <Testimonials />
            <CTA />
          </main>
          <Footer />
          <WelcomeModal />
          <FloatingAction />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
