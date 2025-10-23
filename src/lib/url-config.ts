/**
 * Environment-based URL configuration utilities
 */

// Get the current environment
const getEnvironment = (): 'development' | 'production' | 'staging' => {
  if (import.meta.env.PROD) {
    return 'production';
  }
  if (import.meta.env.DEV) {
    return 'development';
  }
  return 'staging';
};

// Get the base site URL based on environment
export const getSiteUrl = (): string => {
  const env = getEnvironment();
  
  switch (env) {
    case 'production':
      return import.meta.env.VITE_PRODUCTION_URL || 'https://scholardorm.vercel.app';
    case 'development':
      return import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
    case 'staging':
      return import.meta.env.VITE_STAGING_URL || import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
    default:
      return 'http://localhost:5173';
  }
};

// Get the OAuth redirect URL
export const getOAuthRedirectUrl = (): string => {
  const siteUrl = getSiteUrl();
  const redirectPath = import.meta.env.VITE_OAUTH_REDIRECT_URL || '/auth/callback';
  return `${siteUrl}${redirectPath}`;
};

// Get dashboard redirect URL
export const getDashboardUrl = (userRole?: 'student' | 'admin'): string => {
  const siteUrl = getSiteUrl();
  
  if (userRole === 'admin') {
    const adminPath = import.meta.env.VITE_ADMIN_REDIRECT_URL || '/admin';
    return `${siteUrl}${adminPath}`;
  }
  
  const dashboardPath = import.meta.env.VITE_LOGIN_REDIRECT_URL || '/dashboard';
  return `${siteUrl}${dashboardPath}`;
};

// Get login URL
export const getLoginUrl = (): string => {
  const siteUrl = getSiteUrl();
  return `${siteUrl}/login`;
};

// Get current URL information
export const getCurrentUrlInfo = () => {
  return {
    environment: getEnvironment(),
    siteUrl: getSiteUrl(),
    oauthRedirectUrl: getOAuthRedirectUrl(),
    dashboardUrl: getDashboardUrl(),
    adminDashboardUrl: getDashboardUrl('admin'),
    loginUrl: getLoginUrl(),
  };
};

// Debug function to log URL configuration
export const debugUrlConfig = () => {
  // Only debug if enabled in environment
  if (!import.meta.env.VITE_ENABLE_URL_DEBUG && !import.meta.env.DEV) {
    return getCurrentUrlInfo();
  }

  const urlInfo = getCurrentUrlInfo();
  console.group('🔗 URL Configuration');
  console.log('Environment:', urlInfo.environment);
  console.log('Site URL:', urlInfo.siteUrl);
  console.log('OAuth Redirect:', urlInfo.oauthRedirectUrl);
  console.log('Dashboard URL:', urlInfo.dashboardUrl);
  console.log('Admin Dashboard URL:', urlInfo.adminDashboardUrl);
  console.log('Login URL:', urlInfo.loginUrl);
  console.log('---');
  console.log('Environment Variables:');
  console.log('VITE_SITE_URL:', import.meta.env.VITE_SITE_URL);
  console.log('VITE_PRODUCTION_URL:', import.meta.env.VITE_PRODUCTION_URL);
  console.log('VITE_OAUTH_REDIRECT_URL:', import.meta.env.VITE_OAUTH_REDIRECT_URL);
  console.log('Current Origin:', window.location.origin);
  console.groupEnd();
  return urlInfo;
};

// Validate environment variables
export const validateEnvironmentUrls = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!import.meta.env.VITE_SUPABASE_KEY) {
    errors.push('VITE_SUPABASE_KEY is required');
  }
  
  const env = getEnvironment();
  
  if (env === 'production' && !import.meta.env.VITE_PRODUCTION_URL) {
    errors.push('VITE_PRODUCTION_URL is required for production environment');
  }
  
  if (env === 'development' && !import.meta.env.VITE_SITE_URL) {
    console.warn('VITE_SITE_URL not set, using default: http://localhost:5173');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};