import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { AwardIcon, TrophyIcon, ClockIcon, ActivityIcon, CalendarIcon, CheckCircleIcon, BookOpenIcon } from 'lucide-react';
interface ProgressTrackerProps {
  userId: string;
}
interface ProgressStats {
  streak: number;
  longestStreak: number;
  coursesCompleted: number;
  coursesInProgress: number;
  totalQuizzes: number;
  quizzesPassed: number;
  totalPoints: number;
  lastActivity: string | null;
}
export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  userId
}) => {
  const [stats, setStats] = useState<ProgressStats>({
    streak: 0,
    longestStreak: 0,
    coursesCompleted: 0,
    coursesInProgress: 0,
    totalQuizzes: 0,
    quizzesPassed: 0,
    totalPoints: 0,
    lastActivity: null
  });
  const [loading, setLoading] = useState(true);
  const [recentBadges, setRecentBadges] = useState<any[]>([]);
  useEffect(() => {
    if (userId) {
      fetchProgressStats();
      fetchRecentBadges();
    }
  }, [userId]);
  const fetchProgressStats = async () => {
    try {
      setLoading(true);
      // Get user's streak information
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('streak_count, longest_streak').eq('id', userId).single();
      if (userError) throw userError;
      // Get courses information
      const {
        data: coursesData,
        error: coursesError
      } = await supabase.from('user_courses').select('completed').eq('user_id', userId);
      if (coursesError) throw coursesError;
      const completedCourses = coursesData?.filter(course => course.completed).length || 0;
      const inProgressCourses = (coursesData?.length || 0) - completedCourses;
      // Get quiz information
      const {
        data: quizData,
        error: quizError
      } = await supabase.from('enhanced_quiz_attempts').select('is_passed, score').eq('user_id', userId);
      if (quizError) throw quizError;
      const passedQuizzes = quizData?.filter(quiz => quiz.is_passed).length || 0;
      const totalPoints = quizData?.reduce((sum, quiz) => sum + quiz.score, 0) || 0;
      // Get last activity
      const {
        data: lastActivityData,
        error: activityError
      } = await supabase.from('activities').select('created_at').eq('user_id', userId).order('created_at', {
        ascending: false
      }).limit(1).single();
      if (activityError && activityError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" error
        throw activityError;
      }
      setStats({
        streak: userData?.streak_count || 0,
        longestStreak: userData?.longest_streak || 0,
        coursesCompleted: completedCourses,
        coursesInProgress: inProgressCourses,
        totalQuizzes: quizData?.length || 0,
        quizzesPassed: passedQuizzes,
        totalPoints: totalPoints,
        lastActivity: lastActivityData?.created_at || null
      });
    } catch (error) {
      console.error('Error fetching progress stats:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchRecentBadges = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('user_badges').select(`
          earned_at,
          badge:badges(id, name, description, image_url)
        `).eq('user_id', userId).order('earned_at', {
        ascending: false
      }).limit(3);
      if (error) throw error;
      setRecentBadges(data || []);
    } catch (error) {
      console.error('Error fetching recent badges:', error);
    }
  };
  const formatLastActive = (dateString: string | null): string => {
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
  if (loading) {
    return <div className="animate-pulse bg-white rounded-lg shadow p-4">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-24 bg-gray-200 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>;
  }
  return <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Your Learning Progress</h3>
      </div>
      {/* Streak Section */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <ActivityIcon size={20} />
          </div>
          <div className="ml-3">
            <div className="text-sm text-gray-500">Current Streak</div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">
                {stats.streak}
              </span>
              <span className="ml-1 text-sm text-gray-500">days</span>
            </div>
          </div>
          <div className="ml-auto">
            <div className="text-sm text-gray-500">Longest</div>
            <div className="text-lg font-semibold text-gray-700">
              {stats.longestStreak} days
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress to next badge</span>
            <span>
              {stats.streak < 3 ? `${stats.streak}/3 days` : stats.streak < 7 ? `${stats.streak}/7 days` : stats.streak < 14 ? `${stats.streak}/14 days` : stats.streak < 30 ? `${stats.streak}/30 days` : 'Max badge achieved!'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{
            width: `${stats.streak < 3 ? stats.streak / 3 * 100 : stats.streak < 7 ? stats.streak / 7 * 100 : stats.streak < 14 ? stats.streak / 14 * 100 : stats.streak < 30 ? stats.streak / 30 * 100 : 100}%`
          }}></div>
          </div>
        </div>
      </div>
      {/* Stats Section */}
      <div className="p-5 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center">
              <div className="p-1.5 bg-green-100 rounded text-green-600">
                <BookOpenIcon size={16} />
              </div>
              <div className="ml-2 text-xs text-gray-500">
                Courses Completed
              </div>
            </div>
            <div className="mt-1 text-xl font-semibold text-gray-800">
              {stats.coursesCompleted}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center">
              <div className="p-1.5 bg-yellow-100 rounded text-yellow-600">
                <BookOpenIcon size={16} />
              </div>
              <div className="ml-2 text-xs text-gray-500">In Progress</div>
            </div>
            <div className="mt-1 text-xl font-semibold text-gray-800">
              {stats.coursesInProgress}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center">
              <div className="p-1.5 bg-purple-100 rounded text-purple-600">
                <CheckCircleIcon size={16} />
              </div>
              <div className="ml-2 text-xs text-gray-500">Quizzes Passed</div>
            </div>
            <div className="mt-1 text-xl font-semibold text-gray-800">
              {stats.quizzesPassed}/{stats.totalQuizzes}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center">
              <div className="p-1.5 bg-blue-100 rounded text-blue-600">
                <TrophyIcon size={16} />
              </div>
              <div className="ml-2 text-xs text-gray-500">Total Points</div>
            </div>
            <div className="mt-1 text-xl font-semibold text-gray-800">
              {stats.totalPoints}
            </div>
          </div>
        </div>
      </div>
      {/* Recent Badges */}
      {recentBadges.length > 0 && <div className="p-5">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Recent Badges
          </h4>
          <div className="space-y-3">
            {recentBadges.map((item, index) => <div key={index} className="flex items-center">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                  {item.badge.image_url ? <img src={item.badge.image_url} alt={item.badge.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center bg-yellow-100 text-yellow-600">
                      <AwardIcon size={18} />
                    </div>}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.badge.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {item.badge.description}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {formatLastActive(item.earned_at)}
                </div>
              </div>)}
          </div>
        </div>}
      {/* Last Activity */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <div className="flex items-center text-xs text-gray-500">
          <CalendarIcon size={14} className="mr-1" />
          <span>Last active: {formatLastActive(stats.lastActivity)}</span>
        </div>
      </div>
    </div>;
};