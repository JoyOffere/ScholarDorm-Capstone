import * as React from 'react';
const { useState } = React;
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
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
import { AdminTeacherAssignments } from './components/dashboard/admin/TeacherAssignments';
import { AnnouncementForm } from './components/dashboard/admin/AnnouncementForm';
import { AdminGames } from './components/dashboard/admin/Games';
import { AdminPosts } from './components/dashboard/admin/Posts';
import { AdminContent } from './components/dashboard/admin/Content';
import { AdminAnalytics } from './components/dashboard/admin/Analytics';
import { RSLManagement } from './components/dashboard/admin/RSLManagement';
import { 
  TeacherDashboard,
  TeacherStudents,
  TeacherCourses,
  TeacherQuizzes,
  TeacherContent,
  TeacherRSLContent,
  TeacherProfile,
  TeacherSettings,
  TeacherProgress
} from './components/dashboard/teacher';
import { TeacherCourseAnalytics } from './components/dashboard/teacher/CourseAnalytics';
import { TeacherQuizCreate } from './components/dashboard/teacher/QuizCreate';
import { TeacherContentCreate } from './components/dashboard/teacher/ContentCreate';
import { TeacherQuizReview } from './components/dashboard/teacher/QuizReview';
import { TeacherCourseCreate } from './components/dashboard/teacher/CourseCreate';
import { TeacherRSLContentCreate } from './components/dashboard/teacher/RSLContentCreate';
import { TeacherMessages } from './components/dashboard/teacher/Messages';
import { TeacherNotifications } from './components/dashboard/teacher/Notifications';
import { TeacherActivity } from './components/dashboard/teacher/Activity';
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

  // Debug: Log auth state changes (only in development and when loading state changes)
  if (import.meta.env.DEV && loading) {
    console.log('AppContent: Auth state - user:', user?.id, 'role:', user?.role, 'session:', !!session, 'loading:', loading);
  }
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
    if (!session) {
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
    requiredRole: 'student' | 'admin' | 'teacher'
  }) => {
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
      const redirectPath = user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/dashboard';
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
              <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/dashboard'} replace />
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
              <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/dashboard'} replace />
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
              <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/dashboard'} replace />
            ) : (
              <SignupPage />
            )
          }
        />

        {/* Password reset routes */}
        <Route
          path="/forgot-password"
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading...</p>
                </div>
              </div>
            ) : session && user?.role ? (
              <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/dashboard'} replace />
            ) : (
              <ForgotPasswordPage />
            )
          }
        />
        <Route
          path="/reset-password"
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading...</p>
                </div>
              </div>
            ) : (
              <ResetPasswordPage />
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
          path="/admin/teacher-assignments" 
          element={
            <RequireRole requiredRole="admin">
              <AdminTeacherAssignments />
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

        {/* Teacher routes */}
        <Route 
          path="/teacher" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherDashboard />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/students" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherStudents />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/courses" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherCourses />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/courses/create" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherCourseCreate />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/quizzes" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherQuizzes />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/quizzes/create" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherQuizCreate />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/quizzes/review" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherQuizReview />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/content/create" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherContentCreate />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/activity" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherActivity />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/content" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherContent />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/rsl-content" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherRSLContent />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/rsl-content/create" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherRSLContentCreate />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/progress" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherProgress />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/messages" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherMessages />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/announcements" 
          element={
            <RequireRole requiredRole="teacher">
              <AdminAnnouncements />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/notifications" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherNotifications />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/profile" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherProfile />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/settings" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherSettings />
            </RequireRole>
          } 
        />
        <Route 
          path="/teacher/courses/:courseId/analytics" 
          element={
            <RequireRole requiredRole="teacher">
              <TeacherCourseAnalytics />
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