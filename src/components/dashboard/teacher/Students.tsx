import * as React from 'react';
const { useState, useEffect } = React;
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
  courses: string[]; // Course names the student is enrolled in
}

interface StudentQuizAttempt {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_avatar?: string;
  quiz_id: string;
  quiz_title: string;
  course_id: string;
  course_title: string;
  score: number;
  percentage: number;
  passed: boolean;
  completed_at?: string;
  time_spent_seconds?: number;
}

export const TeacherStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<StudentQuizAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<StudentQuizAttempt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'struggling'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'lastActive' | 'score'>('name');
  const [activeTab, setActiveTab] = useState<'students' | 'attempts'>('students');
  const [isLoading, setIsLoading] = useState(true);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchQuizAttempts();
  }, []);

  useEffect(() => {
    filterAndSortStudents();
    filterAttempts();
  }, [students, quizAttempts, searchTerm, statusFilter, sortBy]);

  const fetchStudents = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        return;
      }

      // Get teacher's assigned courses first
      const { data: assignments, error: assignmentError } = await supabase
        .from('teacher_course_assignments')
        .select('course_id, courses!course_id(id, title)')
        .eq('teacher_id', user.id);

      if (assignmentError) {
        console.error('Error fetching course assignments:', assignmentError);
        return;
      }

      const courseIds = assignments?.map(a => a.course_id) || [];
      
      if (courseIds.length === 0) {
        setStudents([]);
        setIsLoading(false);
        return;
      }

      // Get quiz attempts for teacher's courses to identify students who took quizzes
      const { data: quizAttempts, error: quizError } = await supabase
        .from('enhanced_quiz_attempts')
        .select(`
          user_id,
          percentage,
          completed_at,
          enhanced_quizzes!quiz_id(
            course_id
          )
        `)
        .not('completed_at', 'is', null);

      if (quizError) {
        console.error('Error fetching quiz attempts:', quizError);
        return;
      }

      // Filter quiz attempts for teacher's courses and get unique student IDs
      const studentIdsWithQuizzes = [...new Set(
        quizAttempts
          ?.filter(attempt => {
            const quiz = Array.isArray(attempt.enhanced_quizzes) ? attempt.enhanced_quizzes[0] : attempt.enhanced_quizzes;
            return courseIds.includes(quiz?.course_id);
          })
          .map(attempt => attempt.user_id) || []
      )];

      if (studentIdsWithQuizzes.length === 0) {
        setStudents([]);
        setIsLoading(false);
        return;
      }

      // Get students enrolled in teacher's courses who have taken quizzes
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('user_courses')
        .select(`
          user_id,
          course_id,
          progress_percentage,
          last_accessed,
          completed,
          users!user_id(
            id,
            full_name,
            email,
            avatar_url,
            streak_count
          ),
          courses!course_id(
            id,
            title
          )
        `)
        .in('course_id', courseIds)
        .in('user_id', studentIdsWithQuizzes);

      if (enrollmentError) {
        console.error('Error fetching student enrollments:', enrollmentError);
        return;
      }

      // Get quiz scores for students who have taken quizzes
      const { data: quizScores, error: quizScoreError } = await supabase
        .from('enhanced_quiz_attempts')
        .select('user_id, percentage')
        .in('user_id', studentIdsWithQuizzes);

      if (quizScoreError) {
        console.error('Error fetching quiz scores:', quizScoreError);
      }

      // Group data by student
      const studentMap = new Map();
      
      enrollments?.forEach(enrollment => {
        const user = Array.isArray(enrollment.users) ? enrollment.users[0] : enrollment.users;
        const course = Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses;
        
        if (!studentMap.has(user.id)) {
          studentMap.set(user.id, {
            id: user.id,
            name: user.full_name,
            email: user.email,
            avatar: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=0D8ABC&color=fff`,
            streak: user.streak_count || 0,
            courses: [],
            enrollments: []
          });
        }
        
        const student = studentMap.get(user.id);
        student.courses.push(course.title);
        student.enrollments.push(enrollment);
      });

      // Transform to Student interface
      const transformedStudents: Student[] = Array.from(studentMap.values()).map(student => {
        const avgProgress = student.enrollments.reduce((sum: number, e: any) => sum + (e.progress_percentage || 0), 0) / student.enrollments.length;
        const completedCourses = student.enrollments.filter((e: any) => e.completed).length;
        const lastActive = student.enrollments.reduce((latest: string, e: any) => {
          return e.last_accessed && (!latest || e.last_accessed > latest) ? e.last_accessed : latest;
        }, '');

        // Calculate average quiz score for this student
        const studentQuizScores = quizScores?.filter(q => q.user_id === student.id) || [];
        const avgScore = studentQuizScores.length > 0 
          ? studentQuizScores.reduce((sum, q) => sum + q.percentage, 0) / studentQuizScores.length 
          : 0;

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          avatar: student.avatar,
          progress: Math.round(avgProgress),
          coursesCompleted: completedCourses,
          totalCourses: student.enrollments.length,
          lastActive: lastActive || new Date().toISOString(),
          status: lastActive && new Date(lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
            ? 'active' 
            : avgProgress < 30 
              ? 'struggling' 
              : 'inactive',
          averageScore: Math.round(avgScore),
          streak: student.streak,
          courses: student.courses
        };
      });

      setStudents(transformedStudents);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setIsLoading(false);
    }
  };

  const fetchQuizAttempts = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      setAttemptsLoading(true);

      // Get teacher's assigned courses
      const { data: assignments } = await supabase
        .from('teacher_course_assignments')
        .select('course_id')
        .eq('teacher_id', user.id);

      const courseIds = assignments?.map(a => a.course_id) || [];

      if (courseIds.length === 0) {
        setQuizAttempts([]);
        setAttemptsLoading(false);
        return;
      }

      // Get students enrolled in teacher's courses first
      const { data: enrolledStudents } = await supabase
        .from('user_courses')
        .select('user_id')
        .in('course_id', courseIds);

      const enrolledStudentIds = [...new Set(enrolledStudents?.map(e => e.user_id) || [])];

      if (enrolledStudentIds.length === 0) {
        setQuizAttempts([]);
        setAttemptsLoading(false);
        return;
      }

      // Get quiz attempts from enrolled students in teacher's courses only
      const { data: attempts, error: attemptsError } = await supabase
        .from('enhanced_quiz_attempts')
        .select(`
          id,
          user_id,
          quiz_id,
          score,
          percentage,
          is_passed,
          completed_at,
          time_spent_seconds,
          users!user_id(
            id,
            full_name,
            email,
            avatar_url
          ),
          enhanced_quizzes!quiz_id(
            id,
            title,
            course_id,
            courses!course_id(
              id,
              title
            )
          )
        `)
        .in('user_id', enrolledStudentIds)
        .order('completed_at', { ascending: false });

      if (attemptsError) {
        console.error('Error fetching quiz attempts:', attemptsError);
        setAttemptsLoading(false);
        return;
      }

      // Filter attempts for teacher's courses and transform data
      const filteredAttempts: StudentQuizAttempt[] = (attempts || [])
        .filter(attempt => {
          const quiz = Array.isArray(attempt.enhanced_quizzes) ? attempt.enhanced_quizzes[0] : attempt.enhanced_quizzes;
          return courseIds.includes(quiz?.course_id);
        })
        .map(attempt => {
          const user = Array.isArray(attempt.users) ? attempt.users[0] : attempt.users;
          const quiz = Array.isArray(attempt.enhanced_quizzes) ? attempt.enhanced_quizzes[0] : attempt.enhanced_quizzes;
          const course = Array.isArray(quiz?.courses) ? quiz.courses[0] : quiz?.courses;

          return {
            id: attempt.id,
            student_id: user.id,
            student_name: user.full_name,
            student_email: user.email,
            student_avatar: user.avatar_url,
            quiz_id: quiz.id,
            quiz_title: quiz.title,
            course_id: course.id,
            course_title: course.title,
            score: attempt.score,
            percentage: attempt.percentage,
            passed: attempt.is_passed,
            completed_at: attempt.completed_at,
            time_spent_seconds: attempt.time_spent_seconds
          };
        });

      setQuizAttempts(filteredAttempts);
      setAttemptsLoading(false);
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      setAttemptsLoading(false);
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

  const filterAttempts = () => {
    let filtered = quizAttempts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(attempt =>
        attempt.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.quiz_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.course_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAttempts(filtered);
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

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('students')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>My Students</span>
                {students.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {students.length}
                  </span>
                )}
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
                <BarChart3 className="w-4 h-4" />
                <span>Quiz Performance</span>
                {quizAttempts.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {quizAttempts.length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'students' ? (
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
        ) : (
          /* Quiz Performance Tab */
          <div>
            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                    <p className="text-2xl font-bold text-gray-900">{quizAttempts.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {quizAttempts.length > 0 
                        ? Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / quizAttempts.length)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {quizAttempts.length > 0 
                        ? Math.round((quizAttempts.filter(attempt => attempt.passed).length / quizAttempts.length) * 100)
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
                    <p className="text-sm font-medium text-gray-600">Unique Students</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(quizAttempts.map(attempt => attempt.student_id)).size}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Users className="w-6 h-6 text-orange-600" />
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

            {/* Quiz Attempts List */}
            {attemptsLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : filteredAttempts.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Quiz Performance</h2>
                </div>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAttempts.map((attempt) => (
                        <tr key={attempt.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {attempt.student_avatar ? (
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={attempt.student_avatar}
                                    alt={attempt.student_name}
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-gray-600">
                                    {attempt.student_name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {attempt.student_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {attempt.student_email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {attempt.quiz_title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {attempt.course_title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`text-sm font-medium ${
                                attempt.percentage >= 80 ? 'text-green-600' :
                                attempt.percentage >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {attempt.percentage.toFixed(1)}%
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                ({attempt.score} points)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              attempt.passed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attempt.passed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {attempt.completed_at ? 
                              new Date(attempt.completed_at).toLocaleDateString() :
                              'In Progress'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {attempt.time_spent_seconds ? 
                              `${Math.floor(attempt.time_spent_seconds / 60)}m ${attempt.time_spent_seconds % 60}s` :
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
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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