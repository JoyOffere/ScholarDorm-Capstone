import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { SearchIcon, FilterIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon, BookOpenIcon, CheckCircleIcon, XCircleIcon, DownloadIcon, RefreshCwIcon, MoreHorizontalIcon, XIcon, ClockIcon, CalendarIcon, VideoIcon, SettingsIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getCourses, deleteCourse, Course } from '../../../lib/supabase-utils';
import { RSLService, RSLAccessibilitySettings } from '../../../lib/rsl-service';
import { useAuth } from '../../../contexts/AuthContext';
interface CourseWithDetails extends Omit<Course, 'difficulty_level'> {
  difficulty_level: string;
  created_by_name?: string;
  lesson_count?: number;
}
export const AdminCourses: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty_level: 'beginner',
    is_active: true
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty_level: 'beginner',
    is_active: true
  });
  const [createLessons, setCreateLessons] = useState<{
    id: string;
    title: string;
    description: string;
    content_type: 'video' | 'text' | 'interactive' | 'quiz';
    content_url?: string;
    duration_minutes?: number;
    order_index: number;
  }[]>([]);
  const [rslSettings, setRslSettings] = useState<RSLAccessibilitySettings>({
    show_captions: true,
    video_speed: 1.0,
    high_contrast: false,
    large_text: false,
    auto_repeat: false,
    sign_descriptions: true,
  });

  // New handlers for create course modal
  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateFormData({
      ...createFormData,
      [name]: value
    });
  };

  const handleCreateCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCreateFormData({
      ...createFormData,
      [name]: checked
    });
  };

  const handleAddLesson = () => {
    const newLesson = {
      id: Date.now().toString(),
      title: '',
      description: '',
      content_type: 'video' as const,
      content_url: '',
      duration_minutes: 0,
      order_index: createLessons.length
    };
    setCreateLessons([...createLessons, newLesson]);
  };

  const handleLessonChange = (index: number, field: string, value: any) => {
    const updatedLessons = [...createLessons];
    (updatedLessons[index] as any)[field] = value;
    setCreateLessons(updatedLessons);
  };

  const handleRemoveLesson = (index: number) => {
    const updatedLessons = [...createLessons];
    updatedLessons.splice(index, 1);
    // Reorder remaining lessons
    updatedLessons.forEach((lesson, idx) => {
      lesson.order_index = idx;
    });
    setCreateLessons(updatedLessons);
  };

  const handleCreateSubmit = async () => {
    if (!createFormData.title || !createFormData.subject) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      setLoading(true);
      // Insert course
      const { data: courseData, error: courseError } = await supabase.from('courses').insert({
        title: createFormData.title,
        description: createFormData.description,
        subject: createFormData.subject,
        difficulty_level: createFormData.difficulty_level,
        is_active: createFormData.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select().single();
      if (courseError) throw courseError;

      // Insert lessons if any
      if (createLessons.length > 0) {
        const lessonsToInsert = createLessons.map(lesson => ({
          course_id: courseData.id,
          title: lesson.title,
          description: lesson.description,
          content_type: lesson.content_type,
          content_url: lesson.content_url,
          duration_minutes: lesson.duration_minutes,
          order_index: lesson.order_index
        }));
        const { error: lessonsError } = await supabase.from('lessons').insert(lessonsToInsert);
        if (lessonsError) throw lessonsError;
      }

      // Refresh courses list
      await fetchCourses();

      // Reset form and close modal
      setCreateFormData({
        title: '',
        description: '',
        subject: '',
        difficulty_level: 'beginner',
        is_active: true
      });
      setCreateLessons([]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    loadRSLSettings();
  }, [subjectFilter, difficultyFilter, statusFilter]);

  const loadRSLSettings = async () => {
    try {
      const settings = await RSLService.getAccessibilitySettings(user?.id || '');
      setRslSettings(settings);
    } catch (error) {
      console.error('Error loading RSL settings:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses({
        subject: subjectFilter || undefined,
        difficulty: difficultyFilter || undefined,
        isActive: statusFilter !== null ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      // Use the optimized data from getCourses with creator name and lesson count
      const coursesWithDetails = (data || []).map((course: any) => {
        const { difficulty_level, created_by_name, lesson_count, ...rest } = course;
        return {
          ...rest,
          difficulty_level: (difficulty_level as string).toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
          created_by_name: created_by_name || 'Unknown',
          lesson_count: lesson_count || 0
        };
      });
      setCourses(coursesWithDetails || []);
      // Extract unique subjects for filter
      if (data && data.length > 0) {
        const uniqueSubjects = Array.from(new Set(data.map((course: any) => course.subject)));
        setSubjects(uniqueSubjects as string[]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleDeleteClick = (courseId: string) => {
    setCourseToDelete(courseId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      setLoading(true);
      const success = await deleteCourse(courseToDelete);
      if (success) {
        setCourses(courses.filter(course => course.id !== courseToDelete));
        // If we're deleting the currently selected course, close the modal
        if (selectedCourse && selectedCourse.id === courseToDelete) {
          setShowCourseModal(false);
          setSelectedCourse(null);
        }
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    } finally {
      setShowDeleteModal(false);
      setCourseToDelete(null);
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSubjectFilter(null);
    setDifficultyFilter(null);
    setStatusFilter(null);
    fetchCourses();
  };

  const toggleCourseStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      const {
        error
      } = await supabase.from('courses').update({
        is_active: !currentStatus,
        updated_at: new Date().toISOString()
      }).eq('id', courseId);
      if (error) throw error;
      // Update local state
      setCourses(courses.map(course => course.id === courseId ? {
        ...course,
        is_active: !currentStatus
      } : course));
      // Update selected course if it's the one being toggled
      if (selectedCourse && selectedCourse.id === courseId) {
        setSelectedCourse({
          ...selectedCourse,
          is_active: !currentStatus
        });
      }
    } catch (error) {
      console.error('Error toggling course status:', error);
    }
  };

  const handleCourseClick = (course: CourseWithDetails) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
    setIsEditing(false);
    setEditFormData({
      title: course.title,
      description: course.description,
      subject: course.subject,
      difficulty_level: course.difficulty_level,
      is_active: course.is_active
    });
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditSubmit = async () => {
    if (!selectedCourse) return;
    try {
      const {
        error
      } = await supabase.from('courses').update({
        title: editFormData.title,
        description: editFormData.description,
        subject: editFormData.subject,
        difficulty_level: editFormData.difficulty_level,
        is_active: editFormData.is_active,
        updated_at: new Date().toISOString()
      }).eq('id', selectedCourse.id);
      if (error) throw error;
      // Update local state
      setCourses(courses.map(course => course.id === selectedCourse.id ? {
        ...course,
        title: editFormData.title,
        description: editFormData.description,
        subject: editFormData.subject,
        difficulty_level: editFormData.difficulty_level,
        is_active: editFormData.is_active
      } : course));
      // Update selected course
      setSelectedCourse({
        ...selectedCourse,
        title: editFormData.title,
        description: editFormData.description,
        subject: editFormData.subject,
        difficulty_level: editFormData.difficulty_level,
        is_active: editFormData.is_active
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating course:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      checked
    } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: checked
    });
  };

  // Render create course modal
  const renderCreateCourseModal = () => {
    if (!showCreateModal) return null;
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex justify-between items-center">
              <h3 className="text-lg font-medium text-purple-900">Create New Course</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-purple-500 hover:text-purple-700 focus:outline-none">
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title *</label>
                  <input type="text" name="title" id="title" value={createFormData.title} onChange={handleCreateInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea name="description" id="description" rows={3} value={createFormData.description} onChange={handleCreateInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject *</label>
                    <input type="text" name="subject" id="subject" value={createFormData.subject} onChange={handleCreateInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700">Difficulty</label>
                    <select name="difficulty_level" id="difficulty_level" value={createFormData.difficulty_level} onChange={handleCreateInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" name="is_active" id="is_active" checked={createFormData.is_active} onChange={handleCreateCheckboxChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Active</label>
                </div>
                {/* Lessons Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-medium text-gray-900">Lessons</h4>
                    <button type="button" onClick={handleAddLesson} className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <PlusIcon size={16} className="mr-1" />
                      Add Lesson
                    </button>
                  </div>
                  {createLessons.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg border-gray-300 text-gray-500">
                      No lessons added yet. Click "Add Lesson" to get started.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {createLessons.map((lesson, index) => (
                        <div key={lesson.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">Lesson {index + 1}</h5>
                            <button type="button" onClick={() => handleRemoveLesson(index)} className="p-1 rounded text-red-600 hover:bg-red-50">
                              <XIcon size={16} />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                              <input type="text" value={lesson.title} onChange={e => handleLessonChange(index, 'title', e.target.value)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm" placeholder="Lesson title" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                              <textarea value={lesson.description} onChange={e => handleLessonChange(index, 'description', e.target.value)} rows={2} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm" placeholder="Lesson description" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Content Type</label>
                                <select value={lesson.content_type} onChange={e => handleLessonChange(index, 'content_type', e.target.value)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm">
                                  <option value="video">Video</option>
                                  <option value="text">Text</option>
                                  <option value="interactive">Interactive</option>
                                  <option value="quiz">Quiz</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                <input type="number" min={0} value={lesson.duration_minutes || 0} onChange={e => handleLessonChange(index, 'duration_minutes', parseInt(e.target.value) || 0)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm" />
                              </div>
                            </div>
                            {(lesson.content_type === 'video' || lesson.content_type === 'interactive') && (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Content URL</label>
                                <input type="text" value={lesson.content_url || ''} onChange={e => handleLessonChange(index, 'content_url', e.target.value)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm" placeholder="https://example.com/video.mp4" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button type="button" onClick={handleCreateSubmit} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm">
                Create Course
              </button>
              <button type="button" onClick={() => setShowCreateModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return <DashboardLayout title="Course Management" role="admin">
      {/* Filters and actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <form onSubmit={handleSearch}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
              </div>
              <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Search courses by title or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </form>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-2">
            {/* Mobile filter toggle */}
            <button className="md:hidden inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" onClick={() => setShowMobileFilters(!showMobileFilters)}>
              <FilterIcon size={16} className="mr-2" />
              {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {/* Create Course button */}
            <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <PlusIcon size={16} className="mr-2" />
              New Course
            </button>
          </div>
          {/* Filters - hidden on mobile unless toggled */}
          <div className={`flex flex-wrap items-center gap-3 ${showMobileFilters ? 'flex' : 'hidden md:flex'}`}>
            {/* Subject Filter */}
            <div className="relative inline-block text-left w-full md:w-auto">
              <select className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={subjectFilter || ''} onChange={e => setSubjectFilter(e.target.value || null)}>
                <option value="">All Subjects</option>
                {subjects.map(subject => <option key={subject} value={subject}>
                    {subject}
                  </option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Difficulty Filter */}
            <div className="relative inline-block text-left w-full md:w-auto">
              <select className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={difficultyFilter || ''} onChange={e => setDifficultyFilter(e.target.value || null)}>
                <option value="">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Status Filter */}
            <div className="relative inline-block text-left w-full md:w-auto">
              <select className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={statusFilter === null ? '' : statusFilter ? 'active' : 'inactive'} onChange={e => {
              if (e.target.value === '') setStatusFilter(null);else setStatusFilter(e.target.value === 'active');
            }}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Reset Filters */}
            {(searchTerm || subjectFilter || difficultyFilter || statusFilter !== null) && <button onClick={resetFilters} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-auto">
                <RefreshCwIcon size={16} className="mr-2" />
                Reset Filters
              </button>}
            {/* Export */}
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-auto">
              <DownloadIcon size={16} className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>
      {/* Courses Table - Desktop View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                      <span className="ml-2 text-gray-500">
                        Loading courses...
                      </span>
                    </div>
                  </td>
                </tr> : courses.length === 0 ? <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="text-center py-8">
                      <BookOpenIcon size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        No courses found
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm || subjectFilter || difficultyFilter || statusFilter !== null ? 'Try adjusting your search or filter criteria.' : 'Get started by creating your first course.'}
                      </p>
                      {searchTerm || subjectFilter || difficultyFilter || statusFilter !== null ? <button onClick={resetFilters} className="mt-4 text-purple-600 hover:text-purple-800 font-medium">
                          Reset all filters
                        </button> : <Link to="/admin/courses/create" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                          <PlusIcon size={16} className="mr-2" />
                          Create Course
                        </Link>}
                    </div>
                  </td>
                </tr> : courses.map(course => <tr key={course.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleCourseClick(course)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                          {course.image_url ? <img src={course.image_url} alt={course.title} className="h-10 w-10 object-cover" /> : <div className="h-10 w-10 flex items-center justify-center bg-purple-100 text-purple-600">
                              <BookOpenIcon size={20} />
                            </div>}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {course.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {course.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {course.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' : course.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {course.difficulty_level.charAt(0).toUpperCase() + course.difficulty_level.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {course.is_active ? <>
                            <CheckCircleIcon size={12} className="mr-1" />
                            Active
                          </> : <>
                            <XCircleIcon size={12} className="mr-1" />
                            Inactive
                          </>}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(course.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2" onClick={e => e.stopPropagation()}>
                        <Link to={`/admin/courses/${course.id}`} className="text-purple-600 hover:text-purple-900" title="Edit course">
                          <EditIcon size={16} />
                        </Link>
                        <button onClick={e => {
                    e.stopPropagation();
                    handleDeleteClick(course.id);
                  }} className="text-red-600 hover:text-red-900" title="Delete course">
                          <TrashIcon size={16} />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900" title="Preview course">
                          <EyeIcon size={16} />
                        </button>
                        <button className="text-gray-500 hover:text-gray-700" title="More options">
                          <MoreHorizontalIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {courses.length > 0 && <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to{' '}
                  <span className="font-medium">{courses.length}</span> of{' '}
                  <span className="font-medium">{courses.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" aria-current="page" className="z-10 bg-purple-50 border-purple-500 text-purple-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                    1
                  </a>
                  <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                </nav>
              </div>
            </div>
          </div>}
      </div>
      {/* Mobile Course Cards */}
      <div className="md:hidden">
        {loading ? <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-2 text-gray-500">Loading courses...</span>
          </div> : courses.length === 0 ? <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <BookOpenIcon size={40} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No courses found
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchTerm || subjectFilter || difficultyFilter || statusFilter !== null ? 'Try adjusting your search or filter criteria.' : 'Get started by creating your first course.'}
            </p>
            {searchTerm || subjectFilter || difficultyFilter || statusFilter !== null ? <button onClick={resetFilters} className="w-full text-purple-600 hover:text-purple-800 font-medium">
                Reset all filters
              </button> : <Link to="/admin/courses/create" className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                <PlusIcon size={16} className="mr-2" />
                Create Course
              </Link>}
          </div> : <div className="space-y-4">
            {courses.map(course => <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" onClick={() => handleCourseClick(course)}>
                <div className="p-4">
                  <div className="flex justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {course.title}
                      </h3>
                      <p className="mt-1 flex items-center text-xs text-gray-500">
                        <span className="truncate">{course.subject}</span>
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${course.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {course.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>}
      </div>
      {/* Course Detail Modal */}
      {showCourseModal && selectedCourse && <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" style={{
          maxWidth: '90%',
          width: '600px'
        }}>
              {/* Modal Header */}
              <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex justify-between items-center">
                <h3 className="text-lg font-medium text-purple-900">
                  {isEditing ? 'Edit Course' : 'Course Details'}
                </h3>
                <button onClick={() => setShowCourseModal(false)} className="text-purple-500 hover:text-purple-700 focus:outline-none">
                  <XIcon size={20} />
                </button>
              </div>
              {/* Modal Content */}
              <div className="p-6">
                {isEditing /* Edit Form */ ? <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input type="text" name="title" id="title" value={editFormData.title} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea name="description" id="description" rows={3} value={editFormData.description} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                          Subject
                        </label>
                        <input type="text" name="subject" id="subject" value={editFormData.subject} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700">
                          Difficulty
                        </label>
                        <select name="difficulty_level" id="difficulty_level" value={editFormData.difficulty_level} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" name="is_active" id="is_active" checked={editFormData.is_active} onChange={handleCheckboxChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                        Active
                      </label>
                    </div>
                  </div> /* View Details */ : <div className="space-y-4">
                    {/* Course Image */}
                    <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100">
                      {selectedCourse.image_url ? <img src={selectedCourse.image_url} alt={selectedCourse.title} className="object-cover w-full h-40" /> : <div className="flex items-center justify-center h-40 bg-purple-50">
                          <BookOpenIcon size={48} className="text-purple-300" />
                        </div>}
                    </div>
                    {/* Title and Status */}
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {selectedCourse.title}
                      </h2>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedCourse.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedCourse.is_active ? <>
                            <CheckCircleIcon size={12} className="mr-1" />
                            Active
                          </> : <>
                            <XCircleIcon size={12} className="mr-1" />
                            Inactive
                          </>}
                      </span>
                    </div>
                    {/* Description */}
                    <p className="text-sm text-gray-600">
                      {selectedCourse.description}
                    </p>
                    {/* Course Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase">
                          Subject
                        </div>
                        <div className="font-medium text-gray-800">
                          {selectedCourse.subject}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase">
                          Difficulty
                        </div>
                        <div className="font-medium text-gray-800">
                          {selectedCourse.difficulty_level.charAt(0).toUpperCase() + selectedCourse.difficulty_level.slice(1)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase">
                          Lessons
                        </div>
                        <div className="font-medium text-gray-800">
                          {selectedCourse.lesson_count || 0}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase">
                          Created By
                        </div>
                        <div className="font-medium text-gray-800">
                          {selectedCourse.created_by_name}
                        </div>
                      </div>
                    </div>
                    {/* Dates */}
                    <div className="flex justify-between text-xs text-gray-500 pt-2">
                      <div className="flex items-center">
                        <CalendarIcon size={14} className="mr-1" />
                        Created:{' '}
                        {new Date(selectedCourse.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon size={14} className="mr-1" />
                        Updated:{' '}
                        {new Date(selectedCourse.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>}
              </div>
              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {isEditing ? <>
                    <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={handleEditSubmit}>
                      Save Changes
                    </button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={handleEditCancel}>
                      Cancel
                    </button>
                  </> : <>
                    <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={handleEditClick}>
                      Edit Course
                    </button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => handleDeleteClick(selectedCourse.id)}>
                      Delete
                    </button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => toggleCourseStatus(selectedCourse.id, selectedCourse.is_active)}>
                      {selectedCourse.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </>}
              </div>
            </div>
          </div>
        </div>}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Course
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this course? This action
                        cannot be undone, and all associated lessons, quizzes,
                        and student progress will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={confirmDelete}>
                  Delete
                </button>
                <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>}
      {/* Create Course Modal */}
      {renderCreateCourseModal()}
    </DashboardLayout>;
};


