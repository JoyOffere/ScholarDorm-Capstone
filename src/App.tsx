import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { StudentDashboard } from './components/dashboard/student/Dashboard';
import { StudentCourses } from './components/dashboard/student/Courses';
import { StudentMyLearning } from './components/dashboard/student/MyLearning';
import { StudentProfile } from './components/dashboard/student/Profile';
import { StudentSettings } from './components/dashboard/student/Settings';
import { StudentNotifications } from './components/dashboard/student/Notifications';
import { StudentAchievements } from './components/dashboard/student/Achievements';
import { StudentQuizzes } from './components/dashboard/student/Quizzes';
import { QuizAttempt } from './components/dashboard/student/QuizAttempt';
import { StudentGames } from './components/dashboard/student/Games';
import { StudentAnnouncements } from './components/dashboard/student/Announcements';
import { Leaderboard } from './components/dashboard/student/Leaderboard';
import { AdminDashboard } from './components/dashboard/admin/Dashboard';
import { AdminUsers } from './components/dashboard/admin/Users';
import { AdminAuditLog } from './components/dashboard/admin/AuditLog';
import { AdminCourses } from './components/dashboard/admin/Courses';
import { AdminLessons } from './components/dashboard/admin/AdminLessons';
import { RwandaMathCourses } from './components/dashboard/admin/RwandaMathCourses';
import { AdminQuizManagement } from './components/dashboard/admin/QuizManagement';
import { AdminSettings } from './components/dashboard/admin/Settings';
import { AdminProfile } from './components/dashboard/admin/Profile';
import { AdminNotifications } from './components/dashboard/admin/Notifications';
import { AdminAnnouncements } from './components/dashboard/admin/Announcements';
import { AnnouncementForm } from './components/dashboard/admin/AnnouncementForm';
import { AdminGames } from './components/dashboard/admin/Games';
import { AdminPosts } from './components/dashboard/admin/Posts';
import { AdminContent } from './components/dashboard/admin/Content';
import { AdminAnalytics } from './components/dashboard/admin/Analytics';
import { RSLManagement } from './components/dashboard/admin/RSLManagement';
import { TermsOfService } from './components/legal/TermsOfService';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { RSLPage } from './components/accessibility/RSLPage';
import { Chatbot } from './components/common/Chatbot';
import { Footer } from './components/layout/Footer';
import { Toast } from './components/common/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { validateEnvironmentUrls, debugUrlConfig } from './lib/url-config';
import { Landing } from '../landingPage/landing';
import { FeaturesPage } from '../landingPage/components/FeaturesPage';
import { DocumentationPage } from '../landingPage/components/DocumentationPage';
import { APIPage } from '../landingPage/components/APIPage';
import { SupportPage } from '../landingPage/components/SupportPage';
import { CommunityPage } from '../landingPage/components/CommunityPage';
import { BlogPage } from '../landingPage/components/BlogPage';
import { AboutUsPage } from '../landingPage/components/AboutUsPage';
import { CareersPage } from '../landingPage/components/CareersPage';
import { ContactPage } from '../landingPage/components/ContactPage';
import { SessionDebugPage } from './components/debug/SessionDebugPage';

// Main App Content Component that uses AuthContext
const AppContent: React.FC = () => {
  const { user, session, loading } = useAuth();

  // Debug: Log auth state changes
  console.log('AppContent: Auth state - user:', user?.id, 'role:', user?.role, 'session:', !!session, 'loading:', loading);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
    duration: number;
  }>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({
      visible: true,
      message,
      type,
      duration: 5000
    });
  };

  // Auth Guard component to protect routes
  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    console.log('RequireAuth: session exists?', !!session, 'user exists?', !!user);
    if (!session) {
      console.log('RequireAuth: No session, redirecting to /');
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  // Role Guard component to protect role-specific routes
  const RequireRole = ({
    children,
    requiredRole
  }: {
    children: React.ReactNode;
    requiredRole: 'student' | 'admin'
  }) => {
    console.log('RequireRole: session?', !!session, 'user?', !!user, 'user.role?', user?.role, 'requiredRole:', requiredRole, 'loading?', loading);

    // Don't redirect while loading - show loading spinner
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Authenticating...</p>
          </div>
        </div>
      );
    }

    // If not signed in, redirect to public root
    if (!session || !user) {
      console.log('RequireRole: No session or user, redirecting to /');
      return <Navigate to="/" replace />;
    }

    // If role doesn't match, redirect to their dashboard
    if (user.role && user.role !== requiredRole) {
      const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
      console.log(`Role mismatch: user is ${user.role}, required ${requiredRole}, redirecting to ${redirectPath}`);
      return <Navigate to={redirectPath} replace />;
    }

    return <>{children}</>;
  };

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        duration={toast.duration} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
      
      {/* Chatbot component - available on all pages */}
      <Chatbot />
      
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading your session...</p>
                </div>
              </div>
            ) : session && user?.role ? (
              (() => {
                console.log('Root route: Redirecting authenticated user to dashboard, role:', user.role);
                return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
              })()
            ) : (
              <Landing />
            )
          }
        />
        <Route
          path="/login"
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Checking authentication...</p>
                </div>
              </div>
            ) : session && user?.role ? (
              (() => {
                console.log('Login route: User already authenticated, redirecting to dashboard, role:', user.role);
                return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
              })()
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/signup"
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Checking authentication...</p>
                </div>
              </div>
            ) : session && user?.role ? (
              (() => {
                console.log('Signup route: User already authenticated, redirecting to dashboard, role:', user.role);
                return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
              })()
            ) : (
              <SignupPage />
            )
          }
        />

        {/* Auth Callback route */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Landing page routes */}
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/api" element={<APIPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Legal pages */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Accessibility pages */}
        <Route path="/rsl" element={<RSLPage />} />

        {/* Student routes */}
        <Route 
          path="/dashboard" 
          element={
            <RequireRole requiredRole="student">
              <StudentDashboard />
            </RequireRole>
          } 
        />
        <Route 
          path="/courses" 
          element={
            <RequireRole requiredRole="student">
              <StudentCourses />
            </RequireRole>
          } 
        />
        <Route 
          path="/learning" 
          element={
            <RequireRole requiredRole="student">
              <StudentMyLearning />
            </RequireRole>
          } 
        />
        <Route 
          path="/quizzes" 
          element={
            <RequireRole requiredRole="student">
              <StudentQuizzes />
            </RequireRole>
          } 
        />
        <Route 
          path="/quiz/:quizId" 
          element={
            <RequireRole requiredRole="student">
              <QuizAttempt />
            </RequireRole>
          } 
        />
        <Route 
          path="/games" 
          element={
            <RequireRole requiredRole="student">
              <StudentGames />
            </RequireRole>
          } 
        />
        <Route 
          path="/leaderboard" 
          element={
            <RequireRole requiredRole="student">
              <Leaderboard />
            </RequireRole>
          } 
        />
        <Route 
          path="/achievements" 
          element={
            <RequireRole requiredRole="student">
              <StudentAchievements />
            </RequireRole>
          } 
        />
        <Route 
          path="/announcements" 
          element={
            <RequireRole requiredRole="student">
              <StudentAnnouncements />
            </RequireRole>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <RequireRole requiredRole="student">
              <StudentProfile />
            </RequireRole>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <RequireRole requiredRole="student">
              <StudentSettings />
            </RequireRole>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <RequireRole requiredRole="student">
              <StudentNotifications />
            </RequireRole>
          } 
        />

        {/* Admin routes */}
        <Route 
          path="/admin" 
          element={
            <RequireRole requiredRole="admin">
              <AdminDashboard />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <RequireRole requiredRole="admin">
              <AdminUsers />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/courses" 
          element={
            <RequireRole requiredRole="admin">
              <AdminCourses />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/courses/:courseId/lessons" 
          element={
            <RequireRole requiredRole="admin">
              <AdminLessons />
            </RequireRole>
          } 
        />
        <Route 
          path="/rwanda-math" 
          element={<RwandaMathCourses />} 
        />
        <Route 
          path="/admin/quizzes" 
          element={
            <RequireRole requiredRole="admin">
              <AdminQuizManagement />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/games" 
          element={
            <RequireRole requiredRole="admin">
              <AdminGames />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/posts" 
          element={
            <RequireRole requiredRole="admin">
              <AdminPosts />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/content" 
          element={
            <RequireRole requiredRole="admin">
              <AdminContent />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/analytics" 
          element={
            <RequireRole requiredRole="admin">
              <AdminAnalytics />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/audit-log" 
          element={
            <RequireRole requiredRole="admin">
              <AdminAuditLog />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <RequireRole requiredRole="admin">
              <AdminSettings />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/profile" 
          element={
            <RequireRole requiredRole="admin">
              <AdminProfile />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/notifications" 
          element={
            <RequireRole requiredRole="admin">
              <AdminNotifications />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/announcements" 
          element={
            <RequireRole requiredRole="admin">
              <AdminAnnouncements />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/announcements/create" 
          element={
            <RequireRole requiredRole="admin">
              <AnnouncementForm mode="create" />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/announcements/:id/edit" 
          element={
            <RequireRole requiredRole="admin">
              <AnnouncementForm mode="edit" />
            </RequireRole>
          } 
        />
        <Route 
          path="/admin/rsl-management" 
          element={
            <RequireRole requiredRole="admin">
              <RSLManagement />
            </RequireRole>
          } 
        />

        {/* Debug route - available to authenticated users in development */}
        <Route 
          path="/debug/session" 
          element={
            <RequireAuth>
              <SessionDebugPage />
            </RequireAuth>
          } 
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <Footer />
    </BrowserRouter>
  );
};

// Main App component with AuthProvider wrapper
export function App() {
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log(`Toast: ${type.toUpperCase()} - ${message}`);
  };

  // Validate environment URLs on app startup
  React.useEffect(() => {
    const validation = validateEnvironmentUrls();
    
    if (!validation.isValid) {
      console.error('❌ Environment URL validation failed:', validation.errors);
      validation.errors.forEach(error => {
        showToast(`Configuration Error: ${error}`, 'error');
      });
    } else {
      console.log('✅ Environment URLs validated successfully');
      
      // Debug URL configuration in development
      if (import.meta.env.DEV) {
        debugUrlConfig();
      }
    }
  }, []);

  return (
    <AuthProvider 
      onInitFallback={() => 
        showToast('Network issue: continuing with limited data. If problems persist, try refreshing.', 'info')
      }
    >
      <AppContent />
    </AuthProvider>
  );
}