import React from 'react'
import { motion } from 'framer-motion'
import {
  BookOpenIcon,
  CodeIcon,
  FileTextIcon,
  VideoIcon,
  UsersIcon,
  HelpCircleIcon,
} from 'lucide-react'
import { Header } from './Header'
import { Footer } from './Footer'

const docsSections = [
  {
    icon: <BookOpenIcon className="w-6 h-6" />,
    title: 'Getting Started',
    description: 'Quick start guide for new users and administrators.',
    items: ['Platform Overview', 'Account Setup', 'First Course Creation'],
  },
  {
    icon: <CodeIcon className="w-6 h-6" />,
    title: 'API Documentation',
    description: 'Complete API reference for developers and integrations.',
    items: ['Authentication', 'Endpoints', 'Rate Limits', 'Webhooks'],
  },
  {
    icon: <FileTextIcon className="w-6 h-6" />,
    title: 'User Guides',
    description: 'Detailed guides for students and educators.',
    items: ['Course Management', 'Quiz Creation', 'Progress Tracking', 'RSL Features'],
  },
  {
    icon: <VideoIcon className="w-6 h-6" />,
    title: 'Video Tutorials',
    description: 'Step-by-step video guides for complex features.',
    items: ['RSL Gesture Recognition', 'Admin Dashboard', 'Student Portal', 'Analytics'],
  },
  {
    icon: <UsersIcon className="w-6 h-6" />,
    title: 'Best Practices',
    description: 'Tips and recommendations for optimal platform usage.',
    items: ['Content Creation', 'Accessibility Guidelines', 'Security Measures', 'Performance Optimization'],
  },
  {
    icon: <HelpCircleIcon className="w-6 h-6" />,
    title: 'FAQs',
    description: 'Frequently asked questions and troubleshooting.',
    items: ['Common Issues', 'RSL Support', 'Technical Support', 'Contact Information'],
  },
]

export const DocumentationPage = () => {
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
                Documentation & Resources
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
                Comprehensive guides, API references, and resources to help you make the most of ScholarDorm's RSL-integrated learning platform.
              </motion.p>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {docsSections.map((section, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                    {section.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {section.title}
                  </h3>
                  <p className="text-slate-600 mb-4">{section.description}</p>
                  <ul className="space-y-1">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-sm text-slate-500 flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
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
