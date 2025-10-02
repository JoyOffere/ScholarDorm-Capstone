import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { ProgressTracker } from './ProgressTracker';
import { BookOpenIcon, GraduationCapIcon, ClipboardListIcon, GamepadIcon, TrophyIcon, ArrowRightIcon, ClockIcon, CheckCircleIcon, StarIcon, AlertCircleIcon, BellIcon, AwardIcon, ActivityIcon } from 'lucide-react';
export const StudentDashboard: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [showStreakModal, setShowStreakModal] = useState(false);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Get current user
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        // Check if user has logged in today
        const today = new Date().toISOString().split('T')[0];
        const {
          data: todayLogin,
          error: loginError
        } = await supabase.from('activities').select('id').eq('user_id', user.id).eq('activity_type', 'login').gte('created_at', today).limit(1);
        if (loginError) throw loginError;
        // If no login today, log one and show streak modal
        if (!todayLogin || todayLogin.length === 0) {
          // Create login activity
          await supabase.from('activities').insert({
            user_id: user.id,
            activity_type: 'login',
            metadata: {
              source: 'dashboard'
            }
          });
          // Show streak modal
          setShowStreakModal(true);
        }
        // Fetch recent courses
        await fetchRecentCourses(user.id);
        // Fetch announcements
        await fetchAnnouncements();
        // Fetch upcoming quizzes
        await fetchUpcomingQuizzes(user.id);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);
  const fetchRecentCourses = async (userId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('user_courses').select(`
          *,
          course:courses(*)
        `).eq('user_id', userId).order('last_accessed', {
        ascending: false
      }).limit(3);
      if (error) throw error;
      setRecentCourses(data || []);
    } catch (error) {
      console.error('Error fetching recent courses:', error);
    }
  };
  const fetchAnnouncements = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('posts').select(`
          *,
          author:users!author_id(full_name, avatar_url)
        `).eq('post_type', 'announcement').eq('is_published', true).or('target_audience.eq.all,target_audience.eq.students').order('publish_date', {
        ascending: false
      }).limit(3);
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };
  const fetchUpcomingQuizzes = async (userId: string) => {
    try {
      // First get all courses the user is enrolled in
      const {
        data: enrolledCourses,
        error: enrolledError
      } = await supabase.from('user_courses').select('course_id').eq('user_id', userId);
      if (enrolledError) throw enrolledError;
      if (!enrolledCourses || enrolledCourses.length === 0) {
        setQuizzes([]);
        return;
      }
      const courseIds = enrolledCourses.map(item => item.course_id);
      // Get all lessons in these courses
      const {
        data: lessons,
        error: lessonsError
      } = await supabase.from('lessons').select('id, course_id, title').in('course_id', courseIds);
      if (lessonsError) throw lessonsError;
      if (!lessons || lessons.length === 0) {
        setQuizzes([]);
        return;
      }
      const lessonIds = lessons.map(lesson => lesson.id);
      // Get quizzes for these lessons
      const {
        data: quizzesData,
        error: quizzesError
      } = await supabase.from('quizzes').select('*, lesson:lessons(title, course_id, course:courses(title))').in('lesson_id', lessonIds).eq('is_published', true).limit(3);
      if (quizzesError) throw quizzesError;
      // Get user's quiz attempts
      const {
        data: attempts,
        error: attemptsError
      } = await supabase.from('quiz_attempts').select('quiz_id, passed').eq('user_id', userId);
      if (attemptsError) throw attemptsError;
      // Process quizzes with attempt data
      const quizzesWithAttempts = quizzesData?.map(quiz => {
        const quizAttempts = attempts?.filter(a => a.quiz_id === quiz.id) || [];
        const passed = quizAttempts.some(a => a.passed);
        return {
          ...quiz,
          attempted: quizAttempts.length > 0,
          passed
        };
      }) || [];
      setQuizzes(quizzesWithAttempts);
    } catch (error) {
      console.error('Error fetching upcoming quizzes:', error);
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
  const formatPublishDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  return <DashboardLayout title="Dashboard" role="student">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg shadow-md p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
            <p className="opacity-90 mb-4">
              Continue your learning journey and keep your streak going.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link to="/courses" className="inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors">
                <BookOpenIcon size={18} className="mr-2" />
                Browse Courses
              </Link>
              <Link to="/learning" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">
                <GraduationCapIcon size={18} className="mr-2" />
                Continue Learning
              </Link>
            </div>
          </div>

          {/* Recent Courses */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-medium text-gray-900">Recent Courses</h2>
              <Link to="/learning" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                View All
                <ArrowRightIcon size={16} className="ml-1" />
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? <div className="p-5 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div> : recentCourses.length === 0 ? <div className="p-5 text-center">
                  <BookOpenIcon size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">
                    You haven't enrolled in any courses yet.
                  </p>
                  <Link to="/courses" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800">
                    Browse available courses
                  </Link>
                </div> : recentCourses.map(item => <div key={item.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="h-12 w-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.course.image_url ? <img src={item.course.image_url} alt={item.course.title} className="h-12 w-12 object-cover" /> : <div className="h-12 w-12 flex items-center justify-center bg-blue-100 text-blue-600">
                            <BookOpenIcon size={24} />
                          </div>}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {item.course.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatLastAccessed(item.last_accessed)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{
                        width: `${item.progress_percentage}%`
                      }}></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-500">
                            {item.progress_percentage}%
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between">
                          <span className="text-xs text-gray-500">
                            {item.course.subject} •{' '}
                            {item.course.difficulty_level.charAt(0).toUpperCase() + item.course.difficulty_level.slice(1)}
                          </span>
                          <Link to="/learning" className="text-xs text-blue-600 hover:text-blue-800">
                            {item.progress_percentage > 0 ? 'Continue' : 'Start'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>)}
            </div>
            {!loading && recentCourses.length > 0 && <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                <Link to="/courses" className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center">
                  <BookOpenIcon size={16} className="mr-2" />
                  Find More Courses
                </Link>
              </div>}
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h2 className="font-medium text-gray-900">Announcements</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? <div className="p-5 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div> : announcements.length === 0 ? <div className="p-5 text-center">
                  <BellIcon size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">
                    No announcements at this time.
                  </p>
                </div> : announcements.map(announcement => <div key={announcement.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        {announcement.author?.avatar_url ? <img src={announcement.author.avatar_url} alt={announcement.author.full_name} className="h-10 w-10 object-cover" /> : <div className="h-10 w-10 flex items-center justify-center bg-purple-100 text-purple-600">
                            <AlertCircleIcon size={20} />
                          </div>}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {announcement.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatPublishDate(announcement.publish_date)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {announcement.content}
                        </p>
                        <div className="mt-1 text-xs text-gray-500">
                          By {announcement.author?.full_name || 'Administrator'}
                        </div>
                      </div>
                    </div>
                  </div>)}
            </div>
          </div>

          {/* Upcoming Quizzes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-medium text-gray-900">Quizzes</h2>
              <Link to="/quizzes" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                View All
                <ArrowRightIcon size={16} className="ml-1" />
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? <div className="p-5 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div> : quizzes.length === 0 ? <div className="p-5 text-center">
                  <ClipboardListIcon size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">
                    No quizzes available for your courses.
                  </p>
                  <Link to="/courses" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800">
                    Enroll in more courses
                  </Link>
                </div> : quizzes.map(quiz => <div key={quiz.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <ClipboardListIcon size={20} />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {quiz.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {quiz.lesson?.course?.title} • {quiz.lesson?.title}
                        </p>
                      </div>
                      {quiz.attempted ? quiz.passed ? <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center">
                            <CheckCircleIcon size={12} className="mr-1" />
                            Passed
                          </span> : <Link to={`/quiz/${quiz.id}`} className="px-3 py-1 text-xs font-medium rounded-lg bg-yellow-100 text-yellow-800">
                            Try Again
                          </Link> : <Link to={`/quiz/${quiz.id}`} className="px-3 py-1 text-xs font-medium rounded-lg bg-blue-600 text-white">
                          Start Quiz
                        </Link>}
                    </div>
                  </div>)}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Tracker */}
          {userId && <ProgressTracker userId={userId} />}

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Quick Links</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <Link to="/quizzes" className="flex flex-col items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600 mb-2">
                  <ClipboardListIcon size={18} />
                </div>
                <span className="text-xs font-medium text-blue-800">
                  Quizzes
                </span>
              </Link>
              <Link to="/games" className="flex flex-col items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="p-2 bg-purple-100 rounded-full text-purple-600 mb-2">
                  <GamepadIcon size={18} />
                </div>
                <span className="text-xs font-medium text-purple-800">
                  Games
                </span>
              </Link>
              <Link to="/achievements" className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                <div className="p-2 bg-yellow-100 rounded-full text-yellow-600 mb-2">
                  <AwardIcon size={18} />
                </div>
                <span className="text-xs font-medium text-yellow-800">
                  Achievements
                </span>
              </Link>
              <Link to="/leaderboard" className="flex flex-col items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <div className="p-2 bg-green-100 rounded-full text-green-600 mb-2">
                  <TrophyIcon size={18} />
                </div>
                <span className="text-xs font-medium text-green-800">
                  Leaderboard
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Modal */}
      {showStreakModal && <div className="fixed inset-0 z-50 overflow-y-auto">
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
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ActivityIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Daily Login Streak
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        You've successfully logged in today and maintained your
                        learning streak!
                      </p>
                      <div className="mt-4 flex items-center justify-center">
                        <div className="relative">
                          <div className="h-24 w-24 rounded-full flex items-center justify-center bg-blue-100 text-blue-800">
                            <span className="text-3xl font-bold">
                              {userId && <StreakCounter userId={userId} />}
                            </span>
                          </div>
                          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full h-8 w-8 flex items-center justify-center text-white">
                            <StarIcon size={18} className="fill-white" />
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-gray-600 text-center">
                        Keep learning daily to earn streak badges!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setShowStreakModal(false)}>
                  Continue
                </button>
                <Link to="/achievements" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setShowStreakModal(false)}>
                  View Achievements
                </Link>
              </div>
            </div>
          </div>
        </div>}
    </DashboardLayout>;
};
// Helper component to show streak count
const StreakCounter: React.FC<{
  userId: string;
}> = ({
  userId
}) => {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const {
          data,
          error
        } = await supabase.from('users').select('streak_count').eq('id', userId).single();
        if (error) throw error;
        setStreak(data?.streak_count || 0);
      } catch (error) {
        console.error('Error fetching streak:', error);
      }
    };
    fetchStreak();
  }, [userId]);
  return <>{streak}</>;
};