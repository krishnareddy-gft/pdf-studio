# 🔐 Firebase Authentication Setup Guide

## 📋 Prerequisites
- Google account
- Firebase project

## 🚀 Step-by-Step Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "pdf-helpdesk")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication
1. In Firebase Console, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable these providers:
   - **Email/Password**: Enable
   - **Google**: Enable (recommended)

### 3. Get Configuration
1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register app with nickname (e.g., "pdf-helpdesk-web")
6. Copy the config object

### 4. Update Firebase Config
Replace the placeholder values in `src/lib/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
}
```

### 5. Test Authentication
1. Run `npm run dev`
2. Click "Sign In" or "Get Started" in the top navigation
3. Try creating an account or signing in with Google

## 🔧 Configuration Options

### Google Sign-In Setup
1. In Firebase Console > Authentication > Sign-in method
2. Click on Google provider
3. Add your authorized domain
4. Configure OAuth consent screen if needed

### Email Templates
1. Go to Authentication > Templates
2. Customize verification and password reset emails
3. Update sender information

## 🚨 Security Rules
Firebase automatically handles authentication security. No additional rules needed for basic auth.

## 📱 Mobile Support
The authentication system works on both desktop and mobile devices.

## 🆘 Troubleshooting

### Common Issues:
- **"Firebase: Error (auth/invalid-api-key)"**: Check your API key in firebase.js
- **"Firebase: Error (auth/unauthorized-domain)"**: Add your domain to authorized domains in Firebase Console
- **Google sign-in not working**: Check OAuth consent screen configuration

### Need Help?
- Check [Firebase Documentation](https://firebase.google.com/docs/auth)
- Review browser console for error messages
- Ensure all environment variables are set correctly

## ✨ Features Included
- ✅ Email/Password authentication
- ✅ Google OAuth sign-in
- ✅ User registration
- ✅ Secure login/logout
- ✅ User profile management
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states
