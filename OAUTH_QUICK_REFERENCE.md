# 📋 QUICK COPY-PASTE REFERENCE

## 🔧 GOOGLE CLOUD CONSOLE
**Location:** APIs & Services > Credentials > OAuth 2.0 Client IDs

### Authorized redirect URIs (copy all 3):
```
http://localhost:5173/auth/callback
https://scholardorm-lms.vercel.app/auth/callback
https://ubupmqvovtyvhqimettl.supabase.co/auth/v1/callback
```

### Authorized JavaScript origins (copy all 3):
```
http://localhost:5173
https://scholardorm-lms.vercel.app
https://ubupmqvovtyvhqimettl.supabase.co
```

---

## 🗄️ SUPABASE CONFIGURATION
**Location:** Authentication > Providers > Google

### Site URL:
```
https://scholardorm-lms.vercel.app
```

### Redirect URLs (copy all 4):
```
http://localhost:5173/auth/callback
https://scholardorm-lms.vercel.app/auth/callback
http://localhost:5173/**
https://scholardorm-lms.vercel.app/**
```

### Additional Settings:
- ✅ Enable sign in with Google
- ✅ Allow multiple redirect URLs
- Add your Google Client ID and Client Secret

---

## 🚀 TESTING CHECKLIST

### Development Test:
1. ✅ Start server: `npm run dev`
2. ✅ Go to: http://localhost:5173
3. ✅ Click "Continue with Google"
4. ✅ Should redirect to: http://localhost:5173/auth/callback
5. ✅ Should end up at: http://localhost:5173/dashboard

### Production Test:
1. ✅ Deploy to Vercel
2. ✅ Go to: https://scholardorm-lms.vercel.app
3. ✅ Click "Continue with Google"
4. ✅ Should redirect to: https://scholardorm-lms.vercel.app/auth/callback
5. ✅ Should end up at: https://scholardorm-lms.vercel.app/dashboard

---

## ⚠️ COMMON ISSUES

**Error:** `redirect_uri_mismatch`
**Fix:** Make sure URLs match exactly (no trailing slashes)

**Error:** `unauthorized_client`
**Fix:** Check Client ID and Secret are correct

**Error:** `access_denied`
**Fix:** User cancelled (normal) or check OAuth scopes

---

Ready to configure! 🎉