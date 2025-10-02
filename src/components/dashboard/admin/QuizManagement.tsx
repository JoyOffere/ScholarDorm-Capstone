import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { SearchIcon, FilterIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon, ClipboardListIcon, DownloadIcon, RefreshCwIcon, MoreHorizontalIcon, XIcon, CheckCircleIcon, XCircleIcon, BookOpenIcon, CalendarIcon, ClockIcon, ListIcon, FileTextIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
interface Quiz {
  id: string;
  title: string;
  description: string;
  lesson_id: string;
  course_title?: string;
  passing_score: number;
  question_count?: number;
  created_at: string;
  updated_at: string;
  is_published: boolean;
}
export const AdminQuizManagement: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [courses, setCourses] = useState<{
    id: string;
    title: string;
  }[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    passing_score: 0,
    is_published: false
  });
  useEffect(() => {
    fetchQuizzes();
    fetchCourses();
  }, [courseFilter, statusFilter]);
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      // Start with the base query
      let query = supabase.from('quizzes').select(`
          *,
          lesson:lessons(id, title, course_id),
          questions:quiz_questions(id)
        `).order('created_at', {
        ascending: false
      });
      // Apply filters
      if (courseFilter) {
        query = query.eq('lesson.course_id', courseFilter);
      }
      if (statusFilter !== null) {
        query = query.eq('is_published', statusFilter);
      }
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      const {
        data: quizData,
        error
      } = await query;
      if (error) throw error;
      // Get course titles for each quiz
      const enhancedQuizzes = await Promise.all((quizData || []).map(async (quiz: any) => {
        if (!quiz.lesson || !quiz.lesson.course_id) {
          return {
            ...quiz,
            course_title: 'Unknown Course',
            question_count: quiz.questions ? quiz.questions.length : 0
          };
        }
        // Get course title
        const {
          data: courseData
        } = await supabase.from('courses').select('title').eq('id', quiz.lesson.course_id).single();
        return {
          ...quiz,
          course_title: courseData?.title || 'Unknown Course',
          question_count: quiz.questions ? quiz.questions.length : 0
        };
      }));
      setQuizzes(enhancedQuizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchCourses = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('courses').select('id, title').order('title', {
        ascending: true
      });
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuizzes();
  };
  const handleDeleteClick = (quizId: string) => {
    setQuizToDelete(quizId);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!quizToDelete) return;
    try {
      setLoading(true);
      // First delete all questions associated with the quiz
      const {
        error: questionsError
      } = await supabase.from('quiz_questions').delete().eq('quiz_id', quizToDelete);
      if (questionsError) throw questionsError;
      // Then delete the quiz itself
      const {
        error: quizError
      } = await supabase.from('quizzes').delete().eq('id', quizToDelete);
      if (quizError) throw quizError;
      // Update local state
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizToDelete));
      // If we're deleting the currently selected quiz, close the modal
      if (selectedQuiz && selectedQuiz.id === quizToDelete) {
        setShowQuizModal(false);
        setSelectedQuiz(null);
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
    } finally {
      setShowDeleteModal(false);
      setQuizToDelete(null);
      setLoading(false);
    }
  };
  const resetFilters = () => {
    setSearchTerm('');
    setCourseFilter(null);
    setStatusFilter(null);
  };
  const toggleQuizStatus = async (quizId: string, currentStatus: boolean) => {
    try {
      const {
        error
      } = await supabase.from('quizzes').update({
        is_published: !currentStatus,
        updated_at: new Date().toISOString()
      }).eq('id', quizId);
      if (error) throw error;
      // Update local state
      setQuizzes(quizzes.map(quiz => quiz.id === quizId ? {
        ...quiz,
        is_published: !currentStatus
      } : quiz));
      // Update selected quiz if it's the one being toggled
      if (selectedQuiz && selectedQuiz.id === quizId) {
        setSelectedQuiz({
          ...selectedQuiz,
          is_published: !currentStatus
        });
      }
    } catch (error) {
      console.error('Error toggling quiz status:', error);
    }
  };
  const handleQuizClick = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowQuizModal(true);
    setIsEditing(false);
    setEditFormData({
      title: quiz.title,
      description: quiz.description,
      passing_score: quiz.passing_score,
      is_published: quiz.is_published
    });
  };
  const handleEditClick = () => {
    setIsEditing(true);
  };
  const handleEditCancel = () => {
    setIsEditing(false);
  };
  const handleEditSubmit = async () => {
    if (!selectedQuiz) return;
    try {
      const {
        error
      } = await supabase.from('quizzes').update({
        title: editFormData.title,
        description: editFormData.description,
        passing_score: editFormData.passing_score,
        is_published: editFormData.is_published,
        updated_at: new Date().toISOString()
      }).eq('id', selectedQuiz.id);
      if (error) throw error;
      // Update local state
      setQuizzes(quizzes.map(quiz => quiz.id === selectedQuiz.id ? {
        ...quiz,
        title: editFormData.title,
        description: editFormData.description,
        passing_score: editFormData.passing_score,
        is_published: editFormData.is_published
      } : quiz));
      // Update selected quiz
      setSelectedQuiz({
        ...selectedQuiz,
        title: editFormData.title,
        description: editFormData.description,
        passing_score: editFormData.passing_score,
        is_published: editFormData.is_published
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating quiz:', error);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === 'passing_score' ? parseInt(value) : value
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
  return <DashboardLayout title="Quiz Management" role="admin">
      {/* Filters and actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <form onSubmit={handleSearch}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
              </div>
              <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Search quizzes by title or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </form>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-2">
            {/* Mobile filter toggle */}
            <button className="md:hidden inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" onClick={() => setShowMobileFilters(!showMobileFilters)}>
              <FilterIcon size={16} className="mr-2" />
              {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {/* Create Quiz button */}
            <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500" onClick={() => {
            // In a real implementation, this would navigate to a quiz creation page
            alert('This would navigate to a quiz creation page');
          }}>
              <PlusIcon size={16} className="mr-2" />
              New Quiz
            </button>
          </div>
          {/* Filters - hidden on mobile unless toggled */}
          <div className={`flex flex-wrap items-center gap-3 ${showMobileFilters ? 'flex' : 'hidden md:flex'}`}>
            {/* Course Filter */}
            <div className="relative inline-block text-left w-full md:w-auto">
              <select className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={courseFilter || ''} onChange={e => setCourseFilter(e.target.value || null)}>
                <option value="">All Courses</option>
                {courses.map(course => <option key={course.id} value={course.id}>
                    {course.title}
                  </option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Status Filter */}
            <div className="relative inline-block text-left w-full md:w-auto">
              <select className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={statusFilter === null ? '' : statusFilter ? 'published' : 'draft'} onChange={e => {
              if (e.target.value === '') setStatusFilter(null);else setStatusFilter(e.target.value === 'published');
            }}>
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Reset Filters */}
            {(searchTerm || courseFilter || statusFilter !== null) && <button onClick={resetFilters} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-auto">
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
      {/* Quizzes Table - Desktop View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quiz
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
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
                        Loading quizzes...
                      </span>
                    </div>
                  </td>
                </tr> : quizzes.length === 0 ? <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="text-center py-8">
                      <ClipboardListIcon size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        No quizzes found
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm || courseFilter || statusFilter !== null ? 'Try adjusting your search or filter criteria.' : 'Get started by creating your first quiz.'}
                      </p>
                      {searchTerm || courseFilter || statusFilter !== null ? <button onClick={resetFilters} className="mt-4 text-purple-600 hover:text-purple-800 font-medium">
                          Reset all filters
                        </button> : <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700" onClick={() => {
                    // In a real implementation, this would navigate to a quiz creation page
                    alert('This would navigate to a quiz creation page');
                  }}>
                          <PlusIcon size={16} className="mr-2" />
                          Create Quiz
                        </button>}
                    </div>
                  </td>
                </tr> : quizzes.map(quiz => <tr key={quiz.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleQuizClick(quiz)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded bg-purple-100 text-purple-600">
                          <ClipboardListIcon size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {quiz.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {quiz.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {quiz.course_title}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quiz.question_count} questions
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${quiz.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {quiz.is_published ? <>
                            <CheckCircleIcon size={12} className="mr-1" />
                            Published
                          </> : <>
                            <XCircleIcon size={12} className="mr-1" />
                            Draft
                          </>}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(quiz.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2" onClick={e => e.stopPropagation()}>
                        <button className="text-purple-600 hover:text-purple-900" title="Edit quiz" onClick={e => {
                    e.stopPropagation();
                    handleQuizClick(quiz);
                    setIsEditing(true);
                  }}>
                          <EditIcon size={16} />
                        </button>
                        <button onClick={e => {
                    e.stopPropagation();
                    handleDeleteClick(quiz.id);
                  }} className="text-red-600 hover:text-red-900" title="Delete quiz">
                          <TrashIcon size={16} />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900" title="Preview quiz">
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
        {quizzes.length > 0 && <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to{' '}
                  <span className="font-medium">{quizzes.length}</span> of{' '}
                  <span className="font-medium">{quizzes.length}</span> results
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
      {/* Mobile Quiz Cards */}
      <div className="md:hidden">
        {loading ? <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-2 text-gray-500">Loading quizzes...</span>
          </div> : quizzes.length === 0 ? <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <ClipboardListIcon size={40} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No quizzes found
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchTerm || courseFilter || statusFilter !== null ? 'Try adjusting your search or filter criteria.' : 'Get started by creating your first quiz.'}
            </p>
            {searchTerm || courseFilter || statusFilter !== null ? <button onClick={resetFilters} className="w-full text-purple-600 hover:text-purple-800 font-medium">
                Reset all filters
              </button> : <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700" onClick={() => {
          // In a real implementation, this would navigate to a quiz creation page
          alert('This would navigate to a quiz creation page');
        }}>
                <PlusIcon size={16} className="mr-2" />
                Create Quiz
              </button>}
          </div> : <div className="space-y-4">
            {quizzes.map(quiz => <div key={quiz.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" onClick={() => handleQuizClick(quiz)}>
                <div className="p-4">
                  <div className="flex justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {quiz.title}
                      </h3>
                      <p className="mt-1 flex items-center text-xs text-gray-500">
                        <BookOpenIcon size={12} className="mr-1" />
                        <span className="truncate">{quiz.course_title}</span>
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${quiz.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {quiz.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>}
      </div>
      {/* Quiz Detail Modal */}
      {showQuizModal && selectedQuiz && <div className="fixed inset-0 z-50 overflow-y-auto">
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
                  {isEditing ? 'Edit Quiz' : 'Quiz Details'}
                </h3>
                <button onClick={() => setShowQuizModal(false)} className="text-purple-500 hover:text-purple-700 focus:outline-none">
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
                    <div>
                      <label htmlFor="passing_score" className="block text-sm font-medium text-gray-700">
                        Passing Score (%)
                      </label>
                      <input type="number" name="passing_score" id="passing_score" min="0" max="100" value={editFormData.passing_score} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" name="is_published" id="is_published" checked={editFormData.is_published} onChange={handleCheckboxChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                      <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                        Published
                      </label>
                    </div>
                  </div> /* View Details */ : <div className="space-y-4">
                    {/* Quiz Icon */}
                    <div className="flex justify-center">
                      <div className="h-16 w-16 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600">
                        <ClipboardListIcon size={32} />
                      </div>
                    </div>
                    {/* Quiz Title and Status */}
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {selectedQuiz.title}
                      </h2>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedQuiz.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {selectedQuiz.is_published ? <>
                            <CheckCircleIcon size={12} className="mr-1" />
                            Published
                          </> : <>
                            <XCircleIcon size={12} className="mr-1" />
                            Draft
                          </>}
                      </span>
                    </div>
                    {/* Description */}
                    <p className="text-sm text-gray-600">
                      {selectedQuiz.description}
                    </p>
                    {/* Quiz Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase">
                          Course
                        </div>
                        <div className="font-medium text-gray-800">
                          {selectedQuiz.course_title}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase">
                          Questions
                        </div>
                        <div className="font-medium text-gray-800">
                          {selectedQuiz.question_count || 0}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase">
                          Passing Score
                        </div>
                        <div className="font-medium text-gray-800">
                          {selectedQuiz.passing_score}%
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase">
                          Last Updated
                        </div>
                        <div className="font-medium text-gray-800">
                          {new Date(selectedQuiz.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {/* Dates */}
                    <div className="flex justify-between text-xs text-gray-500 pt-2">
                      <div className="flex items-center">
                        <CalendarIcon size={14} className="mr-1" />
                        Created:{' '}
                        {new Date(selectedQuiz.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon size={14} className="mr-1" />
                        Updated:{' '}
                        {new Date(selectedQuiz.updated_at).toLocaleDateString()}
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
                      Edit Quiz
                    </button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => handleDeleteClick(selectedQuiz.id)}>
                      Delete
                    </button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => toggleQuizStatus(selectedQuiz.id, selectedQuiz.is_published)}>
                      {selectedQuiz.is_published ? 'Unpublish' : 'Publish'}
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
                      Delete Quiz
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this quiz? This action
                        cannot be undone, and all associated questions and
                        student attempts will be permanently removed.
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
    </DashboardLayout>;
};