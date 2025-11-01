import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Search, Filter, MoreVertical, Mail, MessageSquare,
  TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle,
  BarChart3, Calendar, Award, BookOpen, User
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { DashboardLayout } from '../../layout/DashboardLayout';

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  progress: number;
  coursesCompleted: number;
  totalCourses: number;
  lastActive: string;
  status: 'active' | 'inactive' | 'struggling';
  averageScore: number;
  streak: number;
}

export const TeacherStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'struggling'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'lastActive' | 'score'>('name');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterAndSortStudents();
  }, [students, searchTerm, statusFilter, sortBy]);

  const fetchStudents = async () => {
    try {
      // Mock data for now - replace with actual API calls
      const mockStudents: Student[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff',
          progress: 85,
          coursesCompleted: 4,
          totalCourses: 6,
          lastActive: '2024-01-15T10:30:00Z',
          status: 'active',
          averageScore: 92,
          streak: 12
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=7C3AED&color=fff',
          progress: 45,
          coursesCompleted: 2,
          totalCourses: 6,
          lastActive: '2024-01-12T14:20:00Z',
          status: 'struggling',
          averageScore: 68,
          streak: 3
        },
        {
          id: '3',
          name: 'Mike Johnson',
          email: 'mike@example.com',
          avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=059669&color=fff',
          progress: 95,
          coursesCompleted: 5,
          totalCourses: 6,
          lastActive: '2024-01-14T16:45:00Z',
          status: 'active',
          averageScore: 88,
          streak: 25
        },
        {
          id: '4',
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          avatar: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=DC2626&color=fff',
          progress: 30,
          coursesCompleted: 1,
          totalCourses: 6,
          lastActive: '2024-01-08T09:15:00Z',
          status: 'inactive',
          averageScore: 75,
          streak: 0
        }
      ];
      
      setStudents(mockStudents);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setIsLoading(false);
    }
  };

  const filterAndSortStudents = () => {
    let filtered = students;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.progress - a.progress;
        case 'lastActive':
          return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        case 'score':
          return b.averageScore - a.averageScore;
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Active</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Inactive</span>;
      case 'struggling':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Needs Help</span>;
      default:
        return null;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" title="My Students and Student Contents">
        <div className="p-6 flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading students...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" title="My Students">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
            <p className="text-gray-600">Monitor student progress and provide support</p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredStudents.length} of {students.length} students
          </div>
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
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
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
                <p className="text-2xl font-bold text-green-600">
                  {students.filter(s => s.status === 'active').length}
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
                <p className="text-sm text-gray-600">Need Support</p>
                <p className="text-2xl font-bold text-red-600">
                  {students.filter(s => s.status === 'struggling').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
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
                <p className="text-sm text-gray-600">Average Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Students</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="struggling">Need Support</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="progress">Sort by Progress</option>
              <option value="lastActive">Sort by Last Active</option>
              <option value="score">Sort by Score</option>
            </select>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Student List</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredStudents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(student.status)}
                        <span className="text-xs text-gray-500">
                          Last active: {new Date(student.lastActive).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-8">
                    {/* Progress */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Progress</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(student.progress)}`}
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{student.progress}%</span>
                      </div>
                    </div>

                    {/* Courses */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Courses</p>
                      <p className="font-medium">{student.coursesCompleted}/{student.totalCourses}</p>
                    </div>

                    {/* Average Score */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Avg Score</p>
                      <p className="font-medium">{student.averageScore}%</p>
                    </div>

                    {/* Streak */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Streak</p>
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">{student.streak}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/teacher/students/${student.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <User className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Send Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="More Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No students found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};