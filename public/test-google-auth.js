// Test Google Authentication Configuration
// Run this in the browser console to verify OAuth setup

console.log('🔍 Testing Google Auth Configuration...');

// Check environment variables
const config = {
  siteUrl: import.meta.env.VITE_SITE_URL || 'Not set',
  productionUrl: import.meta.env.VITE_PRODUCTION_URL || 'Not set',
  oauthRedirect: import.meta.env.VITE_OAUTH_REDIRECT_URL || 'Not set',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'Not set',
  enableOAuthDebug: import.meta.env.VITE_ENABLE_OAUTH_DEBUG || 'Not set',
  enableUrlDebug: import.meta.env.VITE_ENABLE_URL_DEBUG || 'Not set'
};

console.table(config);

// Test URL generation
const getOAuthRedirectUrl = () => {
  const env = import.meta.env.PROD ? 'production' : 'development';
  const siteUrl = env === 'production' 
    ? (import.meta.env.VITE_PRODUCTION_URL || 'https://scholardorm-lms.vercel.app')
    : (import.meta.env.VITE_SITE_URL || 'http://localhost:5173');
  const redirectPath = import.meta.env.VITE_OAUTH_REDIRECT_URL || '/auth/callback';
  return `${siteUrl}${redirectPath}`;
};

const oauthUrl = getOAuthRedirectUrl();
console.log('🔗 Generated OAuth Redirect URL:', oauthUrl);

// Test button presence
const checkGoogleButton = () => {
  const buttons = document.querySelectorAll('button');
  const googleButtons = Array.from(buttons).filter(btn => 
    btn.textContent?.includes('Continue with Google') || 
    btn.textContent?.includes('Google')
  );
  
  console.log('🔘 Google buttons found:', googleButtons.length);
  googleButtons.forEach((btn, index) => {
    console.log(`Button ${index + 1}:`, btn.textContent?.trim());
  });
  
  return googleButtons.length > 0;
};

// Run checks
setTimeout(() => {
  const hasGoogleButtons = checkGoogleButton();
  
  if (!hasGoogleButtons) {
    console.warn('⚠️ No Google buttons found! Check if:');
    console.warn('1. You are on the login or signup page');
    console.warn('2. The components are properly rendered');
    console.warn('3. There are no JavaScript errors');
  } else {
    console.log('✅ Google authentication buttons are present!');
  }
}, 1000);

// Export for manual testing
window.testGoogleAuth = {
  config,
  oauthUrl,
  checkGoogleButton
};