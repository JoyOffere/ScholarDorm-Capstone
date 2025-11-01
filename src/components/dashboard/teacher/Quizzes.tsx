import * as React from 'react';
const { useState, useEffect } = React;
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileQuestion, Plus, Search, Filter, MoreVertical, Edit, Eye,
  Users, BarChart3, Calendar, Clock, CheckCircle, AlertCircle,
  Play, Trophy, Target, TrendingUp, Settings, Copy
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { TeacherService } from '../../../lib/teacher-service';

interface Quiz {
  id: string;
  title: string;
  description: string;
  course: string;
  courseId: string;
  totalQuestions: number;
  timeLimit: number; // in minutes
  attempts: number;
  averageScore: number;
  participants: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  passingScore: number;
  type: 'practice' | 'assessment' | 'final';
}

interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, any>;
  time_spent_seconds?: number;
  feedback?: string;
  started_at: string;
  completed_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

interface StudentAttempt {
  student: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  quiz: {
    id: string;
    title: string;
    course_title: string;
  };
  attempt: QuizAttempt;
}

export const TeacherQuizzes = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [studentAttempts, setStudentAttempts] = useState<StudentAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<StudentAttempt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'practice' | 'assessment' | 'final'>('all');
  const [activeTab, setActiveTab] = useState<'quizzes' | 'attempts'>('quizzes');
  const [isLoading, setIsLoading] = useState(true);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  useEffect(() => {
    fetchQuizzes();
    fetchStudentAttempts();
  }, []);

  useEffect(() => {
    filterQuizzes();
    filterAttempts();
  }, [quizzes, studentAttempts, searchTerm, statusFilter, typeFilter]);

  const fetchQuizzes = async () => {
    try {
      if (!user) return;

      const teacherService = new TeacherService(user.id);
      const quizzesData = await teacherService.getQuizzes(
        searchTerm, 
        statusFilter === 'all' ? undefined : statusFilter,
        typeFilter === 'all' ? undefined : typeFilter
      );
      
      setQuizzes(quizzesData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setIsLoading(false);
    }
  };

  const fetchStudentAttempts = async () => {
    if (!user) return;
    
    setAttemptsLoading(true);
    try {
      // First, get the teacher's assigned courses
      const { data: assignments, error: assignmentError } = await supabase
        .from('teacher_course_assignments')
        .select('course_id')
        .eq('teacher_id', user.id);

      if (assignmentError) throw assignmentError;

      const courseIds = assignments?.map(a => a.course_id) || [];

      if (courseIds.length === 0) {
        setStudentAttempts([]);
        setAttemptsLoading(false);
        return;
      }

      // Get quiz attempts for quizzes in the teacher's assigned courses
      const { data: attempts, error: attemptsError } = await supabase
        .from('enhanced_quiz_attempts')
        .select(`
          id,
          user_id,
          quiz_id,
          score,
          percentage,
          is_passed,
          answers,
          time_spent_seconds,
          question_time_tracking,
          attempt_number,
          started_at,
          completed_at,
          feedback_provided,
          users!user_id(
            id,
            full_name,
            email,
            avatar_url
          ),
          enhanced_quizzes!quiz_id(
            id,
            title,
            courses!course_id(
              id,
              title
            )
          )
        `)
        .in('enhanced_quizzes.course_id', courseIds)
        .order('completed_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      // Transform the data into StudentAttempt format
      const studentAttempts: StudentAttempt[] = (attempts || []).map(attempt => {
        const quiz = Array.isArray(attempt.enhanced_quizzes) ? attempt.enhanced_quizzes[0] : attempt.enhanced_quizzes;
        const course = Array.isArray(quiz?.courses) ? quiz.courses[0] : quiz?.courses;
        
        return {
          student: Array.isArray(attempt.users) ? attempt.users[0] : attempt.users,
          quiz: {
            id: quiz?.id || '',
            title: quiz?.title || 'Unknown Quiz',
            course_title: course?.title || 'Unknown Course'
          },
          attempt: {
            id: attempt.id,
            user_id: attempt.user_id,
            quiz_id: attempt.quiz_id,
            score: attempt.score,
            percentage: attempt.percentage,
            passed: attempt.is_passed,
            answers: attempt.answers,
            time_spent_seconds: attempt.time_spent_seconds,
            question_time_tracking: attempt.question_time_tracking,
            attempt_number: attempt.attempt_number,
            started_at: attempt.started_at,
            completed_at: attempt.completed_at,
            feedback_provided: attempt.feedback_provided
          }
        };
      });

      setStudentAttempts(studentAttempts);
    } catch (error) {
      console.error('Error fetching student attempts:', error);
    } finally {
      setAttemptsLoading(false);
    }
  };

  const filterQuizzes = () => {
    let filtered = quizzes;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.course.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quiz => quiz.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(quiz => quiz.type === typeFilter);
    }

    setFilteredQuizzes(filtered);
  };

  const filterAttempts = () => {
    let filtered = studentAttempts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(attempt =>
        attempt.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.quiz.course_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAttempts(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Published</span>;
      case 'draft':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full">Draft</span>;
      case 'archived':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Archived</span>;
      default:
        return null;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Easy</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full">Medium</span>;
      case 'hard':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Hard</span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'practice':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">Practice</span>;
      case 'assessment':
        return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">Assessment</span>;
      case 'final':
        return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full">Final Exam</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" title="My Quizzes">
        <div className="p-6 flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quizzes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" title="My Quizzes">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Quizzes</h1>
            <p className="text-gray-600">Create and manage quizzes and assessments</p>
          </div>
          <Link
            to="/teacher/quizzes/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Create Quiz</span>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'quizzes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileQuestion className="w-4 h-4" />
                <span>My Quizzes</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('attempts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'attempts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Student Attempts</span>
                {studentAttempts.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {studentAttempts.length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'quizzes' ? (
          <div>
            {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quizzes</p>
                <p className="text-2xl font-bold text-gray-900">{quizzes.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileQuestion className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold text-green-600">
                  {quizzes.reduce((acc, q) => acc + q.attempts, 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Play className="w-6 h-6 text-green-600" />
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
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(quizzes.filter(q => q.averageScore > 0).reduce((acc, q) => acc + q.averageScore, 0) / quizzes.filter(q => q.averageScore > 0).length) || 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Trophy className="w-6 h-6 text-purple-600" />
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
                <p className="text-sm text-gray-600">Participants</p>
                <p className="text-2xl font-bold text-orange-600">
                  {quizzes.reduce((acc, q) => acc + q.participants, 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
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
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="practice">Practice</option>
              <option value="assessment">Assessment</option>
              <option value="final">Final Exam</option>
            </select>
          </div>
        </div>

        {/* Quizzes Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Limit
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuizzes.map((quiz, index) => (
                  <motion.tr
                    key={quiz.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                          <div className="flex space-x-2">
                            {getTypeBadge(quiz.type)}
                            {getDifficultyBadge(quiz.difficulty)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 max-w-md truncate">
                          {quiz.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{quiz.course}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {quiz.totalQuestions}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{quiz.timeLimit}m</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {quiz.attempts}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${
                        quiz.averageScore >= quiz.passingScore 
                          ? 'text-green-600' 
                          : quiz.averageScore > 0 
                            ? 'text-orange-600' 
                            : 'text-gray-400'
                      }`}>
                        {quiz.averageScore > 0 ? `${quiz.averageScore}%` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(quiz.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          to={`/teacher/quizzes/${quiz.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit Quiz"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/teacher/quizzes/${quiz.id}/results`}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="View Results"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Link>
                        <button
                          className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Duplicate Quiz"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredQuizzes.length === 0 && (
          <div className="text-center py-12">
            <FileQuestion className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No quizzes found</p>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first quiz to get started'}
            </p>
            <Link
              to="/teacher/quizzes/create"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Quiz</span>
            </Link>
          </div>
        )}
          </div>
        ) : (
          /* Student Attempts Tab */
          <div>
            {/* Attempts Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                    <p className="text-2xl font-bold text-gray-900">{studentAttempts.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {studentAttempts.length > 0 
                        ? Math.round(studentAttempts.reduce((sum, attempt) => sum + attempt.attempt.percentage, 0) / studentAttempts.length)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Trophy className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {studentAttempts.length > 0 
                        ? Math.round((studentAttempts.filter(attempt => attempt.attempt.passed).length / studentAttempts.length) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recent Attempts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {studentAttempts.filter(attempt => {
                        const attemptDate = new Date(attempt.attempt.completed_at || attempt.attempt.started_at);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return attemptDate > weekAgo;
                      }).length}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search students, quizzes, or courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Student Attempts List */}
            {attemptsLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : filteredAttempts.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAttempts.map((studentAttempt) => (
                        <tr key={studentAttempt.attempt.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {studentAttempt.student.avatar_url ? (
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={studentAttempt.student.avatar_url}
                                    alt={studentAttempt.student.full_name}
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-gray-600">
                                    {studentAttempt.student.full_name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {studentAttempt.student.full_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {studentAttempt.student.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {studentAttempt.quiz.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {studentAttempt.quiz.course_title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`text-sm font-medium ${
                                studentAttempt.attempt.percentage >= 80 ? 'text-green-600' :
                                studentAttempt.attempt.percentage >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {studentAttempt.attempt.percentage.toFixed(1)}%
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                ({studentAttempt.attempt.score} points)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              studentAttempt.attempt.passed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {studentAttempt.attempt.passed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {studentAttempt.attempt.completed_at ? 
                              new Date(studentAttempt.attempt.completed_at).toLocaleDateString() :
                              'In Progress'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {studentAttempt.attempt.time_spent_seconds ? 
                              `${Math.floor(studentAttempt.attempt.time_spent_seconds / 60)}m ${studentAttempt.attempt.time_spent_seconds % 60}s` :
                              'N/A'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Quiz Attempts Yet</h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'No attempts found matching your search criteria'
                    : 'Students haven\'t taken any quizzes for your assigned courses yet'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};