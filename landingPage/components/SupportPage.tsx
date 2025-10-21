import React from 'react'
import { motion } from 'framer-motion'
import {
  HelpCircleIcon,
  MessageCircleIcon,
  MailIcon,
  PhoneIcon,
  FileTextIcon,
  UsersIcon,
} from 'lucide-react'
import { Header } from './Header'
import { Footer } from './Footer'

const supportOptions = [
  {
    icon: <HelpCircleIcon className="w-6 h-6" />,
    title: 'FAQ & Troubleshooting',
    description: 'Find answers to common questions and resolve issues quickly.',
    action: 'Browse FAQs',
  },
  {
    icon: <MessageCircleIcon className="w-6 h-6" />,
    title: 'Live Chat Support',
    description: 'Get instant help from our support team during business hours.',
    action: 'Start Chat',
  },
  {
    icon: <MailIcon className="w-6 h-6" />,
    title: 'Email Support',
    description: 'Send detailed inquiries and receive comprehensive responses.',
    action: 'Send Email',
  },
  {
    icon: <PhoneIcon className="w-6 h-6" />,
    title: 'Phone Support',
    description: 'Speak directly with our technical support specialists.',
    action: 'Call Now',
  },
  {
    icon: <FileTextIcon className="w-6 h-6" />,
    title: 'Knowledge Base',
    description: 'Access detailed guides, tutorials, and best practices.',
    action: 'Explore Docs',
  },
  {
    icon: <UsersIcon className="w-6 h-6" />,
    title: 'Community Forum',
    description: 'Connect with other users and share solutions.',
    action: 'Join Community',
  },
]

export const SupportPage = () => {
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
                Support Center
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
                Get the help you need with our comprehensive support resources, including RSL-specific assistance and accessibility support.
              </motion.p>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {supportOptions.map((option, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                    {option.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-slate-600 mb-4">{option.description}</p>
                  <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors">
                    {option.action}
                  </button>
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
