import React, { Children } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpenIcon,
  UsersIcon,
  AwardIcon,
  GamepadIcon,
  ShieldIcon,
  ActivityIcon,
} from 'lucide-react'
const features = [
  {
    icon: <BookOpenIcon className="w-6 h-6" />,
    title: 'Interactive Courses',
    description:
      'Engaging multimedia content designed to make learning effective and enjoyable.',
  },
  {
    icon: <GamepadIcon className="w-6 h-6" />,
    title: 'Educational Games',
    description:
      'Fun learning activities that reinforce knowledge through play and competition.',
  },
  {
    icon: <AwardIcon className="w-6 h-6" />,
    title: 'Achievements System',
    description:
      'Earn badges and certificates as you progress through your learning journey.',
  },
  {
    icon: <UsersIcon className="w-6 h-6" />,
    title: 'Role-Based Access',
    description:
      'Tailored experiences for students and administrators with appropriate permissions.',
  },
  {
    icon: <ShieldIcon className="w-6 h-6" />,
    title: 'Secure Platform',
    description:
      'State-of-the-art security measures to protect user data and privacy.',
  },
  {
    icon: <ActivityIcon className="w-6 h-6" />,
    title: 'Progress Tracking',
    description:
      'Monitor learning advancement with detailed analytics and insights.',
  },
]
export const Features = () => {
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
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{
              opacity: 0,
              y: -10,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.5,
            }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
          >
            Powerful Features for Enhanced Learning
          </motion.h2>
          <motion.p
            initial={{
              opacity: 0,
              y: 10,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.5,
              delay: 0.2,
            }}
            className="text-lg text-slate-600"
          >
            Scholardorm combines cutting-edge technology with educational
            expertise to deliver a comprehensive learning platform.
          </motion.p>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.1,
          }}
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
  )
}
