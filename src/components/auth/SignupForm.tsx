import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { supabase } from '../../lib/supabase';
import { createAuditLog } from '../../lib/supabase-utils';
import { getOAuthRedirectUrl, debugUrlConfig } from '../../lib/url-config';
import { AtSignIcon, LockIcon, UserIcon, AlertCircleIcon, VideoIcon } from 'lucide-react';
import { RSLModal } from './RSLModal';
interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
export const SignupForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [showRSLModal, setShowRSLModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: {
      errors
    },
    clearErrors,
    setValue
  } = useForm<SignupFormData>({
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });
  const password = watch('password');
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof SignupFormData) => {
    setValue(field, e.target.value);
    if (e.target.value.trim() !== '') {
      clearErrors(field);
    }
    setSignupError(null);
  };

  // Check if email is already registered
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected for new users
        console.error('Error checking email existence:', error);
        return false; // Assume email doesn't exist on error to allow signup
      }
      
      return !!data; // Returns true if email exists, false otherwise
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false; // Assume email doesn't exist on error to allow signup
    }
  };
  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setSignupError(null);
    try {
      // First, check if email is already registered
      const emailExists = await checkEmailExists(data.email);
      
      if (emailExists) {
        setSignupError(
          'This email is already registered. Please use a different email or try signing in instead.'
        );
        setIsLoading(false);
        return;
      }

      // Sign up with Supabase
      const {
        data: authData,
        error
      } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName
          }
        }
      });
      if (error) throw error;
      if (authData?.user) {
        setUserId(authData.user.id);
        
        // Create user profile in the database based on schema
        const {
          error: profileError
        } = await supabase.from('users').insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          role: 'student',
          status: 'active',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=0D8ABC&color=fff`,
          streak_count: 0,
          longest_streak: 0,
          email_verified: true,
          accessibility_preferences: {
            high_contrast: false,
            large_text: false,
            show_rsl: true
          }
        });
        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
        // Create user authentication record (use upsert to handle existing records)
        await supabase.from('user_auth').upsert({
          user_id: authData.user.id,
          auth_provider: 'email',
          last_sign_in: new Date().toISOString()
        }).then(({
          error
        }) => {
          if (error) console.error('Auth tracking error:', error);
        });
        // Create user settings (use upsert to handle existing records)
        await supabase.from('user_settings').upsert({
          user_id: authData.user.id,
          notification_preferences: {
            streak_reminders: true,
            badge_notifications: true,
            course_recommendations: true,
            system_updates: true
          },
          accessibility_settings: {
            high_contrast: false,
            large_text: false,
            show_rsl: true,
            screen_reader_optimized: false
          },
          learning_preferences: {
            preferred_subjects: [],
            learning_pace: 'normal',
            content_format: 'mixed'
          },
          display_settings: {
            theme: 'light',
            dashboard_layout: 'default'
          }
        }).then(({
          error
        }) => {
          if (error) console.error('Settings creation error:', error);
        });
        // Create audit log
        await createAuditLog(authData.user.id, 'profile_update', {
          method: 'email'
        });
        // Store user role in localStorage to avoid race conditions
        localStorage.setItem('userRole', 'student');
        // Automatically sign in the user
        const {
          error: signInError
        } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });
        if (signInError) {
          console.error('Auto sign-in error:', signInError);
          // If auto sign-in fails, redirect to login page
          navigate('/');
        } else {
          // Explicitly navigate to dashboard after successful sign-in
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Enhanced error handling with more specific messages
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        setSignupError('This email is already registered. Please try signing in instead.');
      } else if (error.message?.includes('Email rate limit exceeded')) {
        setSignupError('Too many signup attempts. Please wait a moment and try again.');
      } else if (error.message?.includes('Signup not allowed')) {
        setSignupError('New signups are currently disabled. Please contact support.');
      } else if (error.message?.includes('Invalid email')) {
        setSignupError('Please enter a valid email address.');
      } else if (error.message?.includes('Password should be at least')) {
        setSignupError('Password must be at least 6 characters long.');
      } else if (error.message?.includes('password')) {
        setSignupError('Password error: ' + error.message);
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setSignupError('Network error. Please check your connection and try again.');
      } else {
        setSignupError(error.message || 'An error occurred during signup. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setSignupError(null);
    
    try {
      // Get OAuth redirect URL from environment configuration
      const redirectUrl = getOAuthRedirectUrl();
      
      // Debug URL configuration if enabled
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_OAUTH_DEBUG) {
        debugUrlConfig();
        console.log('🔐 SignupForm OAuth Redirect URL:', redirectUrl);
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
      console.error('Google sign-up error:', error);
      
      // Handle specific Google OAuth errors
      if (error.message?.includes('popup_closed_by_user')) {
        setSignupError('Sign-up was cancelled. Please try again.');
      } else if (error.message?.includes('access_denied')) {
        setSignupError('Access denied. Please grant permissions to continue.');
      } else if (error.message?.includes('network')) {
        setSignupError('Network error. Please check your connection and try again.');
      } else if (error.message?.includes('configuration')) {
        setSignupError('Google authentication is not properly configured. Please contact support.');
      } else {
        setSignupError('Unable to sign up with Google. Please try again or use email/password.');
      }
      
      setIsGoogleLoading(false);
    }
  };

  const toggleRSLModal = () => {
    setShowRSLModal(!showRSLModal);
  };
  return <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <img src="/SCHOLARDORM_LOGO.png" alt="ScholarDorm Logo" className="h-16 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Create an Account</h1>
        <p className="text-gray-600">
          Join ScholarDorm and start your learning journey
        </p>
      </div>
      <div>
        {signupError && <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-start" role="alert">
            <AlertCircleIcon size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{signupError}</span>
          </div>}

        {/* Google Sign Up Button */}
        <button
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md focus:ring-4 focus:ring-blue-100 transition-all duration-200 font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed group mb-6"
        >
          {isGoogleLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
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
            {isGoogleLoading ? 'Creating account...' : 'Continue with Google'}
          </span>
        </button>

        {/* Divider */}
        <div className="mb-6 flex items-center">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-sm text-gray-500 bg-white font-medium">or</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input label="Full Name" type="text" icon={<UserIcon size={20} />} placeholder="Enter your full name" error={errors.fullName?.message} {...register('fullName', {
          required: 'Full name is required',
          minLength: {
            value: 2,
            message: 'Name must be at least 2 characters'
          }
        })} onChange={e => handleInputChange(e, 'fullName')} aria-required="true" disabled={isLoading || isGoogleLoading} />
          <Input label="Email" type="email" icon={<AtSignIcon size={20} />} placeholder="your.email@example.com" error={errors.email?.message} {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address'
          }
        })} onChange={e => handleInputChange(e, 'email')} aria-required="true" disabled={isLoading || isGoogleLoading} />
          <Input label="Password" type="password" icon={<LockIcon size={20} />} placeholder="Create a password" showPasswordToggle error={errors.password?.message} {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters'
          }
        })} onChange={e => handleInputChange(e, 'password')} aria-required="true" disabled={isLoading || isGoogleLoading} />
          <Input label="Confirm Password" type="password" icon={<LockIcon size={20} />} placeholder="Confirm your password" showPasswordToggle error={errors.confirmPassword?.message} {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: value => value === password || 'Passwords do not match'
        })} onChange={e => handleInputChange(e, 'confirmPassword')} aria-required="true" disabled={isLoading || isGoogleLoading} />
          <div className="flex items-center mt-4 mb-6">
            <input id="terms" name="terms" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" required />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </Link>
            </label>
          </div>
          <Button type="submit" fullWidth isLoading={isLoading} disabled={isLoading || isGoogleLoading}>
            Create Account
          </Button>
          <div className="mt-4">
            <Button type="button" variant="outline" fullWidth icon={<VideoIcon size={20} />} onClick={toggleRSLModal} className="mb-4" disabled={isLoading || isGoogleLoading}>
              {showRSLModal ? 'Hide RSL Instructions' : 'Show RSL Instructions'}
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
      {/* RSL Modal */}
      <RSLModal isOpen={showRSLModal} onClose={toggleRSLModal} userId={userId ?? undefined} />
    </div>;
};