import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { createAuditLog } from '../../lib/supabase-utils';
import {
  AtSignIcon,
  LockIcon,
  UserIcon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  ArrowRightIcon,
  VideoIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from 'lucide-react';
import { RSLModal } from './RSLModal';

interface SignupFormData {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

export const SignupPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRSLModal, setShowRSLModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isSlideshowPaused, setIsSlideshowPaused] = useState(false);
  const navigate = useNavigate();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    clearErrors,
    setValue,
    reset,
  } = useForm<SignupFormData>({
    mode: 'onBlur',
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');
  const email = watch('email');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof SignupFormData,
  ) => {
    setValue(field, e.target.value);
    if (e.target.value.trim() !== '') clearErrors(field);
    setSignupError(null);
    setSignupSuccess(null);
  };

  const checkEmailExists = async (email: string) => {
    setIsLoading(true);
    setSignupError(null);
    setSignupSuccess(null);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (data) {
        setSignupError('This email is already registered. Please try logging in.');
        return true;
      }
      setSignupSuccess('Email is available! Proceed to the next step.');
      return false;
    } catch (error: any) {
      setSignupError('Error checking email. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    if (currentStep === 0) {
      const emailExists = await checkEmailExists(data.email);
      if (!emailExists) {
        setCurrentStep(1);
        setTimeout(() => emailInputRef.current?.focus(), 100);
      }
    } else if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setIsLoading(true);
      setSignupError(null);
      setSignupSuccess(null);
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
            },
          },
        });
        if (error) throw error;
        if (authData?.user) {
          setUserId(authData.user.id);
          await supabase.from('users').insert({
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            role: 'student',
            status: 'active',
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=0D8ABC&color=fff`,
            streak_count: 0,
            longest_streak: 0,
            email_verified: false,
            accessibility_preferences: {
              high_contrast: false,
              large_text: false,
              show_rsl: true,
            },
          });
          await createAuditLog(authData.user.id, 'profile_update', {
            method: 'email',
          });
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });
          if (signInError) {
            setSignupError('Login failed. Please try again.');
            navigate('/');
          } else {
            setSignupSuccess('Account created successfully! Welcome to ScholarDorm!');
            localStorage.setItem('userRole', 'student');
            setTimeout(() => navigate('/dashboard'), 1500);
          }
        }
      } catch (error: any) {
        setSignupError(
          error.message || 'An error occurred during signup. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isSlideshowPaused) {
      interval = setInterval(() => {
        setSlideIndex((prev) => (prev + 1) % slides.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isSlideshowPaused]);

  const slides = [
    {
      title: 'Interactive Learning',
      description: 'Engage with dynamic content tailored to your learning style.',
      image: 'https://images.pexels.com/photos/159775/library-la-trobe-study-students-159775.jpeg?w=800&h=600&fit=crop&auto=format',
      bgColor: 'from-blue-50 to-indigo-100',
      caption: 'Students studying in a vibrant library environment.',
    },
    {
      title: 'Rwandan Sign Language',
      description: 'Inclusive education with comprehensive RSL support.',
      image: 'https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg?w=800&h=600&fit=crop&auto=format',
      bgColor: 'from-green-50 to-emerald-100',
      caption: 'Learning with accessibility in mind.',
    },
    {
      title: 'Track Your Progress',
      description: 'Monitor milestones and celebrate your achievements.',
      image: 'https://images.pexels.com/photos/590516/pexels-photo-590516.jpeg?w=800&h=600&fit=crop&auto=format',
      bgColor: 'from-purple-50 to-violet-100',
      caption: 'Visualize your learning journey.',
    },
    {
      title: 'Community Learning',
      description: 'Connect with peers in a supportive environment.',
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?w=800&h=600&fit=crop&auto=format',
      bgColor: 'from-orange-50 to-amber-100',
      caption: 'Collaborate and grow together.',
    },
  ];

  const steps = [
    {
      title: 'Enter Your Email',
      icon: <AtSignIcon className="w-12 h-12 text-blue-600" />,
      description: 'Provide your email to start the signup process.',
    },
    {
      title: 'Your Details',
      icon: <UserIcon className="w-12 h-12 text-blue-600" />,
      description: 'Enter your name and create a password.',
    },
    {
      title: 'Confirm Password',
      icon: <LockIcon className="w-12 h-12 text-blue-600" />,
      description: 'Confirm your password to complete signup.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-12 items-stretch">
          {/* Left Side - Slideshow */}
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="hidden lg:flex flex-col justify-center p-8 rounded-3xl shadow-2xl overflow-hidden relative min-h-[600px]"
            role="region"
            aria-label="Platform features slideshow"
          >
            <img
              src={slides[slideIndex].image}
              alt={slides[slideIndex].caption}
              className="absolute inset-0 w-full h-full object-cover opacity-90"
              loading="lazy"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${slides[slideIndex].bgColor} opacity-80`} />
            <div className="relative z-10 flex flex-col justify-center h-full space-y-6">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {slides[slideIndex].title}
              </h2>
              <p className="text-xl text-gray-700 max-w-md leading-relaxed">
                {slides[slideIndex].description}
              </p>
              <p className="text-sm text-gray-500 italic" aria-hidden="true">
                {slides[slideIndex].caption}
              </p>
              <div className="flex space-x-2 mt-6">
                {slides.map((_, index) => (
                  <motion.div
                    key={index}
                    animate={{ opacity: index === slideIndex ? 1 : 0.5, scale: index === slideIndex ? 1.2 : 1 }}
                    transition={{ duration: 0.3 }}
                    className={`w-3 h-3 rounded-full ${index === slideIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
                    role="button"
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => setSlideIndex(index)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSlideIndex(index)}
                  />
                ))}
              </div>
              <div className="flex w-full justify-between items-center mt-8">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all"
                  aria-label="Previous slide"
                >
                  <ChevronLeftIcon size={24} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSlideshowPaused(!isSlideshowPaused)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all"
                  aria-label={isSlideshowPaused ? 'Play slideshow' : 'Pause slideshow'}
                >
                  {isSlideshowPaused ? <PlayIcon size={24} /> : <PauseIcon size={24} />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSlideIndex((prev) => (prev + 1) % slides.length)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all"
                  aria-label="Next slide"
                >
                  <ChevronRightIcon size={24} />
                </motion.button>
              </div>
            </div>
            <div className="absolute top-4 left-4 w-32 h-32 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-4 right-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
          </motion.div>

          {/* Right Side - Multi-Step Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md flex flex-col justify-center min-h-[600px]"
            role="region"
            aria-label="Signup form"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100/50 flex-1 flex flex-col">
              <div className="mb-6">
                <div className="w-full h-1.5 bg-gray-100/50 rounded-full overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: `${(currentStep / steps.length) * 100}%` }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                  />
                </div>
                <div className="flex justify-center space-x-2">
                  {steps.map((_, index) => (
                    <motion.div
                      key={index}
                      animate={{ scale: index === currentStep ? 1.2 : 1, opacity: index === currentStep ? 1 : 0.5 }}
                      transition={{ duration: 0.3 }}
                      className={`w-2 h-2 rounded-full ${index === currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="flex-1 flex flex-col justify-center"
                >
                  <div className="flex flex-col items-center text-center mb-8">
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 15 }}
                      className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full shadow-inner mb-4"
                    >
                      {steps[currentStep].icon}
                    </motion.div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">
                      {steps[currentStep].title}
                    </h2>
                    <p className="text-gray-600 text-base leading-relaxed max-w-sm">
                      {steps[currentStep].description}
                    </p>
                  </div>

                  {(signupError || signupSuccess) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`mb-6 p-4 ${signupError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border rounded-xl flex items-start gap-3`}
                    >
                      {signupError ? (
                        <AlertCircleIcon size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircleIcon size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${signupError ? 'text-red-700' : 'text-green-700'}`}>
                        {signupError || signupSuccess}
                      </span>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-1">
                    {currentStep === 0 && (
                      <div className="flex-1 flex flex-col justify-center">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <div className="relative">
                            {isLoading ? (
                              <div className="w-full h-12 bg-gray-200 animate-pulse rounded-xl" />
                            ) : (
                              <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                {...register('email', {
                                  required: 'Email is required',
                                  pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email',
                                  },
                                })}
                                onChange={(e) => handleInputChange(e, 'email')}
                                disabled={isLoading}
                                className={`w-full pl-11 pr-4 py-3 border ${errors.email ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white`}
                                ref={emailInputRef}
                                aria-invalid={errors.email ? 'true' : 'false'}
                              />
                            )}
                            <AtSignIcon size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                          {errors.email && (
                            <p className="mt-1.5 text-sm text-red-600" role="alert">
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {currentStep === 1 && (
                      <div className="flex-1 flex flex-col justify-center space-y-6">
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <div className="relative">
                            <input
                              id="fullName"
                              type="text"
                              placeholder="John Doe"
                              {...register('fullName', {
                                required: 'Full name is required',
                                minLength: {
                                  value: 2,
                                  message: 'Name must be at least 2 characters',
                                },
                              })}
                              onChange={(e) => handleInputChange(e, 'fullName')}
                              disabled={isLoading}
                              className={`w-full pl-11 pr-4 py-3 border ${errors.fullName ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white`}
                              aria-invalid={errors.fullName ? 'true' : 'false'}
                            />
                            <UserIcon size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                          {errors.fullName && (
                            <p className="mt-1.5 text-sm text-red-600" role="alert">
                              {errors.fullName.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Create a password"
                              {...register('password', {
                                required: 'Password is required',
                                minLength: {
                                  value: 6,
                                  message: 'Password must be at least 6 characters',
                                },
                              })}
                              onChange={(e) => handleInputChange(e, 'password')}
                              disabled={isLoading}
                              className={`w-full pl-11 pr-11 py-3 border ${errors.password ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white`}
                              aria-invalid={errors.password ? 'true' : 'false'}
                            />
                            <LockIcon size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="mt-1.5 text-sm text-red-600" role="alert">
                              {errors.password.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {currentStep === 2 && (
                      <div className="flex-1 flex flex-col justify-center space-y-6">
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm your password"
                              {...register('confirmPassword', {
                                required: 'Please confirm your password',
                                validate: (value) => value === password || 'Passwords do not match',
                              })}
                              onChange={(e) => handleInputChange(e, 'confirmPassword')}
                              disabled={isLoading}
                              className={`w-full pl-11 pr-11 py-3 border ${errors.confirmPassword ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white`}
                              aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                            />
                            <LockIcon size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                              {showConfirmPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="mt-1.5 text-sm text-red-600" role="alert">
                              {errors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                        <div className="flex items-start">
                          <input
                            id="terms"
                            type="checkbox"
                            required
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                            aria-label="Agree to terms and conditions"
                          />
                          <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                            I agree to the{' '}
                            <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                              Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                              Privacy Policy
                            </Link>
                          </label>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setShowRSLModal(true)}
                          className="w-full flex items-center justify-center px-6 py-3 border-2 border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 transition-all font-medium"
                          aria-label="Learn with Rwandan Sign Language"
                        >
                          <VideoIcon size={20} className="mr-2" />
                          Learn with RSL
                        </motion.button>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                      {currentStep > 0 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => {
                            setCurrentStep(currentStep - 1);
                            if (currentStep === 1) reset({ email, fullName: '', password: '', confirmPassword: '' });
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors flex items-center"
                          aria-label="Go back to previous step"
                        >
                          <ChevronLeftIcon size={16} className="mr-1" />
                          Back
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        aria-label={currentStep === steps.length - 1 ? 'Create account' : 'Next step'}
                      >
                        {isLoading ? (
                          <>
                            <Loader2Icon size={16} className="animate-spin mr-2" />
                            Processing...
                          </>
                        ) : currentStep === steps.length - 1 ? (
                          <>
                            Create Account
                            <ArrowRightIcon size={16} className="ml-2" />
                          </>
                        ) : (
                          <>
                            Next Step
                            <ChevronRightIcon size={16} className="ml-2" />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              </AnimatePresence>

              <p className="mt-8 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <RSLModal
        isOpen={showRSLModal}
        onClose={() => setShowRSLModal(false)}
        userId={userId ?? undefined}
      />
    </div>
  );
};