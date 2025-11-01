import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileQuestion, Plus, Search, Filter, MoreVertical, Edit, Eye,
  Users, BarChart3, Calendar, Clock, CheckCircle, AlertCircle,
  Play, Trophy, Target, TrendingUp, Settings, Copy
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { DashboardLayout } from '../../layout/DashboardLayout';

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

export const TeacherQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'practice' | 'assessment' | 'final'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    filterQuizzes();
  }, [quizzes, searchTerm, statusFilter, typeFilter]);

  const fetchQuizzes = async () => {
    try {
      // Mock data for now - replace with actual API calls
      const mockQuizzes: Quiz[] = [
        {
          id: '1',
          title: 'Basic Addition and Subtraction',
          description: 'Test your understanding of basic arithmetic operations',
          course: 'Basic Mathematics with RSL',
          courseId: '1',
          totalQuestions: 15,
          timeLimit: 30,
          attempts: 45,
          averageScore: 78,
          participants: 25,
          status: 'published',
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-10T00:00:00Z',
          difficulty: 'easy',
          category: 'Mathematics',
          passingScore: 70,
          type: 'practice'
        },
        {
          id: '2',
          title: 'Algebra Mid-term Assessment',
          description: 'Comprehensive assessment covering algebraic concepts',
          course: 'Advanced Algebra Concepts',
          courseId: '2',
          totalQuestions: 25,
          timeLimit: 60,
          attempts: 32,
          averageScore: 85,
          participants: 18,
          status: 'published',
          createdAt: '2023-12-20T00:00:00Z',
          updatedAt: '2024-01-08T00:00:00Z',
          difficulty: 'hard',
          category: 'Mathematics',
          passingScore: 75,
          type: 'assessment'
        },
        {
          id: '3',
          title: 'Geometry Shapes Quiz',
          description: 'Interactive quiz about basic geometric shapes',
          course: 'Geometry Fundamentals',
          courseId: '3',
          totalQuestions: 12,
          timeLimit: 20,
          attempts: 0,
          averageScore: 0,
          participants: 0,
          status: 'draft',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-16T00:00:00Z',
          difficulty: 'medium',
          category: 'Mathematics',
          passingScore: 80,
          type: 'practice'
        },
        {
          id: '4',
          title: 'Final Mathematics Exam',
          description: 'Comprehensive final examination covering all course topics',
          course: 'Basic Mathematics with RSL',
          courseId: '1',
          totalQuestions: 50,
          timeLimit: 120,
          attempts: 23,
          averageScore: 82,
          participants: 23,
          status: 'published',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-12T00:00:00Z',
          difficulty: 'hard',
          category: 'Mathematics',
          passingScore: 80,
          type: 'final'
        }
      ];
      
      setQuizzes(mockQuizzes);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setIsLoading(false);
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
    </DashboardLayout>
  );
};