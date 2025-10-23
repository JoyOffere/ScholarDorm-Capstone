import React, { useEffect, useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { SearchIcon, FilterIcon, PlusIcon, TrashIcon, EditIcon, EyeIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon, AlertCircleIcon, LayersIcon, FolderIcon, FileIcon, ImageIcon, FileTextIcon, VideoIcon, LinkIcon, DownloadIcon, UploadIcon, MoreHorizontalIcon, XIcon, BookOpenIcon, ClockIcon, UsersIcon, BarChart3Icon, PlayCircleIcon, GraduationCapIcon, ChevronRightIcon, ChevronDownIcon, FolderOpenIcon, FileQuestionIcon, Settings } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { createAuditLog } from '../../../lib/supabase-utils';
import { LessonService } from '../../../lib/lesson-service';

interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty_level: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  lesson_count?: number;
  quiz_count?: number;
  enrollment_count?: number;
  has_rsl_support?: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  content_type: string;
  course_id: string;
  is_published: boolean;
  estimated_duration_minutes: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  course_id: string;
  is_published: boolean;
  total_questions?: number;
  created_at: string;
  updated_at: string;
}

interface CourseContent {
  course: Course;
  lessons: Lesson[];
  quizzes: Quiz[];
  isExpanded?: boolean;
}

export const AdminContent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courseContents, setCourseContents] = useState<CourseContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [contentTypeFilter, setContentTypeFilter] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'course' | 'lesson' | 'quiz'; id: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'expanded' | 'compact'>('expanded');
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalLessons: 0,
    totalQuizzes: 0,
    activeCourses: 0,
    publishedContent: 0
  });

  useEffect(() => {
    fetchAllContent();
  }, [subjectFilter, statusFilter, contentTypeFilter, searchTerm]);

  const fetchAllContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch courses with enhanced data
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          enhanced_lesson_count:enhanced_lessons!course_id(count),
          quiz_count:enhanced_quizzes!course_id(count),
          enrollment_count:course_enrollments!course_id(count)
        `)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      const courses = (coursesData || []).map((course: any) => ({
        ...course,
        lesson_count: course.enhanced_lesson_count?.[0]?.count || 0,
        quiz_count: course.quiz_count?.[0]?.count || 0,
        enrollment_count: course.enrollment_count?.[0]?.count || 0
      }));

      // Fetch all lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('enhanced_lessons')
        .select('*')
        .order('course_id, order_index');

      if (lessonsError) throw lessonsError;

      // Fetch all quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('enhanced_quizzes')
        .select(`
          *,
          question_count:enhanced_quiz_questions!quiz_id(count)
        `)
        .order('course_id, created_at');

      if (quizzesError) throw quizzesError;

      const quizzes = (quizzesData || []).map((quiz: any) => ({
        ...quiz,
        total_questions: quiz.question_count?.[0]?.count || 0
      }));

      // Group content by course
      const contentByCourse: CourseContent[] = courses.map(course => ({
        course,
        lessons: lessonsData?.filter(lesson => lesson.course_id === course.id) || [],
        quizzes: quizzes.filter(quiz => quiz.course_id === course.id) || [],
        isExpanded: false
      }));

      // Apply filters
      let filteredContent = contentByCourse;
      
      if (subjectFilter) {
        filteredContent = filteredContent.filter(content => content.course.subject === subjectFilter);
      }
      
      if (statusFilter !== null) {
        filteredContent = filteredContent.filter(content => content.course.is_active === statusFilter);
      }
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredContent = filteredContent.filter(content => 
          content.course.title.toLowerCase().includes(searchLower) ||
          content.course.description.toLowerCase().includes(searchLower) ||
          content.lessons.some(lesson => lesson.title.toLowerCase().includes(searchLower)) ||
          content.quizzes.some(quiz => quiz.title.toLowerCase().includes(searchLower))
        );
      }

      if (contentTypeFilter) {
        filteredContent = filteredContent.map(content => ({
          ...content,
          lessons: contentTypeFilter === 'lessons' ? content.lessons : [],
          quizzes: contentTypeFilter === 'quizzes' ? content.quizzes : []
        })).filter(content => 
          contentTypeFilter === 'courses' || 
          (contentTypeFilter === 'lessons' && content.lessons.length > 0) ||
          (contentTypeFilter === 'quizzes' && content.quizzes.length > 0)
        );
      }

      setCourseContents(filteredContent);

      // Calculate stats
      const totalCourses = courses.length;
      const totalLessons = lessonsData?.length || 0;
      const totalQuizzes = quizzes.length;
      const activeCourses = courses.filter(c => c.is_active).length;
      const publishedLessons = lessonsData?.filter(l => l.is_published).length || 0;
      const publishedQuizzes = quizzes.filter(q => q.is_published).length;

      setStats({
        totalCourses,
        totalLessons,
        totalQuizzes,
        activeCourses,
        publishedContent: publishedLessons + publishedQuizzes
      });

    } catch (err: any) {
      console.error('Error fetching content:', err);
      setError(err.message || 'Failed to fetch content');
      setCourseContents([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseExpansion = (courseId: string) => {
    setCourseContents(prev => prev.map(content => 
      content.course.id === courseId 
        ? { ...content, isExpanded: !content.isExpanded }
        : content
    ));
  };

  const handleDeleteClick = (type: 'course' | 'lesson' | 'quiz', id: string, title: string) => {
    setItemToDelete({ type, id, title });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !user) return;
    try {
      setLoading(true);
      let table = '';
      
      switch (itemToDelete.type) {
        case 'course':
          table = 'courses';
          break;
        case 'lesson':
          table = 'enhanced_lessons';
          break;
        case 'quiz':
          table = 'enhanced_quizzes';
          break;
      }

      const { error } = await supabase.from(table).delete().eq('id', itemToDelete.id);

      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_delete', {
        entity_type: itemToDelete.type,
        entity_id: itemToDelete.id
      });

      setShowDeleteModal(false);
      setItemToDelete(null);
      await fetchAllContent();
    } catch (err: any) {
      console.error('Error deleting content:', err);
      setError(err.message || 'Failed to delete content');
    } finally {
      setLoading(false);
    }
  };

  const togglePublishStatus = async (type: 'course' | 'lesson' | 'quiz', id: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      const newStatus = !currentStatus;
      let table = '';
      let statusField = '';
      
      switch (type) {
        case 'course':
          table = 'courses';
          statusField = 'is_active';
          break;
        case 'lesson':
        case 'quiz':
          table = type === 'lesson' ? 'enhanced_lessons' : 'enhanced_quizzes';
          statusField = 'is_published';
          break;
      }

      const { error } = await supabase
        .from(table)
        .update({ [statusField]: newStatus })
        .eq('id', id);

      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_update', {
        entity_type: type,
        entity_id: id,
        action: newStatus ? `publish_${type}` : `unpublish_${type}`
      });

      await fetchAllContent();
    } catch (err: any) {
      console.error('Error toggling content status:', err);
      setError(err.message || 'Failed to update content status');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSubjectFilter(null);
    setStatusFilter(null);
    setContentTypeFilter(null);
  };

  const getUniqueSubjects = () => {
    const subjects = new Set(courseContents.map(content => content.course.subject));
    return Array.from(subjects);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getContentIcon = (type: string, size: number = 16) => {
    switch (type) {
      case 'video':
        return <VideoIcon className="text-red-500" size={size} />;
      case 'text':
        return <FileTextIcon className="text-blue-500" size={size} />;
      case 'interactive':
        return <PlayCircleIcon className="text-green-500" size={size} />;
      case 'quiz':
        return <FileQuestionIcon className="text-purple-500" size={size} />;
      default:
        return <FileIcon className="text-gray-500" size={size} />;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateToCourse = (courseId: string) => {
    navigate(`/admin/courses/${courseId}/lessons`);
  };

  const navigateToLessonEdit = (courseId: string, lessonId: string) => {
    navigate(`/admin/courses/${courseId}/lessons`, { state: { editLessonId: lessonId } });
  };

  const navigateToQuizEdit = (quizId: string) => {
    navigate(`/admin/quizzes`, { state: { editQuizId: quizId } });
  };

  return (
    <DashboardLayout title="Content Management" role="admin">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <AlertCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Courses</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalCourses}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileTextIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Lessons</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalLessons}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileQuestionIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Quizzes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalQuizzes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Courses</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeCourses}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3Icon className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Published Content</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.publishedContent}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Search courses, lessons, and quizzes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={subjectFilter || ''}
                onChange={e => setSubjectFilter(e.target.value || null)}
              >
                <option value="">All Subjects</option>
                {getUniqueSubjects().map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            <div className="relative">
              <select
                className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={contentTypeFilter || ''}
                onChange={e => setContentTypeFilter(e.target.value || null)}
              >
                <option value="">All Content</option>
                <option value="courses">Courses Only</option>
                <option value="lessons">Lessons Only</option>
                <option value="quizzes">Quizzes Only</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            <div className="relative">
              <select
                className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={statusFilter === null ? '' : statusFilter ? 'active' : 'inactive'}
                onChange={e => {
                  if (e.target.value === '') setStatusFilter(null);
                  else setStatusFilter(e.target.value === 'active');
                }}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            <div className="flex border border-gray-300 rounded-lg">
              <button
                className={`p-2 ${view === 'expanded' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-500'}`}
                onClick={() => setView('expanded')}
                aria-label="Expanded view"
                title="Expanded view"
              >
                <ChevronDownIcon size={16} />
              </button>
              <button
                className={`p-2 ${view === 'compact' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-500'}`}
                onClick={() => setView('compact')}
                aria-label="Compact view"
                title="Compact view"
              >
                <LayersIcon size={16} />
              </button>
            </div>
            {(searchTerm || subjectFilter || statusFilter !== null || contentTypeFilter) && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <RefreshCwIcon size={16} className="mr-2" />
                Reset
              </button>
            )}
            <button
              onClick={fetchAllContent}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <RefreshCwIcon size={16} className="mr-2" />
              Refresh
            </button>
            <Link
              to="/admin/courses"
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <PlusIcon size={16} className="mr-2" />
              New Course
            </Link>
          </div>
        </div>
      </div>

      {/* Course Content Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-lg text-gray-600">Loading content...</span>
          </div>
        ) : courseContents.length === 0 ? (
          <div className="text-center py-16">
            <LayersIcon size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No content found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || subjectFilter || statusFilter !== null || contentTypeFilter
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first course.'}
            </p>
            {searchTerm || subjectFilter || statusFilter !== null || contentTypeFilter ? (
              <button onClick={resetFilters} className="text-purple-600 hover:text-purple-800 font-medium">
                Reset all filters
              </button>
            ) : (
              <Link
                to="/admin/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <PlusIcon size={16} className="mr-2" />
                Create Course
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {courseContents.map((courseContent) => (
              <div key={courseContent.course.id} className="p-6">
                {/* Course Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleCourseExpansion(courseContent.course.id)}
                      className="flex items-center space-x-2 text-left"
                    >
                      {courseContent.isExpanded ? (
                        <ChevronDownIcon size={20} className="text-gray-400" />
                      ) : (
                        <ChevronRightIcon size={20} className="text-gray-400" />
                      )}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <BookOpenIcon size={24} className="text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-purple-600">
                            {courseContent.course.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{courseContent.course.subject}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(courseContent.course.difficulty_level)}`}>
                              {courseContent.course.difficulty_level}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              courseContent.course.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {courseContent.course.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Course Stats */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <FileTextIcon size={16} />
                        <span>{courseContent.lessons.length}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileQuestionIcon size={16} />
                        <span>{courseContent.quizzes.length}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <UsersIcon size={16} />
                        <span>{courseContent.course.enrollment_count || 0}</span>
                      </div>
                    </div>
                    {/* Course Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigateToCourse(courseContent.course.id)}
                        className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50"
                        title="Manage Course"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => togglePublishStatus('course', courseContent.course.id, courseContent.course.is_active)}
                        className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                        title={courseContent.course.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {courseContent.course.is_active ? <XCircleIcon size={16} /> : <CheckCircleIcon size={16} />}
                      </button>
                      <button
                        onClick={() => handleDeleteClick('course', courseContent.course.id, courseContent.course.title)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete Course"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Course Description */}
                {courseContent.course.description && (
                  <p className="text-gray-600 text-sm mb-4 pl-10">{courseContent.course.description}</p>
                )}

                {/* Expanded Content */}
                {courseContent.isExpanded && (
                  <div className="pl-10 space-y-4">
                    {/* Lessons Section */}
                    {courseContent.lessons.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <FileTextIcon size={16} className="mr-2" />
                          Lessons ({courseContent.lessons.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {courseContent.lessons.map((lesson) => (
                            <div key={lesson.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    {getContentIcon(lesson.content_type)}
                                    <h5 className="text-sm font-medium text-gray-900 truncate">{lesson.title}</h5>
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                                    <span>#{lesson.order_index}</span>
                                    <span>•</span>
                                    <span>{formatDuration(lesson.estimated_duration_minutes)}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                      lesson.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {lesson.is_published ? 'Published' : 'Draft'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  <button
                                    onClick={() => navigateToLessonEdit(courseContent.course.id, lesson.id)}
                                    className="p-1 text-gray-400 hover:text-purple-600 rounded"
                                    title="Edit Lesson"
                                  >
                                    <EditIcon size={12} />
                                  </button>
                                  <button
                                    onClick={() => togglePublishStatus('lesson', lesson.id, lesson.is_published)}
                                    className="p-1 text-gray-400 hover:text-green-600 rounded"
                                    title={lesson.is_published ? 'Unpublish' : 'Publish'}
                                  >
                                    {lesson.is_published ? <XCircleIcon size={12} /> : <CheckCircleIcon size={12} />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick('lesson', lesson.id, lesson.title)}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                    title="Delete Lesson"
                                  >
                                    <TrashIcon size={12} />
                                  </button>
                                </div>
                              </div>
                              {lesson.description && (
                                <p className="text-xs text-gray-600 truncate">{lesson.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quizzes Section */}
                    {courseContent.quizzes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <FileQuestionIcon size={16} className="mr-2" />
                          Quizzes ({courseContent.quizzes.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {courseContent.quizzes.map((quiz) => (
                            <div key={quiz.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <FileQuestionIcon size={16} className="text-purple-500" />
                                    <h5 className="text-sm font-medium text-gray-900 truncate">{quiz.title}</h5>
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                                    <span>{quiz.total_questions || 0} questions</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                      quiz.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {quiz.is_published ? 'Published' : 'Draft'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  <button
                                    onClick={() => navigateToQuizEdit(quiz.id)}
                                    className="p-1 text-gray-400 hover:text-purple-600 rounded"
                                    title="Edit Quiz"
                                  >
                                    <EditIcon size={12} />
                                  </button>
                                  <button
                                    onClick={() => togglePublishStatus('quiz', quiz.id, quiz.is_published)}
                                    className="p-1 text-gray-400 hover:text-green-600 rounded"
                                    title={quiz.is_published ? 'Unpublish' : 'Publish'}
                                  >
                                    {quiz.is_published ? <XCircleIcon size={12} /> : <CheckCircleIcon size={12} />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick('quiz', quiz.id, quiz.title)}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                    title="Delete Quiz"
                                  >
                                    <TrashIcon size={12} />
                                  </button>
                                </div>
                              </div>
                              {quiz.description && (
                                <p className="text-xs text-gray-600 truncate">{quiz.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State for Course Content */}
                    {courseContent.lessons.length === 0 && courseContent.quizzes.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <LayersIcon size={32} className="mx-auto mb-2" />
                        <p className="text-sm">No lessons or quizzes yet</p>
                        <Link
                          to={`/admin/courses/${courseContent.course.id}/lessons`}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          Add Content →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete {itemToDelete.type}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete "<strong>{itemToDelete.title}</strong>"? 
                        {itemToDelete.type === 'course' && ' This will also delete all associated lessons and quizzes.'} 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
 