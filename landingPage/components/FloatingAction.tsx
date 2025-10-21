import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MenuIcon,
  XIcon,
  BookOpenIcon,
  UsersIcon,
  PhoneIcon,
  HandIcon,
} from 'lucide-react'
export const FloatingAction = () => {
  const [isOpen, setIsOpen] = useState(false)
  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }
  const actions = [
    {
      icon: <BookOpenIcon size={20} />,
      label: 'Features',
      color: 'bg-blue-500 hover:bg-blue-600',
      to: '/features',
    },
    {
      icon: <UsersIcon size={20} />,
      label: 'About Us',
      color: 'bg-green-500 hover:bg-green-600',
      to: '/about',
    },
    {
      icon: <PhoneIcon size={20} />,
      label: 'Contact',
      color: 'bg-purple-500 hover:bg-purple-600',
      to: '/contact',
    },
    {
      icon: <HandIcon size={20} />,
      label: 'RSL Learning',
      color: 'bg-secondary-600 hover:bg-secondary-700',
      to: '/rsl',
    },
  ]
  return (
    <div className="fixed bottom-24 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 20,
            }}
            transition={{
              duration: 0.2,
            }}
            className="mb-4 flex flex-col gap-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                }}
                transition={{
                  delay: index * 0.05,
                }}
                className="relative group"
              >
                <Link
                  to={action.to}
                  onClick={() => setIsOpen(false)}
                  className={`${action.color} text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-colors`}
                  aria-label={action.label}
                >
                  {action.icon}
                </Link>
                <span className="absolute right-full mr-3 bg-white text-slate-800 py-1 px-3 rounded-lg shadow-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {action.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{
          scale: 1.05,
        }}
        whileTap={{
          scale: 0.95,
        }}
        onClick={toggleOpen}
        className="relative bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600 text-white p-4 rounded-full shadow-lg flex items-center justify-center overflow-hidden"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-secondary-500 via-primary-500 to-secondary-600"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundSize: '200% 200%',
          }}
        />

        {/* Pulsing ring effect */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary-300"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isOpen ? 'close' : 'open'}
            initial={{
              rotate: -180,
              opacity: 0,
            }}
            animate={{
              rotate: 0,
              opacity: 1,
            }}
            exit={{
              rotate: 180,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
            }}
            className="relative z-10"
          >
            {isOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
