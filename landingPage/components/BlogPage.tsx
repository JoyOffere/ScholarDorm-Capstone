import React from 'react'
import { motion } from 'framer-motion'
import {
  BookOpenIcon,
  TrendingUpIcon,
  UsersIcon,
  LightbulbIcon,
  AwardIcon,
  GlobeIcon,
} from 'lucide-react'
import { Header } from './Header'
import { Footer } from './Footer'

const blogCategories = [
  {
    icon: <BookOpenIcon className="w-6 h-6" />,
    title: 'Educational Innovation',
    description: 'Latest trends and technologies in online education.',
    articles: ['AI in Education', 'Gamification Strategies', 'Mobile Learning'],
  },
  {
    icon: <TrendingUpIcon className="w-6 h-6" />,
    title: 'Learning Analytics',
    description: 'Data-driven insights for better educational outcomes.',
    articles: ['Progress Tracking', 'Student Engagement', 'Assessment Methods'],
  },
  {
    icon: <UsersIcon className="w-6 h-6" />,
    title: 'Inclusive Education',
    description: 'Making education accessible for all learners.',
    articles: ['RSL Integration', 'Accessibility Features', 'Diverse Learning Needs'],
  },
  {
    icon: <LightbulbIcon className="w-6 h-6" />,
    title: 'Teaching Tips',
    description: 'Practical advice for educators and course creators.',
    articles: ['Course Design', 'Student Motivation', 'Assessment Strategies'],
  },
  {
    icon: <AwardIcon className="w-6 h-6" />,
    title: 'Success Stories',
    description: 'Real-world examples of educational transformation.',
    articles: ['Student Achievements', 'Institutional Impact', 'Community Success'],
  },
  {
    icon: <GlobeIcon className="w-6 h-6" />,
    title: 'RSL Focus',
    description: 'Deep dives into Russian Sign Language education.',
    articles: ['Gesture Recognition', 'RSL Curriculum', 'Cultural Integration'],
  },
]

export const BlogPage = () => {
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
                Educational Insights & Stories
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
                Explore our blog for the latest in educational technology, RSL integration, and innovative teaching strategies.
              </motion.p>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {blogCategories.map((category, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {category.title}
                  </h3>
                  <p className="text-slate-600 mb-4">{category.description}</p>
                  <ul className="space-y-1">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex} className="text-sm text-slate-500 flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2"></span>
                        {article}
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
