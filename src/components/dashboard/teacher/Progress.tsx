import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BarChart3, TrendingUp, Users, Award, Clock, Calendar,
  Search, Filter, Download, Eye, ChevronRight, Target,
  BookOpen, FileQuestion, Video, CheckCircle, XCircle,
  AlertCircle, Star, ArrowUp, ArrowDown, Minus, X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { DashboardLayout } from '../../layout/DashboardLayout';

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  totalCourses: number;
  completedCourses: number;
  currentCourse: string;
  overallProgress: number;
  averageScore: number;
  timeSpent: number; // in minutes
  lastActive: string;
  strengths: string[];
  improvements: string[];
  courseProgress: CourseProgress[];
}

interface CourseProgress {
  courseId: string;
  courseName: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  averageScore: number;
  timeSpent: number;
  lastAccessed: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface ProgressStats {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  averageScore: number;
  totalTimeSpent: number;
  completionRate: number;
}

interface CourseAnalytics {
  courseId: string;
  courseName: string;
  enrolledStudents: number;
  averageProgress: number;
  averageScore: number;
  completionRate: number;
  engagement: 'high' | 'medium' | 'low';
}

export const TeacherProgress = () => {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProgress[]>([]);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [progressFilter, setProgressFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, [selectedTimeRange]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, progressFilter]);

  const fetchProgressData = async () => {
    try {
      // Mock data for now - replace with actual API calls
      const mockStudents: StudentProgress[] = [
        {
          id: '1',
          name: 'Aline Uwimana',
          email: 'aline.uwimana@example.com',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b6bd8db0?w=150',
          totalCourses: 3,
          completedCourses: 1,
          currentCourse: 'Basic Mathematics with RSL',
          overallProgress: 78,
          averageScore: 85,
          timeSpent: 2340, // minutes
          lastActive: '2024-01-16T10:30:00Z',
          strengths: ['Problem Solving', 'RSL Comprehension', 'Mathematical Reasoning'],
          improvements: ['Speed', 'Complex Operations'],
          courseProgress: [
            {
              courseId: '1',
              courseName: 'Basic Mathematics with RSL',
              progress: 85,
              lessonsCompleted: 10,
              totalLessons: 12,
              averageScore: 88,
              timeSpent: 1440,
              lastAccessed: '2024-01-16T10:30:00Z',
              status: 'in_progress'
            },
            {
              courseId: '2',
              courseName: 'Advanced Algebra Concepts',
              progress: 60,
              lessonsCompleted: 9,
              totalLessons: 15,
              averageScore: 82,
              timeSpent: 720,
              lastAccessed: '2024-01-14T14:20:00Z',
              status: 'in_progress'
            },
            {
              courseId: '3',
              courseName: 'Geometry Fundamentals',
              progress: 100,
              lessonsCompleted: 10,
              totalLessons: 10,
              averageScore: 92,
              timeSpent: 180,
              lastAccessed: '2024-01-10T16:45:00Z',
              status: 'completed'
            }
          ]
        },
        {
          id: '2',
          name: 'Jean Baptiste Nzeyimana',
          email: 'jean.nzeyimana@example.com',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          totalCourses: 2,
          completedCourses: 0,
          currentCourse: 'Basic Mathematics with RSL',
          overallProgress: 45,
          averageScore: 72,
          timeSpent: 1890,
          lastActive: '2024-01-15T08:15:00Z',
          strengths: ['Consistency', 'RSL Skills'],
          improvements: ['Mathematical Concepts', 'Problem Analysis'],
          courseProgress: [
            {
              courseId: '1',
              courseName: 'Basic Mathematics with RSL',
              progress: 50,
              lessonsCompleted: 6,
              totalLessons: 12,
              averageScore: 75,
              timeSpent: 1200,
              lastAccessed: '2024-01-15T08:15:00Z',
              status: 'in_progress'
            },
            {
              courseId: '3',
              courseName: 'Geometry Fundamentals',
              progress: 40,
              lessonsCompleted: 4,
              totalLessons: 10,
              averageScore: 68,
              timeSpent: 690,
              lastAccessed: '2024-01-13T11:30:00Z',
              status: 'in_progress'
            }
          ]
        },
        {
          id: '3',
          name: 'Marie Claire Mukamana',
          email: 'marie.mukamana@example.com',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
          totalCourses: 3,
          completedCourses: 2,
          currentCourse: 'Advanced Algebra Concepts',
          overallProgress: 92,
          averageScore: 94,
          timeSpent: 3120,
          lastActive: '2024-01-16T15:45:00Z',
          strengths: ['Excellence', 'Quick Learning', 'Advanced Concepts', 'RSL Fluency'],
          improvements: ['Time Management'],
          courseProgress: [
            {
              courseId: '1',
              courseName: 'Basic Mathematics with RSL',
              progress: 100,
              lessonsCompleted: 12,
              totalLessons: 12,
              averageScore: 96,
              timeSpent: 960,
              lastAccessed: '2024-01-05T12:00:00Z',
              status: 'completed'
            },
            {
              courseId: '2',
              courseName: 'Advanced Algebra Concepts',
              progress: 87,
              lessonsCompleted: 13,
              totalLessons: 15,
              averageScore: 93,
              timeSpent: 1440,
              lastAccessed: '2024-01-16T15:45:00Z',
              status: 'in_progress'
            },
            {
              courseId: '3',
              courseName: 'Geometry Fundamentals',
              progress: 100,
              lessonsCompleted: 10,
              totalLessons: 10,
              averageScore: 94,
              timeSpent: 720,
              lastAccessed: '2024-01-08T14:30:00Z',
              status: 'completed'
            }
          ]
        }
      ];

      const mockCourseAnalytics: CourseAnalytics[] = [
        {
          courseId: '1',
          courseName: 'Basic Mathematics with RSL',
          enrolledStudents: 25,
          averageProgress: 67,
          averageScore: 83,
          completionRate: 40,
          engagement: 'high'
        },
        {
          courseId: '2',
          courseName: 'Advanced Algebra Concepts',
          enrolledStudents: 18,
          averageProgress: 74,
          averageScore: 87,
          completionRate: 28,
          engagement: 'medium'
        },
        {
          courseId: '3',
          courseName: 'Geometry Fundamentals',
          enrolledStudents: 22,
          averageProgress: 85,
          averageScore: 89,
          completionRate: 68,
          engagement: 'high'
        }
      ];

      setStudents(mockStudents);
      setCourseAnalytics(mockCourseAnalytics);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.currentCourse.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply progress filter
    if (progressFilter !== 'all') {
      filtered = filtered.filter(student => {
        if (progressFilter === 'high') return student.overallProgress >= 80;
        if (progressFilter === 'medium') return student.overallProgress >= 50 && student.overallProgress < 80;
        if (progressFilter === 'low') return student.overallProgress < 50;
        return true;
      });
    }

    setFilteredStudents(filtered);
  };

  const getProgressStats = (): ProgressStats => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => {
      const lastActive = new Date(s.lastActive);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastActive > weekAgo;
    }).length;

    return {
      totalStudents,
      activeStudents,
      averageProgress: Math.round(students.reduce((acc, s) => acc + s.overallProgress, 0) / totalStudents),
      averageScore: Math.round(students.reduce((acc, s) => acc + s.averageScore, 0) / totalStudents),
      totalTimeSpent: students.reduce((acc, s) => acc + s.timeSpent, 0),
      completionRate: Math.round((students.reduce((acc, s) => acc + s.completedCourses, 0) / students.reduce((acc, s) => acc + s.totalCourses, 0)) * 100)
    };
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBg = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getEngagementBadge = (engagement: string) => {
    switch (engagement) {
      case 'high':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">High</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full">Medium</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Low</span>;
      default:
        return null;
    }
  };

  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" title="Student Progress">
        <div className="p-6 flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading progress data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = getProgressStats();

  return (
    <DashboardLayout role="teacher" title="Student Progress">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Progress Analytics</h1>
            <p className="text-gray-600">Track and analyze student learning progress</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as typeof selectedTimeRange)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
              <Download size={16} />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeStudents}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageProgress}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-orange-600">{stats.averageScore}%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Time Spent</p>
                <p className="text-2xl font-bold text-indigo-600">{Math.round(stats.totalTimeSpent / 60)}h</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-pink-600">{stats.completionRate}%</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Course Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Course Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Progress
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courseAnalytics.map((course, index) => (
                  <motion.tr
                    key={course.courseId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <BookOpen className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="font-medium text-gray-900">{course.courseName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900">{course.enrolledStudents}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <span className={`text-sm font-medium ${getProgressColor(course.averageProgress)}`}>
                          {course.averageProgress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{course.averageScore}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{course.completionRate}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getEngagementBadge(course.engagement)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Progress Filter */}
            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value as typeof progressFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Progress Levels</option>
              <option value="high">High (80%+)</option>
              <option value="medium">Medium (50-79%)</option>
              <option value="low">Low (&lt;50%)</option>
            </select>
          </div>
        </div>

        {/* Student Progress List */}
        <div className="space-y-4">
          {filteredStudents.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={student.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        formatLastActive(student.lastActive) === 'Today' ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      <p className="text-xs text-gray-500">Last active: {formatLastActive(student.lastActive)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Overall Progress</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressBg(student.overallProgress)}`}
                            style={{ width: `${student.overallProgress}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getProgressColor(student.overallProgress)}`}>
                          {student.overallProgress}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Avg Score</p>
                      <p className="text-lg font-semibold text-gray-900">{student.averageScore}%</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Time Spent</p>
                      <p className="text-lg font-semibold text-gray-900">{formatTimeSpent(student.timeSpent)}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Completed</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {student.completedCourses}/{student.totalCourses}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Current Course</p>
                    <p className="text-sm text-gray-600">{student.currentCourse}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Strengths</p>
                    <div className="flex flex-wrap gap-1">
                      {student.strengths.slice(0, 3).map((strength, strengthIndex) => (
                        <span key={strengthIndex} className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded">
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No students found</p>
            <p className="text-gray-500">
              {searchTerm || progressFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Students will appear here once they enroll in your courses'}
            </p>
          </div>
        )}

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedStudent.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
                      alt={selectedStudent.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedStudent.name}</h2>
                      <p className="text-gray-600">{selectedStudent.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Course Progress */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Course Progress</h3>
                  <div className="space-y-4">
                    {selectedStudent.courseProgress.map((course) => (
                      <div key={course.courseId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{course.courseName}</h4>
                          <span className={`text-sm font-medium ${getProgressColor(course.progress)}`}>
                            {course.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div
                            className={`h-2 rounded-full ${getProgressBg(course.progress)}`}
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Lessons</p>
                            <p className="font-medium">{course.lessonsCompleted}/{course.totalLessons}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Score</p>
                            <p className="font-medium">{course.averageScore}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Time</p>
                            <p className="font-medium">{formatTimeSpent(course.timeSpent)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Last Access</p>
                            <p className="font-medium">{formatLastActive(course.lastAccessed)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths and Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Strengths</h3>
                    <div className="space-y-2">
                      {selectedStudent.strengths.map((strength, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Areas for Improvement</h3>
                    <div className="space-y-2">
                      {selectedStudent.improvements.map((improvement, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-gray-700">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};