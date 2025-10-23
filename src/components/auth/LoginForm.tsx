import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { createAuditLog } from '../../lib/supabase-utils';
import { useAuth } from '../../contexts/AuthContext';
import { getOAuthRedirectUrl, debugUrlConfig } from '../../lib/url-config';
import {
  AtSignIcon,
  LockIcon,
  AlertCircleIcon,
  Loader2Icon,
  ArrowRightIcon,
  VideoIcon,
  EyeIcon,
  EyeOffIcon,
} from 'lucide-react';
import { RSLModal } from './RSLModal';

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showRSLModal, setShowRSLModal] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | undefined>(undefined);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const { user, session } = useAuth();

  // Handle navigation after successful login
  useEffect(() => {
    if (session && user && isLoading) {
      console.log('LoginForm: Auth successful, navigating to dashboard');
      setIsLoading(false);
      const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [session, user, isLoading, navigate]);

  // Add timeout for login process to prevent hanging
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        if (isLoading && !session) {
          console.warn('LoginForm: Login timeout, stopping loading state');
          setIsLoading(false);
          setLoginError('Login is taking longer than expected. Please try again.');
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading, session]);

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
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof LoginFormData,
  ) => {
    setValue(field, e.target.value);
    if (e.target.value.trim() !== '') clearErrors(field);
    setLoginError(null);
  };

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
      // Get OAuth redirect URL from environment configuration
      const redirectUrl = getOAuthRedirectUrl();
      
      // Debug URL configuration if enabled
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_OAUTH_DEBUG) {
        debugUrlConfig();
        console.log('🔐 LoginForm OAuth Redirect URL:', redirectUrl);
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
        setRetryCount(0); // Reset retry count on success
        console.log('LoginForm: Login successful, AuthContext will handle the rest');
        
        // AuthContext will handle user record creation and navigation
        // Just wait for the auth state change
      }
    } catch (error: any) {
      console.error('LoginForm: Login error:', error);
      
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
        // Network error - offer retry option
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setLoginError(`Connection error. Retrying... (Attempt ${retryCount + 1}/3)`);
          // Auto-retry after 1 second
          setTimeout(() => onSubmit(data), 1000);
          return;
        } else {
          setLoginError('Network connection failed. Please check your internet and try again.');
        }
      } else {
        setLoginError('Unable to sign in. Please check your credentials and try again.');
      }
      
      setIsLoading(false);
    }
    // Note: Don't set isLoading(false) on success - let the auth state change handle it
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Error Message */}
      {loginError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
        >
          <AlertCircleIcon
            size={20}
            className="text-red-600 flex-shrink-0 mt-0.5"
          />
          <span className="text-sm text-red-700 leading-relaxed">{loginError}</span>
        </motion.div>
      )}

      {/* Google Sign In Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md focus:ring-4 focus:ring-blue-100 transition-all duration-200 font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed group"
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
      <div className="my-8 flex items-center">
        <div className="flex-1 border-t border-gray-200"></div>
        <span className="px-4 text-sm text-gray-500 bg-white font-medium">or</span>
        <div className="flex-1 border-t border-gray-200"></div>
      </div>

      {/* Email/Password Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
              onChange={(e) => handleInputChange(e, 'email')}
              disabled={isLoading || isGoogleLoading}
              className={`w-full pl-11 pr-4 py-3.5 border-2 ${
                errors.email 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
              } rounded-xl focus:ring-4 transition-all duration-200 placeholder-gray-400`}
            />
            <AtSignIcon
              size={20}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                errors.email ? 'text-red-400' : 'text-gray-400'
              }`}
            />
          </div>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600 font-medium"
            >
              {errors.email.message}
            </motion.p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-gray-700 mb-2"
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
              disabled={isLoading || isGoogleLoading}
              className={`w-full pl-11 pr-11 py-3.5 border-2 ${
                errors.password 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
              } rounded-xl focus:ring-4 transition-all duration-200 placeholder-gray-400`}
            />
            <LockIcon
              size={20}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                errors.password ? 'text-red-400' : 'text-gray-400'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600 font-medium"
            >
              {errors.password.message}
            </motion.p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
              Remember me
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all"
          >
            Forgot password?
          </Link>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <Loader2Icon size={20} className="animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRightIcon size={18} />
            </>
          )}
        </button>

        {/* RSL Button */}
        <button
          type="button"
          onClick={() => setShowRSLModal(true)}
          disabled={isLoading || isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border-2 border-purple-200 text-purple-700 rounded-xl hover:bg-purple-50 hover:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <VideoIcon size={20} />
          <span>Learn with RSL</span>
        </button>
      </motion.form>

      {/* Sign Up Link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all"
          >
            Sign up for free
          </Link>
        </p>
      </motion.div>

      {/* RSL Modal */}
      <RSLModal
        isOpen={showRSLModal}
        onClose={() => setShowRSLModal(false)}
        userId={authUserId}
      />
    </div>
  );
};
