import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { supabase } from '../../lib/supabase';
import { createAuditLog } from '../../lib/supabase-utils';
import { AtSignIcon, LockIcon, VideoIcon, AlertCircleIcon } from 'lucide-react';
interface LoginFormData {
  email: string;
  password: string;
}
export const LoginForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showRSLVideo, setShowRSLVideo] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: {
      errors
    },
    clearErrors,
    setValue
  } = useForm<LoginFormData>({
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof LoginFormData) => {
    setValue(field, e.target.value);
    if (e.target.value.trim() !== '') {
      clearErrors(field);
    }
    setLoginError(null);
  };
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const {
        data: authData,
        error
      } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      if (error) throw error;
      // Successful login
      if (authData?.user) {
        // Get user role from database
        const {
          data: userData,
          error: userError
        } = await supabase.from('users').select('role').eq('id', authData.user.id).single();
        if (userError) {
          // If user doesn't exist in users table, create a record
          const {
            error: insertError
          } = await supabase.from('users').insert({
            id: authData.user.id,
            email: data.email,
            full_name: data.email.split('@')[0],
            role: 'student',
            status: 'active',
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.email.split('@')[0])}&background=0D8ABC&color=fff`,
            streak_count: 0,
            longest_streak: 0,
            email_verified: true
          });
          if (insertError) {
            console.error('Error creating user record:', insertError);
          }
          // Store default role in localStorage
          localStorage.setItem('userRole', 'student');
          // Create audit log for login
          await createAuditLog(authData.user.id, 'login', {
            method: 'email',
            role: 'student'
          });
        } else {
          // Store role in localStorage
          localStorage.setItem('userRole', userData.role);
          // Create audit log for login
          await createAuditLog(authData.user.id, 'login', {
            method: 'email',
            role: userData.role
          });
        }
        // Redirect will happen in App.tsx when auth state changes
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const toggleRSLVideo = () => {
    setShowRSLVideo(!showRSLVideo);
  };
  return <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <img src="/SCHOLARDORM_LOGO.png" alt="ScholarDorm Logo" className="h-16 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
        <p className="text-gray-600">
          Sign in to continue your learning journey
        </p>
      </div>

      <div>
        {loginError && <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-start" role="alert">
            <AlertCircleIcon size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{loginError}</span>
          </div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Email" type="email" icon={<AtSignIcon size={20} />} placeholder="your.email@example.com" error={errors.email?.message} {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address'
          }
        })} onChange={e => handleInputChange(e, 'email')} aria-required="true" disabled={isLoading} />
          <Input label="Password" type="password" icon={<LockIcon size={20} />} placeholder="Enter your password" showPasswordToggle error={errors.password?.message} {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters'
          }
        })} onChange={e => handleInputChange(e, 'password')} aria-required="true" disabled={isLoading} />
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" disabled={isLoading} />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Forgot password?
            </a>
          </div>
          <Button type="submit" fullWidth isLoading={isLoading} disabled={isLoading}>
            Log In
          </Button>
          <div className="mt-4">
            <Button type="button" variant="outline" fullWidth icon={<VideoIcon size={20} />} onClick={toggleRSLVideo} className="mb-4" disabled={isLoading}>
              {showRSLVideo ? 'Hide RSL Instructions' : 'Show RSL Instructions'}
            </Button>
            {showRSLVideo && <div className="mt-4 mb-6 border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-700 mb-2">
                  Rwandan Sign Language instructions:
                </p>
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-sm">
                    RSL video would appear here
                  </p>
                </div>
              </div>}
          </div>
        </form>
        <p className="mt-8 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>;
};