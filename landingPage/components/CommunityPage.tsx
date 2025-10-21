import React from 'react'
import { motion } from 'framer-motion'
import {
  UsersIcon,
  MessageSquareIcon,
  ShareIcon,
  HeartIcon,
  TrophyIcon,
  LightbulbIcon,
} from 'lucide-react'
import { Header } from './Header'
import { Footer } from './Footer'

const communityFeatures = [
  {
    icon: <UsersIcon className="w-6 h-6" />,
    title: 'Discussion Forums',
    description: 'Connect with educators, students, and developers sharing experiences and solutions.',
  },
  {
    icon: <MessageSquareIcon className="w-6 h-6" />,
    title: 'RSL Community',
    description: 'Dedicated spaces for Russian Sign Language learners and experts to collaborate.',
  },
  {
    icon: <ShareIcon className="w-6 h-6" />,
    title: 'Resource Sharing',
    description: 'Share lesson plans, RSL materials, and educational content with the community.',
  },
  {
    icon: <HeartIcon className="w-6 h-6" />,
    title: 'Mentorship Program',
    description: 'Connect with experienced educators and RSL specialists for guidance.',
  },
  {
    icon: <TrophyIcon className="w-6 h-6" />,
    title: 'Achievements Showcase',
    description: 'Celebrate learning milestones and share success stories.',
  },
  {
    icon: <LightbulbIcon className="w-6 h-6" />,
    title: 'Innovation Hub',
    description: 'Collaborate on new features and educational innovations.',
  },
]

export const CommunityPage = () => {
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
                Join Our Community
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
                Connect with fellow educators, students, and RSL enthusiasts in our vibrant community. Share knowledge, collaborate on projects, and grow together.
              </motion.p>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {communityFeatures.map((feature, index) => (
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
