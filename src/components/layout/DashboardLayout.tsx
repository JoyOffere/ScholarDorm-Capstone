import * as React from 'react';
const { useEffect, useState } = React;
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Navbar } from './Navbar';
import { FloatingButtons } from './FloatingButtons';
import { StatusBanner } from '../common/StatusBanner';
import { supabase } from '../../lib/supabase';
interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  role: 'student' | 'admin' | 'teacher';
}
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  role
}) => {
  const [userProfile, setUserProfile] = useState<{
    name: string;
    avatar?: string;
    unreadNotifications: number;
  }>({
    name: role === 'admin' ? 'Administrator' : 'Student',
    unreadNotifications: 0
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    
    const fetchUserProfile = async () => {
      if (!mounted) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!mounted || !user) {
          setLoading(false);
          return;
        }

        // Fetch user profile and notifications in parallel
        const [profileResult, notificationResult] = await Promise.allSettled([
          supabase.from('users').select('full_name, avatar_url').eq('id', user.id).single(),
          supabase.from('notifications').select('id', {
            count: 'exact',
            head: true
          }).eq('user_id', user.id).eq('is_read', false)
        ]);

        if (!mounted) return;

        let profileData = null;
        let notificationCount = 0;

        if (profileResult.status === 'fulfilled' && !profileResult.value.error) {
          profileData = profileResult.value.data;
        }

        if (notificationResult.status === 'fulfilled' && !notificationResult.value.error) {
          notificationCount = notificationResult.value.count || 0;
        }

        setUserProfile({
          name: profileData?.full_name || user.email?.split('@')[0] || 'User',
          avatar: profileData?.avatar_url,
          unreadNotifications: notificationCount
        });

      } catch (error) {
        console.error('Error fetching user profile:', error);
        if (mounted) {
          // Set default profile on error
          setUserProfile({
            name: role === 'admin' ? 'Administrator' : 'Student',
            unreadNotifications: 0
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      mounted = false;
    };
  }, [role]);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Do not block rendering while fetching profile. Render layout immediately
  // so navigation is fast; show a small inline loading indicator near the
  // header/profile area while the profile loads.

  return <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sidebar - pass open state and toggle function */}
      <Sidebar role={role} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Navbar - pass toggle function */}
        <Navbar role={role} userProfile={userProfile} toggleSidebar={toggleSidebar} />
        {/* Header */}
        <Header title={title} role={role} />
        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 mt-16 mb-16 md:mb-0 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
      {/* Floating Action Buttons - mobile only */}
      <div className="md:hidden">
        <FloatingButtons role={role} onAction={() => {}} />
      </div>
      {/* Status Banner Floating at top right */}
      <div className="fixed top-20 right-4 z-50">
        <StatusBanner />
      </div>
    </div>;
};