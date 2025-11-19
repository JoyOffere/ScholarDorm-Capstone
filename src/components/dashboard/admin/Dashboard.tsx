import * as React from 'react';
const { useEffect, useState } = React;
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import {
  UsersIcon, BookIcon, ClipboardListIcon, TrendingUpIcon, ActivityIcon,
  BellIcon, SettingsIcon, BarChartIcon, PlusIcon, EyeIcon, CalendarIcon,
  ArrowRightIcon, GraduationCapIcon, GamepadIcon, MessageSquareIcon,
  AlertCircleIcon, CheckCircleIcon, ClockIcon, Award, Target, TrendingDownIcon, XIcon, VideoIcon
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { 
  getAllDashboardDataUltraFast,
  DashboardStats,
  DashboardChartData,
  RecentActivity
} from '../../../lib/supabase-utils';
import { useAuth } from '../../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// Types are imported from supabase-utils

export const AdminDashboard: React.FC = () => {
  const { user, session } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalQuizzes: 0,
    activeUsers: 0,
    totalEnrollments: 0,
    completedCourses: 0,
    totalBadgesEarned: 0,
    averageQuizScore: 0,
    totalGames: 0,
    totalPosts: 0,
    pendingFeedback: 0,
    systemHealth: 95,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [chartData, setChartData] = useState<DashboardChartData>({
    enrollmentTrend: [],
    completionRates: [],
    userGrowth: [],
  });
  const [loading, setLoading] = useState(false); // Start with false for instant display
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadDataUltraFast = async () => {
      if (!mounted) return;
      
      console.log('⚡ AdminDashboard: INSTANT display mode activated...');
      const startTime = performance.now();
      
      try {
        // INSTANT DISPLAY: Get sample data immediately, real data loads in background
        const { stats, activities, chartData } = await getAllDashboardDataUltraFast();

        if (!mounted) return;

        // Update all state instantly with sample/cached data
        setStats(stats);
        setRecentActivities(activities);
        setChartData(chartData);
        
        const endTime = performance.now();
        console.log(`⚡ AdminDashboard: Displayed instantly in ${(endTime - startTime).toFixed(2)}ms`);
        console.log('🔄 Real data refreshing in background...');

      } catch (err) {
        if (mounted) {
          console.error('AdminDashboard: Error loading dashboard data:', err);
          setError('Dashboard data temporarily unavailable. Showing cached data.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Start loading immediately - no delays!
    loadDataUltraFast();

    return () => {
      mounted = false;
    };
  }, []);

  // Ultra-fast loading - no more slow individual queries!

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <UsersIcon size={24} />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      subtext: `${stats.activeUsers} active this month`,
      trend: '+12%',
      trendColor: 'text-green-500',
      trendIcon: TrendingUpIcon
    },
    {
      title: 'Course Enrollments',
      value: stats.totalEnrollments,
      icon: <BookIcon size={24} />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      subtext: `${stats.completedCourses} completed`,
      trend: '+8%',
      trendColor: 'text-green-500',
      trendIcon: TrendingUpIcon
    },
    {
      title: 'Badges Earned',
      value: stats.totalBadgesEarned,
      icon: <Award size={24} />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      subtext: 'Achievement rewards',
      trend: '+15%',
      trendColor: 'text-green-500',
      trendIcon: TrendingUpIcon
    },
    {
      title: 'Avg Quiz Score',
      value: `${stats.averageQuizScore}%`,
      icon: <Target size={24} />,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      subtext: 'Student performance',
      trend: '-2%',
      trendColor: 'text-red-500',
      trendIcon: TrendingDownIcon
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: <GraduationCapIcon size={24} />,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      subtext: 'Learning content',
      trend: '+5%',
      trendColor: 'text-green-500',
      trendIcon: TrendingUpIcon
    },
    // {
    //   title: 'Games & Quizzes',
    //   value: stats.totalGames + stats.totalQuizzes,
    //   icon: <GamepadIcon size={24} />,
    //   color: 'from-pink-500 to-pink-600',
    //   bgColor: 'bg-pink-50',
    //   textColor: 'text-pink-600',
    //   subtext: 'Interactive content',
    //   trend: '+10%',
    //   trendColor: 'text-green-500',
    //   trendIcon: TrendingUpIcon
    // },
    {
      title: 'Posts & Updates',
      value: stats.totalPosts,
      icon: <MessageSquareIcon size={24} />,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
      subtext: 'Communications',
      trend: '+7%',
      trendColor: 'text-green-500',
      trendIcon: TrendingUpIcon
    },
    {
      title: 'System Health',
      value: `${stats.systemHealth}%`,
      icon: <CheckCircleIcon size={24} />,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      subtext: 'Platform status',
      trend: '0%',
      trendColor: 'text-gray-500',
      trendIcon: TrendingUpIcon
    }
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: <UsersIcon size={20} />,
      to: '/admin/users',
      color: 'bg-blue-500 hover:bg-blue-600',
      badge: stats.pendingFeedback > 0 ? stats.pendingFeedback : null
    },
    {
      title: 'Create Course',
      description: 'Add new learning content',
      icon: <PlusIcon size={20} />,
      to: '/admin/courses',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Analytics Hub',
      description: 'Monitor platform performance',
      icon: <BarChartIcon size={20} />,
      to: '/admin/analytics',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Send Announcement',
      description: 'Communicate with users',
      icon: <BellIcon size={20} />,
      to: '/admin/announcements',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Quiz Management',
      description: 'Create and manage quizzes',
      icon: <ClipboardListIcon size={20} />,
      to: '/admin/quizzes',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    // {
    //   title: 'Game Center',
    //   description: 'Manage educational games',
    //   icon: <GamepadIcon size={20} />,
    //   to: '/admin/games',
    //   color: 'bg-pink-500 hover:bg-pink-600'
    // },
    {
      title: 'Content Posts',
      description: 'Manage posts and updates',
      icon: <MessageSquareIcon size={20} />,
      to: '/admin/posts',
      color: 'bg-cyan-500 hover:bg-cyan-600'
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings',
      icon: <SettingsIcon size={20} />,
      to: '/admin/settings',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'user_login':
        return 'bg-blue-100 text-blue-800';
      case 'course_enrollment':
        return 'bg-green-100 text-green-800';
      case 'quiz_attempt':
        return 'bg-purple-100 text-purple-800';
      case 'badge_earned':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_login':
        return <UsersIcon size={16} className="text-blue-600" />;
      case 'course_enrollment':
        return <BookIcon size={16} className="text-green-600" />;
      case 'quiz_attempt':
        return <ClipboardListIcon size={16} className="text-purple-600" />;
      case 'badge_earned':
        return <Award size={16} className="text-yellow-600" />;
      default:
        return <ActivityIcon size={16} className="text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <DashboardLayout title="Admin Dashboard" role="admin">

      {/* Welcome Modal with RSL Video */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowWelcomeModal(false)}
                >
                  <XIcon size={24} />
                </button>
              </div>
              <div className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Admin Dashboard, {session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Admin'}</h2>
                  <p className="text-gray-600 text-lg">Murakaza neza! (Welcome in Kinyarwanda)</p>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center justify-center">
                    <VideoIcon size={24} className="mr-2 text-purple-600" />
                    Welcome in Rwandan Sign Language
                  </h3>
                  <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                    <iframe
                      width="100%"
                      height="100%"
                      src="https://www.youtube.com/embed/2ATl9JVycYk"
                      title="Rwandan Sign Language Greeting"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">Learn basic RSL greetings and introductions</p>
                </div>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowWelcomeModal(false)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                  >
                    Get Started
                  </button>
                  <Link
                    to="/admin/rsl-management"
                    className="px-6 py-3 bg-white border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors shadow-md"
                  >
                    Manage RSL Content
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-purple-700 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16"></div>
          <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome Back, {session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Admin'}!</h1>
              <p className="text-lg opacity-90">
                Monitor and manage your educational platform with ease.
                {stats.pendingFeedback > 0 && (
                  <span className="block mt-2 text-yellow-200 font-medium">
                    ⚠️ {stats.pendingFeedback} pending items require attention
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowWelcomeModal(true)}
                className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
              >
                <VideoIcon size={18} className="mr-2" />
                View RSL Welcome
              </button>
              <div className="text-right hidden md:block">
                <p className="text-sm opacity-80">System Health</p>
                <p className="text-2xl font-bold">{stats.systemHealth}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Ultra Fast Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
            >
              <div className={`bg-gradient-to-r ${card.color} p-4`}>
                <div className="flex items-center justify-between">
                  <div className={`${card.bgColor} p-3 rounded-full shadow-md group-hover:scale-105 transition-transform`}>
                    <div className={card.textColor}>
                      {card.icon}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/90 text-sm font-medium">{card.title}</p>
                    <p className="text-2xl font-bold text-white">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{card.subtext}</p>
                  <div className="flex items-center gap-1">
                    <card.trendIcon size={14} className={card.trendColor} />
                    <span className={`text-xs font-medium ${card.trendColor}`}>{card.trend}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrollment Trend */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <TrendingUpIcon size={20} className="mr-2 text-blue-600" />
                Enrollment Trend
              </h3>
              <span className="text-sm text-gray-500">Last 30 days</span>
            </div>
                        <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.enrollmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="enrollments" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Daily Enrollments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion Rates */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Course Completion Rates</h3>
              <BarChartIcon size={24} className="text-purple-600" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.completionRates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="course" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                  <Bar dataKey="rate" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Recent System Activities</h3>
              <ActivityIcon size={24} className="text-purple-600" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivities.length > 0 ? recentActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <ActivityIcon size={16} className="text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{activity.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.user_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTimeAgo(activity.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {activity.details ? JSON.stringify(activity.details) : 'No details'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No recent activities found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircleIcon size={20} className="text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
