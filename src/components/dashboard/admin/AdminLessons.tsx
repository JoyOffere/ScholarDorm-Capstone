import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { 
  BookOpenIcon, 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  EyeIcon, 
  MoveIcon,
  CopyIcon,
  PlayIcon,
  FileTextIcon,
  VideoIcon,
  PuzzleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BarChartIcon,
  ArrowLeftIcon,
  GripVerticalIcon,
  SettingsIcon,
  XIcon
} from 'lucide-react';
import { LessonService, EnhancedLesson, CreateLessonData, UpdateLessonData } from '../../../lib/lesson-service';
import { supabase } from '../../../lib/supabase';

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty_level: string;
}

export const AdminLessons: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [lessons, setLessons] = useState<EnhancedLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showMobileActionModal, setShowMobileActionModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<EnhancedLesson | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CreateLessonData>({
    course_id: courseId || '',
    title: '',
    description: '',
    content_type: 'text',
    content_html: '',
    rsl_video_url: '',
    estimated_duration_minutes: 5,
    learning_objectives: [],
    key_concepts: [],
    difficulty_tags: ['easy'],
    is_preview: false,
    is_published: true
  });

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
      fetchLessons();
      fetchStats();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, subject, difficulty_level')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const fetchLessons = async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      const lessonsData = await LessonService.getLessonsByCourse(courseId);
      setLessons(lessonsData);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!courseId) return;
    
    try {
      const statsData = await LessonService.getLessonStats(courseId);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateLesson = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a lesson title');
      return;
    }

    try {
      setLoading(true);
      const newOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) + 1 : 1;
      const lessonData = {
        ...formData,
        order_index: newOrder,
        course_id: courseId!
      };
      
      await LessonService.createLesson(lessonData);
      setShowCreateModal(false);
      resetForm();
      await fetchLessons();
      await fetchStats();
      alert('Lesson created successfully!');
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      const errorMessage = error.message || 'An unexpected error occurred while creating the lesson.';
      alert(`Failed to create lesson: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLesson = async () => {
    if (!selectedLesson) return;
    
    if (!formData.title.trim()) {
      alert('Please enter a lesson title');
      return;
    }
    
    try {
      setLoading(true);
      await LessonService.updateLesson({
        id: selectedLesson.id,
        ...formData
      });
      setShowEditModal(false);
      setSelectedLesson(null);
      resetForm();
      await fetchLessons();
      await fetchStats();
      alert('Lesson updated successfully!');
    } catch (error: any) {
      console.error('Error updating lesson:', error);
      const errorMessage = error.message || 'An unexpected error occurred while updating the lesson.';
      alert(`Failed to update lesson: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!selectedLesson) return;
    
    try {
      setLoading(true);
      await LessonService.deleteLesson(selectedLesson.id);
      setShowDeleteModal(false);
      setShowMobileActionModal(false);
      setSelectedLesson(null);
      await fetchLessons();
      await fetchStats();
      alert(`Lesson "${selectedLesson.title}" deleted successfully!`);
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      const errorMessage = error.message || 'An unexpected error occurred while deleting the lesson.';
      alert(`Failed to delete lesson: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateLesson = async (lessonId: string) => {
    try {
      setLoading(true);
      await LessonService.duplicateLesson(lessonId);
      await fetchLessons();
      await fetchStats();
      setShowMobileActionModal(false);
      alert('Lesson duplicated successfully!');
    } catch (error: any) {
      console.error('Error duplicating lesson:', error);
      const errorMessage = error.message || 'An unexpected error occurred while duplicating the lesson.';
      alert(`Failed to duplicate lesson: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (lessonId: string) => {
    try {
      setLoading(true);
      const lesson = lessons.find(l => l.id === lessonId);
      await LessonService.toggleLessonStatus(lessonId);
      await fetchLessons();
      await fetchStats();
      setShowMobileActionModal(false);
      const newStatus = lesson?.is_published ? 'unpublished' : 'published';
      alert(`Lesson ${newStatus} successfully!`);
    } catch (error: any) {
      console.error('Error toggling lesson status:', error);
      const errorMessage = error.message || 'An unexpected error occurred while updating the lesson status.';
      alert(`Failed to toggle lesson status: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: courseId || '',
      title: '',
      description: '',
      content_type: 'text',
      content_html: '',
      rsl_video_url: '',
      estimated_duration_minutes: 5,
      learning_objectives: [],
      key_concepts: [],
      difficulty_tags: ['easy'],
      is_preview: false,
      is_published: true
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (lesson: EnhancedLesson) => {
    setSelectedLesson(lesson);
    setFormData({
      course_id: lesson.course_id,
      title: lesson.title,
      description: lesson.description || '',
      content_type: lesson.content_type,
      content_html: lesson.content_html || '',
      rsl_video_url: lesson.rsl_video_url || '',
      estimated_duration_minutes: lesson.estimated_duration_minutes,
      learning_objectives: lesson.learning_objectives || [],
      key_concepts: lesson.key_concepts || [],
      difficulty_tags: lesson.difficulty_tags || ['easy'],
      is_preview: lesson.is_preview,
      is_published: lesson.is_published
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (lesson: EnhancedLesson) => {
    setSelectedLesson(lesson);
    setShowDeleteModal(true);
  };

  const openPreviewModal = (lesson: EnhancedLesson) => {
    setSelectedLesson(lesson);
    setShowPreviewModal(true);
  };

  const openMobileActionMenu = (lesson: EnhancedLesson) => {
    setSelectedLesson(lesson);
    setShowMobileActionModal(true);
  };

  const handleReorderLesson = async (lessonId: string, direction: 'up' | 'down') => {
    try {
      setLoading(true);
      const currentLesson = lessons.find(l => l.id === lessonId);
      if (!currentLesson) return;

      const currentIndex = currentLesson.order_index;
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      const targetLesson = lessons.find(l => l.order_index === targetIndex);
      if (!targetLesson) return;

      // Swap order indices
      await LessonService.updateLesson({
        id: currentLesson.id,
        order_index: targetIndex
      } as any);
      
      await LessonService.updateLesson({
        id: targetLesson.id,
        order_index: currentIndex
      } as any);

      await fetchLessons();
      setShowMobileActionModal(false);
      alert('Lesson order updated successfully!');
    } catch (error: any) {
      console.error('Error reordering lesson:', error);
      const errorMessage = error.message || 'An unexpected error occurred while reordering the lesson.';
      alert(`Failed to reorder lesson: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoIcon size={16} className="text-red-500" />;
      case 'text': return <FileTextIcon size={16} className="text-blue-500" />;
      case 'interactive': return <PuzzleIcon size={16} className="text-green-500" />;
      case 'quiz': return <BarChartIcon size={16} className="text-purple-500" />;
      default: return <BookOpenIcon size={16} className="text-gray-500" />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'interactive': return 'bg-green-100 text-green-800';
      case 'quiz': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!courseId) {
    return <div>Course ID not found</div>;
  }

  return (
    <DashboardLayout title="Lesson Management" role="admin">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/courses')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon size={20} className="mr-2" />
              Back to Courses
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {course?.title || 'Course Lessons'}
              </h1>
              <p className="text-gray-600">{course?.subject} • {course?.difficulty_level}</p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <PlusIcon size={16} className="mr-2" />
            Add Lesson
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpenIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Lessons</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Published</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.published}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Draft</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.draft}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Duration</dt>
                    <dd className="text-lg font-medium text-gray-900">{Math.round(stats.totalDurationMinutes / 60)}h {stats.totalDurationMinutes % 60}m</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lessons List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading lessons...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No lessons</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first lesson.</p>
            <div className="mt-6">
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Add Lesson
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block">
              <ul className="divide-y divide-gray-200">
                {lessons.map((lesson) => (
                  <li key={lesson.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <GripVerticalIcon size={16} className="text-gray-400 cursor-move" />
                          <span className="text-sm font-medium text-gray-500">#{lesson.order_index}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {getContentTypeIcon(lesson.content_type)}
                            <h3 className="text-sm font-medium text-gray-900">{lesson.title}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getContentTypeColor(lesson.content_type)}`}>
                              {lesson.content_type}
                            </span>
                            {lesson.is_preview && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Preview
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500 truncate">{lesson.description}</p>
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <ClockIcon size={12} className="mr-1" />
                              {lesson.estimated_duration_minutes} min
                            </span>
                            {lesson.learning_objectives && lesson.learning_objectives.length > 0 && (
                              <span>{lesson.learning_objectives.length} objectives</span>
                            )}
                            {lesson.key_concepts && lesson.key_concepts.length > 0 && (
                              <span>{lesson.key_concepts.length} concepts</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lesson.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {lesson.is_published ? (
                            <>
                              <CheckCircleIcon size={12} className="mr-1" />
                              Published
                            </>
                          ) : (
                            <>
                              <XCircleIcon size={12} className="mr-1" />
                              Draft
                            </>
                          )}
                        </span>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openEditModal(lesson)}
                            className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit lesson"
                          >
                            <EditIcon size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleDuplicateLesson(lesson.id)}
                            className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50"
                            title="Duplicate lesson"
                          >
                            <CopyIcon size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleToggleStatus(lesson.id)}
                            className="p-1 rounded text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
                            title={lesson.is_published ? 'Unpublish' : 'Publish'}
                          >
                            {lesson.is_published ? <XCircleIcon size={16} /> : <CheckCircleIcon size={16} />}
                          </button>
                          
                          <button
                            onClick={() => openPreviewModal(lesson)}
                            className="p-1 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                            title="Preview lesson"
                          >
                            <EyeIcon size={16} />
                          </button>
                          
                          <button
                            onClick={() => openDeleteModal(lesson)}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete lesson"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
              <div className="space-y-2 p-4">
                {lessons.map((lesson) => (
                  <div 
                    key={lesson.id} 
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                    onClick={() => openMobileActionMenu(lesson)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            #{lesson.order_index}
                          </span>
                          {getContentTypeIcon(lesson.content_type)}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getContentTypeColor(lesson.content_type)}`}>
                            {lesson.content_type}
                          </span>
                        </div>
                        
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{lesson.title}</h3>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{lesson.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="flex items-center">
                              <ClockIcon size={12} className="mr-1" />
                              {lesson.estimated_duration_minutes}m
                            </span>
                            {lesson.learning_objectives && lesson.learning_objectives.length > 0 && (
                              <span>{lesson.learning_objectives.length} obj</span>
                            )}
                          </div>
                          
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            lesson.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {lesson.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="ml-2">
                        <SettingsIcon size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex justify-between items-center">
                <h3 className="text-lg font-medium text-purple-900">
                  {showCreateModal ? 'Create New Lesson' : 'Edit Lesson'}
                </h3>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedLesson(null);
                  }}
                  className="text-purple-500 hover:text-purple-700 focus:outline-none"
                >
                  <XIcon size={20} />
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="Enter lesson title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="Enter lesson description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Content Type</label>
                      <select
                        value={formData.content_type}
                        onChange={(e) => setFormData({...formData, content_type: e.target.value as any})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="video">Video</option>
                        <option value="interactive">Interactive</option>
                        <option value="quiz">Quiz</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.estimated_duration_minutes}
                        onChange={(e) => setFormData({...formData, estimated_duration_minutes: parseInt(e.target.value) || 5})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Content HTML</label>
                    <textarea
                      value={formData.content_html}
                      onChange={(e) => setFormData({...formData, content_html: e.target.value})}
                      rows={6}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm font-mono text-xs"
                      placeholder="Enter HTML content for the lesson"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">RSL Video URL</label>
                    <input
                      type="url"
                      value={formData.rsl_video_url}
                      onChange={(e) => setFormData({...formData, rsl_video_url: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="https://example.com/rsl-video.mp4"
                    />
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_preview"
                        checked={formData.is_preview}
                        onChange={(e) => setFormData({...formData, is_preview: e.target.checked})}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_preview" className="ml-2 block text-sm text-gray-900">
                        Preview Lesson
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_published"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                        Published
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={showCreateModal ? handleCreateLesson : handleEditLesson}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      {showCreateModal ? 'Creating...' : 'Updating...'}
                    </>
                  ) : (
                    showCreateModal ? 'Create Lesson' : 'Update Lesson'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedLesson(null);
                  }}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLesson && (
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Lesson</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete "<strong>{selectedLesson.title}</strong>"? 
                        This action cannot be undone and will remove all associated content and progress.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteLesson}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedLesson(null);
                  }}
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

      {/* Mobile Action Menu Modal */}
      {showMobileActionModal && selectedLesson && (
        <div className="fixed inset-0 z-50 overflow-y-auto md:hidden">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowMobileActionModal(false)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-t-lg text-left overflow-hidden shadow-xl transform transition-all w-full">
              <div className="bg-white px-4 pt-5 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{selectedLesson.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedLesson.content_type} • {selectedLesson.estimated_duration_minutes} min</p>
                  </div>
                  <button
                    onClick={() => setShowMobileActionModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setShowMobileActionModal(false);
                      openPreviewModal(selectedLesson);
                    }}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <EyeIcon size={16} className="mr-2" />
                    Preview
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowMobileActionModal(false);
                      openEditModal(selectedLesson);
                    }}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <EditIcon size={16} className="mr-2" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDuplicateLesson(selectedLesson.id)}
                    disabled={loading}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <CopyIcon size={16} className="mr-2" />
                    Duplicate
                  </button>
                  
                  <button
                    onClick={() => handleToggleStatus(selectedLesson.id)}
                    disabled={loading}
                    className={`flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium disabled:opacity-50 ${
                      selectedLesson.is_published 
                        ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100' 
                        : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    {selectedLesson.is_published ? (
                      <>
                        <XCircleIcon size={16} className="mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon size={16} className="mr-2" />
                        Publish
                      </>
                    )}
                  </button>
                </div>
                
                {/* Reordering Section */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Reorder Lesson</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleReorderLesson(selectedLesson.id, 'up')}
                      disabled={loading || selectedLesson.order_index === 1}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MoveIcon size={16} className="mr-2" />
                      Move Up
                    </button>
                    
                    <button
                      onClick={() => handleReorderLesson(selectedLesson.id, 'down')}
                      disabled={loading || selectedLesson.order_index === lessons.length}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MoveIcon size={16} className="mr-2" />
                      Move Down
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowMobileActionModal(false);
                      openDeleteModal(selectedLesson);
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                  >
                    <TrashIcon size={16} className="mr-2" />
                    Delete Lesson
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedLesson && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-purple-900">{selectedLesson.title}</h3>
                  <p className="text-sm text-purple-600">Preview Mode</p>
                </div>
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="text-purple-500 hover:text-purple-700 focus:outline-none"
                >
                  <XIcon size={20} />
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center">
                      {getContentTypeIcon(selectedLesson.content_type)}
                      <span className="ml-1 capitalize">{selectedLesson.content_type}</span>
                    </span>
                    <span className="flex items-center">
                      <ClockIcon size={14} className="mr-1" />
                      {selectedLesson.estimated_duration_minutes} minutes
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedLesson.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedLesson.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  
                  {selectedLesson.description && (
                    <p className="text-gray-700 mb-4">{selectedLesson.description}</p>
                  )}
                  
                  {selectedLesson.learning_objectives && selectedLesson.learning_objectives.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Learning Objectives:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {selectedLesson.learning_objectives.map((objective, index) => (
                          <li key={index}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedLesson.key_concepts && selectedLesson.key_concepts.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Key Concepts:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedLesson.key_concepts.map((concept, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedLesson.rsl_video_url && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">RSL Video:</h4>
                      <div className="bg-gray-100 rounded-lg p-4">
                        <a 
                          href={selectedLesson.rsl_video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 text-sm"
                        >
                          {selectedLesson.rsl_video_url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {selectedLesson.content_html && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Content:</h4>
                      <div 
                        className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4"
                        dangerouslySetInnerHTML={{ __html: selectedLesson.content_html }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                    openEditModal(selectedLesson);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Edit Lesson
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};