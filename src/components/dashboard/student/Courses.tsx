import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { BookOpenIcon, SearchIcon, FilterIcon, ChevronRightIcon, StarIcon, ClockIcon, GraduationCapIcon, CheckCircleIcon, UserIcon, BookmarkIcon, AlertCircleIcon, XIcon, RefreshCwIcon } from 'lucide-react';
interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  difficulty_level: string;
  subject: string;
  duration_minutes: number;
  is_active: boolean;
  is_enrolled?: boolean;
  progress_percentage?: number;
  has_rsl?: boolean;
}
export const StudentCourses: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    const fetchUserAndCourses = async () => {
      try {
        // Get current user
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          await fetchCourses(user.id);
          await fetchCategories();
        }
      } catch (error) {
        console.error('Error fetching user and courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndCourses();
  }, []);
  const fetchCategories = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('course_categories').select('name').order('name', {
        ascending: true
      });
      if (error) throw error;
      const categoryNames = data?.map(cat => cat.name) || [];
      setCategories(categoryNames);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  const fetchCourses = async (userId: string) => {
    try {
      setLoading(true);
      // Get all active courses
      const {
        data: coursesData,
        error: coursesError
      } = await supabase.from('courses').select('*').eq('is_active', true).order('title', {
        ascending: true
      });
      if (coursesError) throw coursesError;
      // Get user's enrolled courses
      const {
        data: enrolledData,
        error: enrolledError
      } = await supabase.from('user_courses').select('course_id, progress_percentage').eq('user_id', userId);
      if (enrolledError) throw enrolledError;
      // Create a map of enrolled courses
      const enrolledMap: Record<string, number> = {};
      enrolledData?.forEach(item => {
        enrolledMap[item.course_id] = item.progress_percentage || 0;
      });
      // Get lessons with RSL videos
      const {
        data: rslLessons,
        error: rslError
      } = await supabase.from('lessons').select('course_id').not('rsl_video_url', 'is', null).not('rsl_video_url', 'eq', '');
      if (rslError) throw rslError;
      const coursesWithRSL = new Set(rslLessons?.map(lesson => lesson.course_id));
      // Combine the data
      const enhancedCourses = coursesData?.map(course => ({
        ...course,
        is_enrolled: !!enrolledMap[course.id],
        progress_percentage: enrolledMap[course.id] || 0,
        has_rsl: coursesWithRSL.has(course.id)
      })) || [];
      setCourses(enhancedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };
  const enrollInCourse = async (courseId: string) => {
    if (!userId) return;
    try {
      const {
        error
      } = await supabase.from('user_courses').insert({
        user_id: userId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        progress_percentage: 0,
        completed: false
      });
      if (error) throw error;
      // Update local state
      setCourses(courses.map(course => course.id === courseId ? {
        ...course,
        is_enrolled: true,
        progress_percentage: 0
      } : course));
      // Create activity entry
      await supabase.from('activities').insert({
        user_id: userId,
        activity_type: 'course_start',
        metadata: {
          course_id: courseId
        }
      });
      // Close modal if open
      setShowEnrollModal(false);
      setSelectedCourse(null);
      // Navigate to the course
      navigate(`/learning`);
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };
  const handleCourseAction = (course: Course) => {
    if (course.is_enrolled) {
      // If already enrolled, navigate to learning page
      navigate('/learning');
    } else {
      // If not enrolled, show enrollment modal
      setSelectedCourse(course);
      setShowEnrollModal(true);
    }
  };
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.subject === selectedCategory;
    const matchesDifficulty = !selectedDifficulty || course.difficulty_level === selectedDifficulty.toLowerCase();
    return matchesSearch && matchesCategory && matchesDifficulty;
  });
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedDifficulty(null);
  };
  return <DashboardLayout title="Courses" role="student">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 mb-6">
        <div className="flex flex-col space-y-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Search courses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          {/* Filter toggle for mobile */}
          <div className="md:hidden">
            <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <FilterIcon size={16} className="mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
          {/* Filters - hidden on mobile unless toggled */}
          <div className={`flex flex-wrap gap-3 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
            {/* Category filter */}
            <div className="relative inline-block text-left w-full md:w-auto">
              <select className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={selectedCategory || ''} onChange={e => setSelectedCategory(e.target.value || null)}>
                <option value="">All Categories</option>
                {categories.map(category => <option key={category} value={category}>
                    {category}
                  </option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Difficulty filter */}
            <div className="relative inline-block text-left w-full md:w-auto">
              <select className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={selectedDifficulty || ''} onChange={e => setSelectedDifficulty(e.target.value || null)}>
                <option value="">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Reset filters */}
            {(searchTerm || selectedCategory || selectedDifficulty) && <button onClick={resetFilters} className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full md:w-auto">
                <RefreshCwIcon size={16} className="mr-2" />
                Reset Filters
              </button>}
          </div>
        </div>
      </div>
      {/* Course Grid */}
      {loading ? <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div> : filteredCourses.length === 0 ? <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
          <BookOpenIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No courses found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria to find what you're
            looking for.
          </p>
          <button onClick={resetFilters} className="mt-4 text-blue-600 hover:text-blue-800 font-medium">
            Reset all filters
          </button>
        </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              {/* Course Image */}
              <div className="relative h-48 overflow-hidden">
                <img src={course.image_url || 'https://images.unsplash.com/photo-1546521343-4eb2c01aa44b?q=80&w=1635&auto=format&fit=crop'} alt={course.title} className="w-full h-full object-cover" />
                {course.has_rsl && <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                    RSL
                  </div>}
                {course.is_enrolled && course.progress_percentage !== undefined && course.progress_percentage > 0 && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                      <div className="h-full bg-green-500" style={{
              width: `${course.progress_percentage}%`
            }} />
                    </div>}
              </div>
              {/* Course Content */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${course.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' : course.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {course.difficulty_level.charAt(0).toUpperCase() + course.difficulty_level.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {course.subject}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">
                  {course.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center text-xs text-gray-500">
                    <ClockIcon size={14} className="mr-1" />
                    <span>{course.duration_minutes} mins</span>
                  </div>
                  {course.is_enrolled && course.progress_percentage !== undefined && course.progress_percentage > 0 ? <span className="text-sm font-medium text-green-600">
                      {course.progress_percentage}% Complete
                    </span> : <div className="flex items-center">
                      <StarIcon size={14} className="text-yellow-400 mr-1" />
                      <span className="text-xs text-gray-500">
                        {course.is_enrolled ? 'Just Started' : 'New'}
                      </span>
                    </div>}
                </div>
              </div>
              {/* Course Action */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <button onClick={() => handleCourseAction(course)} className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  {course.is_enrolled ? course.progress_percentage && course.progress_percentage > 0 ? 'Continue Learning' : 'Start Learning' : 'Enroll Now'}
                  <ChevronRightIcon size={16} className="ml-1" />
                </button>
              </div>
            </div>)}
        </div>}
      {/* Enrollment Modal */}
      {showEnrollModal && selectedCourse && <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Modal Header */}
              <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
                <h3 className="text-lg font-medium text-blue-900">
                  Enroll in Course
                </h3>
                <button onClick={() => setShowEnrollModal(false)} className="text-blue-500 hover:text-blue-700 focus:outline-none">
                  <XIcon size={20} />
                </button>
              </div>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <GraduationCapIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        You're about to enroll in{' '}
                        <span className="font-medium">
                          {selectedCourse.title}
                        </span>
                        . This course will be added to your learning dashboard.
                      </p>
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <BookOpenIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-blue-800">
                              Course Details
                            </h4>
                            <ul className="mt-1 text-xs text-blue-700 space-y-1">
                              <li>
                                • Duration: {selectedCourse.duration_minutes}{' '}
                                minutes
                              </li>
                              <li>
                                • Difficulty:{' '}
                                {selectedCourse.difficulty_level.charAt(0).toUpperCase() + selectedCourse.difficulty_level.slice(1)}
                              </li>
                              <li>• Subject: {selectedCourse.subject}</li>
                              {selectedCourse.has_rsl && <li>• Includes Rwandan Sign Language videos</li>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => enrollInCourse(selectedCourse.id)}>
                  Enroll Now
                </button>
                <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => {
              setShowEnrollModal(false);
              setSelectedCourse(null);
            }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>}
    </DashboardLayout>;
};