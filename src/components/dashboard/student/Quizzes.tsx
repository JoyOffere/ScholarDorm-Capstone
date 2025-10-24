import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { BookOpenIcon, ClipboardListIcon, ClockIcon, TrophyIcon, ArrowRightIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, EyeIcon, VideoIcon, PlayIcon } from 'lucide-react';
interface Quiz {
  id: string;
  title: string;
  description: string;
  lesson_id: string;
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number | null;
  randomize_questions: boolean;
  show_answers: boolean;
  is_published: boolean;
  question_count?: number;
  course_title?: string;
  lesson_title?: string;
  user_attempts?: number;
  highest_score?: number;
  status?: 'completed' | 'in_progress' | 'not_started';
  rsl_video_url?: string;
  rsl_description?: string;
  rsl_enabled?: boolean;
  has_question_rsl?: boolean;
  lesson_rsl_video_url?: string;
}
export const StudentQuizzes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'available'>('all');
  const [userId, setUserId] = useState<string | null>(null);
  
  // RSL Video Preview Modal States
  const [showRslPreview, setShowRslPreview] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string>('');
  useEffect(() => {
    const fetchUserAndQuizzes = async () => {
      try {
        // Get current user
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          await fetchQuizzes(user.id);
        }
      } catch (error) {
        console.error('Error fetching user and quizzes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndQuizzes();
  }, []);
  const fetchQuizzes = async (userId: string) => {
    try {
      setLoading(true);
      // Get all published quizzes with RSL video information
      const {
        data: quizzesData,
        error: quizzesError
      } = await supabase.from('enhanced_quizzes').select(`
          *,
          enhanced_quiz_questions(count)
        `).eq('is_published', true).order('created_at', {
        ascending: false
      });
      if (quizzesError) throw quizzesError;
      // Get course titles
      const courseIds = quizzesData?.map(quiz => quiz.course_id).filter(Boolean) || [];
      const {
        data: coursesData,
        error: coursesError
      } = await supabase.from('courses').select('id, title').in('id', courseIds);
      if (coursesError) throw coursesError;
      const courseTitleMap = (coursesData || []).reduce((map: Record<string, string>, course) => {
        map[course.id] = course.title;
        return map;
      }, {});
      // Get user's quiz attempts
      const {
        data: attemptsData,
        error: attemptsError
      } = await supabase.from('enhanced_quiz_attempts').select('quiz_id, score, completed_at').eq('user_id', userId);
      if (attemptsError) throw attemptsError;
      // Process quiz attempts
      const attemptsByQuizId: Record<string, {
        count: number;
        highestScore: number;
        completed: boolean;
      }> = {};
      attemptsData?.forEach(attempt => {
        if (!attemptsByQuizId[attempt.quiz_id]) {
          attemptsByQuizId[attempt.quiz_id] = {
            count: 0,
            highestScore: 0,
            completed: false
          };
        }
        attemptsByQuizId[attempt.quiz_id].count++;
        attemptsByQuizId[attempt.quiz_id].highestScore = Math.max(attemptsByQuizId[attempt.quiz_id].highestScore, attempt.score);
        if (attempt.completed_at) {
          attemptsByQuizId[attempt.quiz_id].completed = true;
        }
      });
      
      // Get RSL information for lessons and questions
      const quizIds = quizzesData?.map(quiz => quiz.id) || [];
      
      // Check for question-level RSL videos
      const { data: questionsWithRsl } = await supabase
        .from('enhanced_quiz_questions')
        .select('quiz_id, rsl_video_url')
        .in('quiz_id', quizIds)
        .not('rsl_video_url', 'is', null);

      // Map questions with RSL by quiz
      const quizQuestionRslMap: Record<string, boolean> = {};
      questionsWithRsl?.forEach(q => {
        quizQuestionRslMap[q.quiz_id] = true;
      });

      // Get lesson RSL videos for quizzes that have lesson_id
      const lessonIds = quizzesData?.map(quiz => quiz.lesson_id).filter(Boolean) || [];
      const { data: lessonsWithRsl } = lessonIds.length > 0 ? await supabase
        .from('enhanced_lessons')
        .select('id, rsl_video_url')
        .in('id', lessonIds)
        .not('rsl_video_url', 'is', null) : { data: [] };

      const lessonRslMap: Record<string, string> = {};
      lessonsWithRsl?.forEach(lesson => {
        if (lesson.rsl_video_url) {
          lessonRslMap[lesson.id] = lesson.rsl_video_url;
        }
      });

      // Combine all data
      const enrichedQuizzes = quizzesData?.map(quiz => {
        const attempts = attemptsByQuizId[quiz.id];
        let status: 'completed' | 'in_progress' | 'not_started' = 'not_started';
        if (attempts) {
          if (attempts.completed) {
            status = 'completed';
          } else if (attempts.count > 0) {
            status = 'in_progress';
          }
        }
        return {
          ...quiz,
          question_count: quiz.enhanced_quiz_questions?.length || 0,
          course_title: quiz.course_id ? courseTitleMap[quiz.course_id] ?? 'Unknown Course' : 'Unknown Course',
          lesson_title: 'Quiz Assessment',
          user_attempts: attempts?.count ?? 0,
          highest_score: attempts?.highestScore ?? 0,
          status,
          has_question_rsl: !!quizQuestionRslMap[quiz.id],
          lesson_rsl_video_url: quiz.lesson_id ? lessonRslMap[quiz.lesson_id] : null
        };
      }) || [];
      // Apply filter
      let filteredQuizzes = enrichedQuizzes;
      if (filter === 'completed') {
        filteredQuizzes = enrichedQuizzes.filter(quiz => quiz.status === 'completed');
      } else if (filter === 'available') {
        filteredQuizzes = enrichedQuizzes.filter(quiz => quiz.status !== 'completed');
      }
      setQuizzes(filteredQuizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };
  const startQuiz = (quizId: string, isRetake: boolean = false) => {
    if (isRetake) {
      navigate(`/quiz/${quizId}?new=true`);
    } else {
      navigate(`/quiz/${quizId}`);
    }
  };

  // Helper function to convert YouTube URLs to embed format
  const convertToEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    if (url.includes('embed/')) {
      return url;
    }
    
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  };

  // RSL Preview Functions
  const handleRslPreview = (quiz: Quiz) => {
    // Prioritize quiz-level RSL, then lesson-level RSL
    const rslVideoUrl = quiz.rsl_enabled && quiz.rsl_video_url 
      ? quiz.rsl_video_url 
      : quiz.lesson_rsl_video_url;
      
    if (rslVideoUrl) {
      setPreviewQuiz(quiz);
      setPreviewVideoUrl(rslVideoUrl);
      setShowRslPreview(true);
    }
  };

  const closeRslPreview = () => {
    setShowRslPreview(false);
    setPreviewQuiz(null);
    setPreviewVideoUrl('');
  };

  const getRslVideoInfo = (quiz: Quiz) => {
    if (quiz.rsl_enabled && quiz.rsl_video_url) {
      return {
        hasRsl: true,
        source: 'quiz',
        description: quiz.rsl_description || 'Quiz introduction in RSL'
      };
    }
    if (quiz.lesson_rsl_video_url) {
      return {
        hasRsl: true,
        source: 'lesson',
        description: 'Lesson content in RSL'
      };
    }
    if (quiz.has_question_rsl) {
      return {
        hasRsl: true,
        source: 'questions',
        description: 'Individual questions have RSL videos'
      };
    }
    return {
      hasRsl: false,
      source: null,
      description: null
    };
  };
  return <DashboardLayout title="Quizzes" role="student">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quizzes</h1>
            <p className="text-gray-600">
              Test your knowledge and track your progress
            </p>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              All Quizzes
            </button>
            <button onClick={() => setFilter('available')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'available' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Available
            </button>
            <button onClick={() => setFilter('completed')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Completed
            </button>
          </div>
        </div>
      </div>
      {loading ? <div className="py-6 text-center text-sm text-gray-600">Loading quizzes…</div> : quizzes.length === 0 ? <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <ClipboardListIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No quizzes found
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' ? 'There are no quizzes available yet.' : filter === 'completed' ? "You haven't completed any quizzes yet." : 'There are no available quizzes at the moment.'}
          </p>
          {filter !== 'all' && <button onClick={() => setFilter('all')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              View All Quizzes
            </button>}
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(quiz => <div key={quiz.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg text-gray-800">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">
                      {quiz.course_title}
                    </p>
                    <p className="text-xs text-gray-500">{quiz.lesson_title}</p>
                  </div>
                  <div className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${quiz.status === 'completed' ? 'bg-green-100 text-green-800' : quiz.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}
                  `}>
                    {quiz.status === 'completed' ? 'Completed' : quiz.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {quiz.description}
                </p>
                <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-gray-500 mb-4">
                  <div className="flex items-center">
                    <ClipboardListIcon size={14} className="mr-1" />
                    <span>{quiz.question_count} questions</span>
                  </div>
                  {quiz.time_limit_minutes && <div className="flex items-center">
                      <ClockIcon size={14} className="mr-1" />
                      <span>{quiz.time_limit_minutes} minutes</span>
                    </div>}
                  <div className="flex items-center">
                    <TrophyIcon size={14} className="mr-1" />
                    <span>Pass: {quiz.passing_score}%</span>
                  </div>
                  {(() => {
                    const rslInfo = getRslVideoInfo(quiz);
                    if (rslInfo.hasRsl) {
                      return (
                        <div className="flex items-center text-purple-600">
                          <VideoIcon size={14} className="mr-1" />
                          <span>RSL Available</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                {quiz.status === 'completed' ? <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">
                        Your best score:
                      </div>
                      <div className={`text-lg font-bold ${(quiz.highest_score ?? 0) >= quiz.passing_score ? 'text-green-600' : 'text-red-600'}`}>
                        {quiz.highest_score ?? 0}%
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {(() => {
                        const rslInfo = getRslVideoInfo(quiz);
                        const canPreviewRsl = rslInfo.hasRsl && (quiz.rsl_video_url || quiz.lesson_rsl_video_url);
                        if (canPreviewRsl) {
                          return (
                            <button 
                              onClick={() => handleRslPreview(quiz)} 
                              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center text-sm"
                              title="Preview RSL video"
                            >
                              <VideoIcon size={14} className="mr-1" />
                              RSL
                            </button>
                          );
                        }
                        return null;
                      })()}
                      <button onClick={() => startQuiz(quiz.id, false)} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center text-sm">
                        <EyeIcon size={14} className="mr-1" />
                        Review
                      </button>
                      <button onClick={() => startQuiz(quiz.id, true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                        Try Again
                        <ArrowRightIcon size={16} className="ml-1" />
                      </button>
                    </div>
                  </div> : <div className="flex justify-between items-center">
                    {(quiz.user_attempts ?? 0) > 0 && <div className="text-sm text-gray-600">
                        Attempts: {quiz.user_attempts ?? 0}
                        {quiz.max_attempts ? `/${quiz.max_attempts}` : ''}
                      </div>}
                    <div className="flex space-x-2">
                      {(() => {
                        const rslInfo = getRslVideoInfo(quiz);
                        const canPreviewRsl = rslInfo.hasRsl && (quiz.rsl_video_url || quiz.lesson_rsl_video_url);
                        if (canPreviewRsl) {
                          return (
                            <button 
                              onClick={() => handleRslPreview(quiz)} 
                              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center text-sm"
                              title="Preview RSL video before starting quiz"
                            >
                              <VideoIcon size={14} className="mr-1" />
                              Preview RSL
                            </button>
                          );
                        }
                        return null;
                      })()}
                      <button onClick={() => startQuiz(quiz.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center" disabled={quiz.max_attempts !== null && (quiz.user_attempts ?? 0) >= quiz.max_attempts}>
                        {quiz.status === 'in_progress' ? 'Continue' : 'Start Quiz'}
                        <ArrowRightIcon size={16} className="ml-1" />
                      </button>
                    </div>
                  </div>}
              </div>
            </div>)}
        </div>}
      {/* Leaderboard Preview */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Leaderboard</h2>
          <button onClick={() => navigate('/leaderboard')} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
            View Full Leaderboard
            <ArrowRightIcon size={16} className="ml-1" />
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* We'll implement the actual leaderboard in a separate component */}
          <div className="p-4">
            <p className="text-center text-gray-600">
              See how you compare to other students!
            </p>
          </div>
        </div>
      </div>

      {/* RSL Preview Modal */}
      {showRslPreview && previewQuiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      RSL Video Preview: {previewQuiz.title}
                    </h3>
                    {(() => {
                      const rslInfo = getRslVideoInfo(previewQuiz);
                      return (
                        <p className="text-sm text-gray-600 mt-1">
                          {rslInfo.description}
                        </p>
                      );
                    })()}
                  </div>
                  <button
                    onClick={closeRslPreview}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon size={24} />
                  </button>
                </div>
                
                <div className="mb-6">
                  {previewVideoUrl ? (
                    <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: '16 / 9' }}>
                      <iframe
                        className="w-full h-full"
                        src={convertToEmbedUrl(previewVideoUrl)}
                        title={`RSL Video Preview for ${previewQuiz.title}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                      <VideoIcon size={64} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">No RSL video available</p>
                      <p className="text-sm text-gray-500">
                        This quiz does not have an associated RSL video.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Quiz Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>Questions: {previewQuiz.question_count}</div>
                    <div>Passing Score: {previewQuiz.passing_score}%</div>
                    <div>Time Limit: {previewQuiz.time_limit_minutes ? `${previewQuiz.time_limit_minutes} minutes` : 'No limit'}</div>
                    <div>RSL Support: {(() => {
                      const rslInfo = getRslVideoInfo(previewQuiz);
                      if (rslInfo.hasRsl) {
                        return `Available (${rslInfo.source})`;
                      }
                      return 'Not available';
                    })()}</div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={closeRslPreview}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close Preview
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        closeRslPreview();
                        startQuiz(previewQuiz.id, false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      disabled={previewQuiz.max_attempts !== null && (previewQuiz.user_attempts ?? 0) >= previewQuiz.max_attempts}
                    >
                      <PlayIcon size={16} className="mr-2" />
                      {previewQuiz.status === 'in_progress' ? 'Continue Quiz' : 'Start Quiz'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>;
};