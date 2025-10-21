import React from 'react'
import { motion } from 'framer-motion'
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  MessageCircleIcon,
  SendIcon,
} from 'lucide-react'
import { Header } from './Header'
import { Footer } from './Footer'

const contactMethods = [
  {
    icon: <MailIcon className="w-6 h-6" />,
    title: 'Email Us',
    description: 'Send us a detailed message',
    contact: 'support@scholardorm.com',
  },
  {
    icon: <PhoneIcon className="w-6 h-6" />,
    title: 'Call Us',
    description: 'Speak with our support team',
    contact: '+1 (555) 123-4567',
  },
  {
    icon: <MapPinIcon className="w-6 h-6" />,
    title: 'Visit Us',
    description: 'Our office location',
    contact: '123 Education St, Learning City, LC 12345',
  },
  {
    icon: <ClockIcon className="w-6 h-6" />,
    title: 'Business Hours',
    description: 'When you can reach us',
    contact: 'Mon-Fri: 9AM-6PM EST',
  },
  {
    icon: <MessageCircleIcon className="w-6 h-6" />,
    title: 'Live Chat',
    description: 'Instant support available',
    contact: 'Available 24/7',
  },
  {
    icon: <SendIcon className="w-6 h-6" />,
    title: 'RSL Support',
    description: 'Specialized assistance',
    contact: 'rsl@scholardorm.com',
  },
]

export const ContactPage = () => {
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
                Get in Touch
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
                Have questions about ScholarDorm or RSL integration? We're here to help. Reach out through any of the channels below.
              </motion.p>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {contactMethods.map((method, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {method.title}
                  </h3>
                  <p className="text-slate-600 mb-2">{method.description}</p>
                  <p className="text-primary-600 font-medium">{method.contact}</p>
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
