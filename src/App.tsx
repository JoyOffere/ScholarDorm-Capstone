import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
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
import { TermsOfService } from './components/legal/TermsOfService';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { RSLPage } from './components/accessibility/RSLPage';
import { Chatbot } from './components/common/Chatbot';
import { Footer } from './components/layout/Footer';
import { supabase } from './lib/supabase';
import { createAuditLog } from './lib/supabase-utils';
import { Session } from '@supabase/supabase-js';
import { Toast } from './components/common/Toast';
export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'student' | 'admin' | null>(null);
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
  useEffect(() => {
    // Check for an existing session
    const initializeAuth = async () => {
      let didSetLoading = false;
      // Timeout promise to prevent indefinite loading
      const timeoutPromise = new Promise<{ data: { session: Session | null } }>((resolve) => {
        setTimeout(() => resolve({ data: { session: null } }), 3000);
      });
      try {
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
        setSession(session);
        if (session) {
          const storedRole = localStorage.getItem('userRole') as 'student' | 'admin' | null;
          if (storedRole) {
            setUserRole(storedRole);
          }
          setLoading(false);
          didSetLoading = true;
          supabase.from('users').select('role').eq('id', session.user.id).single().then(({ data, error }) => {
            if (!error && data) {
              const dbRole = data.role as 'student' | 'admin';
              if (dbRole !== userRole) {
                setUserRole(dbRole);
                localStorage.setItem('userRole', dbRole);
              }
            } else {
              console.error('Error fetching user role:', error);
              if (!storedRole) {
                setUserRole('student');
                localStorage.setItem('userRole', 'student');
              }
            }
          });
        } else {
          setUserRole(null);
          localStorage.removeItem('userRole');
          setLoading(false);
          didSetLoading = true;
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
        didSetLoading = true;
      } finally {
        if (!didSetLoading) {
          setLoading(false);
        }
      }
    };
    initializeAuth();
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log('Auth state changed:', event);
        setSession(session);
        if (!session) {
          setUserRole(null);
          localStorage.removeItem('userRole');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const storedRole = localStorage.getItem('userRole') as 'student' | 'admin' | null;
          if (storedRole) {
            setUserRole(storedRole);
          }
          const { data, error } = await supabase.from('users').select('role').eq('id', session.user.id).single();
          if (!error && data) {
            setUserRole(data.role as 'student' | 'admin');
            localStorage.setItem('userRole', data.role);
            if (event === 'SIGNED_IN') {
              await createAuditLog(session.user.id, 'login', {
                method: 'email',
                role: data.role
              });
              showToast(`Welcome back! You're logged in as ${data.role}`, 'success');
            }
          } else if (error) {
            console.error('Error fetching user role:', error);
            if (storedRole) {
              setUserRole(storedRole);
            } else {
              setUserRole('student');
              localStorage.setItem('userRole', 'student');
            }
          }
        }
      } catch (err) {
        console.error('Error in auth state change handler:', err);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-700"></div>
      </div>;
  }
  // Auth Guard component to protect routes
  const RequireAuth = ({
    children
  }: {
    children: React.ReactNode;
  }) => {
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
    requiredRole: 'student' | 'admin';
  }) => {
    if (!session) {
      return <Navigate to="/" replace />;
    }
    // If userRole is not set yet but we have a session, use the stored role or default to student
    const effectiveRole = userRole || localStorage.getItem('userRole') as 'student' | 'admin' || 'student';
    if (effectiveRole !== requiredRole) {
      return <Navigate to={effectiveRole === 'admin' ? '/admin' : '/dashboard'} replace />;
    }
    return <>{children}</>;
  };
  return <BrowserRouter>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} duration={toast.duration} onClose={() => setToast(prev => ({
      ...prev,
      visible: false
    }))} />
      {/* Chatbot component - available on all pages */}
      <Chatbot />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={session ? <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace /> : <LoginPage />} />
        <Route path="/signup" element={session ? <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace /> : <SignupPage />} />
        {/* Legal pages */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        {/* Accessibility pages */}
        <Route path="/rsl" element={<RSLPage />} />
        {/* Student routes */}
        <Route path="/dashboard" element={<RequireRole requiredRole="student">
              <StudentDashboard />
            </RequireRole>} />
        <Route path="/courses" element={<RequireRole requiredRole="student">
              <StudentCourses />
            </RequireRole>} />
        <Route path="/learning" element={<RequireRole requiredRole="student">
              <StudentMyLearning />
            </RequireRole>} />
        <Route path="/quizzes" element={<RequireRole requiredRole="student">
              <StudentQuizzes />
            </RequireRole>} />
        <Route path="/quiz/:quizId" element={<RequireRole requiredRole="student">
              <QuizAttempt />
            </RequireRole>} />
        <Route path="/games" element={<RequireRole requiredRole="student">
              <StudentGames />
            </RequireRole>} />
        <Route path="/leaderboard" element={<RequireRole requiredRole="student">
              <Leaderboard />
            </RequireRole>} />
        <Route path="/achievements" element={<RequireRole requiredRole="student">
              <StudentAchievements />
            </RequireRole>} />
        <Route path="/announcements" element={<RequireRole requiredRole="student">
              <StudentAnnouncements />
            </RequireRole>} />
        <Route path="/profile" element={<RequireRole requiredRole="student">
              <StudentProfile />
            </RequireRole>} />
        <Route path="/settings" element={<RequireRole requiredRole="student">
              <StudentSettings />
            </RequireRole>} />
        <Route path="/notifications" element={<RequireRole requiredRole="student">
              <StudentNotifications />
            </RequireRole>} />
        {/* Admin routes */}
        <Route path="/admin" element={<RequireRole requiredRole="admin">
              <AdminDashboard />
            </RequireRole>} />
        <Route path="/admin/users" element={<RequireRole requiredRole="admin">
              <AdminUsers />
            </RequireRole>} />
        <Route path="/admin/courses" element={<RequireRole requiredRole="admin">
              <AdminCourses />
            </RequireRole>} />
        <Route path="/admin/quizzes" element={<RequireRole requiredRole="admin">
              <AdminQuizManagement />
            </RequireRole>} />
        <Route path="/admin/games" element={<RequireRole requiredRole="admin">
              <AdminGames />
            </RequireRole>} />
        <Route path="/admin/posts" element={<RequireRole requiredRole="admin">
              <AdminPosts />
            </RequireRole>} />
        <Route path="/admin/content" element={<RequireRole requiredRole="admin">
              <AdminContent />
            </RequireRole>} />
        <Route path="/admin/analytics" element={<RequireRole requiredRole="admin">
              <AdminAnalytics />
            </RequireRole>} />
        <Route path="/admin/audit-log" element={<RequireRole requiredRole="admin">
              <AdminAuditLog />
            </RequireRole>} />
        <Route path="/admin/settings" element={<RequireRole requiredRole="admin">
              <AdminSettings />
            </RequireRole>} />
        <Route path="/admin/profile" element={<RequireRole requiredRole="admin">
              <AdminProfile />
            </RequireRole>} />
        <Route path="/admin/notifications" element={<RequireRole requiredRole="admin">
              <AdminNotifications />
            </RequireRole>} />
        <Route path="/admin/announcements" element={<RequireRole requiredRole="admin">
              <AdminAnnouncements />
            </RequireRole>} />
        <Route path="/admin/announcements/create" element={<RequireRole requiredRole="admin">
              <AnnouncementForm mode="create" />
            </RequireRole>} />
        <Route path="/admin/announcements/:id/edit" element={<RequireRole requiredRole="admin">
              <AnnouncementForm mode="edit" />
            </RequireRole>} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>;
}
