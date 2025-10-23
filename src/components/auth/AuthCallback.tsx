import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { createAuditLog } from '../../lib/supabase-utils';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardUrl, getLoginUrl, debugUrlConfig } from '../../lib/url-config';
import { Loader2Icon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

type CallbackStatus = 'loading' | 'success' | 'error';

interface CallbackState {
  status: CallbackStatus;
  message: string;
  redirectPath?: string;
}

export const AuthCallback: React.FC = () => {
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: 'Processing authentication...'
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    // Check if this is actually an OAuth callback before proceeding
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.has('code') || urlParams.has('access_token') || urlParams.has('error');
    const oauthFlowStarted = sessionStorage.getItem('oauth_flow_started') === 'true';
    
    if (!hasOAuthParams && !window.location.hash.includes('access_token') && !oauthFlowStarted) {
      // Not an OAuth callback, redirect to login
      console.log('AuthCallback: No OAuth parameters or flow flag found, redirecting to login');
      setState({
        status: 'error',
        message: 'Invalid authentication callback. Redirecting to login...'
      });
      
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 500); // Even faster redirect for invalid callbacks
      
      return;
    }
    
    // Clear the OAuth flow flag since we're now processing it
    if (oauthFlowStarted) {
      sessionStorage.removeItem('oauth_flow_started');
      sessionStorage.removeItem('oauth_provider');
    }
    
    handleAuthCallback();
  }, [navigate]);

  const handleAuthCallback = async () => {
    try {
      setState({
        status: 'loading',
        message: 'Verifying authentication...'
      });

      // Use AuthContext to handle OAuth callback (this already handles session setup)
      await handleOAuthCallback();

      // Get current session data - should be available immediately after handleOAuthCallback
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        throw new Error('Unable to retrieve user information after OAuth.');
      }

      // Quick check if user exists and get their role
      const { data: existingUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      // If user doesn't exist, create profile in background - don't wait
      if (!existingUser) {
        // Create user profile in background (don't await)
        const fullName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'User';

        // Fire and forget - create all user data in background
        Promise.all([
          // Create user profile
          supabase.from('users').upsert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            role: 'student',
            status: 'active',
            avatar_url: user.user_metadata?.avatar_url || 
                       user.user_metadata?.picture || 
                       `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D8ABC&color=fff`,
            streak_count: 0,
            longest_streak: 0,
            email_verified: true,
            accessibility_preferences: {
              high_contrast: false,
              large_text: false,
              show_rsl: true
            }
          }),

          // Create user auth record
          supabase.from('user_auth').upsert({
            user_id: user.id,
            auth_provider: 'google',
            last_sign_in: new Date().toISOString()
          }),

          // Create user settings
          supabase.from('user_settings').upsert({
            user_id: user.id,
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
          }),

          // Create audit log
          createAuditLog(user.id, 'profile_update', {
            method: 'google_oauth',
            source: 'auth_callback'
          })
        ]).catch(error => {
          console.error('Background user setup error:', error);
          // Don't throw - user can still continue
        });

      } else {
        // For existing users, just update last sign-in in background
        Promise.all([
          supabase.from('user_auth').upsert({
            user_id: user.id,
            auth_provider: 'google',
            last_sign_in: new Date().toISOString()
          }, {
            onConflict: 'user_id,auth_provider'
          }),
          createAuditLog(user.id, 'login', {
            method: 'google_oauth',
            source: 'auth_callback'
          })
        ]).catch(error => {
          console.error('Background login tracking error:', error);
          // Don't throw - user can still continue
        });
      }

      // Determine redirect path based on user role
      const userRole = existingUser?.role || 'student';
      const redirectPath = userRole === 'admin' ? '/admin' : '/dashboard';
      
      // Store user role to avoid race conditions
      localStorage.setItem('userRole', userRole);

      setState({
        status: 'success',
        message: 'Welcome! Redirecting...',
        redirectPath
      });

      // Immediate redirect for better UX
      navigate(redirectPath, { replace: true });

    } catch (error: any) {
      console.error('Auth callback error:', error);
      
      let errorMessage = 'Authentication failed. Please try signing in again.';
      
      // Clear any OAuth flow flags on error
      sessionStorage.removeItem('oauth_flow_started');
      sessionStorage.removeItem('oauth_provider');
      
      // Provide more specific error messages based on the error type
      if (error.message?.includes('Not an OAuth callback')) {
        errorMessage = 'Invalid authentication link. Please try signing in again.';
      } else if (error.message?.includes('OAuth failed')) {
        errorMessage = 'Google authentication was cancelled or failed. Please try again.';
      } else if (error.message?.includes('cancelled or expired')) {
        errorMessage = 'Authentication session expired. Please try signing in again.';
      } else if (error.message?.includes('No OAuth session found')) {
        errorMessage = 'Authentication session not found. Please try signing in again.';
      } else if (error.message?.includes('Invalid request')) {
        errorMessage = 'Invalid authentication request. Please try signing in again.';
      }
      
      setState({
        status: 'error',
        message: errorMessage
      });

      // Redirect to login after delay
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500); // Further reduced delay
    }
  };

  const getStatusIcon = () => {
    switch (state.status) {
      case 'loading':
        return <Loader2Icon size={48} className="text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircleIcon size={48} className="text-green-600" />;
      case 'error':
        return <AlertCircleIcon size={48} className="text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src="/SCHOLARDORM_LOGO.png" 
            alt="ScholarDorm Logo" 
            className="h-16 mx-auto mb-4" 
          />
          <h1 className="text-2xl font-bold text-gray-800">ScholarDorm</h1>
        </div>

        {/* Status Icon */}
        <div className="mb-6 flex justify-center">
          {getStatusIcon()}
        </div>

        {/* Status Message */}
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-2 ${getStatusColor()}`}>
            {state.status === 'loading' && 'Signing you in...'}
            {state.status === 'success' && 'Welcome to ScholarDorm!'}
            {state.status === 'error' && 'Authentication Error'}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {state.message}
          </p>
        </div>

        {/* Additional Info */}
        {state.status === 'loading' && (
          <div className="text-xs text-gray-500">
            This may take a few moments...
          </div>
        )}

        {state.status === 'success' && (
          <div className="text-xs text-gray-500">
            Redirecting to {state.redirectPath === '/admin' ? 'admin panel' : 'dashboard'}...
          </div>
        )}

        {state.status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Back to Login
            </button>
            <div className="text-xs text-gray-500">
              Or try refreshing the page
            </div>
          </div>
        )}
      </div>
    </div>
  );
};