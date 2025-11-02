import * as React from 'react';
const { useState, useEffect } = React;
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Users, BookOpen, BarChart3, TrendingUp, TrendingDown,
  Clock, Award, CheckCircle, AlertCircle, Eye, Download,
  Calendar, Filter, Search, Play, FileText, Star, Target
} from 'lucide-react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface CourseAnalytics {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  averageProgress: number;
  averageRating: number;
  totalLessons: number;
  totalQuizzes: number;
  totalTimeSpent: number;
  engagementScore: number;
  lastActivity: string;
}

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  avatar: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastActive: string;
  timeSpent: number;
  quizScores: number[];
  averageQuizScore: number;
  status: 'active' | 'inactive' | 'completed';
}

interface LessonAnalytics {
  id: string;
  title: string;
  completionRate: number;
  averageTimeSpent: number;
  difficulty: 'easy' | 'medium' | 'hard';
  engagementScore: number;
  dropoffRate: number;
}

interface QuizAnalytics {
  id: string;
  title: string;
  attempts: number;
  averageScore: number;
  passRate: number;
  averageTimeSpent: number;
  commonMistakes: string[];
}

export const TeacherCourseAnalytics = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseAnalytics | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [lessonAnalytics, setLessonAnalytics] = useState<LessonAnalytics[]>([]);
  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'lessons' | 'quizzes'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (courseId) {
      fetchCourseAnalytics();
    }
  }, [courseId, timeRange]);

  const fetchCourseAnalytics = async () => {
    try {
      if (!user || !courseId) return;

      setIsLoading(true);

      // Check if teacher is assigned to this course
      const { data: assignment } = await supabase
        .from('teacher_course_assignments')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .single();

      if (!assignment) {
        throw new Error('You are not assigned to this course');
      }

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          image_url,
          lessons (id, title),
          user_courses (
            user_id,
            progress_percentage,
            last_accessed_at,
            time_spent_minutes,
            is_completed,
            users (id, full_name, email, avatar_url)
          )
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch quiz data
      const { data: quizData } = await supabase
        .from('enhanced_quizzes')
        .select(`
          id,
          title,
          enhanced_quiz_attempts (
            id,
            score,
            time_spent_seconds,
            completed_at,
            user_id
          )
        `)
        .eq('course_id', courseId);

      // Process course analytics
      const enrolledStudents = courseData.user_courses || [];
      const activeStudents = enrolledStudents.filter(uc => 
        uc.last_accessed_at && 
        new Date(uc.last_accessed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      const completedStudents = enrolledStudents.filter(uc => uc.is_completed);
      const averageProgress = enrolledStudents.length > 0 
        ? enrolledStudents.reduce((acc, uc) => acc + (uc.progress_percentage || 0), 0) / enrolledStudents.length
        : 0;

      const totalTimeSpent = enrolledStudents.reduce((acc, uc) => acc + (uc.time_spent_minutes || 0), 0);

      const courseAnalytics: CourseAnalytics = {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.image_url || '/default-course.jpg',
        totalStudents: enrolledStudents.length,
        activeStudents: activeStudents.length,
        completionRate: enrolledStudents.length > 0 ? (completedStudents.length / enrolledStudents.length) * 100 : 0,
        averageProgress,
        averageRating: 4.2, // Mock data - would need ratings table
        totalLessons: courseData.lessons?.length || 0,
        totalQuizzes: quizData?.length || 0,
        totalTimeSpent,
        engagementScore: activeStudents.length > 0 ? (activeStudents.length / enrolledStudents.length) * 100 : 0,
        lastActivity: activeStudents.length > 0 
          ? activeStudents.reduce((latest, uc) => 
              new Date(uc.last_accessed_at) > new Date(latest) ? uc.last_accessed_at : latest, 
              activeStudents[0].last_accessed_at
            )
          : ''
      };

      setCourse(courseAnalytics);

      // Process student progress
      const studentProgressData: StudentProgress[] = enrolledStudents.map(uc => {
        const userQuizAttempts = quizData?.flatMap(q => 
          q.enhanced_quiz_attempts?.filter(qa => qa.user_id === uc.user_id) || []
        ) || [];
        
        const quizScores = userQuizAttempts.map(qa => qa.score);
        const averageQuizScore = quizScores.length > 0 
          ? quizScores.reduce((acc, score) => acc + score, 0) / quizScores.length
          : 0;

        const userData = Array.isArray(uc.users) ? uc.users[0] : uc.users;

        return {
          id: uc.user_id,
          name: userData?.full_name || 'Unknown',
          email: userData?.email || '',
          avatar: userData?.avatar_url || '',
          progress: uc.progress_percentage || 0,
          completedLessons: Math.floor((uc.progress_percentage || 0) / 100 * courseAnalytics.totalLessons),
          totalLessons: courseAnalytics.totalLessons,
          lastActive: uc.last_accessed_at || '',
          timeSpent: uc.time_spent_minutes || 0,
          quizScores,
          averageQuizScore,
          status: uc.is_completed ? 'completed' : 
                   (uc.last_accessed_at && new Date(uc.last_accessed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ? 'active' : 'inactive'
        };
      });

      setStudentProgress(studentProgressData);

      // Mock lesson analytics - would need lesson completion tracking
      const mockLessonAnalytics: LessonAnalytics[] = courseData.lessons?.map((lesson, index) => ({
        id: lesson.id,
        title: lesson.title,
        completionRate: Math.random() * 100,
        averageTimeSpent: Math.random() * 30 + 5,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
        engagementScore: Math.random() * 100,
        dropoffRate: Math.random() * 20
      })) || [];

      setLessonAnalytics(mockLessonAnalytics);

      // Process quiz analytics
      const processedQuizAnalytics: QuizAnalytics[] = quizData?.map(quiz => {
        const attempts = quiz.enhanced_quiz_attempts || [];
        const totalAttempts = attempts.length;
        const averageScore = totalAttempts > 0 
          ? attempts.reduce((acc, attempt) => acc + attempt.score, 0) / totalAttempts
          : 0;
        const passRate = totalAttempts > 0 
          ? (attempts.filter(attempt => attempt.score >= 70).length / totalAttempts) * 100
          : 0;
        const averageTimeSpent = totalAttempts > 0 
          ? attempts.reduce((acc, attempt) => acc + (attempt.time_spent_seconds || 0), 0) / totalAttempts / 60
          : 0;

        return {
          id: quiz.id,
          title: quiz.title,
          attempts: totalAttempts,
          averageScore,
          passRate,
          averageTimeSpent,
          commonMistakes: [] // Would need more detailed quiz analysis
        };
      }) || [];

      setQuizAnalytics(processedQuizAnalytics);

    } catch (error) {
      console.error('Error fetching course analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Completed</span>;
      case 'active':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">Active</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Inactive</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" title="Course Analytics">
        <div className="p-6 flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout role="teacher" title="Course Analytics">
        <div className="p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">Course not found or access denied</p>
          <Link
            to="/teacher/courses"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Courses</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" title={`Analytics - ${course.title}`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/teacher/courses"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600">Course Analytics & Insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{course.totalStudents}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {course.activeStudents} active
                </p>
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
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{course.completionRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500 mt-1">
                  Avg Progress: {course.averageProgress.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
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
                <p className="text-sm text-gray-600">Engagement</p>
                <p className="text-2xl font-bold text-gray-900">{course.engagementScore.toFixed(1)}%</p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatTime(course.totalTimeSpent)} total
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
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
                <p className="text-sm text-gray-600">Content</p>
                <p className="text-2xl font-bold text-gray-900">{course.totalLessons}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {course.totalQuizzes} quizzes
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'students', name: 'Students', icon: Users },
                { id: 'lessons', name: 'Lessons', icon: BookOpen },
                { id: 'quizzes', name: 'Quizzes', icon: Target }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Progress Distribution */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Progress Distribution</h3>
                    <div className="space-y-3">
                      {[
                        { range: '0-25%', count: studentProgress.filter(s => s.progress >= 0 && s.progress < 25).length, color: 'bg-red-500' },
                        { range: '25-50%', count: studentProgress.filter(s => s.progress >= 25 && s.progress < 50).length, color: 'bg-orange-500' },
                        { range: '50-75%', count: studentProgress.filter(s => s.progress >= 50 && s.progress < 75).length, color: 'bg-yellow-500' },
                        { range: '75-100%', count: studentProgress.filter(s => s.progress >= 75).length, color: 'bg-green-500' }
                      ].map((item) => (
                        <div key={item.range} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.range}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${item.color}`}
                                style={{ width: `${course.totalStudents > 0 ? (item.count / course.totalStudents) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {studentProgress
                        .filter(s => s.lastActive)
                        .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
                        .slice(0, 5)
                        .map((student) => (
                          <div key={student.id} className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{student.name}</p>
                              <p className="text-xs text-gray-500">
                                Last active {new Date(student.lastActive).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{student.progress}%</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Student Progress</h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Spent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quiz Average
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Active
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {studentProgress.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${student.progress}%` }}
                              ></div>
                            </div>
                            <div className="text-sm text-gray-900 mt-1">
                              {student.progress}% ({student.completedLessons}/{student.totalLessons} lessons)
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTime(student.timeSpent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.averageQuizScore > 0 ? `${student.averageQuizScore.toFixed(1)}%` : 'No attempts'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(student.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'lessons' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Lesson Performance</h3>
                <div className="grid gap-4">
                  {lessonAnalytics.map((lesson) => (
                    <div key={lesson.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          lesson.difficulty === 'easy' ? 'bg-green-100 text-green-600' :
                          lesson.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {lesson.difficulty}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Completion Rate</p>
                          <p className="font-medium text-gray-900">{lesson.completionRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Avg Time Spent</p>
                          <p className="font-medium text-gray-900">{formatTime(lesson.averageTimeSpent)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Engagement Score</p>
                          <p className="font-medium text-gray-900">{lesson.engagementScore.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Drop-off Rate</p>
                          <p className="font-medium text-gray-900">{lesson.dropoffRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'quizzes' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Quiz Performance</h3>
                <div className="grid gap-4">
                  {quizAnalytics.map((quiz) => (
                    <div key={quiz.id} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{quiz.title}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Attempts</p>
                          <p className="font-medium text-gray-900">{quiz.attempts}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Average Score</p>
                          <p className="font-medium text-gray-900">{quiz.averageScore.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pass Rate</p>
                          <p className="font-medium text-gray-900">{quiz.passRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Avg Time</p>
                          <p className="font-medium text-gray-900">{formatTime(quiz.averageTimeSpent)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};