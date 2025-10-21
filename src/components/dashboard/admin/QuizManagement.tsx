 import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { SearchIcon, FilterIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon, ClipboardListIcon, DownloadIcon, RefreshCwIcon, MoreHorizontalIcon, XIcon, CheckCircleIcon, XCircleIcon, BookOpenIcon, CalendarIcon, ClockIcon, UsersIcon, BarChart3Icon, VideoIcon, SettingsIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { RSLService, RSLAccessibilitySettings } from '../../../lib/rsl-service';
import { useAuth } from '../../../contexts/AuthContext';

interface Quiz {
  id: string;
  title: string;
  description: string;
  lesson_id: string;
  course_title?: string;
  passing_score: number;
  question_count?: number;
  updated_at: string;
  is_published: boolean;
  created_at?: string;
}
export const AdminQuizManagement: React.FC = () => {
  const _ = useNavigate();
  const { user } = useAuth();
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    lesson_id: '',
    passing_score: 70,
    is_published: false
  });
  const [createQuestions, setCreateQuestions] = useState<{
    id: string;
    question: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    options: string[];
    correct_answer: number[];
    explanation: string;
    points: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }[]>([]);
  const [lessons, setLessons] = useState<{
    id: string;
    title: string;
    course_title: string;
  }[]>([]);
  const [rslSettings, setRslSettings] = useState<RSLAccessibilitySettings>({
    show_captions: true,
    video_speed: 1.0,
    high_contrast: false,
    large_text: false,
    auto_repeat: false,
    sign_descriptions: true,
  });

  // Preview modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewCurrentQuestion, setPreviewCurrentQuestion] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [previewShowResults, setPreviewShowResults] = useState(false);

  useEffect(() => {
    fetchQuizzes();
    fetchCourses();
    fetchLessons();
    loadRSLSettings();
  }, []);

  // Refetch quizzes when filters change
  useEffect(() => {
    fetchQuizzes();
  }, [courseFilter, statusFilter, searchTerm]);

  const loadRSLSettings = async () => {
    try {
      const settings = await RSLService.getAccessibilitySettings(user?.id || '');
      setRslSettings(settings);
    } catch (error) {
      console.error('Error loading RSL settings:', error);
    }
  };
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      // Start with the base query for quizzes
      let query = supabase.from('enhanced_quizzes').select('*').order('created_at', {
        ascending: false
      });
      
      // Apply status filter first
      if (statusFilter !== null) {
        query = query.eq('is_published', statusFilter);
      }
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      const {
        data: quizData,
        error: quizError
      } = await query;
      if (quizError) throw quizError;
      
      if (!quizData || quizData.length === 0) {
        setQuizzes([]);
        return;
      }

      // Get all lesson data separately
      const lessonIds = quizData.map(quiz => quiz.lesson_id).filter(id => id);
      let lessonsData: any[] = [];
      if (lessonIds.length > 0) {
        const {
          data: lessons,
          error: lessonsError
        } = await supabase.from('enhanced_lessons').select('id, title, course_id').in('id', lessonIds);
        if (lessonsError) throw lessonsError;
        lessonsData = lessons || [];
      }

      // Get quiz questions count
      const quizIds = quizData.map(quiz => quiz.id);
      const {
        data: questionsData,
        error: questionsError
      } = await supabase.from('enhanced_quiz_questions').select('id, quiz_id').in('quiz_id', quizIds);
      if (questionsError) throw questionsError;

      // Group questions by quiz_id
      const questionCounts: Record<string, number> = {};
      (questionsData || []).forEach((question: any) => {
        questionCounts[question.quiz_id] = (questionCounts[question.quiz_id] || 0) + 1;
      });

      // Apply course filter if needed
      let filteredQuizData = quizData;
      if (courseFilter) {
        const filteredLessonIds = lessonsData
          .filter(lesson => lesson.course_id === courseFilter)
          .map(lesson => lesson.id);
        filteredQuizData = quizData.filter(quiz => {
          // Include quizzes that belong directly to the course
          if (quiz.course_id === courseFilter) {
            return true;
          }
          // Include quizzes that belong to lessons in the course
          if (quiz.lesson_id && filteredLessonIds.includes(quiz.lesson_id)) {
            return true;
          }
          return false;
        });
      }

      // Create lesson lookup map
      const lessonMap: Record<string, any> = {};
      lessonsData.forEach(lesson => {
        lessonMap[lesson.id] = lesson;
      });

      // Get course titles - we need courses from both lessons and ALL quizzes (not just filtered ones)
      const courseIdsFromLessons = lessonsData.map(lesson => lesson.course_id);
      const courseIdsFromQuizzes = quizData.map(quiz => quiz.course_id).filter(id => id); // Use original quizData, not filtered
      const allCourseIds = [...new Set([...courseIdsFromLessons, ...courseIdsFromQuizzes])];
      
      let coursesData: any[] = [];
      if (allCourseIds.length > 0) {
        const {
          data: courses,
          error: coursesError
        } = await supabase.from('courses').select('id, title').in('id', allCourseIds);
        if (coursesError) throw coursesError;
        coursesData = courses || [];
      }

      // Create course lookup map
      const courseMap: Record<string, any> = {};
      coursesData.forEach(course => {
        courseMap[course.id] = course;
      });

      // Build enhanced quiz data
      const enhancedQuizzes = filteredQuizData.map((quiz: any) => {
        const lesson = quiz.lesson_id ? lessonMap[quiz.lesson_id] : null;
        // Get course either from lesson or directly from quiz
        const course = lesson 
          ? courseMap[lesson.course_id] 
          : quiz.course_id 
            ? courseMap[quiz.course_id] 
            : null;

        // Debug logging for unknown courses
        if (!course) {
          console.warn('Quiz missing course info:', {
            quiz: quiz.title,
            lesson_id: quiz.lesson_id,
            course_id: quiz.course_id,
            lesson_course_id: lesson?.course_id,
            available_courses: Object.keys(courseMap)
          });
        }
        
        return {
          ...quiz,
          lesson: lesson,
          course_title: course?.title || 'Unknown Course',
          question_count: questionCounts[quiz.id] || 0
        };
      });
      setQuizzes(enhancedQuizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchCourses = async () => {
    try {
      // Get all courses
      const {
        data: allCourses,
        error: coursesError
      } = await supabase.from('courses').select('id, title').order('title', {
        ascending: true
      });
      if (coursesError) throw coursesError;

      // Get courses that have published lessons (which could have quizzes)
      const {
        data: lessonsWithCourses,
        error: lessonsError
      } = await supabase.from('enhanced_lessons').select('course_id').eq('is_published', true);
      if (lessonsError) throw lessonsError;

      // Get courses that have quizzes directly associated with them
      const {
        data: quizzesWithCourses,
        error: quizzesError
      } = await supabase.from('enhanced_quizzes').select('course_id').not('course_id', 'is', null);
      if (quizzesError) throw quizzesError;

      // Get unique course IDs that have lessons or quizzes
      const courseIdsWithLessons = [...new Set((lessonsWithCourses || []).map(lesson => lesson.course_id))];
      const courseIdsWithQuizzes = [...new Set((quizzesWithCourses || []).map(quiz => quiz.course_id))];
      const relevantCourseIds = [...new Set([...courseIdsWithLessons, ...courseIdsWithQuizzes])];

      // Filter courses to only include those with lessons or quizzes
      const relevantCourses = (allCourses || []).filter(course => 
        relevantCourseIds.includes(course.id)
      );

      setCourses(relevantCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Fallback to all courses if there's an error
      try {
        const {
          data,
          error
        } = await supabase.from('courses').select('id, title').order('title', {
          ascending: true
        });
        if (!error) {
          setCourses(data || []);
        }
      } catch (fallbackError) {
        console.error('Fallback course fetch also failed:', fallbackError);
      }
    }
  };
  const fetchLessons = async () => {
    try {
      // Get lessons
      const {
        data: lessonsData,
        error: lessonsError
      } = await supabase.from('enhanced_lessons').select('id, title, course_id').eq('is_published', true).order('title', {
        ascending: true
      });
      if (lessonsError) throw lessonsError;

      if (!lessonsData || lessonsData.length === 0) {
        setLessons([]);
        return;
      }

      // Get course titles
      const courseIds = [...new Set(lessonsData.map(lesson => lesson.course_id))];
      const {
        data: coursesData,
        error: coursesError
      } = await supabase.from('courses').select('id, title').in('id', courseIds);
      if (coursesError) throw coursesError;

      // Create course lookup map
      const courseMap: Record<string, any> = {};
      (coursesData || []).forEach(course => {
        courseMap[course.id] = course;
      });

      const lessonsWithCourses = lessonsData.map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        course_title: courseMap[lesson.course_id]?.title || 'Unknown Course'
      }));
      setLessons(lessonsWithCourses);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      // Set empty array on error to avoid undefined issues
      setLessons([]);
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
      } = await supabase.from('enhanced_quiz_questions').delete().eq('quiz_id', quizToDelete);
      if (questionsError) throw questionsError;
      // Then delete the quiz itself
      const {
        error: quizError
      } = await supabase.from('enhanced_quizzes').delete().eq('id', quizToDelete);
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
      } = await supabase.from('enhanced_quizzes').update({
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
      } = await supabase.from('enhanced_quizzes').update({
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
  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setCreateFormData({
      ...createFormData,
      [name]: name === 'passing_score' ? parseInt(value) : value
    });
  };
  const handleCreateCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      checked
    } = e.target;
    setCreateFormData({
      ...createFormData,
      [name]: checked
    });
  };
  const handleCreateSubmit = async () => {
    if (!createFormData.title.trim() || !createFormData.lesson_id) {
      alert('Please fill in all required fields (Title and Lesson)');
      return;
    }

    // Validate that the lesson exists
    const selectedLesson = lessons.find(l => l.id === createFormData.lesson_id);
    if (!selectedLesson) {
      alert('Selected lesson not found. Please refresh and try again.');
      return;
    }

    // Validate questions
    for (let i = 0; i < createQuestions.length; i++) {
      const question = createQuestions[i];
      if (!question.question.trim()) {
        alert(`Question ${i + 1} is missing text`);
        return;
      }
      if ((question.question_type === 'multiple_choice' || question.question_type === 'true_false') && question.correct_answer.length === 0) {
        alert(`Question ${i + 1} needs at least one correct answer selected`);
        return;
      }
    }

    try {
      setLoading(true);

      // Get the course_id from the selected lesson
      const selectedLesson = lessons.find(l => l.id === createFormData.lesson_id);
      
      // Get course_id for the lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('enhanced_lessons')
        .select('course_id')
        .eq('id', createFormData.lesson_id)
        .single();

      if (lessonError) {
        throw new Error('Failed to find the selected lesson. Please refresh and try again.');
      }

      // Create the quiz first
      const {
        data: quizData,
        error: quizError
      } = await supabase.from('enhanced_quizzes').insert({
        title: createFormData.title.trim(),
        description: createFormData.description.trim(),
        lesson_id: createFormData.lesson_id,
        course_id: lessonData.course_id,
        passing_score: createFormData.passing_score,
        is_published: createFormData.is_published,
        quiz_type: 'assessment',
        max_attempts: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select().single();

      if (quizError) {
        if (quizError.code === '23505') {
          throw new Error('A quiz with this title already exists for this lesson. Please choose a different title.');
        }
        throw quizError;
      }

      // Create questions if any
      if (createQuestions.length > 0) {
        const questionsToInsert = createQuestions.map((question, index) => ({
          quiz_id: quizData.id,
          question: question.question,
          question_type: question.question_type,
          options: question.question_type === 'multiple_choice' || question.question_type === 'true_false'
            ? question.options
            : null,
          correct_answer: question.correct_answer.length > 0
            ? question.correct_answer
            : null,
          explanation: question.explanation || null,
          points: question.points,
          difficulty: question.difficulty,
          order_index: index
        }));

        const { error: questionsError } = await supabase
          .from('enhanced_quiz_questions')
          .insert(questionsToInsert.map(q => ({
            ...q,
            question_text: q.question,
            difficulty_level: q.difficulty,
            // Remove the old 'question' and 'difficulty' fields
            question: undefined,
            difficulty: undefined
          })));

        if (questionsError) throw questionsError;
      }

      // Add to local state
      setQuizzes([{
        ...quizData,
        course_title: lessons.find(l => l.id === createFormData.lesson_id)?.course_title || 'Unknown Course',
        question_count: createQuestions.length
      }, ...quizzes]);

      // Show success message
      alert(`Quiz "${createFormData.title}" created successfully!`);

      // Reset form and close modal
      setCreateFormData({
        title: '',
        description: '',
        lesson_id: '',
        passing_score: 70,
        is_published: false
      });
      setCreateQuestions([]);
      setShowCreateModal(false);
      
      // Refresh quizzes to ensure consistency
      await fetchQuizzes();
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      const errorMessage = error.message || error.details || 'An unexpected error occurred while creating the quiz.';
      alert(`Failed to create quiz: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Preview modal functions
  const handlePreviewQuiz = async (quiz: Quiz) => {
    try {
      setPreviewQuiz(quiz);
      // Fetch quiz questions
      const { data: questions, error } = await supabase
        .from('enhanced_quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      
      setPreviewQuestions(questions || []);
      setPreviewCurrentQuestion(0);
      setPreviewAnswers({});
      setPreviewShowResults(false);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error loading quiz preview:', error);
      alert('Failed to load quiz preview');
    }
  };

  const handlePreviewAnswer = (questionId: string, answer: any) => {
    setPreviewAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handlePreviewNext = () => {
    if (previewCurrentQuestion < previewQuestions.length - 1) {
      setPreviewCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePreviewPrevious = () => {
    if (previewCurrentQuestion > 0) {
      setPreviewCurrentQuestion(prev => prev - 1);
    }
  };

  const handlePreviewSubmit = () => {
    setPreviewShowResults(true);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewQuiz(null);
    setPreviewQuestions([]);
    setPreviewCurrentQuestion(0);
    setPreviewAnswers({});
    setPreviewShowResults(false);
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
            <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500" onClick={() => setShowCreateModal(true)}>
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
                        </button> : <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700" onClick={() => setShowCreateModal(true)}>
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
                        <button className="text-blue-600 hover:text-blue-900" title="Preview quiz" onClick={e => {
                    e.stopPropagation();
                    handlePreviewQuiz(quiz);
                  }}>
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
              </button> : <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700" onClick={() => setShowCreateModal(true)}>
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
                        {selectedQuiz.created_at ? new Date(selectedQuiz.created_at).toLocaleDateString() : 'Unknown'}
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

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div
                className={`absolute inset-0 ${
                  rslSettings.high_contrast
                    ? "bg-black opacity-90"
                    : "bg-gray-500 opacity-75"
                }`}
              ></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div
              className={`inline-block align-bottom ${
                rslSettings.high_contrast ? "bg-black border-white" : "bg-white"
              } rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border`}
              style={{
                maxWidth: "90%",
                width: "600px",
              }}
            >
              {/* Modal Header */}
              <div
                className={`${
                  rslSettings.high_contrast
                    ? "bg-gray-800 border-white"
                    : "bg-purple-50 border-purple-100"
                } px-4 py-3 border-b flex justify-between items-center`}
              >
                <div className="flex items-center space-x-2">
                  <VideoIcon
                    size={20}
                    className={
                      rslSettings.high_contrast
                        ? "text-white"
                        : "text-purple-600"
                    }
                  />
                  <h3
                    className={`${
                      rslSettings.large_text ? "text-xl" : "text-lg"
                    } font-medium ${
                      rslSettings.high_contrast
                        ? "text-white"
                        : "text-purple-900"
                    }`}
                  >
                    Create New Quiz
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setRslSettings((prev) => ({
                        ...prev,
                        high_contrast: !prev.high_contrast,
                      }))
                    }
                    className={`p-1 rounded ${
                      rslSettings.high_contrast
                        ? "bg-white text-black"
                        : "bg-gray-200 text-gray-700"
                    } hover:opacity-80`}
                    title="Toggle High Contrast"
                  >
                    <EyeIcon size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setRslSettings((prev) => ({
                        ...prev,
                        large_text: !prev.large_text,
                      }))
                    }
                    className={`p-1 rounded ${
                      rslSettings.high_contrast
                        ? "bg-white text-black"
                        : "bg-gray-200 text-gray-700"
                    } hover:opacity-80`}
                    title="Toggle Large Text"
                  >
                    <SettingsIcon size={16} />
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={`${
                      rslSettings.high_contrast
                        ? "text-white hover:text-gray-300"
                        : "text-purple-500 hover:text-purple-700"
                    } focus:outline-none`}
                  >
                    <XIcon size={20} />
                  </button>
                </div>
              </div>
              {/* Modal Content */}
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <VideoIcon
                        size={16}
                        className={
                          rslSettings.high_contrast
                            ? "text-white"
                            : "text-gray-500"
                        }
                      />
                      <label
                        htmlFor="create-title"
                        className={`block ${
                          rslSettings.large_text ? "text-base" : "text-sm"
                        } font-medium ${
                          rslSettings.high_contrast
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        Title *
                      </label>
                    </div>
                    <input
                      type="text"
                      name="title"
                      id="create-title"
                      value={createFormData.title}
                      onChange={handleCreateInputChange}
                      className={`mt-1 block w-full border ${
                        rslSettings.high_contrast
                          ? "border-white bg-gray-800 text-white"
                          : "border-gray-300 bg-white"
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                        rslSettings.large_text ? "text-base" : "sm:text-sm"
                      }`}
                      placeholder="Enter quiz title"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <VideoIcon
                        size={16}
                        className={
                          rslSettings.high_contrast
                            ? "text-white"
                            : "text-gray-500"
                        }
                      />
                      <label
                        htmlFor="create-description"
                        className={`block ${
                          rslSettings.large_text ? "text-base" : "text-sm"
                        } font-medium ${
                          rslSettings.high_contrast
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        Description
                      </label>
                    </div>
                    <textarea
                      name="description"
                      id="create-description"
                      rows={3}
                      value={createFormData.description}
                      onChange={handleCreateInputChange}
                      className={`mt-1 block w-full border ${
                        rslSettings.high_contrast
                          ? "border-white bg-gray-800 text-white"
                          : "border-gray-300 bg-white"
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                        rslSettings.large_text ? "text-base" : "sm:text-sm"
                      }`}
                      placeholder="Enter quiz description"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <VideoIcon
                        size={16}
                        className={
                          rslSettings.high_contrast
                            ? "text-white"
                            : "text-gray-500"
                        }
                      />
                      <label
                        htmlFor="create-lesson"
                        className={`block ${
                          rslSettings.large_text ? "text-base" : "text-sm"
                        } font-medium ${
                          rslSettings.high_contrast
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        Lesson *
                      </label>
                    </div>
                    <select
                      name="lesson_id"
                      id="create-lesson"
                      value={createFormData.lesson_id}
                      onChange={handleCreateInputChange}
                      className={`mt-1 block w-full border ${
                        rslSettings.high_contrast
                          ? "border-white bg-gray-800 text-white"
                          : "border-gray-300 bg-white"
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                        rslSettings.large_text ? "text-base" : "sm:text-sm"
                      }`}
                    >
                      <option value="">Select a lesson</option>
                      {lessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.title} ({lesson.course_title})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <VideoIcon
                        size={16}
                        className={
                          rslSettings.high_contrast
                            ? "text-white"
                            : "text-gray-500"
                        }
                      />
                      <label
                        htmlFor="create-passing-score"
                        className={`block ${
                          rslSettings.large_text ? "text-base" : "text-sm"
                        } font-medium ${
                          rslSettings.high_contrast
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        Passing Score (%)
                      </label>
                    </div>
                    <input
                      type="number"
                      name="passing_score"
                      id="create-passing-score"
                      min="0"
                      max="100"
                      value={createFormData.passing_score}
                      onChange={handleCreateInputChange}
                      className={`mt-1 block w-full border ${
                        rslSettings.high_contrast
                          ? "border-white bg-gray-800 text-white"
                          : "border-gray-300 bg-white"
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                        rslSettings.large_text ? "text-base" : "sm:text-sm"
                      }`}
                    />
                  </div>
                  {/* Questions Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className={`${
                        rslSettings.large_text ? "text-lg" : "text-base"
                      } font-medium ${
                        rslSettings.high_contrast
                          ? "text-white"
                          : "text-gray-900"
                      }`}>
                        Questions
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newQuestion = {
                            id: Date.now().toString(),
                            question: '',
                            question_type: 'multiple_choice' as const,
                            options: ['', ''],
                            correct_answer: [],
                            explanation: '',
                            points: 1,
                            difficulty: 'medium' as const,
                          };
                          setCreateQuestions([...createQuestions, newQuestion]);
                        }}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md ${
                          rslSettings.high_contrast
                            ? "text-black bg-white hover:bg-gray-200"
                            : "text-white bg-green-600 hover:bg-green-700"
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                      >
                        <PlusIcon size={16} className="mr-1" />
                        Add Question
                      </button>
                    </div>

                    {createQuestions.length === 0 ? (
                      <div className={`text-center py-8 border-2 border-dashed rounded-lg ${
                        rslSettings.high_contrast
                          ? "border-white text-white"
                          : "border-gray-300 text-gray-500"
                      }`}>
                        <ClipboardListIcon size={48} className="mx-auto mb-4 opacity-50" />
                        <p className={rslSettings.large_text ? "text-base" : "text-sm"}>
                          No questions added yet. Click "Add Question" to get started.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {createQuestions.map((question, index) => (
                          <div key={question.id} className={`border rounded-lg p-4 ${
                            rslSettings.high_contrast
                              ? "border-white bg-gray-800"
                              : "border-gray-200 bg-gray-50"
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <h5 className={`font-medium ${
                                rslSettings.high_contrast
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}>
                                Question {index + 1}
                              </h5>
                              <button
                                type="button"
                                onClick={() => {
                                  setCreateQuestions(createQuestions.filter(q => q.id !== question.id));
                                }}
                                className={`p-1 rounded ${
                                  rslSettings.high_contrast
                                    ? "text-white hover:bg-gray-700"
                                    : "text-red-600 hover:bg-red-50"
                                }`}
                              >
                                <XIcon size={16} />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className={`block ${
                                  rslSettings.large_text ? "text-sm" : "text-xs"
                                } font-medium ${
                                  rslSettings.high_contrast
                                    ? "text-white"
                                    : "text-gray-700"
                                } mb-1`}>
                                  Question Text *
                                </label>
                                <textarea
                                  value={question.question}
                                  onChange={(e) => {
                                    const updated = [...createQuestions];
                                    updated[index].question = e.target.value;
                                    setCreateQuestions(updated);
                                  }}
                                  rows={2}
                                  className={`block w-full border ${
                                    rslSettings.high_contrast
                                      ? "border-white bg-gray-700 text-white"
                                      : "border-gray-300 bg-white"
                                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                                    rslSettings.large_text ? "text-base" : "text-sm"
                                  }`}
                                  placeholder="Enter your question"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className={`block ${
                                    rslSettings.large_text ? "text-sm" : "text-xs"
                                  } font-medium ${
                                    rslSettings.high_contrast
                                      ? "text-white"
                                      : "text-gray-700"
                                  } mb-1`}>
                                    Question Type
                                  </label>
                                  <select
                                    value={question.question_type}
                                    onChange={(e) => {
                                      const updated = [...createQuestions];
                                      updated[index].question_type = e.target.value as any;
                                      // Reset options based on question type
                                      if (e.target.value === 'multiple_choice') {
                                        updated[index].options = ['', ''];
                                        updated[index].correct_answer = [];
                                      } else if (e.target.value === 'true_false') {
                                        updated[index].options = ['True', 'False'];
                                        updated[index].correct_answer = [];
                                      } else {
                                        updated[index].options = [];
                                        updated[index].correct_answer = [];
                                      }
                                      setCreateQuestions(updated);
                                    }}
                                    className={`block w-full border ${
                                      rslSettings.high_contrast
                                        ? "border-white bg-gray-700 text-white"
                                        : "border-gray-300 bg-white"
                                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                                      rslSettings.large_text ? "text-base" : "text-sm"
                                    }`}
                                  >
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="true_false">True/False</option>
                                    <option value="short_answer">Short Answer</option>
                                    <option value="essay">Essay</option>
                                  </select>
                                </div>

                                <div>
                                  <label className={`block ${
                                    rslSettings.large_text ? "text-sm" : "text-xs"
                                  } font-medium ${
                                    rslSettings.high_contrast
                                      ? "text-white"
                                      : "text-gray-700"
                                  } mb-1`}>
                                    Difficulty
                                  </label>
                                  <select
                                    value={question.difficulty}
                                    onChange={(e) => {
                                      const updated = [...createQuestions];
                                      updated[index].difficulty = e.target.value as any;
                                      setCreateQuestions(updated);
                                    }}
                                    className={`block w-full border ${
                                      rslSettings.high_contrast
                                        ? "border-white bg-gray-700 text-white"
                                        : "border-gray-300 bg-white"
                                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                                      rslSettings.large_text ? "text-base" : "text-sm"
                                    }`}
                                  >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                  </select>
                                </div>
                              </div>

                              {(question.question_type === 'multiple_choice' || question.question_type === 'true_false') && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className={`block ${
                                      rslSettings.large_text ? "text-sm" : "text-xs"
                                    } font-medium ${
                                      rslSettings.high_contrast
                                        ? "text-white"
                                        : "text-gray-700"
                                    }`}>
                                      Answer Options
                                    </label>
                                    {question.question_type === 'multiple_choice' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...createQuestions];
                                          updated[index].options.push('');
                                          setCreateQuestions(updated);
                                        }}
                                        className={`inline-flex items-center px-2 py-1 text-xs border border-transparent rounded ${
                                          rslSettings.high_contrast
                                            ? "text-black bg-white hover:bg-gray-200"
                                            : "text-white bg-blue-600 hover:bg-blue-700"
                                        }`}
                                      >
                                        <PlusIcon size={12} className="mr-1" />
                                        Add Option
                                      </button>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    {question.options.map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center space-x-2">
                                        <input
                                          type={question.question_type === 'multiple_choice' ? 'checkbox' : 'radio'}
                                          name={`question-${index}-correct`}
                                          checked={question.correct_answer.includes(optionIndex)}
                                          onChange={(e) => {
                                            const updated = [...createQuestions];
                                            if (question.question_type === 'multiple_choice') {
                                              if (e.target.checked) {
                                                updated[index].correct_answer.push(optionIndex);
                                              } else {
                                                updated[index].correct_answer = updated[index].correct_answer.filter(i => i !== optionIndex);
                                              }
                                            } else {
                                              updated[index].correct_answer = [optionIndex];
                                            }
                                            setCreateQuestions(updated);
                                          }}
                                          className={`h-4 w-4 ${
                                            rslSettings.high_contrast
                                              ? "text-white"
                                              : "text-purple-600"
                                          } focus:ring-purple-500 border-gray-300 rounded`}
                                        />
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => {
                                            const updated = [...createQuestions];
                                            updated[index].options[optionIndex] = e.target.value;
                                            setCreateQuestions(updated);
                                          }}
                                          className={`flex-1 border ${
                                            rslSettings.high_contrast
                                              ? "border-white bg-gray-700 text-white"
                                              : "border-gray-300 bg-white"
                                          } rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                                            rslSettings.large_text ? "text-base" : "text-sm"
                                          }`}
                                          placeholder={`Option ${optionIndex + 1}`}
                                        />
                                        {question.question_type === 'multiple_choice' && question.options.length > 2 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...createQuestions];
                                              updated[index].options.splice(optionIndex, 1);
                                              updated[index].correct_answer = updated[index].correct_answer
                                                .filter(i => i !== optionIndex)
                                                .map(i => i > optionIndex ? i - 1 : i);
                                              setCreateQuestions(updated);
                                            }}
                                            className={`p-1 rounded ${
                                              rslSettings.high_contrast
                                                ? "text-white hover:bg-gray-700"
                                                : "text-red-600 hover:bg-red-50"
                                            }`}
                                          >
                                            <XIcon size={14} />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className={`block ${
                                    rslSettings.large_text ? "text-sm" : "text-xs"
                                  } font-medium ${
                                    rslSettings.high_contrast
                                      ? "text-white"
                                      : "text-gray-700"
                                  } mb-1`}>
                                    Points
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={question.points}
                                    onChange={(e) => {
                                      const updated = [...createQuestions];
                                      updated[index].points = parseInt(e.target.value) || 1;
                                      setCreateQuestions(updated);
                                    }}
                                    className={`block w-full border ${
                                      rslSettings.high_contrast
                                        ? "border-white bg-gray-700 text-white"
                                        : "border-gray-300 bg-white"
                                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                                      rslSettings.large_text ? "text-base" : "text-sm"
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className={`block ${
                                    rslSettings.large_text ? "text-sm" : "text-xs"
                                  } font-medium ${
                                    rslSettings.high_contrast
                                      ? "text-white"
                                      : "text-gray-700"
                                  } mb-1`}>
                                    Explanation
                                  </label>
                                  <input
                                    type="text"
                                    value={question.explanation}
                                    onChange={(e) => {
                                      const updated = [...createQuestions];
                                      updated[index].explanation = e.target.value;
                                      setCreateQuestions(updated);
                                    }}
                                    className={`block w-full border ${
                                      rslSettings.high_contrast
                                        ? "border-white bg-gray-700 text-white"
                                        : "border-gray-300 bg-white"
                                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                                      rslSettings.large_text ? "text-base" : "text-sm"
                                    }`}
                                    placeholder="Optional explanation"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_published"
                      id="create-is-published"
                      checked={createFormData.is_published}
                      onChange={handleCreateCheckboxChange}
                      className={`h-4 w-4 ${
                        rslSettings.high_contrast
                          ? "text-white"
                          : "text-purple-600"
                      } focus:ring-purple-500 border-gray-300 rounded`}
                    />
                    <label
                      htmlFor="create-is-published"
                      className={`ml-2 block ${
                        rslSettings.large_text ? "text-base" : "text-sm"
                      } ${
                        rslSettings.high_contrast
                          ? "text-white"
                          : "text-gray-900"
                      }`}
                    >
                      Publish immediately
                    </label>
                  </div>
                </div>
              </div>
              {/* Modal Footer */}
              <div
                className={`${
                  rslSettings.high_contrast
                    ? "bg-gray-800 border-white"
                    : "bg-gray-50 border-gray-200"
                } px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t`}
              >
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                    rslSettings.large_text ? "text-base" : "text-base"
                  } font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm`}
                  onClick={handleCreateSubmit}
                >
                  Create Quiz
                </button>
                <button
                  type="button"
                  className={`mt-3 w-full inline-flex justify-center rounded-md border ${
                    rslSettings.high_contrast
                      ? "border-white text-white bg-gray-800 hover:bg-gray-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  } shadow-sm px-4 py-2 ${
                    rslSettings.large_text ? "text-base" : "text-base"
                  } font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm`}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>;
};
