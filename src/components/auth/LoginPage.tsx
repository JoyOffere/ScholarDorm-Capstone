import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { createAuditLog } from '../../lib/supabase-utils'
import { getOAuthRedirectUrl, debugUrlConfig } from '../../lib/url-config'
import {
  AtSignIcon,
  LockIcon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  ArrowRightIcon,
  VideoIcon,
  GraduationCapIcon,
  StarIcon,
  UsersIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  HandIcon
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

export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
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

  // Check if user account exists
  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected for non-existent users
        console.error('Error checking user existence:', error);
        return true; // Assume user exists on error to proceed with normal login flow
      }

      return !!data; // Returns true if user exists, false otherwise
    } catch (error) {
      console.error('Error checking user existence:', error);
      return true; // Assume user exists on error to proceed with normal login flow
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setLoginError(null);

    try {
      // Set a flag to indicate OAuth flow is starting
      sessionStorage.setItem('oauth_flow_started', 'true');
      sessionStorage.setItem('oauth_provider', 'google');
      
      // Get OAuth redirect URL from environment configuration
      const redirectUrl = getOAuthRedirectUrl();

      // Debug URL configuration if enabled
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_OAUTH_DEBUG) {
        debugUrlConfig();
        console.log('🔐 LoginPage OAuth Redirect URL:', redirectUrl);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account consent',
            include_granted_scopes: 'true',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;

      // OAuth redirect will handle the rest
      console.log('Google OAuth initiated successfully');
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      // Handle specific Google OAuth errors
      if (error.message?.includes('popup_closed_by_user')) {
        setLoginError('Sign-in was cancelled. Please try again.');
      } else if (error.message?.includes('access_denied')) {
        setLoginError('Access denied. Please grant permissions to continue.');
      } else if (error.message?.includes('network')) {
        setLoginError('Network error. Please check your connection and try again.');
      } else if (error.message?.includes('configuration')) {
        setLoginError('Google authentication is not properly configured. Please contact support.');
      } else {
        setLoginError('Unable to sign in with Google. Please try again or use email/password.');
      }

      // Clear the OAuth flow flag on error
      sessionStorage.removeItem('oauth_flow_started');
      sessionStorage.removeItem('oauth_provider');
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      // First, check if user account exists
      const userExists = await checkUserExists(data.email);

      if (!userExists) {
        setLoginError(
          'No account found with this email address. Please check your email or sign up for a new account.'
        );
        setIsLoading(false);
        return;
      }

      // Sign in with Supabase - this will trigger AuthContext updates
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      if (authData?.user) {
        setAuthUserId(authData.user.id);
        console.log('LoginPage: Login successful, AuthContext will handle the rest');

        // AuthContext will handle user record creation and navigation
        // Just wait for the auth state change
      }
    } catch (error: any) {
      console.error('LoginPage: Login error:', error);

      // Handle specific error types for better UX
      if (error.message?.includes('Invalid login credentials')) {
        setLoginError('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        setLoginError('Please check your email and confirm your account before signing in.');
      } else if (error.message?.includes('Too many requests')) {
        setLoginError('Too many login attempts. Please wait a moment and try again.');
      } else if (error.message?.includes('Signup not allowed')) {
        setLoginError('New signups are currently disabled. Please contact support.');
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        setLoginError('Network connection failed. Please check your internet and try again.');
      } else {
        setLoginError('Unable to sign in. Please check your credentials and try again.');
      }

      setIsLoading(false);
    }
    // Note: Don't set isLoading(false) on success - let the auth state change handle it
  }

return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-pink-400/15 to-yellow-400/15 rounded-full blur-2xl"
          animate={{
            rotate: [0, 360],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
      
      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Welcome Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCapIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  ScholarDorm
                </h1>
                <p className="text-gray-600 text-sm">Inclusive Learning Platform</p>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight"
              >
                Welcome back to your 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> learning journey</span>
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-xl text-gray-600 leading-relaxed"
              >
                Access your personalized dashboard, track your progress, and continue learning with our inclusive platform that supports Rwanda Sign Language.
              </motion.p>
            </div>

            {/* Feature Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="grid grid-cols-2 gap-6"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Interactive Lessons</h3>
                  <p className="text-sm text-gray-600">Engaging content</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <HandIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">RSL Support</h3>
                  <p className="text-sm text-gray-600">Sign language ready</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Community</h3>
                  <p className="text-sm text-gray-600">Connect with peers</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <StarIcon className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Progress Tracking</h3>
                  <p className="text-sm text-gray-600">Monitor growth</p>
                </div>
              </div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="flex items-center space-x-6 text-sm text-gray-500"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center space-x-2">
                <UsersIcon className="w-4 h-4" />
                <span>Trusted by 1000+ students</span>
              </div>
            </motion.div>
          </motion.div>
          {/* Right Column: Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full max-w-md mx-auto lg:mx-0"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <LockIcon className="w-10 h-10 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-3xl font-bold text-gray-900 mb-2"
                >
                  Sign In
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="text-gray-600"
                >
                  Enter your credentials to access your account
                </motion.p>
              </div>
              <AnimatePresence>
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="mb-6 p-4 bg-red-50/80 border border-red-200/50 rounded-xl flex items-start gap-3 backdrop-blur-sm"
                  >
                    <AlertCircleIcon
                      size={20}
                      className="text-red-600 flex-shrink-0 mt-0.5"
                    />
                    <span className="text-sm text-red-700">{loginError}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Google Sign In Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg focus:ring-4 focus:ring-blue-100 transition-all duration-300 font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed group mb-6 shadow-sm"
              >
                {isGoogleLoading ? (
                  <Loader2Icon size={20} className="animate-spin text-blue-600" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span className="group-hover:text-gray-900 transition-colors">
                  {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                </span>
              </motion.button>

              {/* Divider */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 }}
                className="mb-6 flex items-center"
              >
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500 bg-white/80 font-medium rounded-full">or continue with email</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </motion.div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-3"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      onChange={(e) => handleInputChange(e, 'email')}
                      disabled={isLoading || isGoogleLoading}
                      className={`w-full pl-12 pr-4 py-4 border-2 ${
                        errors.email 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                      } rounded-xl focus:ring-4 focus:outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400`}
                    />
                    <AtSignIcon
                      size={20}
                      className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                        errors.email ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-2 text-sm text-red-600 flex items-center gap-1"
                      >
                        <AlertCircleIcon size={16} />
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 mb-3"
                  >
                    Password
                  </label>
                  <div className="relative group">
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
                      disabled={isLoading || isGoogleLoading}
                      className={`w-full pl-12 pr-12 py-4 border-2 ${
                        errors.password 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                      } rounded-xl focus:ring-4 focus:outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400`}
                    />
                    <LockIcon
                      size={20}
                      className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                        errors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'
                      }`}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOffIcon size={20} />
                      ) : (
                        <EyeIcon size={20} />
                      )}
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-2 text-sm text-red-600 flex items-center gap-1"
                      >
                        <AlertCircleIcon size={16} />
                        {errors.password.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  className="flex items-center justify-between"
                >
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
                    />
                    <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors hover:underline"
                  >
                    Forgot password?
                  </Link>
                </motion.div>
                <motion.button
                  type="submit"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <Loader2Icon size={20} className="animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRightIcon size={18} className="ml-2" />
                    </>
                  )}
                </motion.button>
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRSLModal(true)}
                  className="w-full flex items-center justify-center px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all duration-300 font-medium shadow-sm"
                >
                  <HandIcon size={20} className="mr-2" />
                  Learn with RSL
                </motion.button>
              </form>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="mt-8 text-center text-gray-600"
              >
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline"
                >
                  Sign up for free
                </Link>
              </motion.p>
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