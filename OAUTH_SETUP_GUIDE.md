# OAuth Configuration Guide
## Google Cloud Console & Supabase Auth Settings

---

## 🔧 **Step 1: Google Cloud Console Configuration**

### 1.1 Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**

### 1.2 Configure OAuth 2.0 Client
1. Click on your OAuth 2.0 Client ID (or create one if it doesn't exist)
2. In the **Authorized redirect URIs** section, add these URLs:

```
Development URL:
http://localhost:5173/auth/callback

Production URL:
https://scholardorm.vercel.app/auth/callback

Supabase URL (Primary):
https://ubupmqvovtyvhqimettl.supabase.co/auth/v1/callback
```

### 1.3 Additional Authorized Origins (if needed)
Add these to **Authorized JavaScript origins**:
```
http://localhost:5173
https://scholardorm.vercel.app
https://ubupmqvovtyvhqimettl.supabase.co
```

### 1.4 Save Configuration
- Click **Save** to apply changes
- Note down your **Client ID** and **Client Secret**

---

## 🗄️ **Step 2: Supabase Auth Configuration**

### 2.1 Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **ubupmqvovtyvhqimettl**
3. Navigate to **Authentication** > **Providers**

### 2.2 Configure Google Provider
1. Find **Google** in the provider list
2. Toggle **Enable sign in with Google** to ON
3. Add your Google OAuth credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)

### 2.3 Configure Redirect URLs
In the **Site URL** and **Redirect URLs** section:

**Site URL:**
```
https://scholardorm.vercel.app
```

**Redirect URLs (add all of these):**
```
http://localhost:5173/auth/callback
https://scholardorm.vercel.app/auth/callback
http://localhost:5173/**
https://scholardorm.vercel.app/**
```

### 2.4 Additional Settings
- **Allow multiple redirect URLs**: Enable
- **Disable sign-ups**: Keep disabled (allow sign-ups)
- **Email confirmation**: Configure as needed

---

## 🔐 **Step 3: Environment Variables Update**

Ensure your `.env` file has the correct URLs:

```env
# Site URLs
VITE_SITE_URL=http://localhost:5173
VITE_PRODUCTION_URL=https://scholardorm.vercel.app

# OAuth Configuration
VITE_OAUTH_REDIRECT_URL=/auth/callback
```

---

## ✅ **Step 4: Testing the Configuration**

### 4.1 Development Testing
1. Start your development server: `npm run dev`
2. Go to `http://localhost:5173`
3. Click "Continue with Google"
4. Verify redirect to: `http://localhost:5173/auth/callback`

### 4.2 Production Testing
1. Deploy to Vercel
2. Go to `https://scholardorm.vercel.app`
3. Click "Continue with Google"
4. Verify redirect to: `https://scholardorm.vercel.app/auth/callback`

---

## 🐛 **Troubleshooting**

### Common Issues:

#### **Error: redirect_uri_mismatch**
- Check that callback URLs exactly match in both Google Cloud Console and your app
- Ensure no trailing slashes or extra characters

#### **Error: unauthorized_client**
- Verify Client ID and Client Secret are correct
- Check that the OAuth client is enabled

#### **Error: access_denied**
- User cancelled OAuth flow (normal behavior)
- Check OAuth scopes are properly configured

#### **Callback URL Not Working**
- Verify `/auth/callback` route exists in your app
- Check AuthCallback component is properly imported
- Ensure environment variables are loaded correctly

---

## 📋 **Configuration Checklist**

### Google Cloud Console:
- [ ] OAuth 2.0 Client ID created
- [ ] Development callback URL added: `http://localhost:5173/auth/callback`
- [ ] Production callback URL added: `https://scholardorm.vercel.app/auth/callback`
- [ ] Supabase callback URL added: `https://ubupmqvovtyvhqimettl.supabase.co/auth/v1/callback`
- [ ] Authorized origins configured
- [ ] Client ID and Secret noted

### Supabase:
- [ ] Google provider enabled
- [ ] Client ID configured
- [ ] Client Secret configured
- [ ] Site URL set to production URL
- [ ] All redirect URLs added
- [ ] Multiple redirect URLs enabled

### Application:
- [ ] Environment variables configured
- [ ] AuthCallback route exists at `/auth/callback`
- [ ] OAuth debug logging enabled for testing
- [ ] Error handling implemented

---

## 🔗 **Quick Reference URLs**

**Your Project URLs:**
- Development: `http://localhost:5173`
- Production: `https://scholardorm.vercel.app`
- Supabase: `https://ubupmqvovtyvhqimettl.supabase.co`

**OAuth Callback URLs:**
- Dev Callback: `http://localhost:5173/auth/callback`
- Prod Callback: `https://scholardorm.vercel.app/auth/callback`
- Supabase Callback: `https://ubupmqvovtyvhqimettl.supabase.co/auth/v1/callback`

---

## 📞 **Support**

If you encounter issues:
1. Check browser developer console for errors
2. Review OAuth debug logs (enabled in your app)
3. Verify URLs match exactly between Google Cloud Console and Supabase
4. Test with different browsers or incognito mode