import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpenIcon, GraduationCapIcon, ChevronRightIcon } from 'lucide-react'
export const Hero = () => {
  const heroRef = useRef(null)
  // For floating animation of UI elements
  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }
  return (
    <section
      className="pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden relative"
      ref={heroRef}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <motion.div
          animate={{
            rotate: 360,
            transition: {
              duration: 50,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
          className="absolute -top-[30%] -right-[30%] w-[60%] h-[60%] bg-primary-100 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          animate={{
            rotate: -360,
            transition: {
              duration: 40,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
          className="absolute -bottom-[30%] -left-[30%] w-[60%] h-[60%] bg-secondary-100 rounded-full blur-3xl opacity-20"
        />
        {/* Small decorative elements */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary-400"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
              transition: {
                duration: 3 + Math.random() * 3,
                repeat: Infinity,
                delay: i * 0.5,
              },
            }}
          />
        ))}
      </div>
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{
              opacity: 0,
              x: -50,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
              ease: 'easeOut',
            }}
            className="flex flex-col space-y-6"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                delay: 0.2,
              }}
              className="inline-flex items-center space-x-2 bg-primary-100 text-primary-800 px-4 py-2 rounded-full w-fit"
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <BookOpenIcon size={16} />
              </motion.div>
              <span className="text-sm font-medium">
                Inclusive Education Platform
              </span>
            </motion.div>
            <motion.h1
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 0.3,
                duration: 0.8,
              }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight"
            >
              Learn Without{' '}
              <motion.span
                className="text-primary-600 inline-block"
                animate={{
                  color: [
                    '#4f46e5',
                    '#6366f1',
                    '#818cf8',
                    '#6366f1',
                    '#4f46e5',
                  ],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                }}
              >
                Boundaries
              </motion.span>
            </motion.h1>
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
                delay: 0.5,
                duration: 0.8,
              }}
              className="text-lg text-slate-600 max-w-lg"
            >
              Scholardorm is a comprehensive educational platform with a
              pioneering Rwandan Sign Language module, making education
              accessible to everyone.
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
                delay: 0.7,
                duration: 0.8,
              }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <motion.div
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.5)',
                }}
                whileTap={{
                  scale: 0.95,
                }}
              >
                <Link
                  to="/sign"
                  onClick={() => console.log('Get Started button clicked from hero')}
                  className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 flex items-center gap-2"
                >
                  Get Started
                  <motion.span
                    animate={{
                      x: [0, 4, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  >
                    <ChevronRightIcon size={18} />
                  </motion.span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
              >
                <Link
                  to="/rsl"
                  className="px-8 py-3 bg-white text-primary-600 border border-primary-200 rounded-lg font-medium hover:bg-primary-50 transition-colors shadow-md inline-block"
                >
                  Learn More
                </Link>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 0.9,
                duration: 0.8,
              }}
              className="flex items-center space-x-4 pt-6"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: -20 * i,
                      opacity: 0,
                    }}
                    animate={{
                      x: 0,
                      opacity: 1,
                    }}
                    transition={{
                      delay: 0.9 + i * 0.1,
                    }}
                    whileHover={{
                      y: -5,
                      zIndex: 10,
                    }}
                    className="w-10 h-10 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-xs font-medium text-primary-700 shadow-sm"
                  >
                    {i}
                  </motion.div>
                ))}
              </div>
              <motion.p
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay: 1.3,
                }}
                className="text-sm text-slate-600"
              >
                <motion.span
                  animate={{
                    color: ['#4f46e5', '#4338ca', '#4f46e5'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                  className="font-semibold"
                >
                  Students
                </motion.span>{' '}
                are ready to learn
              </motion.p>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{
              opacity: 0,
              y: 50,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.4,
            }}
            className="relative"
          >
            <motion.div className="relative z-10" animate={floatingAnimation}>
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 border-b border-primary-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="text-xs text-primary-700 font-medium px-2 py-1 bg-primary-100 rounded-md">
                      Student Dashboard
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold flex items-center">
                      <GraduationCapIcon
                        size={20}
                        className="mr-2 text-primary-600"
                      />
                      Rwandan Sign Language Course
                    </h3>
                    <motion.span
                      whileHover={{
                        scale: 1.1,
                      }}
                      className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium"
                    >
                      In Progress
                    </motion.span>
                  </div>
                  <div className="space-y-4">
                    <motion.div
                      initial={{
                        x: -20,
                        opacity: 0,
                      }}
                      animate={{
                        x: 0,
                        opacity: 1,
                      }}
                      transition={{
                        delay: 0.5,
                      }}
                      whileHover={{
                        scale: 1.02,
                      }}
                      className="bg-slate-50 p-4 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <motion.div
                            animate={{
                              rotate: 360,
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className="w-4 h-4 rounded-full border-2 border-primary-300 border-t-primary-600"
                          />
                          Basic Greetings
                        </span>
                        <span className="text-xs text-primary-600 font-semibold">
                          Completed
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                        <motion.div
                          initial={{
                            width: 0,
                          }}
                          animate={{
                            width: '100%',
                          }}
                          transition={{
                            duration: 1,
                            delay: 0.6,
                          }}
                          className="bg-primary-500 h-2 rounded-full"
                        ></motion.div>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{
                        x: -20,
                        opacity: 0,
                      }}
                      animate={{
                        x: 0,
                        opacity: 1,
                      }}
                      transition={{
                        delay: 0.7,
                      }}
                      whileHover={{
                        scale: 1.02,
                      }}
                      className="bg-slate-50 p-4 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <motion.div
                            animate={{
                              rotate: 360,
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className="w-4 h-4 rounded-full border-2 border-primary-300 border-t-primary-600"
                          />
                          Common Phrases
                        </span>
                        <span className="text-xs text-primary-600 font-semibold">
                          75% Complete
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                        <motion.div
                          initial={{
                            width: 0,
                          }}
                          animate={{
                            width: '75%',
                          }}
                          transition={{
                            duration: 1.2,
                            delay: 0.8,
                          }}
                          className="bg-primary-500 h-2 rounded-full"
                        ></motion.div>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{
                        x: -20,
                        opacity: 0,
                      }}
                      animate={{
                        x: 0,
                        opacity: 1,
                      }}
                      transition={{
                        delay: 0.9,
                      }}
                      whileHover={{
                        scale: 1.02,
                      }}
                      className="bg-slate-50 p-4 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <motion.div
                            animate={{
                              rotate: 360,
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className="w-4 h-4 rounded-full border-2 border-primary-300 border-t-primary-600"
                          />
                          Educational Terms
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          Not Started
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full mt-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full"
                          style={{
                            width: '0%',
                          }}
                        ></div>
                      </div>
                    </motion.div>
                  </div>
                  <motion.button
                    initial={{
                      y: 20,
                      opacity: 0,
                    }}
                    animate={{
                      y: 0,
                      opacity: 1,
                    }}
                    transition={{
                      delay: 1.1,
                    }}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    className="mt-6 w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-colors shadow-md"
                  >
                    Continue Learning
                  </motion.button>
                </div>
              </div>
            </motion.div>
            {/* Decorative elements */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.5,
              }}
              animate={{
                opacity: 0.3,
                scale: 1,
              }}
              transition={{
                delay: 0.6,
                duration: 1,
              }}
              className="absolute -z-10 -top-6 -right-6 w-64 h-64 bg-secondary-200 rounded-full blur-3xl"
            />
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.5,
              }}
              animate={{
                opacity: 0.3,
                scale: 1,
              }}
              transition={{
                delay: 0.8,
                duration: 1,
              }}
              className="absolute -z-10 -bottom-8 -left-8 w-72 h-72 bg-primary-200 rounded-full blur-3xl"
            />
            {/* Floating mini elements */}
            <motion.div
              className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/4 z-20"
              animate={floatingAnimation}
            >
              <div className="bg-white p-2 rounded-lg shadow-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900">
                    Lesson Complete!
                  </p>
                  <p className="text-slate-500">+10 points earned</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="absolute bottom-0 left-0 transform translate-y-1/3 -translate-x-1/4 z-20"
              animate={{
                y: [0, -15, 0],
                transition: {
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                },
              }}
            >
              <div className="bg-white p-2 rounded-full shadow-lg">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                  <GraduationCapIcon size={20} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
