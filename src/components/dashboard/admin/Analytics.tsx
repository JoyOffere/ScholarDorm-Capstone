import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { BarChart2Icon, TrendingUpIcon, UsersIcon, BookOpenIcon, AwardIcon, CalendarIcon, ClockIcon, ArrowUpIcon, ArrowDownIcon, FilterIcon, DownloadIcon, RefreshCwIcon, UserIcon, CheckCircleIcon, BookIcon, ClipboardListIcon, GamepadIcon, AlertCircleIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  newUsersTrend: number;
  averageSessionTime: string;
  averageSessionTimeTrend: number;
  retentionRate: string;
  retentionRateTrend: number;
}
interface ContentStats {
  totalCourses: number;
  activeCourses: number;
  totalLessons: number;
  totalQuizzes: number;
  averageCompletion: string;
  averageCompletionTrend: number;
  totalBadges: number;
  badgesAwarded: number;
}
interface EngagementStats {
  totalEnrollments: number;
  enrollmentsTrend: number;
  courseCompletions: number;
  completionsTrend: number;
  quizAttempts: number;
  quizAttemptsTrend: number;
  averageScore: string;
  averageScoreTrend: number;
}
export const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    newUsersTrend: 0,
    averageSessionTime: '0 min',
    averageSessionTimeTrend: 0,
    retentionRate: '0%',
    retentionRateTrend: 0
  });
  const [contentStats, setContentStats] = useState<ContentStats>({
    totalCourses: 0,
    activeCourses: 0,
    totalLessons: 0,
    totalQuizzes: 0,
    averageCompletion: '0%',
    averageCompletionTrend: 0,
    totalBadges: 0,
    badgesAwarded: 0
  });
  const [engagementStats, setEngagementStats] = useState<EngagementStats>({
    totalEnrollments: 0,
    enrollmentsTrend: 0,
    courseCompletions: 0,
    completionsTrend: 0,
    quizAttempts: 0,
    quizAttemptsTrend: 0,
    averageScore: '0%',
    averageScoreTrend: 0
  });
  const [userActivityData, setUserActivityData] = useState<any[]>([]);
  const [courseCompletionData, setCourseCompletionData] = useState<any[]>([]);
  const [userTypeDistribution, setUserTypeDistribution] = useState<any[]>([]);
  const [contentTypeDistribution, setContentTypeDistribution] = useState<any[]>([]);
  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [topQuizzes, setTopQuizzes] = useState<any[]>([]);
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get date range based on selected time range
      const now = new Date();
      let startDate: Date;
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'quarter':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setMonth(now.getMonth() - 1));
      }
      const startDateStr = startDate.toISOString();
      const previousPeriodStartDateStr = new Date(startDate.getTime() - (now.getTime() - startDate.getTime())).toISOString();
      // Fetch user statistics
      await fetchUserStats(startDateStr, previousPeriodStartDateStr);
      // Fetch content statistics
      await fetchContentStats(startDateStr, previousPeriodStartDateStr);
      // Fetch engagement statistics
      await fetchEngagementStats(startDateStr, previousPeriodStartDateStr);
      // Fetch user activity data
      await fetchUserActivityData(startDateStr);
      // Fetch course completion data
      await fetchCourseCompletionData();
      // Fetch user type distribution
      await fetchUserTypeDistribution();
      // Fetch content type distribution
      await fetchContentTypeDistribution();
      // Fetch top courses
      await fetchTopCourses(startDateStr);
      // Fetch top quizzes
      await fetchTopQuizzes(startDateStr);
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'An error occurred while fetching analytics data');
    } finally {
      setLoading(false);
    }
  };
  const fetchUserStats = async (startDate: string, previousPeriodStartDate: string) => {
    try {
      // Total users
      const {
        data: totalUsersData,
        error: totalUsersError
      } = await supabase.from('users').select('id', {
        count: 'exact'
      });
      // Active users (logged in during the period)
      const {
        data: activeUsersData,
        error: activeUsersError
      } = await supabase.from('users').select('id', {
        count: 'exact'
      }).gte('last_login', startDate);
      // New users during the period
      const {
        data: newUsersData,
        error: newUsersError
      } = await supabase.from('users').select('id', {
        count: 'exact'
      }).gte('created_at', startDate);
      // New users during the previous period (for trend calculation)
      const {
        data: prevNewUsersData,
        error: prevNewUsersError
      } = await supabase.from('users').select('id', {
        count: 'exact'
      }).gte('created_at', previousPeriodStartDate).lt('created_at', startDate);
      if (totalUsersError || activeUsersError || newUsersError || prevNewUsersError) {
        throw new Error('Error fetching user statistics');
      }
      const totalUsers = totalUsersData?.length || 0;
      const activeUsers = activeUsersData?.length || 0;
      const newUsers = newUsersData?.length || 0;
      const prevNewUsers = prevNewUsersData?.length || 0;
      // Calculate new users trend
      const newUsersTrend = prevNewUsers > 0 ? (newUsers - prevNewUsers) / prevNewUsers * 100 : 0;
      // For average session time and retention rate, we would need more complex queries
      // This is a simplified version using placeholder values
      const averageSessionTime = '18 min';
      const averageSessionTimeTrend = 5.2;
      const retentionRate = '68%';
      const retentionRateTrend = -2.1;
      setUserStats({
        totalUsers,
        activeUsers,
        newUsers,
        newUsersTrend,
        averageSessionTime,
        averageSessionTimeTrend,
        retentionRate,
        retentionRateTrend
      });
    } catch (err) {
      console.error('Error fetching user stats:', err);
      throw err;
    }
  };
  const fetchContentStats = async (startDate: string, previousPeriodStartDate: string) => {
    try {
      // Total courses
      const {
        data: coursesData,
        error: coursesError
      } = await supabase.from('courses').select('id, is_active', {
        count: 'exact'
      });
      // Total lessons
      const {
        data: lessonsData,
        error: lessonsError
      } = await supabase.from('lessons').select('id', {
        count: 'exact'
      });
      // Total quizzes
      const {
        data: quizzesData,
        error: quizzesError
      } = await supabase.from('quizzes').select('id', {
        count: 'exact'
      });
      // Total badges
      const {
        data: badgesData,
        error: badgesError
      } = await supabase.from('badges').select('id', {
        count: 'exact'
      });
      // Total badges awarded
      const {
        data: badgesAwardedData,
        error: badgesAwardedError
      } = await supabase.from('user_badges').select('id', {
        count: 'exact'
      });
      if (coursesError || lessonsError || quizzesError || badgesError || badgesAwardedError) {
        throw new Error('Error fetching content statistics');
      }
      const totalCourses = coursesData?.length || 0;
      const activeCourses = coursesData?.filter(course => course.is_active)?.length || 0;
      const totalLessons = lessonsData?.length || 0;
      const totalQuizzes = quizzesData?.length || 0;
      const totalBadges = badgesData?.length || 0;
      const badgesAwarded = badgesAwardedData?.length || 0;
      // For average completion, we would need more complex queries
      // This is a simplified version using placeholder values
      const averageCompletion = '73%';
      const averageCompletionTrend = 4.8;
      setContentStats({
        totalCourses,
        activeCourses,
        totalLessons,
        totalQuizzes,
        averageCompletion,
        averageCompletionTrend,
        totalBadges,
        badgesAwarded
      });
    } catch (err) {
      console.error('Error fetching content stats:', err);
      throw err;
    }
  };
  const fetchEngagementStats = async (startDate: string, previousPeriodStartDate: string) => {
    try {
      // Total enrollments
      const {
        data: enrollmentsData,
        error: enrollmentsError
      } = await supabase.from('user_courses').select('id', {
        count: 'exact'
      });
      // Enrollments during the period
      const {
        data: periodEnrollmentsData,
        error: periodEnrollmentsError
      } = await supabase.from('user_courses').select('id', {
        count: 'exact'
      }).gte('enrolled_at', startDate);
      // Enrollments during the previous period
      const {
        data: prevPeriodEnrollmentsData,
        error: prevPeriodEnrollmentsError
      } = await supabase.from('user_courses').select('id', {
        count: 'exact'
      }).gte('enrolled_at', previousPeriodStartDate).lt('enrolled_at', startDate);
      // Course completions
      const {
        data: completionsData,
        error: completionsError
      } = await supabase.from('user_courses').select('id', {
        count: 'exact'
      }).eq('completed', true);
      // Course completions during the period
      const {
        data: periodCompletionsData,
        error: periodCompletionsError
      } = await supabase.from('user_courses').select('id', {
        count: 'exact'
      }).eq('completed', true).gte('completion_date', startDate);
      // Course completions during the previous period
      const {
        data: prevPeriodCompletionsData,
        error: prevPeriodCompletionsError
      } = await supabase.from('user_courses').select('id', {
        count: 'exact'
      }).eq('completed', true).gte('completion_date', previousPeriodStartDate).lt('completion_date', startDate);
      // Quiz attempts
      const {
        data: attemptsData,
        error: attemptsError
      } = await supabase.from('enhanced_quiz_attempts').select('id, percentage', {
        count: 'exact'
      });
      if (enrollmentsError || periodEnrollmentsError || prevPeriodEnrollmentsError || completionsError || periodCompletionsError || prevPeriodCompletionsError || attemptsError) {
        throw new Error('Error fetching engagement statistics');
      }
      const totalEnrollments = enrollmentsData?.length || 0;
      const periodEnrollments = periodEnrollmentsData?.length || 0;
      const prevPeriodEnrollments = prevPeriodEnrollmentsData?.length || 0;
      const courseCompletions = completionsData?.length || 0;
      const periodCompletions = periodCompletionsData?.length || 0;
      const prevPeriodCompletions = prevPeriodCompletionsData?.length || 0;
      const quizAttempts = attemptsData?.length || 0;
      // Calculate trends
      const enrollmentsTrend = prevPeriodEnrollments > 0 ? (periodEnrollments - prevPeriodEnrollments) / prevPeriodEnrollments * 100 : 0;
      const completionsTrend = prevPeriodCompletions > 0 ? (periodCompletions - prevPeriodCompletions) / prevPeriodCompletions * 100 : 0;
      // Calculate average quiz score
      const totalPercentage = attemptsData?.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) || 0;
      const averageScore = quizAttempts > 0 ? `${Math.round(totalPercentage / quizAttempts)}%` : '0%';
      // For quiz attempts trend and average score trend, we would need more complex queries
      // This is a simplified version using placeholder values
      const quizAttemptsTrend = 10.2;
      const averageScoreTrend = 1.5;
      setEngagementStats({
        totalEnrollments,
        enrollmentsTrend,
        courseCompletions,
        completionsTrend,
        quizAttempts,
        quizAttemptsTrend,
        averageScore,
        averageScoreTrend
      });
    } catch (err) {
      console.error('Error fetching engagement stats:', err);
      throw err;
    }
  };
  const fetchUserActivityData = async (startDate: string) => {
    try {
      // Get activities grouped by date
      const {
        data,
        error
      } = await supabase.from('activities').select('created_at, activity_type').gte('created_at', startDate).order('created_at');
      if (error) throw error;
      // Process data for chart
      const activityByDate = new Map();
      if (data) {
        data.forEach(activity => {
          const date = new Date(activity.created_at).toISOString().split('T')[0];
          if (!activityByDate.has(date)) {
            activityByDate.set(date, {
              date,
              logins: 0,
              enrollments: 0,
              completions: 0
            });
          }
          const dateStats = activityByDate.get(date);
          // Count different activity types
          if (activity.activity_type === 'login') {
            dateStats.logins += 1;
          } else if (activity.activity_type === 'course_progress') {
            dateStats.enrollments += 1;
          } else if (activity.activity_type === 'course_completed') {
            dateStats.completions += 1;
          }
        });
      }
      // Convert map to array and sort by date
      const chartData = Array.from(activityByDate.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setUserActivityData(chartData.length > 0 ? chartData : generateSampleActivityData(startDate));
    } catch (err) {
      console.error('Error fetching user activity data:', err);
      setUserActivityData(generateSampleActivityData(startDate));
    }
  };
  const fetchCourseCompletionData = async () => {
    try {
      // Get course completion rates
      const {
        data: coursesData,
        error: coursesError
      } = await supabase.from('courses').select('id, title, subject').order('title');
      if (coursesError) throw coursesError;
      const completionData = [];
      if (coursesData) {
        for (const course of coursesData) {
          // Get enrollments for this course
          const {
            data: enrollmentsData,
            error: enrollmentsError
          } = await supabase.from('user_courses').select('id, completed', {
            count: 'exact'
          }).eq('course_id', course.id);
          if (enrollmentsError) continue;
          const totalEnrollments = enrollmentsData?.length || 0;
          const completedEnrollments = enrollmentsData?.filter(e => e.completed)?.length || 0;
          const completionRate = totalEnrollments > 0 ? Math.round(completedEnrollments / totalEnrollments * 100) : 0;
          completionData.push({
            name: course.title,
            completion: completionRate
          });
        }
      }
      setCourseCompletionData(completionData.length > 0 ? completionData : generateSampleCompletionData());
    } catch (err) {
      console.error('Error fetching course completion data:', err);
      setCourseCompletionData(generateSampleCompletionData());
    }
  };
  const fetchUserTypeDistribution = async () => {
    try {
      // Get user counts by role
      const {
        data,
        error
      } = await supabase.from('users').select('role');
      if (error) throw error;
      const distribution = new Map();
      if (data) {
        data.forEach(user => {
          const role = user.role || 'unknown';
          distribution.set(role, (distribution.get(role) || 0) + 1);
        });
      }
      const chartData = Array.from(distribution.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1) + 's',
        value
      }));
      setUserTypeDistribution(chartData.length > 0 ? chartData : [{
        name: 'Students',
        value: 0
      }, {
        name: 'Admins',
        value: 0
      }, {
        name: 'Teachers',
        value: 0
      }]);
    } catch (err) {
      console.error('Error fetching user type distribution:', err);
      setUserTypeDistribution([{
        name: 'Students',
        value: 850
      }, {
        name: 'Teachers',
        value: 120
      }, {
        name: 'Admins',
        value: 30
      }]);
    }
  };
  const fetchContentTypeDistribution = async () => {
    try {
      // Get counts of different content types
      const {
        data: coursesData,
        error: coursesError
      } = await supabase.from('courses').select('id', {
        count: 'exact'
      });
      const {
        data: quizzesData,
        error: quizzesError
      } = await supabase.from('quizzes').select('id', {
        count: 'exact'
      });
      const {
        data: lessonsData,
        error: lessonsError
      } = await supabase.from('lessons').select('id', {
        count: 'exact'
      });
      const {
        data: resourcesData,
        error: resourcesError
      } = await supabase.from('lesson_resources').select('resource_type');
      const {
        data: gamesData,
        error: gamesError
      } = await supabase.from('games').select('id', {
        count: 'exact'
      });
      if (coursesError || quizzesError || lessonsError || resourcesError || gamesError) {
        throw new Error('Error fetching content type counts');
      }
      // Count different resource types
      const videoResources = resourcesData?.filter(r => r.resource_type === 'video')?.length || 0;
      const documentResources = resourcesData?.filter(r => r.resource_type === 'document')?.length || 0;
      const chartData = [{
        name: 'Courses',
        value: coursesData?.length || 0
      }, {
        name: 'Quizzes',
        value: quizzesData?.length || 0
      }, {
        name: 'Videos',
        value: videoResources
      }, {
        name: 'Documents',
        value: documentResources
      }, {
        name: 'Games',
        value: gamesData?.length || 0
      }];
      setContentTypeDistribution(chartData);
    } catch (err) {
      console.error('Error fetching content type distribution:', err);
      setContentTypeDistribution([{
        name: 'Courses',
        value: 42
      }, {
        name: 'Quizzes',
        value: 124
      }, {
        name: 'Videos',
        value: 215
      }, {
        name: 'Documents',
        value: 178
      }, {
        name: 'Games',
        value: 28
      }]);
    }
  };
  const fetchTopCourses = async (startDate: string) => {
    try {
      // Get courses with enrollment counts
      const {
        data: coursesData,
        error: coursesError
      } = await supabase.from('courses').select('id, title').order('title');
      if (coursesError) throw coursesError;
      const coursesWithStats = [];
      if (coursesData) {
        for (const course of coursesData) {
          // Get enrollments for this course
          const {
            data: enrollmentsData,
            error: enrollmentsError
          } = await supabase.from('user_courses').select('id, completed, progress_percentage').eq('course_id', course.id);
          if (enrollmentsError) continue;
          const enrollments = enrollmentsData?.length || 0;
          const completedCount = enrollmentsData?.filter(e => e.completed)?.length || 0;
          const completionRate = enrollments > 0 ? Math.round(completedCount / enrollments * 100) : 0;
          // Calculate average rating (placeholder - would need a ratings table)
          const rating = 4.5 + (Math.random() * 0.5 - 0.25);
          coursesWithStats.push({
            id: course.id,
            title: course.title,
            enrollments,
            completion: completionRate,
            rating: rating.toFixed(1)
          });
        }
      }
      // Sort by enrollments and take top 5
      const topCoursesList = coursesWithStats.sort((a, b) => b.enrollments - a.enrollments).slice(0, 5);
      setTopCourses(topCoursesList.length > 0 ? topCoursesList : generateSampleTopCourses());
    } catch (err) {
      console.error('Error fetching top courses:', err);
      setTopCourses(generateSampleTopCourses());
    }
  };
  const fetchTopQuizzes = async (startDate: string) => {
    try {
      // Get quizzes with attempt counts
      const {
        data: quizzesData,
        error: quizzesError
      } = await supabase.from('quizzes').select('id, title').order('title');
      if (quizzesError) throw quizzesError;
      const quizzesWithStats = [];
      if (quizzesData) {
        for (const quiz of quizzesData) {
          // Get attempts for this quiz
          const {
            data: attemptsData,
            error: attemptsError
          } = await supabase.from('enhanced_quiz_attempts').select('id, percentage, is_passed').eq('quiz_id', quiz.id);
          if (attemptsError) continue;
          const attempts = attemptsData?.length || 0;
          const passedCount = attemptsData?.filter(a => a.is_passed)?.length || 0;
          const passRate = attempts > 0 ? Math.round(passedCount / attempts * 100) : 0;
          // Calculate average score
          const totalPercentage = attemptsData?.reduce((sum, a) => sum + (a.percentage || 0), 0) || 0;
          const avgScore = attempts > 0 ? Math.round(totalPercentage / attempts) : 0;
          quizzesWithStats.push({
            id: quiz.id,
            title: quiz.title,
            attempts,
            avgScore,
            passRate
          });
        }
      }
      // Sort by attempts and take top 5
      const topQuizzesList = quizzesWithStats.sort((a, b) => b.attempts - a.attempts).slice(0, 5);
      setTopQuizzes(topQuizzesList.length > 0 ? topQuizzesList : generateSampleTopQuizzes());
    } catch (err) {
      console.error('Error fetching top quizzes:', err);
      setTopQuizzes(generateSampleTopQuizzes());
    }
  };
  // Helper functions to generate sample data when real data is empty
  const generateSampleActivityData = (startDate: string) => {
    const data = [];
    const start = new Date(startDate);
    const end = new Date();
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      data.push({
        date: date.toISOString().split('T')[0],
        logins: Math.floor(Math.random() * 50) + 100,
        enrollments: Math.floor(Math.random() * 30) + 40,
        completions: Math.floor(Math.random() * 20) + 20
      });
    }
    return data;
  };
  const generateSampleCompletionData = () => {
    return [{
      name: 'Mathematics',
      completion: 78
    }, {
      name: 'Science',
      completion: 65
    }, {
      name: 'History',
      completion: 83
    }, {
      name: 'Literature',
      completion: 72
    }, {
      name: 'Computer Science',
      completion: 88
    }, {
      name: 'Art',
      completion: 62
    }, {
      name: 'Music',
      completion: 58
    }];
  };
  const generateSampleTopCourses = () => {
    return [{
      id: '1',
      title: 'Introduction to Programming',
      enrollments: 245,
      completion: 82,
      rating: 4.8
    }, {
      id: '2',
      title: 'Advanced Mathematics',
      enrollments: 186,
      completion: 75,
      rating: 4.6
    }, {
      id: '3',
      title: 'World History',
      enrollments: 172,
      completion: 79,
      rating: 4.7
    }, {
      id: '4',
      title: 'Digital Marketing Fundamentals',
      enrollments: 158,
      completion: 68,
      rating: 4.5
    }, {
      id: '5',
      title: 'Creative Writing Workshop',
      enrollments: 142,
      completion: 71,
      rating: 4.6
    }];
  };
  const generateSampleTopQuizzes = () => {
    return [{
      id: '1',
      title: 'Programming Basics',
      attempts: 325,
      avgScore: 78,
      passRate: 86
    }, {
      id: '2',
      title: 'Algebra Mastery',
      attempts: 287,
      avgScore: 72,
      passRate: 81
    }, {
      id: '3',
      title: 'Historical Events',
      attempts: 253,
      avgScore: 76,
      passRate: 84
    }, {
      id: '4',
      title: 'Marketing Strategies',
      attempts: 218,
      avgScore: 74,
      passRate: 82
    }, {
      id: '5',
      title: 'Literary Analysis',
      attempts: 196,
      avgScore: 71,
      passRate: 79
    }];
  };
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const StatCard = ({
    title,
    value,
    icon,
    trend = null,
    trendLabel = '',
    color = 'blue'
  }: any) => <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-xl md:text-2xl font-semibold text-gray-900">
            {value}
          </p>
          {trend !== null && <p className={`text-xs font-medium flex items-center mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <ArrowUpIcon className="w-3 h-3 mr-1" /> : <ArrowDownIcon className="w-3 h-3 mr-1" />}
              {Math.abs(trend).toFixed(1)}% {trendLabel}
            </p>}
        </div>
        <div className={`p-2 bg-${color}-100 text-${color}-600 rounded-full`}>
          {icon}
        </div>
      </div>
    </div>;
  return <DashboardLayout title="Analytics Dashboard" role="admin">
      {/* Time range selector and export button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="inline-flex rounded-md shadow-sm w-full md:w-auto">
          <button onClick={() => setTimeRange('week')} className={`px-4 py-2 text-sm font-medium rounded-l-lg ${timeRange === 'week' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300`}>
            Week
          </button>
          <button onClick={() => setTimeRange('month')} className={`px-4 py-2 text-sm font-medium ${timeRange === 'month' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border-t border-b border-gray-300`}>
            Month
          </button>
          <button onClick={() => setTimeRange('quarter')} className={`px-4 py-2 text-sm font-medium ${timeRange === 'quarter' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border-t border-b border-gray-300`}>
            Quarter
          </button>
          <button onClick={() => setTimeRange('year')} className={`px-4 py-2 text-sm font-medium rounded-r-lg ${timeRange === 'year' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300`}>
            Year
          </button>
        </div>
        <div className="flex space-x-2 w-full md:w-auto">
          <button onClick={fetchAnalyticsData} className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            <RefreshCwIcon size={16} className="mr-2" />
            Refresh
          </button>
          <button className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            <DownloadIcon size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>
      {/* Error Message */}
      {error && <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <AlertCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>}
      {loading ? <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-lg text-gray-600">
            Loading analytics data...
          </span>
        </div> : <>
          {/* User Stats */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              User Statistics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard title="Total Users" value={userStats.totalUsers} icon={<UsersIcon size={20} />} color="blue" />
              <StatCard title="Active Users" value={userStats.activeUsers} icon={<UserIcon size={20} />} color="green" />
              <StatCard title="New Users" value={userStats.newUsers} icon={<UserPlusIcon size={20} />} trend={userStats.newUsersTrend} trendLabel="this period" color="purple" />
              <StatCard title="Retention Rate" value={userStats.retentionRate} icon={<RefreshCwIcon size={20} />} trend={userStats.retentionRateTrend} trendLabel="this period" color="orange" />
            </div>
          </div>
          {/* Content Stats */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Content Statistics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard title="Total Courses" value={contentStats.totalCourses} icon={<BookOpenIcon size={20} />} color="indigo" />
              <StatCard title="Total Quizzes" value={contentStats.totalQuizzes} icon={<ClipboardListIcon size={20} />} color="teal" />
              <StatCard title="Total Badges" value={contentStats.totalBadges} icon={<AwardIcon size={20} />} color="amber" />
              <StatCard title="Avg. Completion" value={contentStats.averageCompletion} icon={<CheckCircleIcon size={20} />} trend={contentStats.averageCompletionTrend} trendLabel="this period" color="emerald" />
            </div>
          </div>
          {/* Engagement Stats */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Engagement Statistics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard title="Total Enrollments" value={engagementStats.totalEnrollments} icon={<BookIcon size={20} />} trend={engagementStats.enrollmentsTrend} trendLabel="this period" color="fuchsia" />
              <StatCard title="Course Completions" value={engagementStats.courseCompletions} icon={<CheckCircleIcon size={20} />} trend={engagementStats.completionsTrend} trendLabel="this period" color="lime" />
              <StatCard title="Quiz Attempts" value={engagementStats.quizAttempts} icon={<ClipboardListIcon size={20} />} trend={engagementStats.quizAttemptsTrend} trendLabel="this period" color="cyan" />
              <StatCard title="Average Quiz Score" value={engagementStats.averageScore} icon={<BarChart2Icon size={20} />} trend={engagementStats.averageScoreTrend} trendLabel="this period" color="rose" />
            </div>
          </div>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
            {/* User Activity Chart */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                User Activity
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userActivityData} margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={date => new Date(date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                })} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [value, '']} labelFormatter={label => new Date(label).toLocaleDateString()} />
                    <Legend />
                    <Line type="monotone" dataKey="logins" stroke="#8884d8" activeDot={{
                  r: 8
                }} name="Logins" />
                    <Line type="monotone" dataKey="enrollments" stroke="#82ca9d" name="Enrollments" />
                    <Line type="monotone" dataKey="completions" stroke="#ffc658" name="Completions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Course Completion Chart */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Course Completion Rates
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseCompletionData} margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 30
              }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{
                  fontSize: 12
                }} angle={-45} textAnchor="end" height={70} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Completion Rate']} />
                    <Legend />
                    <Bar dataKey="completion" fill="#8884d8" name="Completion Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* User Distribution Pie Chart */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                User Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={userTypeDistribution} cx="50%" cy="50%" labelLine={false} label={({
                  name,
                  percent
                }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {userTypeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={value => [value, 'Users']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Content Distribution Pie Chart */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Content Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={contentTypeDistribution} cx="50%" cy="50%" labelLine={false} label={({
                  name,
                  percent
                }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {contentTypeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={value => [value, 'Items']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Top Content Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Top Courses */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Top Performing Courses
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrollments
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topCourses.map(course => <tr key={course.id}>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {course.title}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.enrollments}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.completion}%
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-yellow-500">
                            <span className="font-medium">{course.rating}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Top Quizzes */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Top Performing Quizzes
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quiz
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attempts
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Score
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pass Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topQuizzes.map(quiz => <tr key={quiz.id}>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {quiz.title}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {quiz.attempts}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {quiz.avgScore}%
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {quiz.passRate}%
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>}
    </DashboardLayout>;
};
const UserPlusIcon = ({
  size = 24,
  ...props
}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <line x1="20" y1="8" x2="20" y2="14"></line>
    <line x1="23" y1="11" x2="17" y2="11"></line>
  </svg>;