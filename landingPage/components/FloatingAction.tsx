import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircleIcon,
  HelpCircleIcon,
  HandIcon,
  XIcon,
} from 'lucide-react'
export const FloatingAction = () => {
  const [isOpen, setIsOpen] = useState(false)
  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }
  const actions = [
    {
      icon: <MessageCircleIcon size={20} />,
      label: 'Chat Support',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: <HelpCircleIcon size={20} />,
      label: 'Help Center',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: <HandIcon size={20} />,
      label: 'RSL Assistance',
      color: 'bg-secondary-600 hover:bg-secondary-700',
    },
  ]
  return (
    <div className="fixed bottom-6 right-6 z-40">
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
              <motion.button
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
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                className={`${action.color} text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-colors`}
                aria-label={action.label}
              >
                <span className="absolute right-full mr-3 bg-white text-slate-800 py-1 px-3 rounded-lg shadow-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                {action.icon}
              </motion.button>
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
        className="bg-primary-600 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
        aria-label={isOpen ? 'Close help menu' : 'Open help menu'}
      >
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
          >
            {isOpen ? <XIcon size={24} /> : <MessageCircleIcon size={24} />}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
