import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { ProgressTracker } from './ProgressTracker';
import { RSLWidget } from '../../common/RSLWidget';
import { RSLModal } from '../../auth/RSLModal';
import { 
  getAllStudentDashboardDataUltraFast,
  StudentDashboardStats,
  StudentCourse,
  StudentAnnouncement,
  StudentQuiz
} from '../../../lib/supabase-utils';
import { useAuth } from '../../../contexts/AuthContext';
import { BookOpenIcon, GraduationCapIcon, ClipboardListIcon, GamepadIcon, TrophyIcon, ArrowRightIcon, CheckCircleIcon, StarIcon, AlertCircleIcon, BellIcon, AwardIcon, ActivityIcon, TrendingUpIcon, BarChart3Icon, FlameIcon, VideoIcon, RefreshCwIcon } from 'lucide-react';
export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentCourses, setRecentCourses] = useState<StudentCourse[]>([]);
  const [announcements, setAnnouncements] = useState<StudentAnnouncement[]>([]);
  const [quizzes, setQuizzes] = useState<StudentQuiz[]>([]);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showRSLModal, setShowRSLModal] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<StudentDashboardStats>({
    totalCourses: 0,
    completedCourses: 0,
    currentStreak: 0,
    totalBadges: 0,
    weeklyProgress: 0,
    studyTimeThisWeek: 0,
    quizzesCompleted: 0,
    averageScore: 0
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    // Don't run effect until user is available from auth context
    if (!user?.id) {
      return;
    }
    
    mountedRef.current = true;
    
    const fetchUserData = async () => {
      // Create abort controller for this fetch
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        if (!mountedRef.current) return;
        
        setLoading(true);
        setError(null);
        // Import session cache for instant data loading
        const { sessionCache: persistentCache } = await import('../../../lib/session-cache');
        
        // Try to load cached dashboard data first for instant display
        const cachedDashboardData = persistentCache.getDashboardData(user.id);
        if (cachedDashboardData && mountedRef.current) {
          console.log('Loading dashboard from cache for instant display');
          if (cachedDashboardData.stats) setDashboardStats(cachedDashboardData.stats);
          if (cachedDashboardData.recentCourses) setRecentCourses(cachedDashboardData.recentCourses);
          if (cachedDashboardData.announcements) setAnnouncements(cachedDashboardData.announcements);
          if (cachedDashboardData.quizzes) setQuizzes(cachedDashboardData.quizzes);
          setLoading(false); // Show cached data immediately
        }

        // Skip database connection check for ultra-fast loading

        // Use user from auth context - no need for additional auth call
        if (!user?.id) {
          throw new Error('User not authenticated');
        }

        if (signal.aborted || !mountedRef.current) return;

        setUserId(user.id);

        // Check if user has logged in today
        const today = new Date().toISOString().split('T')[0];
        const { data: todayLogin, error: loginError } = await supabase
          .from('activities')
          .select('id')
          .eq('user_id', user.id)
          .eq('activity_type', 'login')
          .gte('created_at', today)
          .limit(1)
          .abortSignal(signal);

        if (loginError && !signal.aborted) {
          console.error('Login check error:', loginError);
        }

        // If no login today, log one and show streak modal
        if (!todayLogin || todayLogin.length === 0) {
          try {
            await supabase.from('activities').insert({
              user_id: user.id,
              activity_type: 'login',
              metadata: { source: 'dashboard' }
            });
            if (mountedRef.current) {
              setShowStreakModal(true);
            }
          } catch (activityError) {
            console.error('Activity logging error:', activityError);
          }
        }

        // ULTRA-FAST: Get all dashboard data instantly
        const { stats, courses, announcements, quizzes } = await getAllStudentDashboardDataUltraFast(user.id);
        
        if (!mountedRef.current) return;
        
        // Update all state instantly
        setDashboardStats(stats);
        setRecentCourses(courses);
        setAnnouncements(announcements);
        setQuizzes(quizzes);
        
        // Cache the dashboard data for instant future access
        const dashboardDataToCache = {
          stats,
          recentCourses: courses,
          announcements,
          quizzes,
        };
        persistentCache.saveDashboardData(user.id, dashboardDataToCache);
        
        console.log('⚡ Student Dashboard: Data loaded and cached for instant future access!');

      } catch (error: any) {
        if (!signal.aborted && mountedRef.current) {
          console.error('Error fetching user data:', error);
          setError(error.message || 'Failed to load dashboard data');
          
          // No cache clearing needed with ultra-fast approach
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        // ensure fallback cleared
        try { clearTimeout((null as unknown) as number); } catch {};
      }
    };

    fetchUserData();

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user]);

  // Retry function for failed loads
  const retryLoad = () => {
    setError(null);
    window.location.reload(); // Full refresh to reset state
  };

  // Utility functions for date formatting
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const fetchDashboardStats = async (userId: string, signal?: AbortSignal) => {
    try {
      // Get user profile with streak info
      const profileQuery = supabase
        .from('users')
        .select('streak_count')
        .eq('id', userId);

      const { data: userProfile, error: profileError } = signal
        ? await profileQuery.abortSignal(signal).single()
        : await profileQuery.single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // User not found, set defaults
          console.warn('User profile not found, using defaults for stats');
        } else {
          throw new Error(`Failed to fetch user profile: ${profileError.message || 'Unknown error'}`);
        }
      }

      // Get total courses enrolled
      const coursesQuery = supabase
        .from('user_courses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: totalCourses, error: coursesError } = signal
        ? await coursesQuery.abortSignal(signal)
        : await coursesQuery;

      if (coursesError) throw new Error(`Failed to fetch total courses: ${coursesError.message || 'Unknown error'}`);

      // Get completed courses
      const completedQuery = supabase
        .from('user_courses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true);
      
      const { count: completedCourses, error: completedError } = signal
        ? await completedQuery.abortSignal(signal)
        : await completedQuery;

      if (completedError) throw new Error(`Failed to fetch completed courses: ${completedError.message || 'Unknown error'}`);

      // Get badges earned
      const badgesQuery = supabase
        .from('user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: totalBadges, error: badgesError } = signal
        ? await badgesQuery.abortSignal(signal)
        : await badgesQuery;

      if (badgesError) throw new Error(`Failed to fetch badges: ${badgesError.message || 'Unknown error'}`);

      // Get quiz attempts and scores
      const quizQuery = supabase
        .from('enhanced_quiz_attempts')
        .select('score, is_passed')
        .eq('user_id', userId);

      const { data: quizAttempts, error: quizError } = signal
        ? await quizQuery.abortSignal(signal)
        : await quizQuery;

      if (quizError) throw new Error(`Failed to fetch quiz attempts: ${quizError.message || 'Unknown error'}`);

      // Calculate quiz stats
      const quizzesCompleted = quizAttempts?.length || 0;
      const averageScore = quizAttempts?.length > 0
        ? Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length)
        : 0;

      // Get weekly progress (activities in last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const activitiesQuery = supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', weekAgo.toISOString());

      const { count: weeklyActivities, error: activitiesError } = signal
        ? await activitiesQuery.abortSignal(signal)
        : await activitiesQuery;

      if (activitiesError) throw new Error(`Failed to fetch weekly activities: ${activitiesError.message || 'Unknown error'}`);

      if (mountedRef.current) {
        setDashboardStats({
          totalCourses: totalCourses || 0,
          completedCourses: completedCourses || 0,
          currentStreak: userProfile?.streak_count || 0,
          totalBadges: totalBadges || 0,
          weeklyProgress: weeklyActivities || 0,
          studyTimeThisWeek: Math.floor(Math.random() * 480) + 60, // Placeholder - would need actual time tracking
          quizzesCompleted,
          averageScore
        });
      }
    } catch (error: any) {
      if (!signal?.aborted) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
      }
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
  if (loading) {
    return (
      <DashboardLayout title="Dashboard" role="student">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard" role="student">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircleIcon size={48} className="text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
          <p className="text-gray-600 text-center mb-4 max-w-md">
            {error}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={retryLoad}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCwIcon size={16} className="mr-2" />
              Try Again
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign Out & Return Home
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return <DashboardLayout title="Dashboard" role="student">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Welcome Section with Stats */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Welcome back, {(user as any)?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'}!</h1>
                <p className="opacity-90">
                  Continue your learning journey and keep your streak going.
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <FlameIcon size={20} className="text-orange-300" />
                  <span className="text-xl font-bold">{dashboardStats.currentStreak}</span>
                </div>
                <p className="text-sm opacity-75">day streak</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/courses" className="inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors">
                <BookOpenIcon size={18} className="mr-2" />
                Browse Courses
              </Link>
              <Link to="/learning" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">
                <GraduationCapIcon size={18} className="mr-2" />
                Continue Learning
              </Link>
              <button 
                onClick={() => setShowRSLModal(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors"
              >
                <VideoIcon size={18} className="mr-2" />
                RSL Learning
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpenIcon size={20} className="text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalCourses}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon size={20} className="text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.completedCourses}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrophyIcon size={20} className="text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Badges</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalBadges}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3Icon size={20} className="text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Avg. Score</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.averageScore}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Progress Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">This Week's Progress</h3>
              <TrendingUpIcon size={20} className="text-green-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{dashboardStats.weeklyProgress}</div>
                <p className="text-sm text-gray-600">Activities</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{dashboardStats.studyTimeThisWeek}min</div>
                <p className="text-sm text-gray-600">Study Time</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{dashboardStats.quizzesCompleted}</div>
                <p className="text-sm text-gray-600">Quizzes</p>
              </div>
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
                        {item.image_url ? <img src={item.image_url} alt={item.title} className="h-12 w-12 object-cover" /> : <div className="h-12 w-12 flex items-center justify-center bg-blue-100 text-blue-600">
                            <BookOpenIcon size={24} />
                          </div>}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatLastAccessed(item.last_accessed)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{
                        width: `${item.progress}%`
                      }}></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-500">
                            {item.progress}%
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between">
                          <span className="text-xs text-gray-500">
                            Course • Active
                          </span>
                          <Link to="/learning" className="text-xs text-blue-600 hover:text-blue-800">
                            {item.progress > 0 ? 'Continue' : 'Start'}
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
                        <div className="h-10 w-10 flex items-center justify-center bg-purple-100 text-purple-600">
                            <AlertCircleIcon size={20} />
                          </div>
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {announcement.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(announcement.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {announcement.content}
                        </p>
                        <div className="mt-1 text-xs text-gray-500">
                          By Administrator
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
                          {quiz.course_title} • {quiz.questions_count} questions
                        </p>
                      </div>
                      {quiz.completed ? <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center">
                            <CheckCircleIcon size={12} className="mr-1" />
                            Score: {quiz.score}%
                          </span> : <Link to={`/quiz/${quiz.id}`} className="px-3 py-1 text-xs font-medium rounded-lg bg-blue-600 text-white">
                          Start Quiz
                        </Link>}
                    </div>
                  </div>)}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* RSL Widget */}
          {userId && (
            <RSLWidget 
              userId={userId} 
              variant="sidebar" 
              onOpenFullModal={() => setShowRSLModal(true)}
            />
          )}

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
              {/* <Link to="/games" className="flex flex-col items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="p-2 bg-purple-100 rounded-full text-purple-600 mb-2">
                  <GamepadIcon size={18} />
                </div>
                <span className="text-xs font-medium text-purple-800">
                  Games
                </span>
              </Link> */}
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

      {/* RSL Modal */}
      <RSLModal 
        isOpen={showRSLModal} 
        onClose={() => setShowRSLModal(false)} 
        userId={userId || undefined}
      />
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