import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { BookOpenIcon, ClockIcon, CheckCircleIcon, BarChart3Icon, ChevronRightIcon, FilterIcon, SearchIcon, BookmarkIcon, StarIcon } from 'lucide-react';
interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  difficulty_level: string;
  subject: string;
  duration_minutes: number;
  enrolled_at: string;
  last_accessed: string;
  progress_percentage: number;
  completed: boolean;
  completion_date: string | null;
  favorite: boolean;
}
export const StudentMyLearning: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'last_accessed' | 'progress' | 'title'>('last_accessed');
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
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
        }
      } catch (error) {
        console.error('Error fetching user and courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndCourses();
  }, []);
  const fetchCourses = async (userId: string) => {
    try {
      setLoading(true);
      // Get user's enrolled courses
      const {
        data: userCourses,
        error: coursesError
      } = await supabase.from('user_courses').select(`
          *,
          course:courses(*)
        `).eq('user_id', userId);
      if (coursesError) throw coursesError;
      if (!userCourses || userCourses.length === 0) {
        setCourses([]);
        return;
      }
      // Format the courses data
      const formattedCourses = userCourses.map(item => ({
        id: item.course?.id || '',
        title: item.course?.title || 'Untitled Course',
        description: item.course?.description || '',
        image_url: item.course?.image_url || '',
        difficulty_level: item.course?.difficulty_level || 'beginner',
        subject: item.course?.subject || '',
        duration_minutes: item.course?.duration_minutes || 0,
        enrolled_at: item.enrolled_at || '',
        last_accessed: item.last_accessed || item.enrolled_at || '',
        progress_percentage: item.progress_percentage || 0,
        completed: item.completed || false,
        completion_date: item.completion_date || null,
        favorite: item.favorite || false
      }));
      // Apply filter
      let filteredCourses = formattedCourses;
      if (filter === 'in_progress') {
        filteredCourses = formattedCourses.filter(course => !course.completed);
      } else if (filter === 'completed') {
        filteredCourses = formattedCourses.filter(course => course.completed);
      }
      // Apply search
      if (searchTerm) {
        filteredCourses = filteredCourses.filter(course => course.title.toLowerCase().includes(searchTerm.toLowerCase()) || course.description.toLowerCase().includes(searchTerm.toLowerCase()) || course.subject.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      // Apply sorting
      filteredCourses.sort((a, b) => {
        if (sortBy === 'last_accessed') {
          return new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime();
        } else if (sortBy === 'progress') {
          return b.progress_percentage - a.progress_percentage;
        } else {
          return a.title.localeCompare(b.title);
        }
      });
      setCourses(filteredCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };
  const toggleFavorite = async (courseId: string, currentStatus: boolean) => {
    if (!userId) return;
    try {
      // Update in database
      const {
        error
      } = await supabase.from('user_courses').update({
        favorite: !currentStatus
      }).eq('user_id', userId).eq('course_id', courseId);
      if (error) throw error;
      // Update local state
      setCourses(courses.map(course => course.id === courseId ? {
        ...course,
        favorite: !currentStatus
      } : course));
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };
  const continueCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
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
        return 'bg-blue-100 text-blue-800';
    }
  };
  const formatLastAccessed = (dateString: string): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  return <DashboardLayout title="My Learning" role="student">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Learning</h1>
            <p className="text-gray-600">
              Track your progress across all courses
            </p>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              All Courses
            </button>
            <button onClick={() => setFilter('in_progress')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              In Progress
            </button>
            <button onClick={() => setFilter('completed')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Completed
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Search your courses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                <option value="last_accessed">Recently Accessed</option>
                <option value="progress">Progress</option>
                <option value="title">Title</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {loading ? <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div> : courses.length === 0 ? <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <BookOpenIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No courses found
          </h3>
          <p className="text-gray-600 mb-6">
            {filter !== 'all' ? `You don't have any ${filter === 'completed' ? 'completed' : 'in-progress'} courses.` : searchTerm ? 'No courses match your search.' : "You haven't enrolled in any courses yet."}
          </p>
          {filter !== 'all' ? <button onClick={() => setFilter('all')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              View All Courses
            </button> : searchTerm ? <button onClick={() => setSearchTerm('')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Clear Search
            </button> : <button onClick={() => navigate('/courses')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Browse Courses
            </button>}
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-200 relative">
                {course.image_url ? <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <BookOpenIcon size={48} className="text-gray-400" />
                  </div>}
                <button onClick={() => toggleFavorite(course.id, course.favorite)} className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-opacity">
                  <StarIcon size={18} className={course.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(course.difficulty_level)}`}>
                      {course.difficulty_level.charAt(0).toUpperCase() + course.difficulty_level.slice(1)}
                    </span>
                    {course.completed && <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                        <CheckCircleIcon size={12} className="mr-1" />
                        Completed
                      </span>}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg text-gray-800 mb-1">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{course.subject}</p>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                  <div className="flex items-center">
                    <ClockIcon size={14} className="mr-1" />
                    <span>{course.duration_minutes} mins</span>
                  </div>
                  <div className="flex items-center">
                    <BarChart3Icon size={14} className="mr-1" />
                    <span>{course.progress_percentage}% complete</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{
              width: `${course.progress_percentage}%`
            }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Last accessed: {formatLastAccessed(course.last_accessed)}
                  </span>
                  <button onClick={() => continueCourse(course.id)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    {course.progress_percentage > 0 ? 'Continue' : 'Start'}
                    <ChevronRightIcon size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>)}
        </div>}
      {/* Learning Stats */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Your Learning Stats
        </h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-start">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mr-4">
                  <BookOpenIcon size={20} />
                </div>
                <div>
                  <div className="text-sm text-blue-600 font-medium">
                    Total Courses
                  </div>
                  <div className="text-2xl font-bold text-blue-800">
                    {courses.length}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-start">
                <div className="p-2 bg-green-100 rounded-lg text-green-600 mr-4">
                  <CheckCircleIcon size={20} />
                </div>
                <div>
                  <div className="text-sm text-green-600 font-medium">
                    Completed
                  </div>
                  <div className="text-2xl font-bold text-green-800">
                    {courses.filter(c => c.completed).length}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <div className="flex items-start">
                <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600 mr-4">
                  <BarChart3Icon size={20} />
                </div>
                <div>
                  <div className="text-sm text-yellow-600 font-medium">
                    Average Progress
                  </div>
                  <div className="text-2xl font-bold text-yellow-800">
                    {courses.length > 0 ? Math.round(courses.reduce((acc, course) => acc + course.progress_percentage, 0) / courses.length) : 0}
                    %
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>;
};