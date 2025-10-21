import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HandIcon,
  BookOpenIcon,
  AccessibilityIcon,
  HeartIcon,
  GlobeIcon,
  CheckCircleIcon,
} from 'lucide-react'
const categories = [
  {
    name: 'Education',
    examples: 'School, Learning, Book',
  },
  {
    name: 'Greetings',
    examples: 'Hello, Goodbye, Thank you',
  },
  {
    name: 'Navigation',
    examples: 'Help, Next, Back, Menu',
  },
  {
    name: 'Emotions',
    examples: 'Happy, Sad, Excited',
  },
  {
    name: 'Health',
    examples: 'Doctor, Medicine, Hospital',
  },
  {
    name: 'Technology',
    examples: 'Computer, Phone, Internet',
  },
  {
    name: 'Culture',
    examples: 'Rwanda-specific signs, Traditions',
  },
  {
    name: 'Sports',
    examples: 'Football, Basketball, Running',
  },
]
const benefits = [
  {
    icon: <AccessibilityIcon className="w-6 h-6" />,
    title: 'Support for Deaf Students',
    description: 'Accessible educational resources in Rwandan Sign Language',
  },
  {
    icon: <HandIcon className="w-6 h-6" />,
    title: 'Inclusive Communication',
    description:
      'Bridge communication gaps between deaf and hearing individuals',
  },
  {
    icon: <GlobeIcon className="w-6 h-6" />,
    title: 'Cultural Preservation',
    description: 'Document and teach RSL as a vital cultural asset',
  },
  {
    icon: <BookOpenIcon className="w-6 h-6" />,
    title: 'Academic Success',
    description: 'Enable deaf students to fully participate in education',
  },
]
export const RSLSection = () => {
  return (
    <section
      id="rsl"
      className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{
              opacity: 0,
              x: -20,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.6,
            }}
          >
            <div className="inline-flex items-center space-x-2 bg-secondary-100 text-secondary-800 px-3 py-1 rounded-full w-fit mb-6">
              <HandIcon size={16} />
              <span className="text-sm font-medium">Rwandan Sign Language</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Pioneering Inclusive Education with RSL Learning
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Our dedicated Rwandan Sign Language module promotes inclusive
              education and preserves this vital aspect of cultural heritage,
              making learning accessible to everyone.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
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
                    duration: 0.4,
                    delay: index * 0.1,
                  }}
                  className="flex space-x-3"
                >
                  <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center text-secondary-600 flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {benefit.description}
                    </p>
                  </div>
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
                duration: 0.6,
                delay: 0.4,
              }}
            >
              <Link to="/rsl">
                <button className="px-6 py-3 bg-secondary-600 text-white rounded-lg font-medium hover:bg-secondary-700 transition-colors shadow-lg shadow-secondary-100 flex items-center space-x-2">
                  <HeartIcon size={18} />
                  <span>Explore RSL Learning</span>
                </button>
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.6,
            }}
            className="relative"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 relative z-10">
              <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                <HandIcon size={20} className="mr-2 text-secondary-600" />
                RSL Categories
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((category, index) => (
                  <motion.div
                    key={index}
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
                      delay: index * 0.1,
                    }}
                    className="bg-slate-50 rounded-lg p-4 border border-slate-100"
                  >
                    <h4 className="font-medium text-slate-900 mb-1">
                      {category.name}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {category.examples}
                    </p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="font-medium text-slate-900 mb-4">
                  RSL Content Types
                </h4>
                <div className="space-y-3">
                  {[
                    'RSL Videos with native signers',
                    'Interactive sign database',
                    'Learning progress tracking',
                    'Customizable accessibility settings',
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{
                        opacity: 0,
                        x: -10,
                      }}
                      whileInView={{
                        opacity: 1,
                        x: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay: index * 0.1 + 0.5,
                      }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircleIcon
                        size={18}
                        className="text-green-500 flex-shrink-0"
                      />
                      <span className="text-slate-700">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -z-10 -top-6 -right-6 w-64 h-64 bg-secondary-200 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute -z-10 -bottom-8 -left-8 w-72 h-72 bg-secondary-100 rounded-full blur-3xl opacity-30"></div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
