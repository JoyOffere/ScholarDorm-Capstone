import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, BookOpenIcon, HandIcon, StarIcon } from 'lucide-react';

export const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    {
      icon: <BookOpenIcon className="w-14 h-14 text-blue-600" />,
      title: 'Welcome to ScholarDorm',
      description:
        'Embark on a journey of inclusive education. Discover interactive learning experiences designed for all.',
    },
    {
      icon: <HandIcon className="w-14 h-14 text-green-600" />,
      title: 'Rwandan Sign Language',
      description:
        'Experience our innovative RSL module, crafted to make education accessible for deaf students.',
      videoUrl: 'https://www.youtube.com/watch?v=2ATl9JVycYk',
    },
    {
      icon: <StarIcon className="w-14 h-14 text-yellow-500" />,
      title: 'Start Your Journey',
      description:
        'Join thousands of learners by creating your free account and transforming your education today.',
    },
  ];

  const handleClose = () => {
    setIsOpen(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-md p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-gray-100/50"
          >
            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="Close welcome modal"
            >
              <XIcon size={24} />
            </motion.button>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-100/50">
              <motion.div
                initial={{ width: `${(currentStep / steps.length) * 100}%` }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="h-full bg-blue-600"
              />
            </div>

            {/* Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="flex flex-col items-center text-center"
                >
                  {steps[currentStep].videoUrl ? (
                    // RSL Video Step
                    <div className="w-full">
                      <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 15 }}
                        className="mb-4 p-4 bg-gray-50 rounded-full shadow-inner mx-auto w-fit"
                      >
                        {steps[currentStep].icon}
                      </motion.div>
                      <h2
                        id="modal-title"
                        className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"
                      >
                        {steps[currentStep].title}
                      </h2>
                      <p className="text-gray-600 mb-4 text-base leading-relaxed">
                        {steps[currentStep].description}
                      </p>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="mb-4"
                      >
                        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden shadow-md">
                          <iframe
                            src="https://www.youtube.com/embed/2ATl9JVycYk"
                            title="Rwandan Sign Language Introduction"
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    // Regular Steps
                    <>
                      <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 15 }}
                        className="mb-6 p-4 bg-gray-50 rounded-full shadow-inner"
                      >
                        {steps[currentStep].icon}
                      </motion.div>
                      <h2
                        id="modal-title"
                        className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"
                      >
                        {steps[currentStep].title}
                      </h2>
                      <p className="text-gray-600 mb-8 text-base leading-relaxed max-w-sm">
                        {steps[currentStep].description}
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={prevStep}
                  className={`px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors ${
                    currentStep === 0 ? 'invisible' : ''
                  }`}
                  aria-label="Previous step"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm shadow-sm"
                >
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                </motion.button>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center mt-6 space-x-2">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    animate={{
                      scale: index === currentStep ? 1.2 : 1,
                      opacity: index === currentStep ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-2 h-2 bg-blue-600 rounded-full"
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>

            {/* Decorative elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="absolute -top-20 -right-20 w-48 h-48 bg-blue-200 rounded-full blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="absolute -bottom-20 -left-20 w-48 h-48 bg-green-200 rounded-full blur-3xl"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};