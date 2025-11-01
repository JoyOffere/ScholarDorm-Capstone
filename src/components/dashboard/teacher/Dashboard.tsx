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
      // Mock data for now - replace with actual API calls
      setStats({
        totalStudents: 45,
        totalCourses: 8,
        totalQuizzes: 24,
        averageScore: 78,
        pendingAssignments: 12,
        activeStudents: 38
      });
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Mock data for now - replace with actual API calls
      setRecentActivity([
        {
          id: '1',
          type: 'quiz_submission',
          student: 'John Doe',
          description: 'Completed Mathematics Quiz 5',
          timestamp: '2024-01-15T10:30:00Z',
          status: 'completed'
        },
        {
          id: '2',
          type: 'question',
          student: 'Jane Smith',
          description: 'Asked about RSL signs in lesson 3',
          timestamp: '2024-01-15T09:15:00Z',
          status: 'needs_review'
        },
        {
          id: '3',
          type: 'course_completion',
          student: 'Mike Johnson',
          description: 'Finished Basic Algebra course',
          timestamp: '2024-01-14T16:45:00Z',
          status: 'completed'
        }
      ]);
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
      trend: '+5',
      trendColor: 'text-green-500',
    },
    {
      title: 'Active Courses',
      value: stats.totalCourses,
      icon: <BookOpen size={24} />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      subtext: 'Published courses',
      trend: '+2',
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
      trend: '+8',
      trendColor: 'text-green-500',
    },
    {
      title: 'Average Score',
      value: `${stats.averageScore}%`,
      icon: <BarChart3 size={24} />,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      subtext: 'Class performance',
      trend: '+3%',
      trendColor: 'text-green-500',
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