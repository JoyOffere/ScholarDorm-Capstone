import React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRightIcon,
  BookOpenIcon,
  AccessibilityIcon,
  UserIcon,
} from 'lucide-react'
export const CTA = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary-600 to-primary-800 text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full opacity-5"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full opacity-5"></div>
        <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-white rounded-full opacity-5"></div>
      </div>
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
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
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
          >
            Ready to Transform Your Learning Experience?
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
            className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto"
          >
            Join thousands of students and educators on Scholardorm and discover
            a new way to learn, including our pioneering Rwandan Sign Language
            module.
          </motion.p>
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
              delay: 0.4,
            }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <motion.button
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="px-8 py-4 bg-white text-primary-700 rounded-lg font-medium hover:bg-slate-100 transition-colors shadow-lg flex items-center justify-center space-x-2"
            >
              <UserIcon size={20} />
              <span>Create Free Account</span>
            </motion.button>
            <motion.button
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="px-8 py-4 bg-primary-700 border border-primary-500 text-white rounded-lg font-medium hover:bg-primary-800 transition-colors shadow-lg flex items-center justify-center space-x-2"
            >
              <BookOpenIcon size={20} />
              <span>Explore Courses</span>
            </motion.button>
          </motion.div>
          <motion.div
            initial={{
              opacity: 0,
            }}
            whileInView={{
              opacity: 1,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.5,
              delay: 0.6,
            }}
            className="mt-12 flex items-center justify-center space-x-2"
          >
            <AccessibilityIcon size={24} className="opacity-80" />
            <span className="text-sm opacity-80">
              Inclusive education for all abilities
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
