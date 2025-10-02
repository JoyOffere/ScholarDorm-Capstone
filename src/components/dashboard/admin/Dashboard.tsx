import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { UsersIcon, BookOpenIcon, AwardIcon, TrendingUpIcon, ActivityIcon, BellIcon, UserPlusIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, CalendarIcon, ClockIcon, RefreshCwIcon, BarChart2Icon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Link } from 'react-router-dom';
interface DashboardStat {
  name: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
}
interface RecentActivity {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  action: string;
  target: string;
  time: string;
  timestamp: Date;
}
interface NewUser {
  id: string;
  name: string;
  avatar?: string;
  joined: string;
  completed: number;
}
interface AdminNotification {
  id: string;
  message: string;
  time: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
}
export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [newUsers, setNewUsers] = useState<NewUser[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');
  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRecentActivities(), fetchNewUsers(), fetchNotifications()]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const refreshDashboard = async () => {
    try {
      setRefreshing(true);
      await fetchDashboardData();
    } finally {
      setRefreshing(false);
    }
  };
  const fetchStats = async () => {
    try {
      // Get total student count
      const {
        count: studentCount,
        error: studentError
      } = await supabase.from('users').select('*', {
        count: 'exact',
        head: true
      }).eq('role', 'student');
      if (studentError) throw studentError;
      // Get active courses count
      const {
        count: courseCount,
        error: courseError
      } = await supabase.from('courses').select('*', {
        count: 'exact',
        head: true
      }).eq('is_active', true);
      if (courseError) throw courseError;
      // Get badges count
      const {
        count: badgeCount,
        error: badgeError
      } = await supabase.from('badges').select('*', {
        count: 'exact',
        head: true
      });
      if (badgeError) throw badgeError;
      // Get average streak
      const {
        data: streakData,
        error: streakError
      } = await supabase.from('users').select('streak_count').eq('role', 'student').gt('streak_count', 0);
      if (streakError) throw streakError;
      const avgStreak = streakData && streakData.length > 0 ? (streakData.reduce((sum, user) => sum + (user.streak_count || 0), 0) / streakData.length).toFixed(1) : '0';
      // Calculate user growth
      const now = new Date();
      let startDate: Date;
      if (timeRange === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
      } else if (timeRange === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
      }
      const {
        count: newUserCount,
        error: newUserError
      } = await supabase.from('users').select('*', {
        count: 'exact',
        head: true
      }).gte('created_at', startDate.toISOString());
      if (newUserError) throw newUserError;
      // Get previous period data for comparison
      const previousStartDate = new Date(startDate);
      if (timeRange === 'today') {
        previousStartDate.setDate(previousStartDate.getDate() - 1);
      } else if (timeRange === 'week') {
        previousStartDate.setDate(previousStartDate.getDate() - 7);
      } else {
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
      }
      const {
        count: previousUserCount,
        error: prevUserError
      } = await supabase.from('users').select('*', {
        count: 'exact',
        head: true
      }).gte('created_at', previousStartDate.toISOString()).lt('created_at', startDate.toISOString());
      if (prevUserError) throw prevUserError;
      // Calculate change percentage
      const userChange = previousUserCount === 0 ? 100 : Math.round((newUserCount - previousUserCount) / previousUserCount * 100);
      // Get course completion count
      const {
        count: completionCount,
        error: completionError
      } = await supabase.from('user_courses').select('*', {
        count: 'exact',
        head: true
      }).eq('completed', true).gte('completion_date', startDate.toISOString());
      if (completionError) throw completionError;
      // Get previous period completions
      const {
        count: prevCompletionCount,
        error: prevCompletionError
      } = await supabase.from('user_courses').select('*', {
        count: 'exact',
        head: true
      }).eq('completed', true).gte('completion_date', previousStartDate.toISOString()).lt('completion_date', startDate.toISOString());
      if (prevCompletionError) throw prevCompletionError;
      const completionChange = prevCompletionCount === 0 ? 100 : Math.round((completionCount - prevCompletionCount) / prevCompletionCount * 100);
      setStats([{
        name: 'Total Students',
        value: studentCount || 0,
        icon: <UsersIcon size={20} />,
        color: 'blue',
        change: {
          value: userChange,
          isPositive: userChange >= 0
        }
      }, {
        name: 'Active Courses',
        value: courseCount || 0,
        icon: <BookOpenIcon size={20} />,
        color: 'green'
      }, {
        name: 'Badges Created',
        value: badgeCount || 0,
        icon: <AwardIcon size={20} />,
        color: 'yellow'
      }, {
        name: 'Avg. Streak',
        value: `${avgStreak} days`,
        icon: <ActivityIcon size={20} />,
        color: 'orange'
      }, {
        name: 'Course Completions',
        value: completionCount || 0,
        icon: <CheckCircleIcon size={20} />,
        color: 'purple',
        change: {
          value: completionChange,
          isPositive: completionChange >= 0
        }
      }]);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats([{
        name: 'Total Students',
        value: '0',
        icon: <UsersIcon size={20} />,
        color: 'blue'
      }, {
        name: 'Active Courses',
        value: '0',
        icon: <BookOpenIcon size={20} />,
        color: 'green'
      }, {
        name: 'Badges Created',
        value: '0',
        icon: <AwardIcon size={20} />,
        color: 'yellow'
      }, {
        name: 'Avg. Streak',
        value: '0 days',
        icon: <ActivityIcon size={20} />,
        color: 'orange'
      }]);
    }
  };
  const fetchRecentActivities = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('audit_logs').select(`
          id, 
          action, 
          details,
          created_at,
          users:user_id (id, full_name, avatar_url)
        `).order('created_at', {
        ascending: false
      }).limit(10);
      if (error) throw error;
      if (data) {
        const formattedActivities: RecentActivity[] = data.map(item => {
          let action = item.action;
          let target = '';
          // Format action and target based on action type
          switch (item.action) {
            case 'course_start':
              action = 'started';
              target = item.details.course_title || 'a course';
              break;
            case 'course_complete':
              action = 'completed';
              target = item.details.course_title || 'a course';
              break;
            case 'badge_earned':
              action = 'earned badge';
              target = item.details.badge_name || 'an achievement';
              break;
            case 'login':
              action = 'logged in';
              target = '';
              break;
            case 'logout':
              action = 'logged out';
              target = '';
              break;
            case 'quiz_complete':
              action = 'completed quiz';
              target = item.details.quiz_title || 'a quiz';
              break;
            default:
              action = item.action.replace(/_/g, ' ');
              target = item.details.entity_name || '';
          }
          return {
            id: item.id,
            user: {
              id: item.users?.id || '',
              name: item.users?.full_name || 'Unknown User',
              avatar: item.users?.avatar_url
            },
            action,
            target,
            timestamp: new Date(item.created_at),
            time: formatTimeAgo(new Date(item.created_at))
          };
        });
        setRecentActivities(formattedActivities);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setRecentActivities([]);
    }
  };
  const fetchNewUsers = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('users').select(`
          id, 
          full_name, 
          avatar_url, 
          created_at,
          user_courses:user_courses!user_id(id)
        `).eq('role', 'student').order('created_at', {
        ascending: false
      }).limit(5);
      if (error) throw error;
      if (data) {
        const formattedUsers: NewUser[] = data.map(user => {
          return {
            id: user.id,
            name: user.full_name || 'Unknown User',
            avatar: user.avatar_url,
            joined: formatTimeAgo(new Date(user.created_at)),
            completed: Array.isArray(user.user_courses) ? user.user_courses.length : 0
          };
        });
        setNewUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Error fetching new users:', error);
      setNewUsers([]);
    }
  };
  const fetchNotifications = async () => {
    try {
      // Get system notifications from the posts table
      const {
        data,
        error
      } = await supabase.from('posts').select('id, title, created_at').eq('post_type', 'announcement').eq('target_audience', 'admins').order('created_at', {
        ascending: false
      }).limit(3);
      if (error) throw error;
      // Get course completion rate alerts
      const {
        data: coursesData,
        error: coursesError
      } = await supabase.from('courses').select(`
          id, 
          title,
          user_courses:user_courses!course_id(completed)
        `).eq('is_active', true).order('created_at', {
        ascending: false
      }).limit(5);
      if (coursesError) throw coursesError;
      // Get recent user signups
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const {
        count: recentSignups,
        error: signupsError
      } = await supabase.from('users').select('*', {
        count: 'exact',
        head: true
      }).gte('created_at', oneDayAgo.toISOString());
      if (signupsError) throw signupsError;
      // Combine different types of notifications
      const adminNotifications: AdminNotification[] = [];
      // Add system notifications
      if (data) {
        data.forEach(post => {
          adminNotifications.push({
            id: `post-${post.id}`,
            message: post.title,
            timestamp: new Date(post.created_at),
            time: formatTimeAgo(new Date(post.created_at)),
            priority: 'medium'
          });
        });
      }
      // Add course completion rate alerts
      if (coursesData) {
        coursesData.forEach(course => {
          if (course.user_courses && course.user_courses.length > 0) {
            const totalEnrollments = course.user_courses.length;
            const completions = course.user_courses.filter(c => c.completed).length;
            const completionRate = totalEnrollments > 0 ? completions / totalEnrollments * 100 : 0;
            if (completionRate < 30) {
              adminNotifications.push({
                id: `course-${course.id}`,
                message: `${course.title} has a low completion rate (${Math.round(completionRate)}%)`,
                timestamp: new Date(),
                time: 'Today',
                priority: 'medium'
              });
            }
          }
        });
      }
      // Add signup spike notification if applicable
      if (recentSignups > 10) {
        adminNotifications.push({
          id: 'signup-spike',
          message: `${recentSignups} new user registrations in the last 24 hours`,
          timestamp: new Date(),
          time: 'Today',
          priority: 'high'
        });
      }
      // Sort by priority and timestamp
      adminNotifications.sort((a, b) => {
        const priorityOrder = {
          high: 0,
          medium: 1,
          low: 2
        };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      setNotifications(adminNotifications.slice(0, 5));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay > 0) {
      return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    }
    if (diffHour > 0) {
      return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    }
    if (diffMin > 0) {
      return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    }
    return 'Just now';
  };
  return <DashboardLayout title="Admin Dashboard" role="admin">
      {/* Time range selector and refresh button */}
      <div className="flex justify-between items-center mb-6">
        <div className="inline-flex rounded-md shadow-sm">
          <button onClick={() => setTimeRange('today')} className={`px-4 py-2 text-sm font-medium rounded-l-lg ${timeRange === 'today' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300`}>
            Today
          </button>
          <button onClick={() => setTimeRange('week')} className={`px-4 py-2 text-sm font-medium ${timeRange === 'week' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border-t border-b border-gray-300`}>
            This Week
          </button>
          <button onClick={() => setTimeRange('month')} className={`px-4 py-2 text-sm font-medium rounded-r-lg ${timeRange === 'month' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300`}>
            This Month
          </button>
        </div>
        <button onClick={refreshDashboard} disabled={refreshing} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50">
          {refreshing ? <>
              <RefreshCwIcon size={16} className="mr-2 animate-spin" />
              Refreshing...
            </> : <>
              <RefreshCwIcon size={16} className="mr-2" />
              Refresh Dashboard
            </>}
        </button>
      </div>

      {loading ? <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-lg text-gray-600">
            Loading dashboard data...
          </span>
        </div> : <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
            {stats.map((stat, index) => <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {stat.name}
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                    {stat.change && <p className={`text-xs font-medium flex items-center mt-2 ${stat.change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change.isPositive ? <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg> : <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>}
                        {Math.abs(stat.change.value)}%{' '}
                        {timeRange === 'today' ? 'today' : timeRange === 'week' ? 'this week' : 'this month'}
                      </p>}
                  </div>
                  <div className={`p-2 bg-${stat.color}-100 text-${stat.color}-600 rounded-full`}>
                    {stat.icon}
                  </div>
                </div>
              </div>)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-lg font-bold text-gray-800">
                  Recent Activity
                </h2>
                <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                  <TrendingUpIcon size={20} />
                </div>
              </div>
              <div className="space-y-4">
                {recentActivities.length === 0 ? <div className="text-center py-8">
                    <ActivityIcon size={40} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No recent activities found</p>
                  </div> : recentActivities.map(activity => <div key={activity.id} className="flex items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {activity.user.avatar ? <img src={activity.user.avatar} alt={activity.user.name} className="h-full w-full object-cover" /> : <span className="text-gray-600 text-sm font-medium">
                            {activity.user.name.charAt(0)}
                          </span>}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="text-sm">
                          <Link to={`/admin/users/${activity.user.id}`} className="font-medium text-gray-800 hover:text-purple-600">
                            {activity.user.name}
                          </Link>{' '}
                          <span className="text-gray-600">
                            {activity.action}
                          </span>{' '}
                          {activity.target && <span className="font-medium text-gray-800">
                              {activity.target}
                            </span>}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <ClockIcon size={12} className="mr-1" />
                          {activity.time}
                        </div>
                      </div>
                    </div>)}
                <Link to="/admin/audit-log" className="w-full block mt-2 text-center text-sm text-purple-600 hover:text-purple-800 font-medium">
                  View all activity
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              {/* New Users */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-gray-800">New Users</h2>
                  <div className="p-2 bg-green-100 text-green-600 rounded-full">
                    <UserPlusIcon size={20} />
                  </div>
                </div>
                <div className="space-y-4">
                  {newUsers.length === 0 ? <div className="text-center py-4">
                      <UsersIcon size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">No new users found</p>
                    </div> : newUsers.map(user => <div key={user.id} className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.avatar ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" /> : <span className="text-gray-600">
                              {user.name.charAt(0)}
                            </span>}
                        </div>
                        <div className="ml-3 flex-1">
                          <Link to={`/admin/users/${user.id}`} className="font-medium text-gray-800 hover:text-purple-600">
                            {user.name}
                          </Link>
                          <div className="text-xs text-gray-500">
                            Joined: {user.joined}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-600">
                          {user.completed}{' '}
                          <span className="text-xs">courses</span>
                        </div>
                      </div>)}
                  <Link to="/admin/users" className="w-full block mt-2 text-center text-sm text-purple-600 hover:text-purple-800 font-medium">
                    View all users
                  </Link>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Alerts</h2>
                  <div className="p-2 bg-red-100 text-red-600 rounded-full">
                    <BellIcon size={20} />
                  </div>
                </div>
                <div className="space-y-4">
                  {notifications.length === 0 ? <div className="text-center py-4">
                      <AlertCircleIcon size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">No alerts found</p>
                    </div> : notifications.map(notification => <div key={notification.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-start">
                          <div className={`h-2 w-2 rounded-full mt-1.5 mr-2 ${notification.priority === 'high' ? 'bg-red-500' : notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                          <div>
                            <div className="text-sm text-gray-800">
                              {notification.message}
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <CalendarIcon size={12} className="mr-1" />
                              {notification.time}
                            </div>
                          </div>
                        </div>
                      </div>)}
                  <Link to="/admin/notifications" className="w-full block mt-2 text-center text-sm text-purple-600 hover:text-purple-800 font-medium">
                    View all notifications
                  </Link>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    Platform Health
                  </h2>
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                    <BarChart2Icon size={20} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">System Status</span>
                    <span className="flex items-center text-sm font-medium text-green-600">
                      <CheckCircleIcon size={16} className="mr-1" />
                      Operational
                    </span>
                  </div>
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Database Usage
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      42%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{
                  width: '42%'
                }}></div>
                  </div>
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Storage Usage</span>
                    <span className="text-sm font-medium text-gray-800">
                      28%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{
                  width: '28%'
                }}></div>
                  </div>
                  <Link to="/admin/settings" className="w-full block mt-3 text-center text-sm text-purple-600 hover:text-purple-800 font-medium">
                    View system settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>}
    </DashboardLayout>;
};