import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { createAuditLog } from '../../lib/supabase-utils'
import {
  AtSignIcon,
  LockIcon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  ArrowRightIcon,
  VideoIcon,
} from 'lucide-react'
import { RSLModal } from './RSLModal'

interface LoginFormData {
  email: string
  password: string
}

interface Slide {
  image: string
  caption: string
  subcaption: string
}

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showRSLModal, setShowRSLModal] = useState(false)
  const [authUserId, setAuthUserId] = useState<string | undefined>(undefined)
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate()

  const slides: Slide[] = [
    {
      image: 'https://images.pexels.com/photos/4145195/pexels-photo-4145195.jpeg?auto=compress&w=800&q=80',
      caption: 'Inclusive Learning for All',
      subcaption:
        'ScholarDorm is dedicated to accessible education. Our platform integrates Rwanda Sign Language (RSL) support, making learning welcoming for Deaf and hard-of-hearing students. Enjoy seamless navigation, clear visuals, and interactive RSL video guides throughout your journey.',
    },
    {
      image: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&w=800&q=80',
      caption: 'Rwanda Sign Language at Your Fingertips',
      subcaption:
        'Dive into a unique learning experience with RSL video lessons, real-time sign language assistance, and a visually harmonious interface. Animated transitions, soft gradients, and intuitive layouts ensure every learner feels comfortable and engaged.',
    },
    {
      image: 'https://images.pexels.com/photos/256401/pexels-photo-256401.jpeg?auto=compress&w=800&q=80',
      caption: 'Vibrant Community & Collaboration',
      subcaption:
        'Connect with peers and educators in a supportive environment. ScholarDorm celebrates diversity and empowers you to communicate, collaborate, and grow—whether through text, voice, or Rwanda Sign Language. Experience smooth, animated feedback and lively interactions as you progress.',
    },
    {
      image: 'https://images.pexels.com/photos/1181357/pexels-photo-1181357.jpeg?auto=compress&w=800&q=80',
      caption: 'Modern Aesthetics, Effortless Usability',
      subcaption:
        'Our platform features elegant animations, responsive layouts, and a calming color palette inspired by Rwandan culture. Every detail—from animated buttons to smooth page transitions—enhances your focus and enjoyment.',
    },
    {
      image: 'https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&w=800&q=80',
      caption: 'Start Your Accessible Learning Journey',
      subcaption:
        'Sign in to unlock personalized content, track your progress, and access Rwanda Sign Language resources anytime. ScholarDorm is your gateway to inclusive, beautiful, and effective education.',
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds
    return () => clearInterval(interval)
  }, [slides.length])

  const handleDotClick = (index: number) => {
    setCurrentSlide(index)
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
    setValue,
  } = useForm<LoginFormData>({
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof LoginFormData,
  ) => {
    setValue(field, e.target.value)
    if (e.target.value.trim() !== '') clearErrors(field)
    setLoginError(null)
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setLoginError(null)
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw error
      if (authData?.user) {
        setAuthUserId(authData.user.id)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .single()
        if (userError) {
          await supabase.from('users').insert({
            id: authData.user.id,
            email: data.email,
            full_name: data.email.split('@')[0],
            role: 'student',
            status: 'active',
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.email.split('@')[0])}&background=0D8ABC&color=fff`,
            streak_count: 0,
            longest_streak: 0,
            email_verified: true,
          })
          localStorage.setItem('userRole', 'student')
          await createAuditLog(authData.user.id, 'login', {
            method: 'email',
            role: 'student',
          })
          navigate('/dashboard')
        } else {
          localStorage.setItem('userRole', userData.role)
          await createAuditLog(authData.user.id, 'login', {
            method: 'email',
            role: userData.role,
          })
          navigate(userData.role === 'admin' ? '/admin' : '/dashboard')
        }
      }
    } catch (error: any) {
      setLoginError('Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

return (
    <div className="min-h-screen relative overflow-hidden bg-primary-50">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute top-20 left-20 w-48 h-48 bg-primary-200 rounded-full opacity-40 animate-float blur-xl"
          style={{ animationDelay: '0s' }}
        ></div>
        <div
          className="absolute bottom-40 right-40 w-64 h-64 bg-secondary-300 rounded-full opacity-30 animate-float blur-2xl"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-32 h-32 bg-primary-400 rotate-45 opacity-20 animate-slide-right blur-lg"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-secondary-500 opacity-25 animate-fade-in blur-xl"
          style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
        ></div>
      </div>
      {/* Main Content */}
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-6 pb-12 min-h-screen relative z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Slideshow */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block rounded-2xl shadow-xl h-[500px] relative overflow-hidden"
            style={{
              backgroundImage: `url(${slides[currentSlide].image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="relative z-10 flex flex-col justify-center items-center h-full text-white text-center px-8">
              <motion.h2
                key={currentSlide}
                className="text-4xl font-display font-bold mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {slides[currentSlide].caption}
              </motion.h2>
              <motion.p
                key={currentSlide + '-sub'}
                className="text-lg font-sans leading-relaxed max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {slides[currentSlide].subcaption}
              </motion.p>
            </div>
            {/* Dots for Navigation */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </motion.div>
          {/* Right Column: Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-[500px]"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 h-full flex flex-col justify-center">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-display font-bold text-primary-900 mb-2">
                  Welcome Back
                </h1>
                <p className="text-primary-600 font-sans">
                  Sign in to continue your learning journey
                </p>
              </div>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                >
                  <AlertCircleIcon
                    size={20}
                    className="text-red-600 flex-shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-red-700">{loginError}</span>
                </motion.div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-primary-700 mb-2 font-sans"
                  >
                    Email Address
                  </label>
                  <div className="relative">
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
                      className={`w-full pl-11 pr-4 py-3 border ${
                        errors.email ? 'border-red-300' : 'border-primary-200'
                      } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    />
                    <AtSignIcon
                      size={20}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-primary-700 mb-2 font-sans"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      onChange={(e) => handleInputChange(e, 'password')}
                      disabled={isLoading}
                      className={`w-full pl-11 pr-11 py-3 border ${
                        errors.password ? 'border-red-300' : 'border-primary-200'
                      } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    />
                    <LockIcon
                      size={20}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
                    >
                      {showPassword ? (
                        <EyeOffIcon size={20} />
                      ) : (
                        <EyeIcon size={20} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 border-primary-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-primary-700 font-sans">
                      Remember me
                    </span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium font-sans"
                  >
                    Forgot password?
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-6 py-3.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all font-medium font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2Icon size={20} className="animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRightIcon size={18} className="ml-2" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRSLModal(true)}
                  className="w-full flex items-center justify-center px-6 py-3 border-2 border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 transition-all font-medium font-sans"
                >
                  <VideoIcon size={20} className="mr-2" />
                  Learn with RSL
                </button>
              </form>
              <p className="mt-8 text-center text-sm text-primary-600 font-sans">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      <RSLModal
        isOpen={showRSLModal}
        onClose={() => setShowRSLModal(false)}
        userId={authUserId}
      />
    </div>
  )
}