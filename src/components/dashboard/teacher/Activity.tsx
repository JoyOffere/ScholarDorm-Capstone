import * as React from 'react';
const { useState, useEffect } = React;
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Activity, TrendingUp, Users, BookOpen, Clock,
  MessageSquare, Award, Eye, Filter, Calendar, BarChart3,
  RefreshCw, Download, User, CheckCircle, AlertCircle,
  PlayCircle, FileText, Star, Zap, Target, Globe
} from 'lucide-react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface ActivityItem {
  id: string;
  type: 'lesson_completed' | 'quiz_attempted' | 'quiz_completed' | 'course_enrolled' | 'message_sent' | 'achievement_earned' | 'login' | 'rsl_video_watched';
  description: string;
  timestamp: string;
  student: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  course?: {
    id: string;
    title: string;
  };
  lesson?: {
    id: string;
    title: string;
  };
  quiz?: {
    id: string;
    title: string;
    score?: number;
    max_score?: number;
  };
  metadata?: Record<string, any>;
}

interface ActivityStats {
  total_activities: number;
  unique_students: number;
  lessons_completed: number;
  quizzes_completed: number;
  messages_sent: number;
  avg_engagement_score: number;
}

interface EngagementData {
  date: string;
  activities: number;
  unique_students: number;
}

export const TeacherActivity: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    total_activities: 0,
    unique_students: 0,
    lessons_completed: 0,
    quizzes_completed: 0,
    messages_sent: 0,
    avg_engagement_score: 0
  });
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [selectedActivityType, setSelectedActivityType] = useState<'all' | 'lesson_completed' | 'quiz_attempted' | 'quiz_completed' | 'course_enrolled' | 'message_sent' | 'achievement_earned' | 'login' | 'rsl_video_watched'>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (!user) return;
    fetchCourses();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchActivities();
    fetchStats();
  }, [user, selectedTimeRange]);

  useEffect(() => {
    if (!user) return;

    // Set up real-time subscription
    const subscription = supabase
      .channel('teacher_activities')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'student_activities' },
        () => {
          fetchActivities();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [activities, selectedActivityType, selectedCourse]);

  const fetchCourses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('teacher_course_assignments')
        .select(`
          course_id,
          courses!inner(id, title)
        `)
        .eq('teacher_id', user.id);

      if (error) throw error;

      const courseList = data?.map(item => ({
        id: (item.courses as any).id,
        title: (item.courses as any).title
      })) || [];

      setCourses(courseList);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchActivities = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get teacher's courses
      const { data: teacherCourses } = await supabase
        .from('teacher_course_assignments')
        .select('course_id')
        .eq('teacher_id', user.id);

      const courseIds = teacherCourses?.map(tc => tc.course_id) || [];

      // Early return if no courses assigned
      if (courseIds.length === 0) {
        setActivities([]);
        setFilteredActivities([]);
        setIsLoading(false);
        return;
      }

      // Calculate date filter
      let dateFilter = new Date();
      if (selectedTimeRange === 'today') {
        dateFilter.setHours(0, 0, 0, 0);
      } else if (selectedTimeRange === 'week') {
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (selectedTimeRange === 'month') {
        dateFilter.setMonth(dateFilter.getMonth() - 1);
      } else {
        dateFilter = new Date('2020-01-01'); // Far past date for 'all'
      }

      // Fetch student activities for teacher's courses
      const { data, error } = await supabase
        .from('student_activities')
        .select(`
          id,
          activity_type,
          description,
          created_at,
          metadata,
          student_id,
          course_id,
          lesson_id,
          quiz_id,
          users!student_id(
            id,
            full_name,
            email,
            avatar_url
          ),
          courses(
            id,
            title
          ),
          lessons(
            id,
            title
          ),
          quizzes(
            id,
            title
          )
        `)
        .in('course_id', courseIds)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedActivities: ActivityItem[] = (data || []).map(activity => ({
        id: activity.id,
        type: activity.activity_type,
        description: activity.description,
        timestamp: activity.created_at,
        student: {
          id: (activity.users as any)?.id || '',
          full_name: (activity.users as any)?.full_name || 'Unknown Student',
          email: (activity.users as any)?.email || '',
          avatar_url: (activity.users as any)?.avatar_url
        },
        course: activity.courses ? {
          id: (activity.courses as any).id,
          title: (activity.courses as any).title
        } : undefined,
        lesson: activity.lessons ? {
          id: (activity.lessons as any).id,
          title: (activity.lessons as any).title
        } : undefined,
        quiz: activity.quizzes ? {
          id: (activity.quizzes as any).id,
          title: (activity.quizzes as any).title,
          score: activity.metadata?.score,
          max_score: activity.metadata?.max_score
        } : undefined,
        metadata: activity.metadata
      }));

      setActivities(formattedActivities);
      
      // Generate engagement data for the chart
      generateEngagementData(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get teacher's courses
      const { data: teacherCourses } = await supabase
        .from('teacher_course_assignments')
        .select('course_id')
        .eq('teacher_id', user.id);

      const courseIds = teacherCourses?.map(tc => tc.course_id) || [];

      // Early return if no courses assigned
      if (courseIds.length === 0) {
        setStats({
          total_activities: 0,
          unique_students: 0,
          lessons_completed: 0,
          quizzes_completed: 0,
          messages_sent: 0,
          avg_engagement_score: 0
        });
        return;
      }

      // Calculate date filter
      let dateFilter = new Date();
      if (selectedTimeRange === 'today') {
        dateFilter.setHours(0, 0, 0, 0);
      } else if (selectedTimeRange === 'week') {
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (selectedTimeRange === 'month') {
        dateFilter.setMonth(dateFilter.getMonth() - 1);
      } else {
        dateFilter = new Date('2020-01-01');
      }

      // Get activity counts
      const { data: activityData, error: activityError } = await supabase
        .from('student_activities')
        .select('id, activity_type, student_id')
        .in('course_id', courseIds)
        .gte('created_at', dateFilter.toISOString());

      if (activityError) throw activityError;

      const activities = activityData || [];
      const uniqueStudents = new Set(activities.map(a => a.student_id)).size;
      const lessonsCompleted = activities.filter(a => a.activity_type === 'lesson_completed').length;
      const quizzesCompleted = activities.filter(a => a.activity_type === 'quiz_completed').length;
      const messagesSent = activities.filter(a => a.activity_type === 'message_sent').length;

      // Calculate engagement score (simplified metric)
      const engagementScore = uniqueStudents > 0 ? 
        Math.round((activities.length / uniqueStudents) * 10) / 10 : 0;

      setStats({
        total_activities: activities.length,
        unique_students: uniqueStudents,
        lessons_completed: lessonsCompleted,
        quizzes_completed: quizzesCompleted,
        messages_sent: messagesSent,
        avg_engagement_score: engagementScore
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateEngagementData = (activities: ActivityItem[]) => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayActivities = activities.filter(activity => 
        activity.timestamp.startsWith(dateStr)
      );
      
      const uniqueStudents = new Set(dayActivities.map(a => a.student.id)).size;
      
      last7Days.push({
        date: dateStr,
        activities: dayActivities.length,
        unique_students: uniqueStudents
      });
    }
    
    setEngagementData(last7Days);
  };

  const applyFilters = () => {
    let filtered = [...activities];

    // Activity type filter
    if (selectedActivityType !== 'all') {
      filtered = filtered.filter(activity => activity.type === selectedActivityType);
    }

    // Course filter
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(activity => activity.course?.id === selectedCourse);
    }

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson_completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'quiz_attempted':
        return <FileText className="w-5 h-5 text-yellow-600" />;
      case 'quiz_completed':
        return <Award className="w-5 h-5 text-blue-600" />;
      case 'course_enrolled':
        return <BookOpen className="w-5 h-5 text-purple-600" />;
      case 'message_sent':
        return <MessageSquare className="w-5 h-5 text-indigo-600" />;
      case 'achievement_earned':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'login':
        return <User className="w-5 h-5 text-gray-600" />;
      case 'rsl_video_watched':
        return <PlayCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const exportActivities = () => {
    const csvContent = [
      'Date,Time,Student,Activity Type,Description,Course,Score',
      ...filteredActivities.map(activity => [
        new Date(activity.timestamp).toLocaleDateString(),
        new Date(activity.timestamp).toLocaleTimeString(),
        activity.student.full_name,
        activity.type,
        `"${activity.description}"`,
        activity.course?.title || 'N/A',
        activity.quiz?.score ? `${activity.quiz.score}/${activity.quiz.max_score}` : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-activities-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" title="Student Activity">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading student activities...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" title="Student Activity">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Activity</h1>
              <p className="text-gray-600">Monitor student engagement and progress</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={fetchActivities}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportActivities}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Activities</p>
                <p className="text-xl font-bold text-blue-600">{stats.total_activities}</p>
              </div>
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Active Students</p>
                <p className="text-xl font-bold text-green-600">{stats.unique_students}</p>
              </div>
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Lessons Done</p>
                <p className="text-xl font-bold text-purple-600">{stats.lessons_completed}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Quizzes Done</p>
                <p className="text-xl font-bold text-orange-600">{stats.quizzes_completed}</p>
              </div>
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Messages</p>
                <p className="text-xl font-bold text-indigo-600">{stats.messages_sent}</p>
              </div>
              <MessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Engagement</p>
                <p className="text-xl font-bold text-red-600">{stats.avg_engagement_score}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </motion.div>
        </div>

        {/* Engagement Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity Trend</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {engagementData.map((data, index) => {
              const maxActivities = Math.max(...engagementData.map(d => d.activities), 1);
              const height = (data.activities / maxActivities) * 200;
              
              return (
                <div key={data.date} className="flex-1 flex flex-col items-center">
                  <div className="flex-1 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}px` }}
                      transition={{ delay: index * 0.1 }}
                      className="w-full bg-blue-500 rounded-t min-h-[4px] relative group"
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {data.activities} activities<br />
                        {data.unique_students} students
                      </div>
                    </motion.div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    {new Date(data.date).toLocaleDateString([], { weekday: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
              <select
                value={selectedActivityType}
                onChange={(e) => setSelectedActivityType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Activities</option>
                <option value="lesson_completed">Lesson Completed</option>
                <option value="quiz_attempted">Quiz Attempted</option>
                <option value="quiz_completed">Quiz Completed</option>
                <option value="course_enrolled">Course Enrolled</option>
                <option value="message_sent">Message Sent</option>
                <option value="achievement_earned">Achievement Earned</option>
                <option value="login">Student Login</option>
                <option value="rsl_video_watched">RSL Video Watched</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activities ({filteredActivities.length})
            </h3>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
              <p className="text-gray-600">
                {activities.length === 0 
                  ? "No student activities recorded yet." 
                  : "No activities match your current filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {activity.student.avatar_url ? (
                            <img
                              src={activity.student.avatar_url}
                              alt=""
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-500" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {activity.student.full_name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        {activity.course && (
                          <span className="flex items-center space-x-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{activity.course.title}</span>
                          </span>
                        )}
                        
                        {activity.lesson && (
                          <span className="flex items-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span>{activity.lesson.title}</span>
                          </span>
                        )}
                        
                        {activity.quiz && (
                          <span className="flex items-center space-x-1">
                            <FileText className="w-3 h-3" />
                            <span>
                              {activity.quiz.title}
                              {activity.quiz.score !== undefined && (
                                <span className="ml-1 text-blue-600">
                                  ({activity.quiz.score}/{activity.quiz.max_score})
                                </span>
                              )}
                            </span>
                          </span>
                        )}
                        
                        <span className="capitalize">
                          {activity.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};