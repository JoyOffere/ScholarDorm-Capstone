import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { 
  UsersIcon, BookIcon, ClipboardListIcon, TrendingUpIcon, ActivityIcon, 
  BellIcon, SettingsIcon, BarChartIcon, PlusIcon, EyeIcon, CalendarIcon, 
  ArrowRightIcon, GraduationCapIcon, GamepadIcon, MessageSquareIcon,
  AlertCircleIcon, CheckCircleIcon, ClockIcon, Award, Target, TrendingDownIcon, XIcon, VideoIcon
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface EnhancedStats {
  totalUsers: number;
  totalCourses: number;
  totalQuizzes: number;
  activeUsers: number;
  totalEnrollments: number;
  completedCourses: number;
  totalBadgesEarned: number;
  averageQuizScore: number;
  totalGames: number;
  totalPosts: number;
  pendingFeedback: number;
  systemHealth: number;
}

interface RecentActivity {
  id: string;
  action: string;
  user_email: string;
  created_at: string;
  details?: any;
}

interface ChartData {
  enrollmentTrend: Array<{ date: string; enrollments: number }>;
  completionRates: Array<{ course: string; rate: number }>;
  userGrowth: Array<{ month: string; users: number }>;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<EnhancedStats>({
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
  const [chartData, setChartData] = useState<ChartData>({
    enrollmentTrend: [],
    completionRates: [],
    userGrowth: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      console.log('Starting to load dashboard data');
      try {
        const fallbackTimer = setTimeout(() => {
          console.warn('Admin dashboard loading timed out, unblocking UI');
          setError('Dashboard loading timed out');
          setLoading(false);
        }, 10000);

        Promise.all([
          fetchEnhancedStats(),
          fetchRecentActivities(),
          fetchChartData()
        ]).then(() => {
          console.log('Dashboard data loaded successfully');
          clearTimeout(fallbackTimer);
        }).catch(err => {
          console.error('Error during dashboard data loading:', err);
          clearTimeout(fallbackTimer);
          setError('Failed to load dashboard data');
        });
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchEnhancedStats = async () => {
    try {
      const [
        usersResult,
        coursesResult,
        quizzesResult,
        activeUsersResult,
        enrollmentsResult,
        completionsResult,
        badgesResult,
        quizScoreResult,
        gamesResult,
        postsResult,
        feedbackResult
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('quizzes').select('*', { count: 'exact', head: true }),
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('last_login', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('user_courses').select('*', { count: 'exact', head: true }),
        supabase
          .from('user_courses')
          .select('*', { count: 'exact', head: true })
          .eq('completed', true),
        supabase.from('user_badges').select('*', { count: 'exact', head: true }),
        supabase
          .from('quiz_attempts')
          .select('percentage'),
        supabase.from('games').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase
          .from('feedback')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
      ]);

      const avgScore = quizScoreResult.data && quizScoreResult.data.length > 0
        ? quizScoreResult.data.reduce((sum: number, attempt: any) => sum + attempt.percentage, 0) / quizScoreResult.data.length
        : 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalQuizzes: quizzesResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
        totalEnrollments: enrollmentsResult.count || 0,
        completedCourses: completionsResult.count || 0,
        totalBadgesEarned: badgesResult.count || 0,
        averageQuizScore: Math.round(avgScore),
        totalGames: gamesResult.count || 0,
        totalPosts: postsResult.count || 0,
        pendingFeedback: feedbackResult.count || 0,
        systemHealth: 95,
      });
    } catch (error) {
      console.error('Error fetching enhanced stats:', error);
      throw error;
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          created_at,
          users!inner(email)
        `)
        .order('created_at', { ascending: false })
        .limit(10); // Increased to 10 for more activities

      if (error) throw error;
      const activities = data?.map(item => ({
        id: item.id,
        action: item.action,
        user_email: (item.users as any).email,
        created_at: item.created_at
      })) || [];
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      // Enrollment trend over last 30 days for more data
      const enrollmentTrend = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const { count } = await supabase
          .from('user_courses')
          .select('*', { count: 'exact', head: true })
          .gte('enrolled_at', dateStr)
          .lt('enrolled_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        
        enrollmentTrend.push({
          date: dateStr,
          enrollments: count || 0
        });
      }

      // Completion rates for all courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
          id, title,
          user_courses!inner(completed)
        `);

      const completionRates = coursesData?.map(course => {
        const enrollments = course.user_courses?.length || 0;
        const completions = course.user_courses?.filter((uc: any) => uc.completed).length || 0;
        return {
          course: course.title,
          rate: enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0
        };
      }) || [];

      // User growth over last 12 months
      const userGrowth = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(date.getFullYear(), date.getMonth(), 1).toISOString())
          .lt('created_at', new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString());
        
        userGrowth.push({
          month: monthStr,
          users: count || 0
        });
      }

      setChartData({
        enrollmentTrend,
        completionRates,
        userGrowth
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData({
        enrollmentTrend: [],
        completionRates: [],
        userGrowth: []
      });
    }
  };

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
    {
      title: 'Games & Quizzes',
      value: stats.totalGames + stats.totalQuizzes,
      icon: <GamepadIcon size={24} />,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      subtext: 'Interactive content',
      trend: '+10%',
      trendColor: 'text-green-500',
      trendIcon: TrendingUpIcon
    },
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
    {
      title: 'Game Center',
      description: 'Manage educational games',
      icon: <GamepadIcon size={20} />,
      to: '/admin/games',
      color: 'bg-pink-500 hover:bg-pink-600'
    },
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
      {loading && (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 border-opacity-25 border-b-4"></div>
        </div>
      )}

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
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Admin Dashboard</h2>
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
              <h1 className="text-3xl font-bold mb-2">Welcome Back, Admin!</h1>
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

        {/* Stats Cards */}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      padding: '10px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="enrollments" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion Rates */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Target size={20} className="mr-2 text-green-600" />
                Course Completion Rates
              </h3>
              <span className="text-sm text-gray-500">Top Courses</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.completionRates}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="course" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => `${value}%`}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      padding: '10px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="rate" 
                    fill="#22c55e" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <SettingsIcon size={24} className="mr-2 text-purple-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.to}
                className={`${action.color} text-white p-5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg group relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                {action.badge && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white rounded-full text-xs px-2 py-1 font-medium shadow-md">
                    {action.badge}
                  </span>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm group-hover:rotate-6 transition-transform">
                    {action.icon}
                  </div>
                  <ArrowRightIcon size={18} className="opacity-80 group-hover:translate-x-2 transition-transform" />
                </div>
                <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Two-column layout for activities and system status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <ActivityIcon size={24} className="mr-2 text-green-600" />
                Recent Activities
              </h2>
              <Link to="/admin/activities" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center">
                View All <ArrowRightIcon size={14} className="ml-1" />
              </Link>
            </div>
            {recentActivities.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                    <div className={`${getActionColor(activity.action)} p-3 rounded-xl mr-4 flex-shrink-0 shadow-sm`}>
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">
                          {activity.user_email} <span className="text-gray-500">performed</span> {activity.action}
                        </p>
                        <span className="text-xs text-gray-500 group-hover:text-gray-700">{formatTimeAgo(activity.created_at)}</span>
                      </div>
                      {activity.details && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">{JSON.stringify(activity.details)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ActivityIcon size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">No recent activities</p>
                <p className="text-sm text-gray-500 mt-1">Activities will appear here as users interact with the platform</p>
              </div>
            )}
          </div>

          {/* System Status Panel */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <CheckCircleIcon size={24} className="mr-2 text-emerald-600" />
              System Status
            </h2>
            <div className="space-y-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full border-8 border-emerald-200 flex items-center justify-center">
                    <span className="text-3xl font-bold text-emerald-600">{stats.systemHealth}%</span>
                  </div>
                  <div 
                    className="absolute top-0 left-0 w-32 h-32 rounded-full border-8 border-emerald-600"
                    style={{
                      clipPath: `inset(0 0 ${100 - stats.systemHealth}% 0)`
                    }}
                  ></div>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-600">Overall Health</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl shadow-inner">
                  <div className="flex items-center">
                    <CheckCircleIcon size={16} className="text-emerald-600 mr-2" />
                    <span className="text-sm font-medium text-gray-800">Database</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">Operational</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl shadow-inner">
                  <div className="flex items-center">
                    <CheckCircleIcon size={16} className="text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-800">API Services</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">Online</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl shadow-inner">
                  <div className="flex items-center">
                    <ClockIcon size={16} className="text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-gray-800">Pending Tasks</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">{stats.pendingFeedback}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Insights</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <TrendingUpIcon size={12} className="mr-1 text-green-500" />
                      New Users Today
                    </span>
                    <span className="font-medium text-gray-800">--</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Award size={12} className="mr-1 text-yellow-500" />
                      Badges Awarded
                    </span>
                    <span className="font-medium text-gray-800">--</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Target size={12} className="mr-1 text-orange-500" />
                      Avg Session Time
                    </span>
                    <span className="font-medium text-gray-800">-- min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <UsersIcon size={24} className="mr-2 text-indigo-600" />
            User Growth
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    padding: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};