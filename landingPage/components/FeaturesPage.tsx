import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpenIcon,
  UsersIcon,
  AwardIcon,
  GamepadIcon,
  ShieldIcon,
  ActivityIcon,
  HandIcon,
  EyeIcon,
} from 'lucide-react'
import { Header } from './Header'
import { Footer } from './Footer'

const features = [
  {
    icon: <BookOpenIcon className="w-6 h-6" />,
    title: 'Interactive Courses',
    description:
      'Engaging multimedia content designed to make learning effective and enjoyable, including RSL-integrated lessons for inclusive education.',
  },
  {
    icon: <GamepadIcon className="w-6 h-6" />,
    title: 'Educational Games',
    description:
      'Fun learning activities that reinforce knowledge through play and competition, with RSL gesture-based interactions.',
  },
  {
    icon: <AwardIcon className="w-6 h-6" />,
    title: 'Achievements System',
    description:
      'Earn badges and certificates as you progress through your learning journey, celebrating RSL milestones and accessibility achievements.',
  },
  {
    icon: <UsersIcon className="w-6 h-6" />,
    title: 'Role-Based Access',
    description:
      'Tailored experiences for students and administrators with appropriate permissions, ensuring RSL accessibility for all users.',
  },
  {
    icon: <ShieldIcon className="w-6 h-6" />,
    title: 'Secure Platform',
    description:
      'State-of-the-art security measures to protect user data and privacy, with RSL-secure authentication methods.',
  },
  {
    icon: <ActivityIcon className="w-6 h-6" />,
    title: 'Progress Tracking',
    description:
      'Monitor learning advancement with detailed analytics and insights, including RSL proficiency tracking.',
  },
  {
    icon: <HandIcon className="w-6 h-6" />,
    title: 'RSL Integration',
    description:
      'Comprehensive Russian Sign Language support with gesture recognition, video lessons, and interactive RSL content.',
  },
  {
    icon: <EyeIcon className="w-6 h-6" />,
    title: 'Accessibility Features',
    description:
      'Advanced accessibility tools including screen readers, high contrast modes, and RSL visual aids for diverse learners.',
  },
]

export const FeaturesPage = () => {
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
                  Discover Our Features
                </span>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                  Powerful Features for <span className="text-primary-600">Enhanced Learning</span>
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
                Scholardorm combines cutting-edge technology with educational
                expertise to deliver a comprehensive learning platform, with deep RSL integration for inclusive education.
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
                <Link to="/signup">
                  <button className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg">
                    Get Started
                  </button>
                </Link>
                <Link to="/about">
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
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">{feature.description}</p>
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
