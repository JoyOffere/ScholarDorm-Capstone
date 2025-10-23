#!/usr/bin/env node

/**
 * OAuth Configuration Verification Script
 * This script checks your current environment and displays what URLs will be used
 */

// Simulate environment variables (you would normally load these from .env)
const config = {
  VITE_SITE_URL: 'http://localhost:5173',
  VITE_PRODUCTION_URL: 'https://scholardorm.vercel.app',
  VITE_OAUTH_REDIRECT_URL: '/auth/callback',
  VITE_LOGIN_REDIRECT_URL: '/dashboard',
  VITE_ADMIN_REDIRECT_URL: '/admin',
  VITE_SUPABASE_URL: 'https://ubupmqvovtyvhqimettl.supabase.co'
};

console.log('🔍 Current OAuth Configuration Verification');
console.log('='.repeat(60));

console.log('\n📋 **CURRENT ENVIRONMENT VARIABLES**');
Object.entries(config).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

console.log('\n🌐 **GENERATED URLS**');
console.log('\nDevelopment Environment:');
console.log(`  Site URL: ${config.VITE_SITE_URL}`);
console.log(`  OAuth Redirect: ${config.VITE_SITE_URL}${config.VITE_OAUTH_REDIRECT_URL}`);
console.log(`  Dashboard: ${config.VITE_SITE_URL}${config.VITE_LOGIN_REDIRECT_URL}`);
console.log(`  Admin: ${config.VITE_SITE_URL}${config.VITE_ADMIN_REDIRECT_URL}`);

console.log('\nProduction Environment:');
console.log(`  Site URL: ${config.VITE_PRODUCTION_URL}`);
console.log(`  OAuth Redirect: ${config.VITE_PRODUCTION_URL}${config.VITE_OAUTH_REDIRECT_URL}`);
console.log(`  Dashboard: ${config.VITE_PRODUCTION_URL}${config.VITE_LOGIN_REDIRECT_URL}`);
console.log(`  Admin: ${config.VITE_PRODUCTION_URL}${config.VITE_ADMIN_REDIRECT_URL}`);

console.log('\nSupabase:');
console.log(`  Supabase URL: ${config.VITE_SUPABASE_URL}`);
console.log(`  Supabase Callback: ${config.VITE_SUPABASE_URL}/auth/v1/callback`);

console.log('\n✅ **WHAT TO COPY TO GOOGLE CLOUD CONSOLE**');
console.log('Authorized redirect URIs:');
console.log(`${config.VITE_SITE_URL}${config.VITE_OAUTH_REDIRECT_URL}`);
console.log(`${config.VITE_PRODUCTION_URL}${config.VITE_OAUTH_REDIRECT_URL}`);
console.log(`${config.VITE_SUPABASE_URL}/auth/v1/callback`);

console.log('\nAuthorized JavaScript origins:');
console.log(`${config.VITE_SITE_URL}`);
console.log(`${config.VITE_PRODUCTION_URL}`);
console.log(`${config.VITE_SUPABASE_URL}`);

console.log('\n✅ **WHAT TO COPY TO SUPABASE**');
console.log('Site URL:');
console.log(`${config.VITE_PRODUCTION_URL}`);

console.log('\nRedirect URLs:');
console.log(`${config.VITE_SITE_URL}${config.VITE_OAUTH_REDIRECT_URL}`);
console.log(`${config.VITE_PRODUCTION_URL}${config.VITE_OAUTH_REDIRECT_URL}`);
console.log(`${config.VITE_SITE_URL}/**`);
console.log(`${config.VITE_PRODUCTION_URL}/**`);

console.log('\n🧪 **TESTING STEPS**');
console.log('1. Start development server: npm run dev');
console.log('2. Navigate to: http://localhost:5173');
console.log('3. Click "Continue with Google"');
console.log('4. Should redirect to: http://localhost:5173/auth/callback');
console.log('5. After processing, should redirect to: http://localhost:5173/dashboard');

console.log('\n🚀 **PRODUCTION TESTING**');
console.log('1. Deploy to Vercel');
console.log('2. Navigate to: https://scholardorm.vercel.app');
console.log('3. Click "Continue with Google"');
console.log('4. Should redirect to: https://scholardorm.vercel.app/auth/callback');
console.log('5. After processing, should redirect to: https://scholardorm.vercel.app/dashboard');

console.log('\n' + '='.repeat(60));
console.log('📝 Copy the URLs above to your Google Cloud Console and Supabase settings');
console.log('='.repeat(60));