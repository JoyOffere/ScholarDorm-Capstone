import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, ClipboardList, BarChart3, Bell, TrendingUp,
  ArrowRightIcon, GraduationCapIcon, MessageSquareIcon,
  CalendarIcon, CheckCircleIcon, AlertCircleIcon, StarIcon,
  FileTextIcon, VideoIcon, AwardIcon, ActivityIcon, PlusIcon
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { DashboardLayout } from '../../layout/DashboardLayout';

interface TeacherStats {
  totalStudents: number;
  totalCourses: number;
  totalQuizzes: number;
  averageScore: number;
  pendingAssignments: number;
  activeStudents: number;
}

interface RecentActivity {
  id: string;
  type: 'quiz_submission' | 'course_completion' | 'question' | 'assignment';
  student: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'needs_review';
}

export const TeacherDashboard = () => {
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalQuizzes: 0,
    averageScore: 0,
    pendingAssignments: 0,
    activeStudents: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeacherStats();
    fetchRecentActivity();
  }, []);

  const fetchTeacherStats = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        return;
      }

      // Fetch teacher dashboard summary from our database view
      const { data: dashboardData, error: dashboardError } = await supabase
        .from('teacher_dashboard_summary')
        .select('*')
        .eq('teacher_id', user.id)
        .single();

      if (dashboardError) {
        console.error('Error fetching dashboard data:', dashboardError);
        return;
      }

      // Fetch additional stats
      const { data: courseStats, error: courseError } = await supabase
        .from('teacher_course_analytics')
        .select('average_quiz_score, total_quiz_attempts')
        .eq('teacher_id', user.id);

      if (courseError) {
        console.error('Error fetching course stats:', courseError);
      }

      // Calculate average score from course analytics
      const avgScore = courseStats && courseStats.length > 0 
        ? Math.round(courseStats.reduce((sum, course) => sum + (course.average_quiz_score || 0), 0) / courseStats.length)
        : 0;

      // Fetch pending assignments (gradebook entries without grades)
      const { data: pendingData, error: pendingError } = await supabase
        .from('teacher_gradebook')
        .select('id')
        .eq('teacher_id', user.id)
        .is('points_earned', null);

      const pendingCount = pendingData?.length || 0;

      setStats({
        totalStudents: dashboardData?.total_students || 0,
        totalCourses: dashboardData?.assigned_courses || 0,
        totalQuizzes: dashboardData?.created_quizzes || 0,
        averageScore: avgScore,
        pendingAssignments: pendingCount,
        activeStudents: dashboardData?.active_students || 0
      });

    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        return;
      }

      // Fetch recent student progress from our teacher view
      const { data: progressData, error: progressError } = await supabase
        .from('teacher_student_progress_view')
        .select(`
          student_name,
          course_title,
          progress_percentage,
          course_completed,
          last_accessed,
          average_quiz_score
        `)
        .eq('teacher_id', user.id)
        .order('last_accessed', { ascending: false, nullsFirst: false })
        .limit(10);

      if (progressError) {
        console.error('Error fetching progress data:', progressError);
      }

      // Fetch recent quiz attempts
      const { data: quizData, error: quizError } = await supabase
        .rpc('get_teacher_recent_quiz_attempts', { teacher_uuid: user.id });

      if (quizError) {
        console.error('Error fetching quiz data:', quizError);
      }

      // Fetch recent messages as activity
      const { data: messagesData, error: messagesError } = await supabase
        .from('teacher_messages')
        .select(`
          id,
          subject,
          created_at,
          is_read,
          student_id,
          users!student_id(full_name)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (messagesError) {
        console.error('Error fetching messages data:', messagesError);
      }

      // Convert to activity format
      const activities: RecentActivity[] = [];

      // Add progress activities
      if (progressData) {
        progressData.forEach((progress, index) => {
          if (progress.course_completed) {
            activities.push({
              id: `progress-${index}`,
              type: 'course_completion',
              student: progress.student_name,
              description: `Completed ${progress.course_title}`,
              timestamp: progress.last_accessed || new Date().toISOString(),
              status: 'completed'
            });
          } else if (progress.progress_percentage > 0) {
            activities.push({
              id: `progress-update-${index}`,
              type: 'assignment',
              student: progress.student_name,
              description: `${Math.round(progress.progress_percentage)}% progress in ${progress.course_title}`,
              timestamp: progress.last_accessed || new Date().toISOString(),
              status: 'pending'
            });
          }
        });
      }

      // Add quiz activities
      if (quizData) {
        quizData.forEach((quiz: any) => {
          activities.push({
            id: `quiz-${quiz.id}`,
            type: 'quiz_submission',
            student: quiz.student_name,
            description: `Completed "${quiz.quiz_title}" - ${Math.round(quiz.percentage)}%`,
            timestamp: quiz.completed_at,
            status: quiz.is_passed ? 'completed' : 'needs_review'
          });
        });
      }

      // Add message activities
      if (messagesData) {
        messagesData.forEach((message: any) => {
          activities.push({
            id: `message-${message.id}`,
            type: 'question',
            student: message.users?.full_name || 'Unknown Student',
            description: message.subject,
            timestamp: message.created_at,
            status: message.is_read ? 'completed' : 'needs_review'
          });
        });
      }

      // Sort by timestamp and take the most recent
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);

      setRecentActivity(sortedActivities);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setIsLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: <Users size={24} />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      subtext: 'Enrolled students',
      trend: `${stats.activeStudents} active`,
      trendColor: 'text-blue-500',
    },
    {
      title: 'Active Courses',
      value: stats.totalCourses,
      icon: <BookOpen size={24} />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      subtext: 'Assigned courses',
      trend: 'Teaching now',
      trendColor: 'text-green-500',
    },
    {
      title: 'Quizzes Created',
      value: stats.totalQuizzes,
      icon: <ClipboardList size={24} />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      subtext: 'Assessment tools',
      trend: 'Available',
      trendColor: 'text-purple-500',
    },
    {
      title: 'Average Score',
      value: stats.averageScore > 0 ? `${stats.averageScore}%` : 'N/A',
      icon: <BarChart3 size={24} />,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      subtext: 'Class performance',
      trend: stats.pendingAssignments > 0 ? `${stats.pendingAssignments} pending` : 'Up to date',
      trendColor: stats.pendingAssignments > 0 ? 'text-orange-500' : 'text-green-500',
    }
  ];

  const quickActions = [
    {
      title: 'Create Quiz',
      description: 'Design new assessments',
      icon: <ClipboardList size={20} />,
      to: '/teacher/quizzes/create',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Add Content',
      description: 'Upload course materials',
      icon: <BookOpen size={20} />,
      to: '/teacher/content/create',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'RSL Videos',
      description: 'Manage sign language content',
      icon: <VideoIcon size={20} />,
      to: '/teacher/rsl-content',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Student Progress',
      description: 'View performance reports',
      icon: <BarChart3 size={20} />,
      to: '/teacher/progress',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz_submission':
        return <ClipboardList size={16} className="text-blue-600" />;
      case 'course_completion':
        return <CheckCircleIcon size={16} className="text-green-600" />;
      case 'question':
        return <MessageSquareIcon size={16} className="text-purple-600" />;
      case 'assignment':
        return <FileTextIcon size={16} className="text-orange-600" />;
      default:
        return <ActivityIcon size={16} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full">Pending</span>;
      case 'needs_review':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Needs Review</span>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout role="teacher" title="Teacher Dashboard">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600">Manage your courses and track student progress</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/teacher/content/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <PlusIcon size={16} />
              <span>Add Content</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <div className={card.textColor}>{card.icon}</div>
                </div>
                <div className={`flex items-center text-sm ${card.trendColor}`}>
                  <TrendingUp size={14} className="mr-1" />
                  {card.trend}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-xs text-gray-500">{card.subtext}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.to}
                className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group"
              >
                <div className={`inline-flex p-2 rounded-lg text-white mb-3 ${action.color}`}>
                  {action.icon}
                </div>
                <h3 className="font-medium text-gray-900 group-hover:text-gray-700 mb-1">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity & Pending Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Link
                to="/teacher/activity"
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
              >
                View all
                <ArrowRightIcon size={14} className="ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.student}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Items */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Pending Reviews</h2>
              <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                {stats.pendingAssignments}
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertCircleIcon size={16} className="text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Quiz submissions waiting</p>
                  <p className="text-xs text-gray-600">8 students submitted Math Quiz 5</p>
                </div>
                <Link
                  to="/teacher/quizzes/review"
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  Review
                </Link>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <MessageSquareIcon size={16} className="text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Student questions</p>
                  <p className="text-xs text-gray-600">4 new questions about RSL signs</p>
                </div>
                <Link
                  to="/teacher/messages"
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  Answer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};