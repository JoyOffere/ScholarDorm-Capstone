import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboardIcon, BookOpenIcon, AwardIcon, BellIcon, UserIcon, SettingsIcon, UsersIcon, FileTextIcon, BarChartIcon, LogOutIcon, MenuIcon, XIcon, BookIcon, GraduationCapIcon, PencilIcon, ClipboardListIcon, HomeIcon, GamepadIcon, StarIcon, TrophyIcon, ChevronRightIcon, ActivityIcon, MegaphoneIcon, LayersIcon, LineChartIcon, FileIcon, VideoIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
interface SidebarProps {
  role: 'student' | 'admin' | 'teacher';
  isOpen: boolean;
  toggleSidebar: () => void;
}
interface NavItem {
  name: string;
  to: string;
  icon: React.ReactNode;
  badge?: number;
  isNew?: boolean;
}
interface NavGroup {
  title?: string;
  items: NavItem[];
}
export const Sidebar: React.FC<SidebarProps> = ({
  role,
  isOpen,
  toggleSidebar
}) => {
  const location = useLocation();
  const [userProfile, setUserProfile] = useState({
    name: '',
    avatar: '',
    streak: 0
  });
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user) {
          const {
            data: profile
          } = await supabase.from('users').select('full_name, avatar_url, streak_count').eq('id', user.id).single();
          if (profile) {
            setUserProfile({
              name: profile.full_name || user.email?.split('@')[0] || '',
              avatar: profile.avatar_url || '',
              streak: profile.streak_count || 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);
  const studentNavGroups: NavGroup[] = [{
    title: 'Main',
    items: [{
      name: 'Dashboard',
      to: '/dashboard',
      icon: <HomeIcon size={20} />
    }, {
      name: 'Courses',
      to: '/courses',
      icon: <BookOpenIcon size={20} />
    }, {
      name: 'My Learning',
      to: '/learning',
      icon: <GraduationCapIcon size={20} />
    }]
  }, {
    title: 'Learning',
    items: [{
      name: 'Quizzes',
      to: '/quizzes',
      icon: <ClipboardListIcon size={20} />,
      badge: 3
    }, 
    // {
    //   name: 'Games',
    //   to: '/games',
    //   icon: <GamepadIcon size={20} />,
    //   isNew: true
    // }, 
    {
      name: 'Leaderboard',
      to: '/leaderboard',
      icon: <TrophyIcon size={20} />
    }, {
      name: 'Achievements',
      to: '/achievements',
      icon: <AwardIcon size={20} />
    }]
  }, {
    title: 'Account',
    items: [{
      name: 'Notifications',
      to: '/notifications',
      icon: <BellIcon size={20} />,
      badge: 3
    }, {
      name: 'Profile',
      to: '/profile',
      icon: <UserIcon size={20} />
    }, {
      name: 'Settings',
      to: '/settings',
      icon: <SettingsIcon size={20} />
    }]
  }];
  const adminNavGroups: NavGroup[] = [{
    title: 'Main',
    items: [{
      name: 'Dashboard',
      to: '/admin',
      icon: <LayoutDashboardIcon size={20} />
    }, {
      name: 'Users',
      to: '/admin/users',
      icon: <UsersIcon size={20} />
    }]
  },
  {
    title: 'Content',
    items: [{
      name: 'Courses',
      to: '/admin/courses',
      icon: <BookIcon size={20} />
    }, {
      name: 'Quizzes',
      to: '/admin/quizzes',
      icon: <ClipboardListIcon size={20} />
    }, 
    // {
    //   name: 'Games',
    //   to: '/admin/games',
    //   icon: <GamepadIcon size={20} />
    // }, 
    {
      name: 'Announcements',
      to: '/admin/announcements',
      icon: <MegaphoneIcon size={20} />
    }, {
      name: 'Posts',
      to: '/admin/posts',
      icon: <FileTextIcon size={20} />
    }, {
      name: 'Content',
      to: '/admin/content',
      icon: <LayersIcon size={20} />
    }, {
      name: 'RSL Management',
      to: '/admin/rsl-management',
      icon: <SettingsIcon size={20} />
    }]
  },
  {
    title: 'System',
    items: [{
      name: 'Analytics',
      to: '/admin/analytics',
      icon: <LineChartIcon size={20} />
    }, {
      name: 'Notifications',
      to: '/admin/notifications',
      icon: <BellIcon size={20} />
    }, {
      name: 'Audit Log',
      to: '/admin/audit-log',
      icon: <FileIcon size={20} />
    }, {
      name: 'Settings',
      to: '/admin/settings',
      icon: <SettingsIcon size={20} />
    }]
  }];

  const teacherNavGroups: NavGroup[] = [{
    title: 'Main',
    items: [{
      name: 'Dashboard',
      to: '/teacher',
      icon: <HomeIcon size={20} />
    }, {
      name: 'My Courses',
      to: '/teacher/courses',
      icon: <BookOpenIcon size={20} />
    }, {
      name: 'Students',
      to: '/teacher/students',
      icon: <UsersIcon size={20} />
    }]
  }, {
    title: 'Teaching Tools',
    items: [{
      name: 'Quizzes',
      to: '/teacher/quizzes',
      icon: <ClipboardListIcon size={20} />
    }, {
      name: 'Content Library',
      to: '/teacher/content',
      icon: <BookIcon size={20} />
    }, {
      name: 'RSL Videos',
      to: '/teacher/rsl-content',
      icon: <VideoIcon size={20} />
    }, {
      name: 'Progress Reports',
      to: '/teacher/progress',
      icon: <BarChartIcon size={20} />
    }]
  }, {
    title: 'Communication',
    items: [{
      name: 'Messages',
      to: '/teacher/messages',
      icon: <FileTextIcon size={20} />
    }, {
      name: 'Announcements',
      to: '/teacher/announcements',
      icon: <MegaphoneIcon size={20} />
    }, {
      name: 'Notifications',
      to: '/teacher/notifications',
      icon: <BellIcon size={20} />
    }]
  }, {
    title: 'Account',
    items: [{
      name: 'Profile',
      to: '/teacher/profile',
      icon: <UserIcon size={20} />
    }, {
      name: 'Settings',
      to: '/teacher/settings',
      icon: <SettingsIcon size={20} />
    }]
  }];

  const navGroups = role === 'admin' ? adminNavGroups : role === 'teacher' ? teacherNavGroups : studentNavGroups;
  const auth = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    try {
      console.log('Sidebar: Starting sign out process...');
      
      // Call the improved signOut from AuthContext
      await auth.signOut();
      
      // Navigate after signout completes
      navigate('/', { replace: true });
      console.log('Sidebar: Sign out completed, redirected to home');
    } catch (error) {
      console.error('Sidebar: Error during sign out:', error);
      // Even if signout fails, redirect to home for security
      navigate('/', { replace: true });
    }
  };
  return <>
      {/* Mobile menu button - moved to Navbar */}
      {/* Overlay for mobile */}
      {isOpen && <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleSidebar} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-3 border-b flex items-center justify-center">
            <img src="/SCHOLARDORM_LOGO.png" alt="ScholarDorm Logo" className="h-9 w-auto" />
          </div>

          {/* User Profile */}
          <div className="p-3 border-b">
            <div className="flex items-center">
              <div className="h-9 w-9 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
                {userProfile.avatar ? <img src={userProfile.avatar} alt={userProfile.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600">
                    <UserIcon size={18} />
                  </div>}
              </div>
              <div className="ml-2 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile.name}
                </p>
                <div className={`text-xs font-medium py-0.5 px-1.5 rounded ${role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                  {role === 'admin' ? 'Administrator' : 'Student'}
                </div>
              </div>
            </div>
            {role === 'student' && <div className="mt-2 flex items-center p-2 bg-indigo-50 rounded-lg">
                <div className="p-1 bg-indigo-100 rounded-md text-indigo-600">
                  <ActivityIcon size={14} />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-indigo-700">
                    Current Streak
                  </p>
                  <p className="text-sm font-bold text-indigo-900">
                    {userProfile.streak} days
                  </p>
                </div>
                <div className="ml-auto">
                  <Link to="/achievements" className="text-xs text-indigo-700 flex items-center hover:text-indigo-900" onClick={() => toggleSidebar()}>
                    View <ChevronRightIcon size={12} className="ml-0.5" />
                  </Link>
                </div>
              </div>}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2">
            {navGroups.map((group, groupIndex) => <div key={groupIndex} className="mb-4">
                {group.title && <h3 className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group.title}
                  </h3>}
                <div className="space-y-1">
                  {group.items.map(item => {
                const isActive = location.pathname === item.to;
                return <Link key={item.name} to={item.to} className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${isActive ? role === 'admin' ? 'bg-purple-100 text-purple-900' : 'bg-blue-100 text-blue-900' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => toggleSidebar()}>
                        <span className={`mr-2 ${isActive ? role === 'admin' ? 'text-purple-600' : 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                        {item.badge && <span className={`ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1 text-xs font-semibold rounded-full ${isActive ? role === 'admin' ? 'bg-purple-200 text-purple-800' : 'bg-blue-200 text-blue-800' : 'bg-red-500 text-white'}`}>
                            {item.badge}
                          </span>}
                        {item.isNew && <span className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded-sm bg-green-100 text-green-800">
                            NEW
                          </span>}
                      </Link>;
              })}
                </div>
              </div>)}
          </nav>

          {/* Sign out button */}
          <div className="p-3 border-t">
            <button onClick={handleSignOut} className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              <LogOutIcon size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>;
};
