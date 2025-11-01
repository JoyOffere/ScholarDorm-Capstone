import * as React from 'react';
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
    description: 'Bridging critical gaps in Rwandan secondary mathematics education by creating gamified, accessible learning experiences specifically designed for deaf and hard-of-hearing students using Rwanda Sign Language (RSL).',
  },
  {
    icon: <TargetIcon className="w-6 h-6" />,
    title: 'Research-Driven Vision',
    description: 'Addressing the documented lack of rigorous research on gamified mathematics interventions for deaf learners in Rwanda, while ensuring accessibility compliance with UDL and WCAG 2.1 standards.',
  },
  {
    icon: <UsersIcon className="w-6 h-6" />,
    title: 'Evidence-Based Impact',
    description: 'Going beyond assertions to measure motivation, engagement, and cognitive load, documenting how modality-appropriate interventions yield stronger academic outcomes for deaf secondary students.',
  },
  {
    icon: <LightbulbIcon className="w-6 h-6" />,
    title: 'RSL-Centered Innovation',
    description: 'Embedding Rwanda Sign Language from the start, not as a bolt-on feature, reducing cognitive friction and allowing time-on-task to convert into measurable attainment in mathematics.',
  },
  {
    icon: <AwardIcon className="w-6 h-6" />,
    title: 'Pedagogical Excellence',
    description: 'Ensuring game mechanics amplify good pedagogy through scaffolded practice, explanatory feedback, and adaptive progression, aligned with Rwanda Education Board syllabi.',
  },
  {
    icon: <GlobeIcon className="w-6 h-6" />,
    title: 'Systemic Change',
    description: 'Supporting Rwanda\'s capacity-constrained but policy-supportive environment with classroom-ready tools that demand minimal setup while delivering maximum educational impact.',
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
                  Transforming Mathematics Education with <span className="text-primary-600">Rwanda Sign Language</span>
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
                ScholarDorm addresses critical research gaps in deaf education by delivering gamified, RSL-integrated mathematics instruction that measurably improves academic performance for secondary students in Rwanda.
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

        {/* Research Context Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                  Addressing Critical <span className="text-primary-600">Research Gaps</span>
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Our platform responds to four critical gaps identified in current educational research for deaf learners in Rwanda.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-4">1</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Targeted Intervention Testing</h3>
                  <p className="text-slate-600">
                    First gamified mathematics intervention specifically designed and tested for deaf learners in the Rwandan secondary education context.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100"
                >
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-4">2</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Comprehensive Measurement</h3>
                  <p className="text-slate-600">
                    Measuring motivation, engagement, and cognitive load to explain performance gains rather than simply asserting them.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100"
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-4">3</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Moderator Analysis</h3>
                  <p className="text-slate-600">
                    Recording gender, prior attainment, teacher readiness, and infrastructure factors to interpret who benefits most from the intervention.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100"
                >
                  <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-4">4</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Accessibility Documentation</h3>
                  <p className="text-slate-600">
                    Documenting accessibility using Universal Design for Learning (UDL) and WCAG 2.1 criteria for replicable and scalable results.
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                className="mt-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white text-center"
              >
                <h3 className="text-2xl font-bold mb-4">Evidence-Based Impact</h3>
                <p className="text-lg text-primary-100 mb-6">
                  Drawing from research across Nigeria, South Africa, and East Africa that shows deaf learners achieve more when instruction is adapted in both language and modality.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                    Rwanda Education Board Aligned
                  </span>
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                    RSL Integration
                  </span>
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                    Performance Measured
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
