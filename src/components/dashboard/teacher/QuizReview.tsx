import * as React from 'react';
const { useState, useEffect } = React;
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search, Filter, Clock, CheckCircle, AlertCircle,
  User, Calendar, Star, MessageSquare, FileText, Download,
  Eye, ChevronDown, ChevronRight, Award, BarChart3, X
} from 'lucide-react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  max_score: number;
  completion_time: number; // in seconds
  completed_at: string;
  status: 'completed' | 'in_progress' | 'abandoned';
  student: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  quiz: {
    id: string;
    title: string;
    course_id: string;
    course: {
      title: string;
    };
  };
  answers: QuizAnswer[];
}

interface QuizAnswer {
  id: string;
  question_id: string;
  answer_text?: string;
  selected_options?: string[];
  is_correct: boolean;
  points_earned: number;
  points_possible: number;
  question: {
    id: string;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer';
    correct_answer?: string;
    options?: string[];
    points: number;
  };
}

interface ReviewFilters {
  search: string;
  course: string;
  status: 'all' | 'completed' | 'needs_review';
  score_range: 'all' | 'high' | 'medium' | 'low';
  date_range: 'all' | 'today' | 'week' | 'month';
}

export const TeacherQuizReview: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<QuizAttempt[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<ReviewFilters>({
    search: '',
    course: 'all',
    status: 'all',
    score_range: 'all',
    date_range: 'all'
  });

  useEffect(() => {
    fetchQuizAttempts();
    fetchCourses();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [attempts, filters]);

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

      const courseList = data?.map(item => {
        const course = Array.isArray(item.courses) ? item.courses[0] : item.courses;
        return {
          id: course?.id,
          title: course?.title
        };
      }) || [];

      setCourses(courseList);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchQuizAttempts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get teacher's courses
      const { data: teacherCourses, error: coursesError } = await supabase
        .from('teacher_course_assignments')
        .select('course_id')
        .eq('teacher_id', user.id);

      if (coursesError) throw coursesError;

      const courseIds = teacherCourses?.map(tc => tc.course_id) || [];

      // Fetch quiz attempts for teacher's courses
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('enhanced_quiz_attempts')
        .select(`
          id,
          quiz_id,
          user_id,
          score,
          percentage,
          time_spent_seconds,
          question_time_tracking,
          attempt_number,
          completed_at,
          is_passed,
          users!user_id(id, full_name, email, avatar_url),
          enhanced_quizzes!quiz_id(
            id,
            title,
            lesson_id,
            lessons!lesson_id(
              id,
              course_id,
              courses!course_id(title)
            )
          )
        `)
        .order('completed_at', { ascending: false });

      // Filter manually since we can't easily filter by nested course_id in the query
      const filteredAttempts = attemptsData?.filter(attempt => {
        try {
          const quizData = Array.isArray(attempt.enhanced_quizzes) ? attempt.enhanced_quizzes[0] : attempt.enhanced_quizzes;
          const lessonData = Array.isArray(quizData?.lessons) ? quizData.lessons[0] : quizData?.lessons;
          return courseIds.includes(lessonData?.course_id);
        } catch (error) {
          console.warn('Error filtering attempt:', error);
          return false;
        }
      }) || [];

      if (attemptsError) throw attemptsError;

      // Fetch detailed answers for each attempt
        const attemptsWithAnswers = await Promise.all(
        (filteredAttempts || []).map(async (attempt) => {
          // For now, we'll create a simplified version without detailed answers
          // since the quiz answers structure may not match exactly
          const answersData = [];

          return {
            id: attempt.id,
            quiz_id: attempt.quiz_id,
            student_id: attempt.user_id,
            score: Math.round((attempt.percentage / 100) * 100) || 0, // Convert percentage to score
            max_score: 100, // Assuming 100 points max
            completion_time: attempt.time_spent_seconds || 0,
            completed_at: attempt.completed_at,
            status: attempt.is_passed ? 'completed' : 'completed', // Simplify status
            student: (() => {
              const userData = Array.isArray(attempt.users) ? attempt.users[0] : attempt.users;
              return {
                id: userData?.id || '',
                full_name: userData?.full_name || 'Unknown Student',
                email: userData?.email || '',
                avatar_url: userData?.avatar_url
              };
            })(),
            quiz: (() => {
              const quizData = Array.isArray(attempt.enhanced_quizzes) ? attempt.enhanced_quizzes[0] : attempt.enhanced_quizzes;
              const lessonData = Array.isArray(quizData?.lessons) ? quizData.lessons[0] : quizData?.lessons;
              const courseData = Array.isArray(lessonData?.courses) ? lessonData.courses[0] : lessonData?.courses;
              return {
                id: quizData?.id || '',
                title: quizData?.title || 'Unknown Quiz',
                course_id: lessonData?.course_id || '',
                course: {
                  title: courseData?.title || 'Unknown Course'
                }
              };
            })(),
            answers: [] // Simplified - no detailed answers for now
          } as QuizAttempt;
        })
      );

      setAttempts(attemptsWithAnswers);
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...attempts];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(attempt =>
        attempt.student.full_name.toLowerCase().includes(searchLower) ||
        attempt.student.email.toLowerCase().includes(searchLower) ||
        attempt.quiz.title.toLowerCase().includes(searchLower) ||
        attempt.quiz.course.title.toLowerCase().includes(searchLower)
      );
    }

    // Course filter
    if (filters.course !== 'all') {
      filtered = filtered.filter(attempt => attempt.quiz.course_id === filters.course);
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'completed') {
        filtered = filtered.filter(attempt => attempt.status === 'completed');
      } else if (filters.status === 'needs_review') {
        // Show attempts with short answer questions that might need manual review
        filtered = filtered.filter(attempt =>
          attempt.answers.some(answer => 
            answer.question.question_type === 'short_answer' && 
            attempt.status === 'completed'
          )
        );
      }
    }

    // Score range filter
    if (filters.score_range !== 'all') {
      filtered = filtered.filter(attempt => {
        const percentage = attempt.max_score > 0 ? (attempt.score / attempt.max_score) * 100 : 0;
        if (filters.score_range === 'high') return percentage >= 80;
        if (filters.score_range === 'medium') return percentage >= 60 && percentage < 80;
        if (filters.score_range === 'low') return percentage < 60;
        return true;
      });
    }

    // Date range filter
    if (filters.date_range !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      if (filters.date_range === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (filters.date_range === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (filters.date_range === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      }

      filtered = filtered.filter(attempt => 
        new Date(attempt.completed_at) >= startDate
      );
    }

    setFilteredAttempts(filtered);
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const toggleAnswerExpansion = (answerId: string) => {
    setExpandedAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(answerId)) {
        newSet.delete(answerId);
      } else {
        newSet.add(answerId);
      }
      return newSet;
    });
  };

  const exportResults = () => {
    const csvContent = [
      'Student Name,Email,Quiz,Course,Score,Max Score,Percentage,Completion Time,Date',
      ...filteredAttempts.map(attempt => [
        attempt.student.full_name,
        attempt.student.email,
        attempt.quiz.title,
        attempt.quiz.course.title,
        attempt.score,
        attempt.max_score,
        attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0,
        formatTime(attempt.completion_time),
        new Date(attempt.completed_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" title="Quiz Reviews">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quiz attempts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" title="Quiz Reviews">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/teacher/quizzes')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quiz Reviews</h1>
              <p className="text-gray-600">Review and analyze student quiz performance</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportResults}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              <span>Export Results</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search students, quizzes..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                value={filters.course}
                onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Attempts</option>
                <option value="completed">Completed</option>
                <option value="needs_review">Needs Review</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Score Range</label>
              <select
                value={filters.score_range}
                onChange={(e) => setFilters(prev => ({ ...prev, score_range: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Scores</option>
                <option value="high">High (80%+)</option>
                <option value="medium">Medium (60-79%)</option>
                <option value="low">Low (&lt;60%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.date_range}
                onChange={(e) => setFilters(prev => ({ ...prev, date_range: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold text-blue-600">{filteredAttempts.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredAttempts.length > 0
                    ? Math.round(
                        filteredAttempts.reduce((sum, attempt) => 
                          sum + (attempt.max_score > 0 ? (attempt.score / attempt.max_score) * 100 : 0), 0
                        ) / filteredAttempts.length
                      )
                    : 0}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredAttempts.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Need Review</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredAttempts.filter(attempt =>
                    attempt.answers.some(answer => 
                      answer.question.question_type === 'short_answer' && 
                      attempt.status === 'completed'
                    )
                  ).length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </motion.div>
        </div>

        {/* Quiz Attempts List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Quiz Attempts ({filteredAttempts.length})
            </h3>
          </div>

          {filteredAttempts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Quiz Attempts Found</h3>
              <p className="text-gray-600">
                {attempts.length === 0 
                  ? "No students have taken quizzes yet."
                  : "No attempts match your current filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quiz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttempts.map((attempt) => {
                    const percentage = attempt.max_score > 0 
                      ? Math.round((attempt.score / attempt.max_score) * 100) 
                      : 0;
                    const needsReview = attempt.answers.some(answer => 
                      answer.question.question_type === 'short_answer'
                    );

                    return (
                      <tr key={attempt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              {attempt.student.avatar_url ? (
                                <img
                                  className="h-8 w-8 rounded-full"
                                  src={attempt.student.avatar_url}
                                  alt=""
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {attempt.student.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {attempt.student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {attempt.quiz.title}
                          </div>
                          {needsReview && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Needs Review
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attempt.quiz.course.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(attempt.score, attempt.max_score)}`}>
                            {attempt.score}/{attempt.max_score} ({percentage}%)
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-1" />
                            {formatTime(attempt.completion_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                            {new Date(attempt.completed_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedAttempt(attempt);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          >
                            <Eye size={16} />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedAttempt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Quiz Review: {selectedAttempt.quiz.title}
                    </h2>
                    <p className="text-gray-600">
                      Student: {selectedAttempt.student.full_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">Final Score</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedAttempt.score}/{selectedAttempt.max_score}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedAttempt.max_score > 0 
                        ? Math.round((selectedAttempt.score / selectedAttempt.max_score) * 100)
                        : 0}%
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">Questions</div>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedAttempt.answers.filter(a => a.is_correct).length}/{selectedAttempt.answers.length}
                    </div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">Time Taken</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatTime(selectedAttempt.completion_time)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">Status</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedAttempt.status}
                    </div>
                  </div>
                </div>

                {/* Detailed Answers */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Question by Question Analysis</h3>
                  {selectedAttempt.answers.map((answer, index) => {
                    const isExpanded = expandedAnswers.has(answer.id);
                    return (
                      <div key={answer.id} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => toggleAnswerExpansion(answer.id)}
                          className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 truncate">
                                {answer.question.question_text}
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  answer.is_correct 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {answer.is_correct ? 'Correct' : 'Incorrect'}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {answer.points_earned}/{answer.points_possible} points
                                </span>
                              </div>
                            </div>
                          </div>
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-100">
                            <div className="space-y-3">
                              {answer.question.question_type === 'multiple_choice' && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                                  <div className="space-y-1">
                                    {answer.question.options?.map((option, optIndex) => (
                                      <div
                                        key={optIndex}
                                        className={`p-2 rounded text-sm ${
                                          answer.selected_options?.includes(option)
                                            ? answer.is_correct
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-red-100 text-red-800'
                                            : option === answer.question.correct_answer
                                              ? 'bg-blue-100 text-blue-800'
                                              : 'bg-gray-50 text-gray-700'
                                        }`}
                                      >
                                        {option}
                                        {answer.selected_options?.includes(option) && ' (Selected)'}
                                        {option === answer.question.correct_answer && ' (Correct)'}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {answer.question.question_type === 'short_answer' && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Student Answer:</p>
                                  <div className="p-3 bg-gray-50 rounded">
                                    <p className="text-sm text-gray-900">
                                      {answer.answer_text || 'No answer provided'}
                                    </p>
                                  </div>
                                  {answer.question.correct_answer && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2 mt-3">Expected Answer:</p>
                                      <div className="p-3 bg-blue-50 rounded">
                                        <p className="text-sm text-blue-900">
                                          {answer.question.correct_answer}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {answer.question.question_type === 'true_false' && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Answer:</p>
                                  <div className="flex space-x-4">
                                    <span className={`px-3 py-1 rounded text-sm ${
                                      answer.selected_options?.[0] === 'true'
                                        ? answer.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      True {answer.selected_options?.[0] === 'true' && '(Selected)'}
                                    </span>
                                    <span className={`px-3 py-1 rounded text-sm ${
                                      answer.selected_options?.[0] === 'false'
                                        ? answer.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      False {answer.selected_options?.[0] === 'false' && '(Selected)'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-2">
                                    Correct answer: {answer.question.correct_answer}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};