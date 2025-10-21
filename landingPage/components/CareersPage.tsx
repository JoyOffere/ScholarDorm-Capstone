import React from 'react'
import { motion } from 'framer-motion'
import {
  CodeIcon,
  UsersIcon,
  PaletteIcon,
  ShieldIcon,
  BookOpenIcon,
  HeartIcon,
} from 'lucide-react'
import { Header } from './Header'
import { Footer } from './Footer'

const careerOpportunities = [
  {
    icon: <CodeIcon className="w-6 h-6" />,
    title: 'Software Engineers',
    description: 'Build the next generation of educational technology with RSL integration and accessibility features.',
    type: 'Full-time',
  },
  {
    icon: <UsersIcon className="w-6 h-6" />,
    title: 'Education Specialists',
    description: 'Design curriculum and learning experiences that incorporate RSL and inclusive education principles.',
    type: 'Full-time',
  },
  {
    icon: <PaletteIcon className="w-6 h-6" />,
    title: 'UX/UI Designers',
    description: 'Create intuitive, accessible interfaces that work seamlessly for all users, including RSL learners.',
    type: 'Full-time',
  },
  {
    icon: <ShieldIcon className="w-6 h-6" />,
    title: 'Security Engineers',
    description: 'Ensure our platform remains secure and compliant with educational data protection standards.',
    type: 'Full-time',
  },
  {
    icon: <BookOpenIcon className="w-6 h-6" />,
    title: 'Content Developers',
    description: 'Create engaging educational content with RSL integration and accessibility considerations.',
    type: 'Contract',
  },
  {
    icon: <HeartIcon className="w-6 h-6" />,
    title: 'Accessibility Experts',
    description: 'Specialize in making our platform accessible to users with diverse needs and communication methods.',
    type: 'Full-time',
  },
]

export const CareersPage = () => {
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }
  const itemVariants = {
    hidden: {
      y: 20,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <Header />
      <main>
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.h1
                initial={{
                  opacity: 0,
                  y: -10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                }}
                className="text-4xl md:text-5xl font-bold text-slate-900 mb-4"
              >
                Join Our Team
              </motion.h1>
              <motion.p
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                }}
                className="text-lg text-slate-600"
              >
                Help us revolutionize education with RSL integration. We're looking for passionate individuals who believe in inclusive, accessible learning for all.
              </motion.p>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {careerOpportunities.map((opportunity, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                    {opportunity.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {opportunity.title}
                  </h3>
                  <p className="text-slate-600 mb-4">{opportunity.description}</p>
                  <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                    {opportunity.type}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
