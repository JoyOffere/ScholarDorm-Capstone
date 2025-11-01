import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen, Plus, Search, Filter, MoreVertical, Edit, Eye,
  Users, BarChart3, Calendar, Clock, CheckCircle, AlertCircle,
  Play, FileText, Star, TrendingUp, Settings
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { DashboardLayout } from '../../layout/DashboardLayout';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  totalLessons: number;
  completedLessons: number;
  enrolledStudents: number;
  averageProgress: number;
  averageRating: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const TeacherCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, statusFilter]);

  const fetchCourses = async () => {
    try {
      // Mock data for now - replace with actual API calls
      const mockCourses: Course[] = [
        {
          id: '1',
          title: 'Basic Mathematics with RSL',
          description: 'Introduction to mathematics concepts using Rwanda Sign Language',
          thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
          totalLessons: 12,
          completedLessons: 8,
          enrolledStudents: 25,
          averageProgress: 67,
          averageRating: 4.5,
          status: 'published',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-10T00:00:00Z',
          category: 'Mathematics',
          difficulty: 'beginner'
        },
        {
          id: '2',
          title: 'Advanced Algebra Concepts',
          description: 'Complex algebraic equations and problem-solving techniques',
          thumbnail: 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400',
          totalLessons: 15,
          completedLessons: 15,
          enrolledStudents: 18,
          averageProgress: 89,
          averageRating: 4.8,
          status: 'published',
          createdAt: '2023-12-15T00:00:00Z',
          updatedAt: '2024-01-05T00:00:00Z',
          category: 'Mathematics',
          difficulty: 'advanced'
        },
        {
          id: '3',
          title: 'Geometry Fundamentals',
          description: 'Basic geometry concepts with visual RSL explanations',
          thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
          totalLessons: 10,
          completedLessons: 3,
          enrolledStudents: 0,
          averageProgress: 0,
          averageRating: 0,
          status: 'draft',
          createdAt: '2024-01-12T00:00:00Z',
          updatedAt: '2024-01-14T00:00:00Z',
          category: 'Mathematics',
          difficulty: 'intermediate'
        }
      ];
      
      setCourses(mockCourses);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setIsLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter);
    }

    setFilteredCourses(filtered);
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
      case 'beginner':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">Beginner</span>;
      case 'intermediate':
        return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full">Intermediate</span>;
      case 'advanced':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Advanced</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" title="My Courses">
        <div className="p-6 flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" title="My Courses">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600">Create and manage your educational content</p>
          </div>
          <Link
            to="/teacher/courses/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Create Course</span>
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
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {courses.filter(c => c.status === 'published').length}
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
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-purple-600">
                  {courses.reduce((acc, c) => acc + c.enrolledStudents, 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
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
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.round(courses.reduce((acc, c) => acc + c.averageProgress, 0) / courses.length)}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600" />
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
                  placeholder="Search courses..."
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
              <option value="all">All Courses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Course Thumbnail */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  {getStatusBadge(course.status)}
                </div>
                <div className="absolute top-4 right-4">
                  {getDifficultyBadge(course.difficulty)}
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
                    {course.title}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                {/* Course Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {course.completedLessons}/{course.totalLessons} lessons
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{course.enrolledStudents} students</span>
                    </div>
                  </div>

                  {course.status === 'published' && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{course.averageProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${course.averageProgress}%` }}
                        ></div>
                      </div>

                      {course.averageRating > 0 && (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(course.averageRating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {course.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 mt-6">
                  <Link
                    to={`/teacher/courses/${course.id}/edit`}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </Link>
                  
                  <Link
                    to={`/teacher/courses/${course.id}/analytics`}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No courses found</p>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first course to get started'}
            </p>
            <Link
              to="/teacher/courses/create"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Course</span>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};