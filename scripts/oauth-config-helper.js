#!/usr/bin/env node

/**
 * OAuth Configuration Helper
 * Run this script to get the exact URLs needed for Google Cloud Console and Supabase
 */

console.log('🔧 OAuth Configuration URLs for ScholarDorm');
console.log('='.repeat(50));

console.log('\n📱 **GOOGLE CLOUD CONSOLE CONFIGURATION**');
console.log('Navigate to: https://console.cloud.google.com/');
console.log('Go to: APIs & Services > Credentials > OAuth 2.0 Client IDs');
console.log('\nAdd these to "Authorized redirect URIs":');
console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│ http://localhost:5173/auth/callback                        │');
console.log('│ https://scholardorm.vercel.app/auth/callback               │');
console.log('│ https://ubupmqvovtyvhqimettl.supabase.co/auth/v1/callback  │');
console.log('└─────────────────────────────────────────────────────────────┘');

console.log('\nAdd these to "Authorized JavaScript origins":');
console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│ http://localhost:5173                                      │');
console.log('│ https://scholardorm.vercel.app                             │');
console.log('│ https://ubupmqvovtyvhqimettl.supabase.co                   │');
console.log('└─────────────────────────────────────────────────────────────┘');

console.log('\n🗄️ **SUPABASE CONFIGURATION**');
console.log('Navigate to: https://supabase.com/dashboard');
console.log('Go to: Authentication > Providers > Google');
console.log('\nSite URL:');
console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│ https://scholardorm.vercel.app                             │');
console.log('└─────────────────────────────────────────────────────────────┘');

console.log('\nRedirect URLs (add all of these):');
console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│ http://localhost:5173/auth/callback                        │');
console.log('│ https://scholardorm.vercel.app/auth/callback               │');
console.log('│ http://localhost:5173/**                                   │');
console.log('│ https://scholardorm.vercel.app/**                          │');
console.log('└─────────────────────────────────────────────────────────────┘');

console.log('\n⚙️ **ENVIRONMENT VARIABLES**');
console.log('Your .env file should contain:');
console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│ VITE_SITE_URL=http://localhost:5173                       │');
console.log('│ VITE_PRODUCTION_URL=https://scholardorm.vercel.app         │');
console.log('│ VITE_OAUTH_REDIRECT_URL=/auth/callback                     │');
console.log('│ VITE_LOGIN_REDIRECT_URL=/dashboard                         │');
console.log('│ VITE_ADMIN_REDIRECT_URL=/admin                             │');
console.log('└─────────────────────────────────────────────────────────────┘');

console.log('\n🧪 **TESTING URLS**');
console.log('Development: http://localhost:5173');
console.log('Production:  https://scholardorm.vercel.app');
console.log('Callback:    [site-url]/auth/callback');

console.log('\n✅ **VERIFICATION CHECKLIST**');
console.log('□ Google Cloud Console OAuth client configured');
console.log('□ All redirect URIs added to Google Cloud Console');
console.log('□ Supabase Google provider enabled');
console.log('□ Client ID and Secret added to Supabase');
console.log('□ All redirect URLs added to Supabase');
console.log('□ Environment variables updated');
console.log('□ Application deployed and tested');

console.log('\n🚀 Ready to test OAuth authentication!');
console.log('='.repeat(50));