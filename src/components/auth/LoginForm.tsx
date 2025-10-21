import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { createAuditLog } from '../../lib/supabase-utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  AtSignIcon,
  LockIcon,
  AlertCircleIcon,
  Loader2Icon,
  ArrowRightIcon,
  VideoIcon,
} from 'lucide-react';
import { RSLModal } from './RSLModal';

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showRSLModal, setShowRSLModal] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const { user, session } = useAuth();

  // Handle navigation after successful login
  useEffect(() => {
    if (session && user?.role && isLoading) {
      console.log('LoginForm: Auth successful, navigating to dashboard');
      setIsLoading(false);
      const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [session, user, isLoading, navigate]);

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

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      // Sign in with Supabase
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) throw error;
      
      if (authData?.user) {
        setAuthUserId(authData.user.id);
        
        // Check if user exists in our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .single();
        
        // Create user record if it doesn't exist
        if (userError && userError.code === 'PGRST116') {
          try {
            await supabase.from('users').insert({
              id: authData.user.id,
              email: data.email,
              full_name: data.email.split('@')[0],
              role: 'student',
              status: 'active',
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                data.email.split('@')[0],
              )}&background=0D8ABC&color=fff`,
              streak_count: 0,
              longest_streak: 0,
              email_verified: true,
            });
            console.log('LoginForm: Created new user record');
          } catch (insertError) {
            console.warn('LoginForm: Failed to create user record:', insertError);
          }
        }
        
        // Let AuthContext handle the navigation via auth state change
        // Don't manually navigate here to avoid race conditions
        console.log('LoginForm: Login successful, waiting for AuthContext to handle navigation');
      }
    } catch (error: any) {
      console.error('LoginForm: Login error:', error);
      setLoginError('Invalid email or password. Please try again.');
      setIsLoading(false);
    }
    // Note: Don't set isLoading(false) on success - let the auth state change handle it
  };

  return (
    <>
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
            <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
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
              type="password"
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
          </div>
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
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

      <RSLModal
        isOpen={showRSLModal}
        onClose={() => setShowRSLModal(false)}
        userId={authUserId}
      />
    </>
  );
};
