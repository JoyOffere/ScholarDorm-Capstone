 import * as React from 'react';
const { useEffect, useState } = React;
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
  rsl_video_url?: string;
  rsl_description?: string;
  rsl_enabled?: boolean;
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
  const [editActiveTab, setEditActiveTab] = useState<'details' | 'questions'>('details');
  const [editQuestions, setEditQuestions] = useState<any[]>([]);
  const [editQuestionsRsl, setEditQuestionsRsl] = useState<Record<string, {rsl_video_url?: string, description?: string}>>({});
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    passing_score: 0,
    is_published: false,
    rsl_video_url: '',
    rsl_description: '',
    rsl_enabled: true
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    lesson_id: '',
    passing_score: 70,
    is_published: false,
    rsl_video_url: '',
    rsl_description: '',
    rsl_enabled: true
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
      is_published: quiz.is_published,
      rsl_video_url: quiz.rsl_video_url || '',
      rsl_description: quiz.rsl_description || '',
      rsl_enabled: quiz.rsl_enabled ?? true
    });
  };
  const handleEditClick = async () => {
    if (!selectedQuiz) return;
    
    try {
      // Fetch questions for this quiz
      const { data: questionsData, error: questionsError } = await supabase
        .from('enhanced_quiz_questions')
        .select('*')
        .eq('quiz_id', selectedQuiz.id)
        .order('order_index', { ascending: true });
      
      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        // Continue anyway, just with empty questions
        setEditQuestions([]);
        setEditQuestionsRsl({});
      } else {
        setEditQuestions(questionsData || []);
        
        // Fetch RSL content for questions
        if (questionsData && questionsData.length > 0) {
          const questionIds = questionsData.map(q => q.id);
          const { data: rslData, error: rslError } = await supabase
            .from('rsl_content')
            .select('content_id, rsl_video_url, description')
            .eq('content_type', 'question')
            .in('content_id', questionIds);
            
          if (rslError) {
            console.error('Error fetching RSL data:', rslError);
            setEditQuestionsRsl({});
          } else {
            // Convert to object map
            const rslMap: Record<string, {rsl_video_url?: string, description?: string}> = {};
            (rslData || []).forEach(rsl => {
              rslMap[rsl.content_id] = {
                rsl_video_url: rsl.rsl_video_url,
                description: rsl.description
              };
            });
            setEditQuestionsRsl(rslMap);
          }
        } else {
          setEditQuestionsRsl({});
        }
      }
      
      setEditActiveTab('details');
      setIsEditing(true);
    } catch (error) {
      console.error('Error preparing edit mode:', error);
      setIsEditing(true); // Still allow editing even if questions fail to load
    }
  };
  const handleEditCancel = () => {
    setIsEditing(false);
  };
  const handleEditSubmit = async () => {
    if (!selectedQuiz) return;
    try {
      // Update quiz details including RSL fields
      const {
        error
      } = await supabase.from('enhanced_quizzes').update({
        title: editFormData.title,
        description: editFormData.description,
        passing_score: editFormData.passing_score,
        is_published: editFormData.is_published,
        rsl_video_url: editFormData.rsl_video_url.trim() || null,
        rsl_description: editFormData.rsl_description.trim() || null,
        rsl_enabled: editFormData.rsl_enabled,
        updated_at: new Date().toISOString()
      }).eq('id', selectedQuiz.id);
      if (error) throw error;

      // Update RSL content for questions
      for (const questionId in editQuestionsRsl) {
        const rslData = editQuestionsRsl[questionId];
        if (rslData.rsl_video_url && rslData.rsl_video_url.trim()) {
          // Check if RSL content already exists for this question
          const { data: existingRsl, error: checkError } = await supabase
            .from('rsl_content')
            .select('id')
            .eq('content_type', 'question')
            .eq('content_id', questionId)
            .maybeSingle();

          if (checkError) {
            console.error('Error checking existing RSL:', checkError);
            continue;
          }

          if (existingRsl) {
            // Update existing RSL content
            const { error: updateError } = await supabase
              .from('rsl_content')
              .update({
                rsl_video_url: rslData.rsl_video_url.trim(),
                description: rslData.description?.trim() || '',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingRsl.id);

            if (updateError) {
              console.error('Error updating RSL content:', updateError);
            }
          } else {
            // Create new RSL content
            const { error: insertError } = await supabase
              .from('rsl_content')
              .insert({
                content_type: 'question',
                content_id: questionId,
                rsl_video_url: rslData.rsl_video_url.trim(),
                description: rslData.description?.trim() || '',
                sign_complexity: 'basic'
              });

            if (insertError) {
              console.error('Error inserting RSL content:', insertError);
            }
          }
        } else {
          // Remove RSL content if URL is empty
          const { error: deleteError } = await supabase
            .from('rsl_content')
            .delete()
            .eq('content_type', 'question')
            .eq('content_id', questionId);

          if (deleteError) {
            console.error('Error deleting RSL content:', deleteError);
          }
        }
      }

      // Update local state
      setQuizzes(quizzes.map(quiz => quiz.id === selectedQuiz.id ? {
        ...quiz,
        title: editFormData.title,
        description: editFormData.description,
        passing_score: editFormData.passing_score,
        is_published: editFormData.is_published,
        rsl_video_url: editFormData.rsl_video_url,
        rsl_description: editFormData.rsl_description,
        rsl_enabled: editFormData.rsl_enabled
      } : quiz));
      
      // Update selected quiz
      setSelectedQuiz({
        ...selectedQuiz,
        title: editFormData.title,
        description: editFormData.description,
        passing_score: editFormData.passing_score,
        is_published: editFormData.is_published,
        rsl_video_url: editFormData.rsl_video_url,
        rsl_description: editFormData.rsl_description,
        rsl_enabled: editFormData.rsl_enabled
      });
      
      setIsEditing(false);
      alert('Quiz and RSL content updated successfully!');
    } catch (error) {
      console.error('Error updating quiz:', error);
      alert('Error updating quiz. Please try again.');
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
        rsl_video_url: createFormData.rsl_video_url.trim() || null,
        rsl_description: createFormData.rsl_description.trim() || null,
        rsl_enabled: createFormData.rsl_enabled,
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
        is_published: false,
        rsl_video_url: '',
        rsl_description: '',
        rsl_enabled: true
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

  return (
    <DashboardLayout title="Quiz Management" role="admin">
      {/* Analytics Dashboard Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Quizzes</p>
              <p className="text-3xl font-bold">{quizzes.length}</p>
            </div>
            <ClipboardListIcon size={32} className="text-purple-200" />
          </div>
          <div className="mt-3">
            <span className="text-purple-100 text-xs">
              {quizzes.filter(q => q.is_published).length} Published • {quizzes.filter(q => !q.is_published).length} Drafts
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">RSL Enabled</p>
              <p className="text-3xl font-bold">{quizzes.filter(q => q.rsl_enabled && q.rsl_video_url).length}</p>
            </div>
            <VideoIcon size={32} className="text-green-200" />
          </div>
          <div className="mt-3">
            <span className="text-green-100 text-xs">
              {Math.round((quizzes.filter(q => q.rsl_enabled && q.rsl_video_url).length / Math.max(quizzes.length, 1)) * 100)}% Coverage
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Questions</p>
              <p className="text-3xl font-bold">{quizzes.reduce((sum, q) => sum + (q.question_count || 0), 0)}</p>
            </div>
            <BookOpenIcon size={32} className="text-blue-200" />
          </div>
          <div className="mt-3">
            <span className="text-blue-100 text-xs">
              Avg {Math.round(quizzes.reduce((sum, q) => sum + (q.question_count || 0), 0) / Math.max(quizzes.length, 1))} per quiz
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Active Courses</p>
              <p className="text-3xl font-bold">{courses.length}</p>
            </div>
            <UsersIcon size={32} className="text-orange-200" />
          </div>
          <div className="mt-3">
            <span className="text-orange-100 text-xs">
              Across {new Set(quizzes.map(q => q.course_title).filter(Boolean)).size || 0} subjects
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SettingsIcon size={20} className="mr-2 text-purple-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
          >
            <PlusIcon size={24} className="text-purple-600 group-hover:text-purple-700 mb-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">New Quiz</span>
          </button>

          <button 
            onClick={() => {/* TODO: Implement bulk import */}}
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
          >
            <DownloadIcon size={24} className="text-blue-600 group-hover:text-blue-700 mb-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Import</span>
          </button>

          <button 
            onClick={() => {/* TODO: Implement analytics view */}}
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
          >
            <BarChart3Icon size={24} className="text-green-600 group-hover:text-green-700 mb-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">Analytics</span>
          </button>

          <button 
            onClick={() => {/* TODO: Implement RSL batch setup */}}
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group"
          >
            <VideoIcon size={24} className="text-indigo-600 group-hover:text-indigo-700 mb-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">RSL Setup</span>
          </button>

          <button 
            onClick={resetFilters}
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 group"
          >
            <RefreshCwIcon size={24} className="text-gray-600 group-hover:text-gray-700 mb-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-700">Reset</span>
          </button>

          <button 
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50 transition-all duration-200 group"
          >
            <CalendarIcon size={24} className="text-yellow-600 group-hover:text-yellow-700 mb-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-yellow-700">Schedule</span>
          </button>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 mb-6">
        <div className="flex flex-col gap-4">
          {/* Enhanced Search with suggestions */}
          <div className="relative flex-1">
            <form onSubmit={handleSearch}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm" 
                placeholder="Search quizzes by title, description, or course..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XIcon size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </form>
          </div>
          {/* Enhanced Filter Bar */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            {/* Left side filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Mobile filter toggle */}
              <button className="lg:hidden inline-flex items-center px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors" onClick={() => setShowMobileFilters(!showMobileFilters)}>
                <FilterIcon size={16} className="mr-2" />
                {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
              </button>

              {/* Filters - always visible on desktop */}
              <div className={`flex flex-wrap items-center gap-3 w-full lg:w-auto ${showMobileFilters ? 'flex' : 'hidden lg:flex'}`}>
                {/* Course Filter */}
                <div className="relative w-full sm:w-48">
                  <select className="block w-full appearance-none bg-white border border-gray-300 rounded-xl py-2.5 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm" value={courseFilter || ''} onChange={e => setCourseFilter(e.target.value || null)}>
                    <option value="">All Courses</option>
                    {courses.map(course => <option key={course.id} value={course.id}>
                        {course.title}
                      </option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                    <FilterIcon size={16} />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative w-full sm:w-36">
                  <select className="block w-full appearance-none bg-white border border-gray-300 rounded-xl py-2.5 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm" value={statusFilter === null ? '' : statusFilter ? 'published' : 'draft'} onChange={e => {
                  if (e.target.value === '') setStatusFilter(null);else setStatusFilter(e.target.value === 'published');
                }}>
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                    <FilterIcon size={16} />
                  </div>
                </div>

                {/* RSL Filter */}
                <div className="relative w-full sm:w-32">
                  <select className="block w-full appearance-none bg-white border border-gray-300 rounded-xl py-2.5 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm">
                    <option value="">RSL Status</option>
                    <option value="enabled">RSL Ready</option>
                    <option value="partial">RSL Enabled</option>
                    <option value="none">No RSL</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                    <VideoIcon size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Active filter indicator */}
              {(searchTerm || courseFilter || statusFilter !== null) && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {[searchTerm && 'Search', courseFilter && 'Course', statusFilter !== null && 'Status'].filter(Boolean).join(', ')} active
                </span>
              )}

              {/* Reset Filters */}
              {(searchTerm || courseFilter || statusFilter !== null) && (
                <button onClick={resetFilters} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  <RefreshCwIcon size={16} className="mr-2" />
                  Reset
                </button>
              )}

              {/* Export */}
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <DownloadIcon size={16} className="mr-2" />
                Export
              </button>

              {/* View Toggle */}
              <div className="hidden md:flex border border-gray-300 rounded-xl p-1">
                <button className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
                  </svg>
                </button>
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          {quizzes.length > 0 && (
            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center">
                  <ClipboardListIcon size={16} className="mr-1" />
                  {quizzes.length} Total
                </span>
                <span className="flex items-center">
                  <CheckCircleIcon size={16} className="mr-1 text-green-600" />
                  {quizzes.filter(q => q.is_published).length} Published
                </span>
                <span className="flex items-center">
                  <VideoIcon size={16} className="mr-1 text-purple-600" />
                  {quizzes.filter(q => q.rsl_enabled && q.rsl_video_url).length} RSL Ready
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {quizzes[0]?.updated_at ? new Date(quizzes[0].updated_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Performance Metrics & Recent Activity Row */}
      {quizzes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Metrics */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3Icon size={20} className="mr-2 text-purple-600" />
              Quiz Performance Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">
                  {Math.round(quizzes.reduce((sum, q) => sum + (q.question_count || 0), 0) / Math.max(quizzes.length, 1))}
                </div>
                <div className="text-xs text-blue-600 font-medium">Avg Questions</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {Math.round(quizzes.reduce((sum, q) => sum + q.passing_score, 0) / Math.max(quizzes.length, 1))}%
                </div>
                <div className="text-xs text-green-600 font-medium">Avg Pass Rate</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">
                  {Math.round((quizzes.filter(q => q.rsl_enabled && q.rsl_video_url).length / Math.max(quizzes.length, 1)) * 100)}%
                </div>
                <div className="text-xs text-purple-600 font-medium">RSL Coverage</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                <div className="text-2xl font-bold text-indigo-700">
                  {Math.round((quizzes.filter(q => q.is_published).length / Math.max(quizzes.length, 1)) * 100)}%
                </div>
                <div className="text-xs text-indigo-600 font-medium">Published</div>
              </div>
            </div>
            
            {/* Quick Stats Bar */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Most Questions</span>
                  <ClipboardListIcon size={16} className="text-gray-400" />
                </div>
                <div className="text-lg font-semibold text-gray-900 truncate">
                  {quizzes.sort((a, b) => (b.question_count || 0) - (a.question_count || 0))[0]?.title || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {quizzes.sort((a, b) => (b.question_count || 0) - (a.question_count || 0))[0]?.question_count || 0} questions
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Latest Updated</span>
                  <CalendarIcon size={16} className="text-gray-400" />
                </div>
                <div className="text-lg font-semibold text-gray-900 truncate">
                  {quizzes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]?.title || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {quizzes[0]?.updated_at ? new Date(quizzes[0].updated_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">RSL Leader</span>
                  <VideoIcon size={16} className="text-gray-400" />
                </div>
                <div className="text-lg font-semibold text-gray-900 truncate">
                  {quizzes.filter(q => q.rsl_enabled && q.rsl_video_url)[0]?.title || 'No RSL Quizzes'}
                </div>
                <div className="text-xs text-gray-500">
                  {quizzes.filter(q => q.rsl_enabled && q.rsl_video_url).length > 0 ? 'RSL Ready' : 'Set up RSL videos'}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon size={20} className="mr-2 text-green-600" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {quizzes
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .slice(0, 5)
                .map((quiz, index) => (
                  <div key={quiz.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => handleQuizClick(quiz)}>
                    <div className={`w-2 h-2 rounded-full ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-blue-500' : 
                      'bg-gray-400'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {quiz.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        Updated {new Date(quiz.updated_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                      quiz.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {quiz.is_published ? 'Live' : 'Draft'}
                    </div>
                  </div>
                ))
              }
              
              {quizzes.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <ClockIcon size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
              
              {quizzes.length > 5 && (
                <button 
                  onClick={() => {/* TODO: Implement show more functionality */}} 
                  className="w-full text-center text-sm text-purple-600 hover:text-purple-800 font-medium py-2 border-t border-gray-200"
                >
                  Show More ({quizzes.length - 5} more quizzes)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Quiz Grid Layout */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <span className="text-gray-500 font-medium">Loading quizzes...</span>
              <p className="text-sm text-gray-400 mt-1">Please wait while we fetch your quiz data</p>
            </div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-200 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
              <ClipboardListIcon size={48} className="text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || courseFilter || statusFilter !== null ? 'No matches found' : 'No quizzes yet'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || courseFilter || statusFilter !== null 
                ? 'Try adjusting your search criteria or filters to find the quizzes you\'re looking for.' 
                : 'Ready to create your first quiz? Click the button below to get started and engage your students with interactive content.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {searchTerm || courseFilter || statusFilter !== null ? (
                <button 
                  onClick={resetFilters} 
                  className="inline-flex items-center px-6 py-3 border border-purple-300 rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 font-medium transition-colors"
                >
                  <RefreshCwIcon size={20} className="mr-2" />
                  Reset All Filters
                </button>
              ) : (
                <button 
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" 
                  onClick={() => setShowCreateModal(true)}
                >
                  <PlusIcon size={24} className="mr-3" />
                  Create Your First Quiz
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map(quiz => (
              <div 
                key={quiz.id} 
                className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1" 
                onClick={() => handleQuizClick(quiz)}
              >
                {/* Quiz Card Header */}
                <div className="relative p-6 bg-gradient-to-br from-purple-500 to-purple-600">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      quiz.is_published 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {quiz.is_published ? (
                        <>
                          <CheckCircleIcon size={12} className="mr-1" />
                          Published
                        </>
                      ) : (
                        <>
                          <ClockIcon size={12} className="mr-1" />
                          Draft
                        </>
                      )}
                    </span>
                  </div>

                  {/* Quiz Icon */}
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4">
                    <ClipboardListIcon size={24} className="text-white" />
                  </div>

                  {/* Quiz Title */}
                  <h3 className="text-xl font-bold text-white mb-2 pr-20 line-clamp-2">
                    {quiz.title}
                  </h3>

                  {/* Course Badge */}
                  {quiz.course_title && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                      <BookOpenIcon size={14} className="mr-1" />
                      {quiz.course_title}
                    </span>
                  )}
                </div>

                {/* Quiz Card Body */}
                <div className="p-6">
                  {/* Description */}
                  {quiz.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  {/* Quiz Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900">{quiz.question_count || 0}</div>
                      <div className="text-xs text-gray-500 font-medium">Questions</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900">{quiz.passing_score}%</div>
                      <div className="text-xs text-gray-500 font-medium">Pass Score</div>
                    </div>
                  </div>

                  {/* RSL Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">RSL Support:</span>
                    {quiz.rsl_enabled && quiz.rsl_video_url ? (
                      <div className="flex items-center text-purple-600">
                        <VideoIcon size={16} className="mr-1" />
                        <span className="text-sm font-medium">Ready</span>
                      </div>
                    ) : quiz.rsl_enabled ? (
                      <div className="flex items-center text-yellow-600">
                        <VideoIcon size={16} className="mr-1" />
                        <span className="text-sm font-medium">Enabled</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <VideoIcon size={16} className="mr-1" />
                        <span className="text-sm font-medium">Disabled</span>
                      </div>
                    )}
                  </div>

                  {/* Last Updated */}
                  <div className="text-xs text-gray-500 mb-4">
                    Updated {new Date(quiz.updated_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button 
                        className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors" 
                        title="Edit quiz" 
                        onClick={e => {
                          e.stopPropagation();
                          handleQuizClick(quiz);
                          setIsEditing(true);
                        }}
                      >
                        <EditIcon size={18} />
                      </button>
                      <button 
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="Preview quiz" 
                        onClick={e => {
                          e.stopPropagation();
                          handlePreviewQuiz(quiz);
                        }}
                      >
                        <EyeIcon size={18} />
                      </button>
                      <button 
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteClick(quiz.id);
                        }} 
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Delete quiz"
                      >
                        <TrashIcon size={18} />
                      </button>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors" 
                      title="More options"
                    >
                      <MoreHorizontalIcon size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Pagination */}
        {quizzes.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">1</span> to{' '}
                <span className="font-semibold text-gray-900">{quizzes.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{quizzes.length}</span> results
              </div>
              
              <nav className="flex items-center space-x-2" aria-label="Pagination">
                <button className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  <button className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-purple-600 rounded-xl">
                    1
                  </button>
                </div>
                
                <button className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors">
                  Next
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
      {/* Enhanced Quiz Detail Modal */}
      {showQuizModal && selectedQuiz && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowQuizModal(false);
              setIsEditing(false);
            }
          }}
        >
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm" 
              aria-hidden="true"
              onClick={() => {
                setShowQuizModal(false);
                setIsEditing(false);
              }}
            ></div>
            
            {/* Center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            
            {/* Modal Content */}
            <div 
              className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '95%',
                width: isEditing ? '900px' : '700px'
              }}
            >
              {/* Enhanced Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {isEditing ? 'Edit Quiz' : 'Quiz Details'}
                  </h3>
                  <p className="text-purple-100 text-sm mt-1">
                    {isEditing ? 'Modify quiz settings and questions' : 'View and manage quiz information'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowQuizModal(false);
                    setIsEditing(false);
                  }} 
                  className="text-purple-200 hover:text-white focus:outline-none p-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <XIcon size={24} />
                </button>
              </div>
              {/* Modal Content */}
              <div className="p-6">
                {isEditing ? (
                  // Edit Form with Tabs
                  <div>
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="-mb-px flex space-x-8">
                        <button
                          onClick={() => setEditActiveTab('details')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            editActiveTab === 'details'
                              ? 'border-purple-500 text-purple-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Quiz Details
                        </button>
                        <button
                          onClick={() => setEditActiveTab('questions')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            editActiveTab === 'questions'
                              ? 'border-purple-500 text-purple-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Manage Questions ({editQuestions.length})
                        </button>
                      </nav>
                    </div>

                    {/* Tab Content */}
                    {editActiveTab === 'details' ? (
                      <div className="space-y-4">
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

                        {/* RSL Video Settings */}
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                            <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            RSL Video Settings
                          </h4>
                          
                          <div className="flex items-center mb-3">
                            <input 
                              type="checkbox" 
                              name="rsl_enabled" 
                              id="rsl_enabled" 
                              checked={editFormData.rsl_enabled} 
                              onChange={handleCheckboxChange} 
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" 
                            />
                            <label htmlFor="rsl_enabled" className="ml-2 block text-sm text-gray-900">
                              Enable RSL video for this quiz
                            </label>
                          </div>

                          {editFormData.rsl_enabled && (
                            <>
                              <div className="mb-3">
                                <label htmlFor="rsl_video_url" className="block text-sm font-medium text-gray-700">
                                  RSL Video URL
                                </label>
                                <input 
                                  type="url" 
                                  name="rsl_video_url" 
                                  id="rsl_video_url" 
                                  value={editFormData.rsl_video_url} 
                                  onChange={handleInputChange} 
                                  placeholder="https://youtu.be/example or https://youtube.com/watch?v=example"
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" 
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  YouTube URLs will be automatically converted to embeddable format
                                </p>
                              </div>
                              
                              <div className="mb-3">
                                <label htmlFor="rsl_description" className="block text-sm font-medium text-gray-700">
                                  RSL Video Description
                                </label>
                                <textarea 
                                  name="rsl_description" 
                                  id="rsl_description" 
                                  rows={2} 
                                  value={editFormData.rsl_description} 
                                  onChange={handleInputChange} 
                                  placeholder="Brief description of what this RSL video covers..."
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" 
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  This description will be shown to students before they watch the video
                                </p>
                              </div>

                              {/* Video Preview */}
                              {editFormData.rsl_video_url && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">Video Preview:</h5>
                                  <div className="relative w-full max-w-sm bg-gray-100 rounded overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
                                    <iframe
                                      className="w-full h-full"
                                      src={editFormData.rsl_video_url.includes('embed/') 
                                        ? editFormData.rsl_video_url 
                                        : editFormData.rsl_video_url.includes('youtube.com/watch?v=')
                                          ? editFormData.rsl_video_url.replace('watch?v=', 'embed/')
                                          : editFormData.rsl_video_url.includes('youtu.be/')
                                            ? `https://www.youtube.com/embed/${editFormData.rsl_video_url.split('youtu.be/')[1]?.split('?')[0]}`
                                            : editFormData.rsl_video_url
                                      }
                                      title="RSL Video Preview"
                                      frameBorder="0"
                                      allowFullScreen
                                    />
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Enhanced Question Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">Quiz Questions</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {editQuestions.length} questions • Total points: {editQuestions.reduce((sum, q) => sum + (q.points || 0), 0)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  // Fetch questions for this quiz
                                  const { data, error } = await supabase
                                    .from('enhanced_quiz_questions')
                                    .select('*')
                                    .eq('quiz_id', selectedQuiz.id)
                                    .order('order_index');
                                  
                                  if (error) throw error;
                                  
                                  setEditQuestions(data || []);
                                  // Load RSL data for questions
                                  const rslData: Record<string, any> = {};
                                  (data || []).forEach(q => {
                                    if (q.rsl_video_url || q.rsl_description) {
                                      rslData[q.id] = {
                                        rsl_video_url: q.rsl_video_url,
                                        description: q.rsl_description
                                      };
                                    }
                                  });
                                  setEditQuestionsRsl(rslData);
                                } catch (error) {
                                  console.error('Error loading questions:', error);
                                  alert('Failed to load questions');
                                }
                              }}
                              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                              <RefreshCwIcon size={16} className="mr-1" />
                              Load Questions
                            </button>
                            <button
                              onClick={() => {
                                // Create a new question template
                                const newQuestion = {
                                  id: `temp_${Date.now()}`,
                                  quiz_id: selectedQuiz.id,
                                  question_text: '',
                                  question_type: 'multiple_choice',
                                  options: ['', '', '', ''],
                                  correct_answer: [0],
                                  explanation: '',
                                  points: 1,
                                  difficulty_level: 'medium',
                                  order_index: editQuestions.length
                                };
                                setEditQuestions([...editQuestions, newQuestion]);
                              }}
                              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center shadow-lg"
                            >
                              <PlusIcon size={16} className="mr-2" />
                              Add Question
                            </button>
                          </div>
                        </div>
                        
                        {editQuestions.length === 0 ? (
                          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                              <ClipboardListIcon size={40} className="text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Yet</h3>
                            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                              Start building your quiz by adding questions. You can create multiple choice, true/false, or open-ended questions.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <button
                                onClick={() => {
                                  const newQuestion = {
                                    id: `temp_${Date.now()}`,
                                    quiz_id: selectedQuiz.id,
                                    question_text: '',
                                    question_type: 'multiple_choice',
                                    options: ['', '', '', ''],
                                    correct_answer: [0],
                                    explanation: '',
                                    points: 1,
                                    difficulty_level: 'medium',
                                    order_index: 0
                                  };
                                  setEditQuestions([newQuestion]);
                                }}
                                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-lg"
                              >
                                Create First Question
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const { data, error } = await supabase
                                      .from('enhanced_quiz_questions')
                                      .select('*')
                                      .eq('quiz_id', selectedQuiz.id)
                                      .order('order_index');
                                    
                                    if (error) throw error;
                                    
                                    if (data && data.length > 0) {
                                      setEditQuestions(data);
                                      const rslData: Record<string, any> = {};
                                      data.forEach(q => {
                                        if (q.rsl_video_url || q.rsl_description) {
                                          rslData[q.id] = {
                                            rsl_video_url: q.rsl_video_url,
                                            description: q.rsl_description
                                          };
                                        }
                                      });
                                      setEditQuestionsRsl(rslData);
                                    } else {
                                      alert('No existing questions found in database');
                                    }
                                  } catch (error) {
                                    console.error('Error loading questions:', error);
                                    alert('Failed to load questions from database');
                                  }
                                }}
                                className="px-6 py-3 border border-purple-300 text-purple-700 rounded-xl hover:bg-purple-50 transition-colors font-medium"
                              >
                                Load from Database
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[600px] overflow-y-auto">
                            {editQuestions.map((question, index) => (
                              <div key={question.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                                {/* Question Header */}
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                      <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-bold px-3 py-1 rounded-lg">
                                        Q{index + 1}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                          question.question_type === 'multiple_choice' ? 'bg-blue-100 text-blue-700' :
                                          question.question_type === 'true_false' ? 'bg-green-100 text-green-700' :
                                          question.question_type === 'short_answer' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {question.question_type?.replace('_', ' ') || 'Multiple Choice'}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                                          {question.points || 1} point{(question.points || 1) !== 1 ? 's' : ''}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                          question.difficulty_level === 'easy' ? 'bg-green-100 text-green-700' :
                                          question.difficulty_level === 'hard' ? 'bg-red-100 text-red-700' :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          {question.difficulty_level || 'Medium'}
                                        </span>
                                        {editQuestionsRsl[question.id]?.rsl_video_url && (
                                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full flex items-center font-medium">
                                            <VideoIcon size={12} className="mr-1" />
                                            RSL Ready
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          // TODO: Edit question functionality
                                          alert('Edit question functionality to be implemented');
                                        }}
                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Question"
                                      >
                                        <EditIcon size={16} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditQuestions(prev => prev.filter(q => q.id !== question.id));
                                          setEditQuestionsRsl(prev => {
                                            const newRsl = { ...prev };
                                            delete newRsl[question.id];
                                            return newRsl;
                                          });
                                        }}
                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Question"
                                      >
                                        <TrashIcon size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Question Content */}
                                <div className="p-6">
                                  <div className="mb-4">
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">Question Text:</h5>
                                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border">
                                      {question.question_text || 'No question text provided'}
                                    </p>
                                  </div>

                                  {/* Question Options */}
                                  {question.question_type === 'multiple_choice' && question.options && (
                                    <div className="mb-4">
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">Answer Options:</h5>
                                      <div className="space-y-2">
                                        {Array.isArray(question.options) ? question.options.map((option: string, optIndex: number) => (
                                          <div key={optIndex} className={`p-3 rounded-lg border flex items-center ${
                                            question.correct_answer?.includes(optIndex) 
                                              ? 'bg-green-50 border-green-200 text-green-800' 
                                              : 'bg-gray-50 border-gray-200 text-gray-700'
                                          }`}>
                                            <span className={`text-xs font-bold px-2 py-1 rounded mr-3 ${
                                              question.correct_answer?.includes(optIndex) 
                                                ? 'bg-green-200 text-green-800' 
                                                : 'bg-gray-200 text-gray-600'
                                            }`}>
                                              {String.fromCharCode(65 + optIndex)}
                                            </span>
                                            <span className="flex-1">{option || `Option ${optIndex + 1}`}</span>
                                            {question.correct_answer?.includes(optIndex) && (
                                              <CheckCircleIcon size={16} className="text-green-600 ml-2" />
                                            )}
                                          </div>
                                        )) : (
                                          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                                            Invalid options format
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* True/False Questions */}
                                  {question.question_type === 'true_false' && (
                                    <div className="mb-4">
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">Correct Answer:</h5>
                                      <div className="flex gap-3">
                                        <div className={`px-4 py-2 rounded-lg border flex items-center ${
                                          question.correct_answer?.[0] === 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700'
                                        }`}>
                                          <span className="font-medium">True</span>
                                          {question.correct_answer?.[0] === 0 && <CheckCircleIcon size={16} className="ml-2 text-green-600" />}
                                        </div>
                                        <div className={`px-4 py-2 rounded-lg border flex items-center ${
                                          question.correct_answer?.[0] === 1 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700'
                                        }`}>
                                          <span className="font-medium">False</span>
                                          {question.correct_answer?.[0] === 1 && <CheckCircleIcon size={16} className="ml-2 text-green-600" />}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Explanation */}
                                  {question.explanation && (
                                    <div className="mb-4">
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">Explanation:</h5>
                                      <p className="text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        {question.explanation}
                                      </p>
                                    </div>
                                  )}

                                  {/* Enhanced RSL Video Section */}
                                  <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center">
                                        <VideoIcon size={16} className="text-purple-600 mr-2" />
                                        <label className="text-sm font-semibold text-purple-900">RSL Video Support</label>
                                      </div>
                                      {editQuestionsRsl[question.id]?.rsl_video_url && (
                                        <a 
                                          href={editQuestionsRsl[question.id].rsl_video_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-purple-600 hover:text-purple-800 flex items-center font-medium"
                                        >
                                          <EyeIcon size={14} className="mr-1" />
                                          Preview
                                        </a>
                                      )}
                                    </div>
                                    <div className="space-y-3">
                                      <input
                                        type="url"
                                        placeholder="Enter YouTube URL for RSL video..."
                                        value={editQuestionsRsl[question.id]?.rsl_video_url || ''}
                                        onChange={(e) => {
                                          setEditQuestionsRsl(prev => ({
                                            ...prev,
                                            [question.id]: {
                                              ...prev[question.id],
                                              rsl_video_url: e.target.value
                                            }
                                          }));
                                        }}
                                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                      />
                                      <input
                                        type="text"
                                        placeholder="RSL video description (optional)..."
                                        value={editQuestionsRsl[question.id]?.description || ''}
                                        onChange={(e) => {
                                          setEditQuestionsRsl(prev => ({
                                            ...prev,
                                            [question.id]: {
                                              ...prev[question.id],
                                              description: e.target.value
                                            }
                                          }));
                                        }}
                                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // View Details
                  <div className="space-y-4">
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
                  </div>
                )}
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
        </div>
      )}
      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false);
              setQuizToDelete(null);
            }
          }}
        >
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm" 
              aria-hidden="true"
              onClick={() => {
                setShowDeleteModal(false);
                setQuizToDelete(null);
              }}
            ></div>
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
        </div>
      )}

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

                  {/* RSL Video Settings */}
                  <div className={`border-t pt-4 ${rslSettings.high_contrast ? "border-white" : "border-gray-200"}`}>
                    <h4 className={`${rslSettings.large_text ? "text-lg" : "text-base"} font-medium ${rslSettings.high_contrast ? "text-white" : "text-gray-900"} mb-3 flex items-center`}>
                      <VideoIcon size={20} className={`${rslSettings.high_contrast ? "text-white" : "text-purple-600"} mr-2`} />
                      RSL Video Settings
                    </h4>
                    
                    <div className="flex items-center mb-3">
                      <input 
                        type="checkbox" 
                        name="rsl_enabled" 
                        id="create-rsl-enabled" 
                        checked={createFormData.rsl_enabled} 
                        onChange={handleCreateCheckboxChange} 
                        className={`h-4 w-4 ${rslSettings.high_contrast ? "text-white" : "text-purple-600"} focus:ring-purple-500 border-gray-300 rounded`}
                      />
                      <label htmlFor="create-rsl-enabled" className={`ml-2 block ${rslSettings.large_text ? "text-base" : "text-sm"} ${rslSettings.high_contrast ? "text-white" : "text-gray-900"}`}>
                        Enable RSL video for this quiz
                      </label>
                    </div>

                    {createFormData.rsl_enabled && (
                      <>
                        <div className="mb-3">
                          <label htmlFor="create-rsl-video-url" className={`block ${rslSettings.large_text ? "text-base" : "text-sm"} font-medium ${rslSettings.high_contrast ? "text-white" : "text-gray-700"}`}>
                            RSL Video URL
                          </label>
                          <input 
                            type="url" 
                            name="rsl_video_url" 
                            id="create-rsl-video-url" 
                            value={createFormData.rsl_video_url} 
                            onChange={handleCreateInputChange} 
                            placeholder="https://youtu.be/example or https://youtube.com/watch?v=example"
                            className={`mt-1 block w-full border ${rslSettings.high_contrast ? "border-white bg-gray-800 text-white" : "border-gray-300 bg-white"} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${rslSettings.large_text ? "text-base" : "sm:text-sm"}`}
                          />
                          <p className={`mt-1 ${rslSettings.large_text ? "text-sm" : "text-xs"} ${rslSettings.high_contrast ? "text-gray-300" : "text-gray-500"}`}>
                            YouTube URLs will be automatically converted to embeddable format
                          </p>
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="create-rsl-description" className={`block ${rslSettings.large_text ? "text-base" : "text-sm"} font-medium ${rslSettings.high_contrast ? "text-white" : "text-gray-700"}`}>
                            RSL Video Description
                          </label>
                          <textarea 
                            name="rsl_description" 
                            id="create-rsl-description" 
                            rows={2} 
                            value={createFormData.rsl_description} 
                            onChange={handleCreateInputChange} 
                            placeholder="Brief description of what this RSL video covers..."
                            className={`mt-1 block w-full border ${rslSettings.high_contrast ? "border-white bg-gray-800 text-white" : "border-gray-300 bg-white"} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${rslSettings.large_text ? "text-base" : "sm:text-sm"}`}
                          />
                          <p className={`mt-1 ${rslSettings.large_text ? "text-sm" : "text-xs"} ${rslSettings.high_contrast ? "text-gray-300" : "text-gray-500"}`}>
                            This description will be shown to students before they watch the video
                          </p>
                        </div>
                      </>
                    )}
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

      {/* Quiz Preview Modal */}
      {showPreviewModal && previewQuiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border">
              
              {/* Modal Header */}
              <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <EyeIcon size={24} className="text-purple-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Quiz Preview</h3>
                    <p className="text-sm text-gray-600">{previewQuiz.title}</p>
                  </div>
                </div>
                <button 
                  onClick={closePreviewModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XIcon size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="bg-white px-6 py-6">
                {previewQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardListIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-800 mb-2">No Questions Available</h4>
                    <p className="text-gray-600">This quiz doesn't have any questions yet. Add questions to enable preview.</p>
                  </div>
                ) : previewShowResults ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon size={64} className="mx-auto text-green-500 mb-4" />
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">Preview Complete!</h4>
                    <p className="text-gray-600 mb-4">This is how the quiz would appear to students.</p>
                    <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                      <div className="text-sm text-gray-600 mb-2">Questions Answered:</div>
                      <div className="text-2xl font-bold text-purple-600">{Object.keys(previewAnswers).length} of {previewQuestions.length}</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Question Progress */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">
                          Question {previewCurrentQuestion + 1} of {previewQuestions.length}
                        </span>
                        <span className="text-sm text-gray-600">
                          {previewQuestions[previewCurrentQuestion]?.points || 1} point{previewQuestions[previewCurrentQuestion]?.points !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((previewCurrentQuestion + 1) / previewQuestions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Current Question */}
                    {previewQuestions[previewCurrentQuestion] && (
                      <div className="mb-6">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">
                          {previewQuestions[previewCurrentQuestion].question_text}
                        </h4>
                        
                        {previewQuestions[previewCurrentQuestion].question_type === 'mcq' && (
                          <div className="space-y-3">
                            {Object.entries(previewQuestions[previewCurrentQuestion].options || {}).map(([key, value]: [string, any]) => (
                              <label key={key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`preview-question-${previewCurrentQuestion}`}
                                  value={key}
                                  checked={previewAnswers[previewQuestions[previewCurrentQuestion].id] === key}
                                  onChange={() => handlePreviewAnswer(previewQuestions[previewCurrentQuestion].id, key)}
                                  className="mr-3"
                                />
                                <span className="font-medium mr-2">{key}.</span>
                                <span>{value}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {previewQuestions[previewCurrentQuestion].question_type === 'short_answer' && (
                          <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            rows={4}
                            placeholder="Enter your answer here..."
                            value={previewAnswers[previewQuestions[previewCurrentQuestion].id] || ''}
                            onChange={(e) => handlePreviewAnswer(previewQuestions[previewCurrentQuestion].id, e.target.value)}
                          />
                        )}

                        {previewQuestions[previewCurrentQuestion].question_type === 'word_problem' && (
                          <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            rows={4}
                            placeholder="Show your work and final answer..."
                            value={previewAnswers[previewQuestions[previewCurrentQuestion].id] || ''}
                            onChange={(e) => handlePreviewAnswer(previewQuestions[previewCurrentQuestion].id, e.target.value)}
                          />
                        )}
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between items-center">
                      <button
                        onClick={handlePreviewPrevious}
                        disabled={previewCurrentQuestion === 0}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="flex space-x-2">
                        {previewQuestions.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setPreviewCurrentQuestion(index)}
                            className={`w-8 h-8 rounded-full text-sm font-medium ${
                              index === previewCurrentQuestion
                                ? 'bg-purple-600 text-white'
                                : previewAnswers[previewQuestions[index]?.id]
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {index + 1}
                          </button>
                        ))}
                      </div>

                      {previewCurrentQuestion === previewQuestions.length - 1 ? (
                        <button
                          onClick={handlePreviewSubmit}
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                        >
                          Finish Preview
                        </button>
                      ) : (
                        <button
                          onClick={handlePreviewNext}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Admin Preview Mode</span> - Students will see the same interface
                </div>
                <button
                  onClick={closePreviewModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
