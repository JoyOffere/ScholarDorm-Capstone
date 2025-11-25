import * as React from 'react';
const { useState, useEffect } = React;
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  VideoIcon, PlayIcon, BookOpenIcon, ClipboardListIcon, 
  ClockIcon, TrophyIcon, ArrowRightIcon, CheckCircleIcon, 
  AlertCircleIcon, XCircleIcon, EyeIcon, ChevronRightIcon,
  LanguagesIcon, VolumeXIcon
} from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description: string;
  lesson_id: string;
  course_id: string;
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
  rsl_video_url?: string;
  rsl_description?: string;
  rsl_enabled?: boolean;
  lesson_rsl_video_url?: string;
}

interface Question {
  id: string;
  question_text: string;
  rsl_video_url?: string;
  order_index: number;
}

export const QuizRSLPreparation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState<Set<number>>(new Set());
  const [isVideoWatched, setIsVideoWatched] = useState(false);
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    if (!quizId) {
      navigate('/quizzes');
      return;
    }
    fetchQuizData();
  }, [quizId]);

  useEffect(() => {
    // Check if all required videos have been watched
    const allMainVideosWatched = quiz?.rsl_video_url ? watchedVideos.has(-1) : true;
    const allQuestionVideosWatched = questions.filter(q => q.rsl_video_url).length === 0 || 
      questions.filter(q => q.rsl_video_url).every((_, index) => watchedVideos.has(index));
    
    setCanProceed(allMainVideosWatched && allQuestionVideosWatched);
  }, [watchedVideos, quiz, questions]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      
      // Get quiz data with RSL information
      const { data: quizData, error: quizError } = await supabase
        .from('enhanced_quizzes')
        .select(`
          *,
          courses!course_id(id, title),
          enhanced_lessons!lesson_id(id, title, rsl_video_url)
        `)
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;
      if (!quizData) {
        navigate('/quizzes');
        return;
      }

      // Get questions with RSL videos
      const { data: questionsData, error: questionsError } = await supabase
        .from('enhanced_quiz_questions')
        .select('id, question_text, rsl_video_url, order_index')
        .eq('quiz_id', quizId)
        .not('rsl_video_url', 'is', null)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      const enrichedQuiz: Quiz = {
        ...quizData,
        course_title: quizData.courses?.title || 'Unknown Course',
        lesson_title: quizData.enhanced_lessons?.title || 'Quiz Assessment',
        lesson_rsl_video_url: quizData.enhanced_lessons?.rsl_video_url,
        question_count: 0 // We'll get this separately if needed
      };

      setQuiz(enrichedQuiz);
      setQuestions(questionsData || []);
      
      // If there's no RSL content, redirect directly to quiz
      if (!enrichedQuiz.rsl_video_url && !enrichedQuiz.lesson_rsl_video_url && (!questionsData || questionsData.length === 0)) {
        navigate(`/quiz/${quizId}?rsl_ready=true`);
        return;
      }
      
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      navigate('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoWatched = (videoIndex: number) => {
    setWatchedVideos(prev => new Set([...prev, videoIndex]));
  };

  const handleVideoProgress = (progress: number, videoIndex: number) => {
    // Mark video as watched when 80% complete
    if (progress > 0.8 && !watchedVideos.has(videoIndex)) {
      handleVideoWatched(videoIndex);
    }
  };

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

  const getAllRSLVideos = () => {
    const videos: { title: string; url: string; type: 'quiz' | 'lesson' | 'question'; index: number }[] = [];
    
    // Quiz-level RSL video (highest priority)
    if (quiz?.rsl_enabled && quiz.rsl_video_url) {
      videos.push({
        title: `Quiz Introduction: ${quiz.title}`,
        url: quiz.rsl_video_url,
        type: 'quiz',
        index: -1
      });
    }
    
    // Lesson-level RSL video (fallback)
    else if (quiz?.lesson_rsl_video_url) {
      videos.push({
        title: `Lesson Content: ${quiz.lesson_title}`,
        url: quiz.lesson_rsl_video_url,
        type: 'lesson',
        index: -1
      });
    }

    // Question-level RSL videos
    questions.forEach((question, index) => {
      if (question.rsl_video_url) {
        videos.push({
          title: `Question ${question.order_index + 1} Explanation`,
          url: question.rsl_video_url,
          type: 'question',
          index: index
        });
      }
    });

    return videos;
  };

  const allVideos = getAllRSLVideos();
  const currentVideo = allVideos[currentVideoIndex];

  if (loading) {
    return (
      <DashboardLayout title="Loading Quiz Preparation" role="student">
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing your quiz experience...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return (
      <DashboardLayout title="Quiz Not Found" role="student">
        <div className="py-8 text-center">
          <AlertCircleIcon size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-medium text-gray-800 mb-2">Quiz Not Found</h2>
          <p className="text-gray-600 mb-4">The quiz you're looking for doesn't exist or isn't available.</p>
          <button
            onClick={() => navigate('/quizzes')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Quizzes
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Quiz Preparation" role="student">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <BookOpenIcon size={16} />
            <span>{quiz.course_title}</span>
            <ChevronRightIcon size={14} />
            <span>{quiz.lesson_title}</span>
            <ChevronRightIcon size={14} />
            <span className="text-blue-600 font-medium">RSL Preparation</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{quiz.title}</h1>
          <p className="text-gray-600">{quiz.description}</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium text-gray-800">RSL Video Preparation</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <LanguagesIcon size={16} />
              <span>Rwanda Sign Language</span>
            </div>
          </div>
          <div className="bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 rounded-full h-2 transition-all duration-300"
              style={{ width: `${(watchedVideos.size / allVideos.length) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {watchedVideos.size} of {allVideos.length} videos watched
            {canProceed && <span className="text-green-600 font-medium ml-2">✓ Ready to proceed</span>}
          </p>
        </div>

        {allVideos.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-800">{currentVideo?.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <VideoIcon size={14} />
                      <span>Video {currentVideoIndex + 1} of {allVideos.length}</span>
                    </div>
                    {watchedVideos.has(currentVideo?.index ?? -999) && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircleIcon size={14} />
                        <span>Watched</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="relative bg-gray-100" style={{ aspectRatio: '16 / 9' }}>
                  {currentVideo ? (
                    <iframe
                      className="w-full h-full"
                      src={convertToEmbedUrl(currentVideo.url)}
                      title={currentVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={() => {
                        // Simple video completion tracking - mark as watched after iframe loads and user interacts
                        setTimeout(() => {
                          if (!watchedVideos.has(currentVideo.index)) {
                            handleVideoWatched(currentVideo.index);
                          }
                        }, 30000); // Auto-mark as watched after 30 seconds
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <VolumeXIcon size={48} className="mx-auto mb-2" />
                        <p>No video selected</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Manual Mark as Watched Button */}
                {currentVideo && !watchedVideos.has(currentVideo.index) && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => handleVideoWatched(currentVideo.index)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon size={16} />
                      Mark as Watched
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Video List & Quiz Info */}
            <div className="space-y-6">
              {/* Video List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-800">RSL Videos</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {allVideos.map((video, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentVideoIndex(index)}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                        currentVideoIndex === index ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800 line-clamp-2">
                            {video.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 capitalize">
                            {video.type === 'quiz' ? 'Quiz Introduction' : 
                             video.type === 'lesson' ? 'Lesson Content' : 
                             'Question Explanation'}
                          </div>
                        </div>
                        <div className="ml-2 flex items-center">
                          {watchedVideos.has(video.index) ? (
                            <CheckCircleIcon size={16} className="text-green-600" />
                          ) : (
                            <PlayIcon size={16} className="text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quiz Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-800">Quiz Information</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{quiz.question_count || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Time Limit:</span>
                    <span className="font-medium">
                      {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} minutes` : 'No limit'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Passing Score:</span>
                    <span className="font-medium">{quiz.passing_score}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Max Attempts:</span>
                    <span className="font-medium">
                      {quiz.max_attempts || 'Unlimited'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <VideoIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">No RSL Videos Available</h3>
            <p className="text-gray-600 mb-6">
              This quiz doesn't have any RSL preparation videos. You can proceed directly to the quiz.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => navigate('/quizzes')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Quizzes
          </button>
          
          <div className="flex gap-3">
            {allVideos.length > 0 && (
              <button
                onClick={() => navigate(`/quiz/${quizId}?rsl_ready=true`)}
                className="px-6 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
              >
                Skip RSL Videos
              </button>
            )}
            
            <button
              onClick={() => navigate(`/quiz/${quizId}?rsl_ready=true`)}
              disabled={!canProceed && allVideos.length > 0}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                canProceed || allVideos.length === 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {allVideos.length === 0 ? 'Start Quiz' : canProceed ? 'Start Quiz' : 'Complete Videos First'}
              <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};