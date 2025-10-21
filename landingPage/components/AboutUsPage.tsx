import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HeartIcon,
  TargetIcon,
  UsersIcon,
  LightbulbIcon,
  AwardIcon,
  GlobeIcon,
} from 'lucide-react'
import { Header } from './Header'
import { Footer } from './Footer'

const aboutSections = [
  {
    icon: <HeartIcon className="w-6 h-6" />,
    title: 'Our Mission',
    description: 'To democratize education through innovative technology and inclusive design, making quality learning accessible to everyone, including those who use Russian Sign Language.',
  },
  {
    icon: <TargetIcon className="w-6 h-6" />,
    title: 'Our Vision',
    description: 'A world where education transcends barriers, where every learner can thrive regardless of their communication method or learning style.',
  },
  {
    icon: <UsersIcon className="w-6 h-6" />,
    title: 'Our Team',
    description: 'Passionate educators, developers, and accessibility experts working together to create the future of inclusive education.',
  },
  {
    icon: <LightbulbIcon className="w-6 h-6" />,
    title: 'Innovation',
    description: 'Pioneering RSL integration in educational platforms, combining gesture recognition with comprehensive learning management.',
  },
  {
    icon: <AwardIcon className="w-6 h-6" />,
    title: 'Excellence',
    description: 'Committed to the highest standards in educational technology, accessibility, and user experience design.',
  },
  {
    icon: <GlobeIcon className="w-6 h-6" />,
    title: 'Global Impact',
    description: 'Supporting educational institutions worldwide with tools that bridge communication gaps and enhance learning outcomes.',
  },
]

export const AboutUsPage = () => {
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
        <section className="py-20 md:py-32 bg-gradient-to-br from-primary-50 via-white to-primary-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/SCHOLARDORM_LOGO.png')] bg-no-repeat bg-center bg-contain opacity-5"></div>
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-12">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 0.6,
                }}
                className="mb-6"
              >
                <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                  About ScholarDorm
                </span>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                  Building the Future of <span className="text-primary-600">Inclusive Education</span>
                </h1>
              </motion.div>
              <motion.p
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.3,
                }}
                className="text-xl text-slate-600 mb-8 leading-relaxed"
              >
                We're building the future of education with RSL integration at its core, creating inclusive learning experiences for all students.
              </motion.p>
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.5,
                }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link to="/contact">
                  <button className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg">
                    Join Our Mission
                  </button>
                </Link>
                <Link to="/features">
                  <button className="px-8 py-3 border border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                    Learn More
                  </button>
                </Link>
              </motion.div>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {aboutSections.map((section, index) => (
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
                  <p className="text-slate-600">{section.description}</p>
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
