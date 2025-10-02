import React, { useState, Component } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { supabase } from '../../lib/supabase';
import { createAuditLog } from '../../lib/supabase-utils';
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
  const [signupError, setSignupError] = useState<string | null>(null);
  const [showRSLModal, setShowRSLModal] = useState(false);
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
  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setSignupError(null);
    try {
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
        // Create user authentication record
        await supabase.from('user_auth').insert({
          user_id: authData.user.id,
          auth_provider: 'email',
          last_sign_in: new Date().toISOString()
        }).then(({
          error
        }) => {
          if (error) console.error('Auth tracking error:', error);
        });
        // Create user settings
        await supabase.from('user_settings').insert({
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
        await createAuditLog(authData.user.id, 'signup', {
          method: 'email'
        });
        // Store user role in localStorage to avoid race conditions
        localStorage.setItem('userRole', 'student');
        // Automatically sign in the user
        const {
          data: signInData,
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
      if (error.message.includes('already registered')) {
        setSignupError('This email is already registered. Please try logging in instead.');
      } else if (error.message.includes('password')) {
        setSignupError('Password error: ' + error.message);
      } else {
        setSignupError(error.message || 'An error occurred during signup. Please try again.');
      }
    } finally {
      setIsLoading(false);
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
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input label="Full Name" type="text" icon={<UserIcon size={20} />} placeholder="Enter your full name" error={errors.fullName?.message} {...register('fullName', {
          required: 'Full name is required',
          minLength: {
            value: 2,
            message: 'Name must be at least 2 characters'
          }
        })} onChange={e => handleInputChange(e, 'fullName')} aria-required="true" disabled={isLoading} />
          <Input label="Email" type="email" icon={<AtSignIcon size={20} />} placeholder="your.email@example.com" error={errors.email?.message} {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address'
          }
        })} onChange={e => handleInputChange(e, 'email')} aria-required="true" disabled={isLoading} />
          <Input label="Password" type="password" icon={<LockIcon size={20} />} placeholder="Create a password" showPasswordToggle error={errors.password?.message} {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters'
          }
        })} onChange={e => handleInputChange(e, 'password')} aria-required="true" disabled={isLoading} />
          <Input label="Confirm Password" type="password" icon={<LockIcon size={20} />} placeholder="Confirm your password" showPasswordToggle error={errors.confirmPassword?.message} {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: value => value === password || 'Passwords do not match'
        })} onChange={e => handleInputChange(e, 'confirmPassword')} aria-required="true" disabled={isLoading} />
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
          <Button type="submit" fullWidth isLoading={isLoading} disabled={isLoading}>
            Create Account
          </Button>
          <div className="mt-4">
            <Button type="button" variant="outline" fullWidth icon={<VideoIcon size={20} />} onClick={toggleRSLModal} className="mb-4" disabled={isLoading}>
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
      <RSLModal isOpen={showRSLModal} onClose={toggleRSLModal} />
    </div>;
};