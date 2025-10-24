import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { ClockIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, ArrowLeftIcon, ArrowRightIcon, FlagIcon, HelpCircleIcon, VideoIcon, PlayIcon, EyeIcon } from 'lucide-react';

// Helper function to convert YouTube URLs to embed format
const convertToEmbedUrl = (url: string): string => {
  console.log('🔗 [RSL DEBUG] convertToEmbedUrl input:', url);
  
  if (!url) {
    console.log('❌ [RSL DEBUG] convertToEmbedUrl: Empty URL provided');
    return '';
  }
  
  // If already an embed URL, return as is
  if (url.includes('embed/')) {
    console.log('✅ [RSL DEBUG] convertToEmbedUrl: Already embed URL:', url);
    return url;
  }
  
  // Handle various YouTube URL formats
  if (url.includes('youtube.com/watch?v=')) {
    const converted = url.replace('watch?v=', 'embed/');
    console.log('🔄 [RSL DEBUG] convertToEmbedUrl: Converted watch URL:', { input: url, output: converted });
    return converted;
  }
  
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    const converted = `https://www.youtube.com/embed/${videoId}`;
    console.log('🔄 [RSL DEBUG] convertToEmbedUrl: Converted youtu.be URL:', { input: url, videoId, output: converted });
    return converted;
  }
  
  // For other video URLs, return as is and let iframe handle it
  console.log('⚠️ [RSL DEBUG] convertToEmbedUrl: Non-YouTube URL, returning as-is:', url);
  return url;
};
interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'calculation' | 'word_problem' | 'reasoning';
  options: any;
  correct_answer: any;
  explanation: string;
  points: number;
  difficulty_level: string;
  order_index: number;
  rsl_video_url?: string;
}
interface Quiz {
  id: string;
  title: string;
  description: string;
  instructions: string;
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number | null;
  randomize_questions: boolean;
  show_answers: boolean;
  lesson_id?: string;
  rsl_video_url?: string;
  rsl_description?: string;
  rsl_enabled?: boolean;
}
export const QuizAttempt: React.FC = () => {
  const {
    quizId
  } = useParams<{
    quizId: string;
  }>();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const isNewAttempt = searchParams.get('new') === 'true';
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [percentage, setPercentage] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showRSLVideo, setShowRSLVideo] = useState(false);
  const [rslVideoWatched, setRslVideoWatched] = useState(false);
  const [canStartQuiz, setCanStartQuiz] = useState(false);
  const [lessonRslVideoUrl, setLessonRslVideoUrl] = useState<string | null>(null);
  const [showQuestionRSL, setShowQuestionRSL] = useState(false);
  const [currentQuestionRSL, setCurrentQuestionRSL] = useState<QuizQuestion | null>(null);
  const [questionRSLWatched, setQuestionRSLWatched] = useState<Record<string, boolean>>({});
  const [pendingQuestionIndex, setPendingQuestionIndex] = useState<number | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Debug function to check RSL state (available in browser console)
  (window as any).debugRSL = () => {
    console.group('🎬 [RSL DEBUG] Complete State Overview');
    console.log('📊 Quiz Information:', {
      quizId: quizId,
      quizTitle: quiz?.title,
      lessonId: quiz?.lesson_id,
      hasLessonId: !!quiz?.lesson_id
    });
    console.log('🎥 RSL Video State:', {
      lessonRslVideoUrl: lessonRslVideoUrl,
      hasVideoUrl: !!lessonRslVideoUrl,
      convertedUrl: lessonRslVideoUrl ? convertToEmbedUrl(lessonRslVideoUrl) : null,
      rslVideoSource: lessonRslVideoUrl ? (quiz?.lesson_id ? 'lesson-level' : 'fallback/quiz-level') : 'none',
      isStandaloneQuiz: !quiz?.lesson_id
    });
    console.log('🎯 Quiz Flow State:', {
      loading: loading,
      quizComplete: quizComplete,
      canStartQuiz: canStartQuiz,
      showRSLVideo: showRSLVideo,
      rslVideoWatched: rslVideoWatched
    });
    console.log('📱 UI Conditions:', {
      shouldShowPreparationScreen: !canStartQuiz && !quizComplete,
      shouldShowModalVideo: showRSLVideo,
      currentScreen: loading ? 'loading' : quizComplete ? 'results' : !canStartQuiz ? 'rsl-preparation' : 'quiz'
    });
    console.groupEnd();
  };

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        if (!quizId || isLoadingQuiz) return;
        setIsLoadingQuiz(true);
        // Get current user
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) {
          navigate('/');
          return;
        }
        setUserId(user.id);
        // Check if user has any existing attempts
        const {
          data: existingAttempts,
          error: attemptsError
        } = await supabase.from('enhanced_quiz_attempts').select('id, answers, score, percentage, is_passed, completed_at').eq('user_id', user.id).eq('quiz_id', quizId).order('started_at', {
          ascending: false
        }).limit(1);
        if (attemptsError) throw attemptsError;
        // If there's a completed attempt and this is not a new attempt, show the results
        if (!isNewAttempt && existingAttempts && existingAttempts.length > 0 && existingAttempts[0].completed_at) {
          setQuizComplete(true);
          setScore(existingAttempts[0].score);
          setPercentage(existingAttempts[0].percentage);
          setPassed(existingAttempts[0].is_passed);
          setAnswers(existingAttempts[0].answers || {});
        }
        // Fetch quiz details
        const {
          data: quizData,
          error: quizError
        } = await supabase.from('enhanced_quizzes').select('*').eq('id', quizId).single();
        if (quizError) throw quizError;
        setQuiz(quizData);
        
        // Fetch RSL video - prioritize quiz-level RSL, then fallback to lesson-level
        let rslVideoUrl = null;
        let rslVideoSource = 'none';
        
        console.log('🎬 [RSL DEBUG] Checking for RSL video content...', {
          quizId,
          lessonId: quizData.lesson_id,
          quizTitle: quizData.title,
          quizRslEnabled: quizData.rsl_enabled,
          quizRslVideoUrl: quizData.rsl_video_url,
          hasLessonId: !!quizData.lesson_id
        });

        // First priority: Quiz-level RSL video (from our database migrations)
        if (quizData.rsl_enabled && quizData.rsl_video_url) {
          rslVideoUrl = quizData.rsl_video_url;
          rslVideoSource = 'quiz';
          console.log('✅ [RSL DEBUG] Quiz-level RSL video found (highest priority):', rslVideoUrl);
        }
        // Second priority: Lesson-level RSL video (fallback)
        else if (quizData.lesson_id) {
          const { data: lessonData, error: lessonError } = await supabase
            .from('enhanced_lessons')
            .select('rsl_video_url')
            .eq('id', quizData.lesson_id)
            .maybeSingle();
          
          console.log('🎬 [RSL DEBUG] Lesson data fetch result:', {
            lessonError: lessonError?.message,
            lessonData,
            hasRslVideoUrl: !!lessonData?.rsl_video_url
          });

          if (!lessonError && lessonData?.rsl_video_url) {
            rslVideoUrl = lessonData.rsl_video_url;
            rslVideoSource = 'lesson';
            console.log('✅ [RSL DEBUG] Lesson RSL video found (fallback):', rslVideoUrl);
          }
        }

        // Set the RSL video URL if found
        if (rslVideoUrl) {
          setLessonRslVideoUrl(rslVideoUrl);
          console.log('✅ [RSL DEBUG] RSL video set from', rslVideoSource, ':', rslVideoUrl);
        } else {
          console.log('ℹ️ [RSL DEBUG] No RSL video found for this quiz');
        }
        
        // Show RSL video preparation screen logic (fixed)
        const hasRslVideo = !!rslVideoUrl;
        const isFirstTimeOrRetake = isNewAttempt || !existingAttempts?.length;
        const shouldShowRSL = hasRslVideo && !quizComplete && isFirstTimeOrRetake;
        
        console.log('🎬 [RSL DEBUG] RSL preparation screen logic:', {
          hasRslVideo,
          rslVideoSource,
          rslVideoUrl,
          quizComplete,
          isNewAttempt,
          existingAttemptsCount: existingAttempts?.length || 0,
          isFirstTimeOrRetake,
          shouldShowRSL,
          willShowPreparationScreen: shouldShowRSL
        });

        if (shouldShowRSL) {
          setCanStartQuiz(false);
          console.log('🎬 [RSL DEBUG] RSL preparation screen will be shown');
        } else {
          setCanStartQuiz(true);
          console.log('🎬 [RSL DEBUG] Skipping RSL preparation screen, going directly to quiz');
        }
        // Fetch quiz questions with RSL video URLs directly
        const {
          data: questionData,
          error: questionError
        } = await supabase
          .from('enhanced_quiz_questions')
          .select('*, rsl_video_url')
          .eq('quiz_id', quizId)
          .order('order_index', { ascending: true });
          
        if (questionError) throw questionError;
        
        let processedQuestions = questionData || [];
        
        // Log RSL video availability for questions
        console.log('🎬 [RSL DEBUG] Questions loaded with RSL videos:', 
          processedQuestions.filter(q => q.rsl_video_url).length, 'out of', processedQuestions.length);
          
        if (processedQuestions.length > 0) {
          console.log('🎬 [RSL DEBUG] Sample questions with RSL:', 
            processedQuestions
              .filter(q => q.rsl_video_url)
              .slice(0, 3)
              .map(q => ({ 
                id: q.id, 
                order: q.order_index, 
                rsl_video: q.rsl_video_url?.substring(0, 50) + '...' 
              }))
          );
        }
        
        // Randomize questions if needed (preserve RSL video URLs)
        if (quizData.randomize_questions) {
          processedQuestions = [...processedQuestions].sort(() => Math.random() - 0.5);
          console.log('🔀 [RSL DEBUG] Questions randomized, RSL videos preserved');
        }
        
        setQuestions(processedQuestions);
        
        // Final RSL summary
        const questionsWithRsl = processedQuestions.filter(q => q.rsl_video_url);
        console.log('🎬 [RSL DEBUG] Final RSL Summary:', {
          totalQuestions: processedQuestions.length,
          questionsWithRsl: questionsWithRsl.length,
          quizRslVideo: !!rslVideoUrl,
          rslVideoSource,
          fullRslCoverage: questionsWithRsl.length === processedQuestions.length
        });

        // Set timer if applicable
        if (quizData.time_limit_minutes && !quizComplete) {
          const timeInSeconds = quizData.time_limit_minutes * 60;
          setTimeRemaining(timeInSeconds);
        }
      } catch (error) {
        console.error('Error fetching quiz data:', error);
      } finally {
        setLoading(false);
        setIsLoadingQuiz(false);
      }
    };
    fetchQuizData();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizId]);

  const submitQuiz = useCallback(async () => {
    if (!quiz || !userId || submitting) return;
    try {
      setSubmitting(true);
      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;
      questions.forEach(question => {
        totalPoints += question.points;
        const userAnswer = answers[question.id];
        if (!userAnswer) return;
        if (question.question_type === 'mcq' || question.question_type === 'true_false') {
          if (userAnswer === question.correct_answer) {
            earnedPoints += question.points;
          }
        } else if (question.question_type === 'calculation' || question.question_type === 'word_problem' || question.question_type === 'reasoning') {
          // For open-ended questions, check if answer is not empty (partial credit)
          // In a real app, these would need manual grading
          if (userAnswer && userAnswer.trim() !== '') {
            earnedPoints += question.points * 0.5; // Give 50% credit for attempting
          }
        }
        // Short answer and essay would need manual grading
      });
      const scorePercentage = Math.round(earnedPoints / totalPoints * 100);
      const hasPassed = scorePercentage >= quiz.passing_score;
      // Get attempt number for this user and quiz
      const { count: attemptCount } = await supabase
        .from('enhanced_quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('quiz_id', quizId);

      // Save attempt to database
      const {
        data: attemptData,
        error: attemptError
      } = await supabase.from('enhanced_quiz_attempts').insert({
        user_id: userId,
        quiz_id: quizId,
        attempt_number: (attemptCount || 0) + 1,
        score: scorePercentage,
        total_points: totalPoints,
        percentage: scorePercentage,
        is_passed: hasPassed,
        answers,
        time_taken_minutes: quiz.time_limit_minutes ? Math.ceil((quiz.time_limit_minutes * 60 - (timeRemaining || 0)) / 60) : null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }).select();
      if (attemptError) throw attemptError;
      // Update state with results
      setQuizComplete(true);
      setScore(scorePercentage);
      setPercentage(scorePercentage);
      setPassed(hasPassed);
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  }, [quiz, userId, submitting, questions, answers, timeRemaining, quizId]);

  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining > 0 && !quizComplete) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, quizComplete, submitQuiz]);

  // Check if question has RSL video and show modal before rendering
  useEffect(() => {
    if (questions && questions.length > 0 && currentQuestionIndex >= 0) {
      const question = questions[currentQuestionIndex];
      if (question.rsl_video_url && !questionRSLWatched[question.id]) {
        setCurrentQuestionRSL(question);
        setShowQuestionRSL(true);
        setPendingQuestionIndex(currentQuestionIndex);
      }
    }
  }, [currentQuestionIndex, questions, questionRSLWatched]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleWatchRSLVideo = () => {
    // Prevent multiple opens
    if (showRSLVideo) {
      console.log('🎬 [RSL DEBUG] RSL video modal already open, ignoring click');
      return;
    }
    
    console.log('🎬 [RSL DEBUG] handleWatchRSLVideo triggered', {
      lessonRslVideoUrl,
      hasVideoUrl: !!lessonRslVideoUrl,
      currentShowRSLVideo: showRSLVideo
    });
    setShowRSLVideo(true);
  };

  const handleRSLVideoWatched = () => {
    console.log('✅ [RSL DEBUG] handleRSLVideoWatched triggered - User completed watching RSL video');
    setRslVideoWatched(true);
    setShowRSLVideo(false);
    setCanStartQuiz(true);
  };

  const handleSkipRSLVideo = () => {
    console.log('⏭️ [RSL DEBUG] handleSkipRSLVideo triggered - User skipped RSL video');
    setShowRSLVideo(false);
    setCanStartQuiz(true);
  };

  const handleWatchQuestionRSL = () => {
    setShowQuestionRSL(true);
  };

  const handleQuestionRSLWatched = () => {
    if (currentQuestionRSL) {
      setQuestionRSLWatched(prev => ({
        ...prev,
        [currentQuestionRSL.id]: true
      }));
    }
    setShowQuestionRSL(false);
    setCurrentQuestionRSL(null);
    setPendingQuestionIndex(null);
  };

  const handleSkipQuestionRSL = () => {
    if (currentQuestionRSL) {
      setQuestionRSLWatched(prev => ({
        ...prev,
        [currentQuestionRSL.id]: true
      }));
    }
    setShowQuestionRSL(false);
    setCurrentQuestionRSL(null);
    setPendingQuestionIndex(null);
  };


  const renderQuestion = () => {
    if (questions.length === 0) return null;
    const question = questions[currentQuestionIndex];
    if (!question) return null;

    // Check if question has RSL video that hasn't been watched
    if (question.rsl_video_url && !questionRSLWatched[question.id]) {
      return (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 text-center">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <VideoIcon size={32} className="text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-purple-900 mb-2">
            Question RSL Video Available
          </h3>
          <p className="text-purple-700 mb-4">
            This question has a dedicated RSL instructional video to help you understand the concepts better.
          </p>
          <div className="bg-white/60 rounded-lg p-3 mb-4 text-sm text-purple-800">
            <p><strong>Question {currentQuestionIndex + 1} of {questions.length}</strong></p>
            <p className="text-xs mt-1">Individual RSL explanation available</p>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleSkipQuestionRSL}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Skip Video
            </button>
            <button
              onClick={handleWatchQuestionRSL}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <PlayIcon size={16} className="mr-2" />
              Watch RSL Video
            </button>
          </div>
        </div>
      );
    }

    switch (question.question_type) {
      case 'mcq':
        return renderMultipleChoice(question);
      case 'true_false':
        return renderTrueFalse(question);
      case 'short_answer':
        return renderShortAnswer(question);
      case 'calculation':
        return renderCalculation(question);
      case 'word_problem':
        return renderWordProblem(question);
      case 'reasoning':
        return renderReasoning(question);
      default:
        return <p>Unsupported question type: {question.question_type}</p>;
    }
  };
  const renderMultipleChoice = (question: QuizQuestion) => {
    // Handle both array format and object format for options
    let options: Array<{value: string, label: string}> = [];
    
    if (Array.isArray(question.options)) {
      // Already in the expected format
      options = question.options;
    } else if (question.options && typeof question.options === 'object') {
      // Convert object format {"A": "answer1", "B": "answer2"} to array format
      options = Object.entries(question.options).map(([key, value]) => ({
        value: key,
        label: String(value)
      }));
    }
    
    const userAnswer = answers[question.id];
    const isCorrect = quizComplete && userAnswer === question.correct_answer;
    return <div>
        <div className="mb-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-medium text-gray-800 flex-1">
              {question.question_text}
            </h3>
            {question.rsl_video_url && (
              <button
                onClick={() => {
                  setCurrentQuestionRSL(question);
                  setShowQuestionRSL(true);
                }}
                className="ml-4 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center text-sm"
                title="Watch RSL explanation for this question"
              >
                <EyeIcon size={14} className="mr-1" />
                RSL
              </button>
            )}
          </div>
          {quizComplete && <div className={`mt-2 p-2 rounded-lg ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {isCorrect ? <div className="flex items-center">
                  <CheckCircleIcon size={16} className="mr-2" />
                  <span>Correct!</span>
                </div> : <div>
                  <div className="flex items-center">
                    <XCircleIcon size={16} className="mr-2" />
                    <span>Incorrect</span>
                  </div>
                  {quiz?.show_answers && <div className="mt-1 text-sm">
                      Correct answer:{' '}
                      {options.find(opt => opt.value === question.correct_answer)?.label || 
                       `${question.correct_answer} (option not found)`}
                    </div>}
                </div>}
              {question.explanation && quiz?.show_answers && <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-700">
                  <strong>Explanation:</strong> {question.explanation}
                </div>}
            </div>}
        </div>
        <div className="space-y-2">
          {options.length > 0 ? (
            options.map((option, index) => (
              <div key={index} className="flex items-center">
                <input 
                  type="radio" 
                  id={`${question.id}-option-${index}`} 
                  name={`question-${question.id}`} 
                  value={option.value} 
                  checked={userAnswer === option.value} 
                  onChange={() => handleAnswerChange(question.id, option.value)} 
                  disabled={quizComplete} 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" 
                />
                <label 
                  htmlFor={`${question.id}-option-${index}`} 
                  className={`ml-2 block text-gray-700 ${
                    quizComplete && option.value === question.correct_answer ? 'font-bold text-green-700' : ''
                  }`}
                >
                  {option.label}
                </label>
                {quizComplete && option.value === question.correct_answer && (
                  <CheckCircleIcon size={16} className="ml-2 text-green-600" />
                )}
              </div>
            ))
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>No options available for this question.</strong>
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                Options data: {JSON.stringify(question.options)}
              </p>
            </div>
          )}
        </div>
      </div>;
  };
  const renderTrueFalse = (question: QuizQuestion) => {
    const userAnswer = answers[question.id];
    const isCorrect = quizComplete && userAnswer === question.correct_answer;
    return <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            {question.question_text}
          </h3>
          {quizComplete && <div className={`mt-2 p-2 rounded-lg ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {isCorrect ? <div className="flex items-center">
                  <CheckCircleIcon size={16} className="mr-2" />
                  <span>Correct!</span>
                </div> : <div>
                  <div className="flex items-center">
                    <XCircleIcon size={16} className="mr-2" />
                    <span>Incorrect</span>
                  </div>
                  {quiz?.show_answers && <div className="mt-1 text-sm">
                      Correct answer:{' '}
                      {question.correct_answer ? 'True' : 'False'}
                    </div>}
                </div>}
              {question.explanation && quiz?.show_answers && <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-700">
                  <strong>Explanation:</strong> {question.explanation}
                </div>}
            </div>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <input type="radio" id={`${question.id}-true`} name={`question-${question.id}`} value="true" checked={userAnswer === true} onChange={() => handleAnswerChange(question.id, true)} disabled={quizComplete} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
            <label htmlFor={`${question.id}-true`} className={`ml-2 block text-gray-700 ${quizComplete && question.correct_answer === true ? 'font-bold text-green-700' : ''}`}>
              True
            </label>
            {quizComplete && question.correct_answer === true && <CheckCircleIcon size={16} className="ml-2 text-green-600" />}
          </div>
          <div className="flex items-center">
            <input type="radio" id={`${question.id}-false`} name={`question-${question.id}`} value="false" checked={userAnswer === false} onChange={() => handleAnswerChange(question.id, false)} disabled={quizComplete} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
            <label htmlFor={`${question.id}-false`} className={`ml-2 block text-gray-700 ${quizComplete && question.correct_answer === false ? 'font-bold text-green-700' : ''}`}>
              False
            </label>
            {quizComplete && question.correct_answer === false && <CheckCircleIcon size={16} className="ml-2 text-green-600" />}
          </div>
        </div>
      </div>;
  };

  const renderShortAnswer = (question: QuizQuestion) => {
    const userAnswer = answers[question.id] || '';
    return <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            {question.question_text}
          </h3>
          {quizComplete && quiz?.show_answers && <div className="mt-2 p-2 rounded-lg bg-blue-50 text-blue-800">
              <div className="flex items-center">
                <AlertCircleIcon size={16} className="mr-2" />
                <span>This question requires manual grading</span>
              </div>
              {quiz?.show_answers && <div className="mt-1 text-sm">
                  <strong>Expected answer:</strong> {question.correct_answer}
                </div>}
              {question.explanation && <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-700">
                  <strong>Explanation:</strong> {question.explanation}
                </div>}
            </div>}
        </div>
        <div>
          <textarea value={userAnswer} onChange={e => handleAnswerChange(question.id, e.target.value)} disabled={quizComplete} rows={4} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter your answer here..."></textarea>
        </div>
      </div>;
  };


  const renderCalculation = (question: QuizQuestion) => {
    const userAnswer = answers[question.id] || '';
    return <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            {question.question_text}
          </h3>
          {quizComplete && quiz?.show_answers && <div className="mt-2 p-2 rounded-lg bg-blue-50 text-blue-800">
              <div className="flex items-center">
                <AlertCircleIcon size={16} className="mr-2" />
                <span>Show your work for full credit</span>
              </div>
              {quiz?.show_answers && <div className="mt-1 text-sm">
                  <strong>Expected answer:</strong> {question.correct_answer}
                </div>}
              {question.explanation && <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-700">
                  <strong>Solution:</strong> {question.explanation}
                </div>}
            </div>}
        </div>
        <div>
          <textarea 
            value={userAnswer} 
            onChange={e => handleAnswerChange(question.id, e.target.value)} 
            disabled={quizComplete} 
            rows={6} 
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
            placeholder="Show your calculation steps here..."
          />
        </div>
      </div>;
  };

  const renderWordProblem = (question: QuizQuestion) => {
    const userAnswer = answers[question.id] || '';
    return <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            {question.question_text}
          </h3>
          {quizComplete && quiz?.show_answers && <div className="mt-2 p-2 rounded-lg bg-blue-50 text-blue-800">
              <div className="flex items-center">
                <AlertCircleIcon size={16} className="mr-2" />
                <span>Explain your reasoning and show calculations</span>
              </div>
              {quiz?.show_answers && <div className="mt-1 text-sm">
                  <strong>Expected answer:</strong> {question.correct_answer}
                </div>}
              {question.explanation && <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-700">
                  <strong>Solution approach:</strong> {question.explanation}
                </div>}
            </div>}
        </div>
        <div>
          <textarea 
            value={userAnswer} 
            onChange={e => handleAnswerChange(question.id, e.target.value)} 
            disabled={quizComplete} 
            rows={8} 
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
            placeholder="Explain your approach and show your work..."
          />
        </div>
      </div>;
  };

  const renderReasoning = (question: QuizQuestion) => {
    const userAnswer = answers[question.id] || '';
    return <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            {question.question_text}
          </h3>
          {quizComplete && quiz?.show_answers && <div className="mt-2 p-2 rounded-lg bg-blue-50 text-blue-800">
              <div className="flex items-center">
                <AlertCircleIcon size={16} className="mr-2" />
                <span>Provide clear reasoning and justification</span>
              </div>
              {quiz?.show_answers && <div className="mt-1 text-sm">
                  <strong>Expected reasoning:</strong> {question.correct_answer}
                </div>}
              {question.explanation && <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-700">
                  <strong>Key concepts:</strong> {question.explanation}
                </div>}
            </div>}
        </div>
        <div>
          <textarea 
            value={userAnswer} 
            onChange={e => handleAnswerChange(question.id, e.target.value)} 
            disabled={quizComplete} 
            rows={6} 
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
            placeholder="Explain your reasoning step by step..."
          />
        </div>
      </div>;
  };

  const renderQuizResults = () => {
    if (!quizComplete || score === null || percentage === null || passed === null) return null;
    return <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className={`h-24 w-24 rounded-full mx-auto flex items-center justify-center ${passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {passed ? <CheckCircleIcon size={64} /> : <XCircleIcon size={64} />}
          </div>
          <h2 className="text-2xl font-bold mt-4">
            {passed ? 'Congratulations!' : 'Quiz Completed'}
          </h2>
          <p className="text-gray-600 mt-1">
            {passed ? 'You have successfully passed this quiz.' : 'You did not meet the passing score for this quiz.'}
          </p>
        </div>
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 w-48 h-48 rounded-full flex items-center justify-center relative">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="#e5e7eb" strokeWidth="12" fill="transparent" />
              <circle cx="96" cy="96" r="88" stroke={passed ? '#22c55e' : '#ef4444'} strokeWidth="12" fill="transparent" strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - percentage / 100)} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold">{percentage}%</div>
                <div className="text-sm text-gray-500">Your Score</div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center space-y-4">
          <div>
            <div className="text-sm text-gray-600">Passing Score</div>
            <div className="font-bold">{quiz?.passing_score}%</div>
          </div>
          
          {/* RSL Usage Summary */}
          {(() => {
            const questionsWithRsl = questions.filter(q => q.rsl_video_url);
            const hasQuizRsl = quiz?.rsl_video_url && quiz?.rsl_enabled;
            const hasLessonRsl = !!lessonRslVideoUrl && !hasQuizRsl;
            
            if (hasQuizRsl || hasLessonRsl || questionsWithRsl.length > 0) {
              return (
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                  <div className="flex items-center justify-center mb-2">
                    <VideoIcon size={16} className="text-purple-600 mr-2" />
                    <span className="text-purple-800 font-medium text-sm">RSL Support Used</span>
                  </div>
                  <div className="text-xs text-purple-700 space-y-1">
                    {hasQuizRsl && <div>✓ Quiz introduction video available</div>}
                    {hasLessonRsl && <div>✓ Lesson overview video available</div>}
                    {questionsWithRsl.length > 0 && (
                      <div>✓ {questionsWithRsl.length}/{questions.length} questions had RSL videos</div>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })()}
          
          {!isNewAttempt && (
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-blue-800 text-sm">
                <strong>Reviewing Previous Attempt</strong> - You can try again to improve your score
              </p>
            </div>
          )}
          
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => navigate('/quizzes')} 
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Quizzes
            </button>
            {!isNewAttempt && quiz?.max_attempts !== 1 && (
              <button 
                onClick={() => navigate(`/quiz/${quizId}?new=true`)} 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>;
  };
  if (loading) {
    return <DashboardLayout title="Loading Quiz..." role="student">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>;
  }
  if (!quiz) {
    return <DashboardLayout title="Quiz Not Found" role="student">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircleIcon size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            Quiz Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The quiz you're looking for doesn't exist or you don't have
            permission to access it.
          </p>
          <button onClick={() => navigate('/quizzes')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Back to Quizzes
          </button>
        </div>
      </DashboardLayout>;
  }

  // Show RSL video preparation screen
  if (!canStartQuiz && !quizComplete) {
    console.log('🎬 [RSL DEBUG] Rendering RSL preparation screen:', {
      canStartQuiz,
      quizComplete,
      lessonRslVideoUrl,
      hasVideoUrl: !!lessonRslVideoUrl,
      quiz: quiz?.title,
      showingPreparationScreen: true
    });

    return <DashboardLayout title={quiz.title} role="student">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600 mx-auto mb-4">
                <VideoIcon size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {(() => {
                  if (quiz?.rsl_video_url && quiz?.rsl_enabled) {
                    return 'Quiz Introduction Video';
                  } else if (lessonRslVideoUrl) {
                    return 'Lesson Overview Video';
                  }
                  return 'RSL Instructional Video';
                })()}
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                {(() => {
                  if (quiz?.rsl_video_url && quiz?.rsl_enabled) {
                    return (
                      <>
                        Welcome to <strong>{quiz.title}</strong>! This quiz has its own introduction video in Rwandan Sign Language (RSL).
                        {quiz.rsl_description && (
                          <span className="block mt-2 text-sm italic text-gray-500">
                            {quiz.rsl_description}
                          </span>
                        )}
                      </>
                    );
                  } else if (lessonRslVideoUrl) {
                    return (
                      <>
                        This video covers the lesson concepts for <strong>{quiz?.title}</strong> in Rwandan Sign Language (RSL).
                        <span className="block mt-2 text-sm text-blue-600">
                          📝 Note: Additional RSL videos are available for individual questions during the quiz.
                        </span>
                      </>
                    );
                  }
                  return 'This quiz includes Rwandan Sign Language (RSL) support. Watch the instructional video below to better understand the concepts.';
                })()}
              </p>
            </div>

            {/* RSL Video Player */}
            {lessonRslVideoUrl ? (
              <div className="mb-6">
                {(() => {
                  const convertedUrl = convertToEmbedUrl(lessonRslVideoUrl);
                  console.log('🎬 [RSL DEBUG] Rendering RSL video iframe:', {
                    originalUrl: lessonRslVideoUrl,
                    convertedUrl: convertedUrl,
                    urlIsValid: !!convertedUrl,
                    renderingVideoPlayer: true
                  });
                  return null;
                })()}
                <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden shadow-lg mb-4" style={{ aspectRatio: '16 / 9' }}>
                  <iframe
                    className="w-full h-full"
                    src={convertToEmbedUrl(lessonRslVideoUrl)}
                    title="RSL Instructional Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => console.log('✅ [RSL DEBUG] RSL video iframe loaded successfully')}
                    onError={() => console.error('❌ [RSL DEBUG] RSL video iframe failed to load')}
                  ></iframe>
                </div>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Watch the video above to learn the RSL signs and concepts for this quiz.
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    <VideoIcon size={14} className="mr-1" />
                    {(() => {
                      if (quiz?.rsl_video_url && quiz?.rsl_enabled) {
                        return 'Quiz-specific RSL video';
                      } else if (lessonRslVideoUrl) {
                        return 'Lesson-based RSL video';
                      }
                      return 'RSL instructional content';
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center mb-6">
                {(() => {
                  console.log('⚠️ [RSL DEBUG] Showing fallback - No RSL video available:', {
                    lessonRslVideoUrl,
                    hasVideoUrl: !!lessonRslVideoUrl,
                    renderingFallback: true
                  });
                  return null;
                })()}
                <VideoIcon size={64} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No RSL video available for this quiz</p>
                <p className="text-sm text-gray-500">
                  The lesson associated with this quiz does not have an RSL video.
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <button
                onClick={handleRSLVideoWatched}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <CheckCircleIcon size={20} className="mr-2" />
                Continue to Quiz
              </button>
              
              <button
                onClick={handleSkipRSLVideo}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Skip Video & Start Quiz
              </button>
            </div>

            <div className="text-sm text-gray-500 text-center border-t pt-4">
              <p className="font-semibold mb-2">Quiz Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <div>Questions: {questions.length}</div>
                <div>Time: {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'No limit'}</div>
                <div>Pass: {quiz.passing_score}%</div>
              </div>
              {(() => {
                const questionsWithRsl = questions.filter(q => q.rsl_video_url);
                const hasQuizRsl = quiz?.rsl_video_url && quiz?.rsl_enabled;
                const hasLessonRsl = !!lessonRslVideoUrl && !hasQuizRsl;
                
                if (hasQuizRsl || hasLessonRsl || questionsWithRsl.length > 0) {
                  return (
                    <div className="bg-purple-50 rounded-lg p-3 mt-3">
                      <div className="flex items-center justify-center mb-2">
                        <VideoIcon size={16} className="text-purple-600 mr-2" />
                        <span className="text-purple-800 font-medium">RSL Support Available</span>
                      </div>
                      <div className="text-xs text-purple-700 space-y-1">
                        {hasQuizRsl && <div>✓ Quiz introduction video</div>}
                        {hasLessonRsl && <div>✓ Lesson overview video</div>}
                        {questionsWithRsl.length > 0 && (
                          <div>✓ {questionsWithRsl.length} question{questionsWithRsl.length !== 1 ? 's' : ''} with RSL videos</div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>

        {/* RSL Video Modal */}
        {showRSLVideo && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {(() => {
              console.log('🎬 [RSL DEBUG] Rendering RSL Video Modal:', {
                showRSLVideo,
                lessonRslVideoUrl,
                hasVideoUrl: !!lessonRslVideoUrl,
                modalVisible: true
              });
              return null;
            })()}
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      RSL Instructional Video
                    </h3>
                    <button
                      onClick={() => {
                        console.log('❌ [RSL DEBUG] Closing RSL modal via X button');
                        setShowRSLVideo(false);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircleIcon size={24} />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Watch this RSL instructional video to better understand the concepts before taking the quiz.
                    </p>
                    {lessonRslVideoUrl ? (
                      <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: '16 / 9' }}>
                        {(() => {
                          const convertedUrl = convertToEmbedUrl(lessonRslVideoUrl);
                          console.log('🎬 [RSL DEBUG] Rendering modal iframe:', {
                            originalUrl: lessonRslVideoUrl,
                            convertedUrl: convertedUrl
                          });
                          return null;
                        })()}
                        <iframe
                          className="w-full h-full"
                          src={convertToEmbedUrl(lessonRslVideoUrl)}
                          title="RSL Instructional Video"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          onLoad={() => console.log('✅ [RSL DEBUG] Modal RSL video iframe loaded successfully')}
                          onError={() => console.error('❌ [RSL DEBUG] Modal RSL video iframe failed to load')}
                        ></iframe>
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-8 text-center">
                        {(() => {
                          console.log('⚠️ [RSL DEBUG] Modal showing fallback - No RSL video available');
                          return null;
                        })()}
                        <VideoIcon size={64} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-4">No RSL video available for this quiz</p>
                        <p className="text-sm text-gray-500">
                          The lesson associated with this quiz does not have an RSL video.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={handleSkipRSLVideo}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Skip Video
                    </button>
                    <button
                      onClick={handleRSLVideoWatched}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <CheckCircleIcon size={16} className="mr-2" />
                      Mark as Watched & Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question-specific RSL Modal */}
        {showQuestionRSL && currentQuestionRSL && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      RSL Video for Question {currentQuestionIndex + 1}
                    </h3>
                    <button
                      onClick={() => setShowQuestionRSL(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircleIcon size={24} />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Watch this RSL video to help you understand the question better.
                    </p>
                    {currentQuestionRSL?.rsl_video_url ? (
                      <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: '16 / 9' }}>
                        <iframe
                          className="w-full h-full"
                          src={convertToEmbedUrl(currentQuestionRSL.rsl_video_url)}
                          title={`RSL Video for Question ${currentQuestionIndex + 1}`}
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
                          This question does not have an associated RSL video.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={handleSkipQuestionRSL}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Skip Video
                    </button>
                    <button
                      onClick={handleQuestionRSLWatched}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <CheckCircleIcon size={16} className="mr-2" />
                      Mark as Watched & Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>;
  }

  if (quizComplete) {
    return <DashboardLayout title={quiz.title} role="student">
        {renderQuizResults()}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Review Your Answers
          </h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-wrap gap-2 mb-6">
              {questions.map((q, index) => {
              const isAnswered = !!answers[q.id];
              const isCorrect = quizComplete && (q.question_type === 'mcq' || q.question_type === 'true_false') ? answers[q.id] === q.correct_answer : false;
              const hasRslVideo = !!q.rsl_video_url;
              return <button key={q.id} onClick={() => navigateToQuestion(index)} className={`relative h-8 w-8 rounded-full flex items-center justify-center text-sm ${currentQuestionIndex === index ? 'ring-2 ring-blue-500 bg-blue-100 text-blue-800' : isAnswered ? isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`} title={`Question ${index + 1}${hasRslVideo ? ' (RSL available)' : ''}${isAnswered ? (isCorrect ? ' - Correct' : ' - Incorrect') : ''}`}>
                    {index + 1}
                    {hasRslVideo && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-500 flex items-center justify-center">
                        <VideoIcon size={8} className="text-white" />
                      </div>
                    )}
                  </button>;
            })}
            </div>
            <div className="border-t border-gray-200 pt-6">
              {renderQuestion()}
              <div className="mt-6 flex justify-between">
                <button onClick={() => navigateToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0} className={`px-4 py-2 rounded-lg flex items-center ${currentQuestionIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  <ArrowLeftIcon size={16} className="mr-1" />
                  Previous
                </button>
                <button onClick={() => navigateToQuestion(currentQuestionIndex + 1)} disabled={currentQuestionIndex === questions.length - 1} className={`px-4 py-2 rounded-lg flex items-center ${currentQuestionIndex === questions.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  Next
                  <ArrowRightIcon size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>;
  }
  return <DashboardLayout title={quiz.title} role="student">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Quiz Header */}
        <div className="mb-6">
          {isNewAttempt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center text-green-800">
                <CheckCircleIcon size={16} className="mr-2" />
                <span className="text-sm font-medium">New Attempt - Fresh Start!</span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
              {quiz.description && <p className="text-gray-600 mt-1">{quiz.description}</p>}
            </div>
            {timeRemaining !== null && <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg flex items-center">
              <ClockIcon size={18} className="mr-2" />
              <span className="font-mono font-medium">
                {formatTime(timeRemaining)}
              </span>
            </div>}
          </div>
        </div>
        {/* Instructions */}
        {quiz.instructions && <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <HelpCircleIcon size={20} className="text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800 mb-1">
                  Instructions
                </h3>
                <p className="text-yellow-700 text-sm">{quiz.instructions}</p>
              </div>
            </div>
          </div>}
        {/* Question Navigator */}
        <div className="flex flex-wrap gap-2 mb-6">
          {questions.map((q, index) => {
          const isAnswered = !!answers[q.id];
          const hasRslVideo = !!q.rsl_video_url;
          return <button key={q.id} onClick={() => navigateToQuestion(index)} className={`relative h-8 w-8 rounded-full flex items-center justify-center text-sm transition-all ${currentQuestionIndex === index ? 'ring-2 ring-blue-500 bg-blue-100 text-blue-800' : isAnswered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`} title={`Question ${index + 1}${hasRslVideo ? ' (RSL available)' : ''}`}>
                {index + 1}
                {hasRslVideo && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-500 flex items-center justify-center">
                    <VideoIcon size={8} className="text-white" />
                  </div>
                )}
              </button>;
        })}
        </div>
        
        {/* RSL Legend */}
        {questions.some(q => q.rsl_video_url) && (
          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center text-sm text-purple-800">
              <VideoIcon size={16} className="mr-2" />
              <span className="font-medium">RSL Video Legend:</span>
              <span className="ml-2">Questions with</span>
              <div className="relative ml-1 mr-1">
                <div className="h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs">1</span>
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-purple-500"></div>
                </div>
              </div>
              <span>have RSL support</span>
            </div>
          </div>
        )}
        {/* Current Question */}
        <div className="border-t border-gray-200 pt-6">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
                {questions[currentQuestionIndex]?.rsl_video_url && (
                  <div className="flex items-center px-2 py-1 bg-purple-100 rounded-full text-xs text-purple-700">
                    <VideoIcon size={12} className="mr-1" />
                    RSL Available
                  </div>
                )}
              </div>
              {lessonRslVideoUrl && (
                <button
                  onClick={handleWatchRSLVideo}
                  disabled={showRSLVideo}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center text-sm ${
                    showRSLVideo 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  title={showRSLVideo ? "RSL video is currently open" : "Review quiz/lesson RSL video"}
                >
                  <VideoIcon size={14} className="mr-1" />
                  {(() => {
                    if (showRSLVideo) return 'RSL Video Open';
                    if (quiz?.rsl_video_url && quiz?.rsl_enabled) return 'Quiz RSL';
                    return 'Lesson RSL';
                  })()}
                </button>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {questions[currentQuestionIndex]?.points}{' '}
              {questions[currentQuestionIndex]?.points === 1 ? 'point' : 'points'}
            </div>
          </div>
          {renderQuestion()}
          <div className="mt-6 flex justify-between">
            <div>
              <button onClick={() => navigateToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0} className={`px-4 py-2 rounded-lg flex items-center ${currentQuestionIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <ArrowLeftIcon size={16} className="mr-1" />
                Previous
              </button>
            </div>
            <div className="flex gap-2">
              {currentQuestionIndex === questions.length - 1 ? <button onClick={submitQuiz} disabled={submitting} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                  {submitting ? <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </> : <>
                      <FlagIcon size={16} className="mr-1" />
                      Submit Quiz
                    </>}
                </button> : <button onClick={() => navigateToQuestion(currentQuestionIndex + 1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  Next
                  <ArrowRightIcon size={16} className="ml-1" />
                </button>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>;
};