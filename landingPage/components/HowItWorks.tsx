import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserIcon, BookOpenIcon, TrophyIcon, LineChartIcon } from 'lucide-react'
const steps = [
  {
    icon: <UserIcon className="w-6 h-6" />,
    title: 'Create Your Account',
    description:
      'Sign up with your email or social accounts to get started on your learning journey.',
  },
  {
    icon: <BookOpenIcon className="w-6 h-6" />,
    title: 'Explore Courses & RSL',
    description:
      'Browse our library of courses and Rwandan Sign Language resources tailored to your needs.',
  },
  {
    icon: <TrophyIcon className="w-6 h-6" />,
    title: 'Learn & Earn Achievements',
    description:
      'Complete quizzes, participate in games, and earn badges as you progress.',
  },
  {
    icon: <LineChartIcon className="w-6 h-6" />,
    title: 'Track Your Progress',
    description:
      'Monitor your advancement with detailed analytics and personalized insights.',
  },
]
export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-slate-50">
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
            How Scholardorm Works
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
            Getting started with Scholardorm is easy. Follow these simple steps
            to begin your educational journey.
          </motion.p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 20,
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
                delay: index * 0.1,
              }}
              className="relative"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 h-full">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-6">
                  {step.icon}
                </div>
                <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-1 bg-primary-200 relative">
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary-400 rounded-full"></div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
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
            delay: 0.6,
          }}
          className="text-center mt-12"
        >
          <Link
            to="/signup"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-100"
          >
            Start Your Journey Today
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
