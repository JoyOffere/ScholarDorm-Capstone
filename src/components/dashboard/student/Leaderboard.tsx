import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { TrophyIcon, MedalIcon, AwardIcon, UserIcon, FilterIcon, SearchIcon } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_score: number;
  quizzes_completed: number;
  highest_score: number;
  rank: number;
  is_current_user: boolean;
  average_score?: number;
  streak_count?: number;
  courses_participated?: number;
}

export const Leaderboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeframe, setTimeframe] = useState<'all_time' | 'month' | 'week'>('all_time');
  const [filter, setFilter] = useState<'overall' | 'course' | 'quiz'>('overall');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [courses, setCourses] = useState<{
    id: string;
    title: string;
  }[]>([]);
  const [quizzes, setQuizzes] = useState<{
    id: string;
    title: string;
  }[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title', { ascending: true });
      if (!error && data) {
        setCourses(data);
      }
    };

    const fetchQuizzes = async () => {
      const { data, error } = await supabase
        .from('enhanced_quizzes')
        .select('id, title')
        .eq('is_published', true)
        .order('title', { ascending: true });
      if (!error && data) {
        setQuizzes(data);
      }
    };

    fetchCourses();
    fetchQuizzes();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, filter, courseId, quizId, currentUserId]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      let data: any[] = [];

      if (filter === 'overall') {
        // GLOBAL LEADERBOARD - Get ALL users who have taken ANY quiz
        console.log('Fetching GLOBAL leaderboard for all users...');

        let query = supabase
          .from('enhanced_quiz_attempts')
          .select(`
            user_id,
            score,
            completed_at,
            quiz_id,
            is_passed,
            users!inner(
              id,
              email,
              full_name,
              avatar_url,
              streak_count,
              role
            ),
            enhanced_quizzes!inner(
              id,
              title,
              course_id,
              courses!inner(id, title)
            )
          `)
          .not('completed_at', 'is', null)
          // Include ALL attempts to show comprehensive global stats
          .order('completed_at', { ascending: false })
          .limit(1000); // Get much more data for comprehensive global view

        // Apply time filter
        if (timeframe !== 'all_time') {
          const daysAgo = timeframe === 'week' ? 7 : 30;
          const dateThreshold = new Date();
          dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
          query = query.gte('completed_at', dateThreshold.toISOString());
        }

        const { data: globalData, error } = await query;
        if (error) throw error;

        data = globalData || [];
        console.log(`Found ${data.length} quiz attempts for global leaderboard`);

      } else if (filter === 'course') {
        // COURSE LEADERBOARD - Aggregate across all quizzes in the course
        let query = supabase
          .from('enhanced_quiz_attempts')
          .select(`
            user_id,
            score,
            completed_at,
            quiz_id,
            is_passed,
            users!inner(
              id,
              email,
              full_name,
              avatar_url,
              streak_count
            ),
            enhanced_quizzes!inner(
              id,
              title,
              course_id,
              courses!inner(id, title)
            )
          `)
          .not('completed_at', 'is', null)
          .order('score', { ascending: false })
          .limit(500);

        // Apply time filter
        if (timeframe !== 'all_time') {
          const daysAgo = timeframe === 'week' ? 7 : 30;
          const dateThreshold = new Date();
          dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
          query = query.gte('completed_at', dateThreshold.toISOString());
        }

        // Apply course filter
        if (courseId) {
          query = query.eq('enhanced_quizzes.course_id', courseId);
        }

        const { data: courseData, error } = await query;
        if (error) throw error;

        data = courseData || [];

      } else if (filter === 'quiz') {
        // QUIZ LEADERBOARD - Show participants and their best scores for specific quiz
        let query = supabase
          .from('enhanced_quiz_attempts')
          .select(`
            user_id,
            score,
            completed_at,
            quiz_id,
            is_passed,
            users!inner(
              id,
              email,
              full_name,
              avatar_url,
              streak_count
            ),
            enhanced_quizzes!inner(
              id,
              title,
              course_id,
              courses!inner(id, title)
            )
          `)
          .not('completed_at', 'is', null)
          .order('score', { ascending: false })
          .limit(500);

        // Apply time filter
        if (timeframe !== 'all_time') {
          const daysAgo = timeframe === 'week' ? 7 : 30;
          const dateThreshold = new Date();
          dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
          query = query.gte('completed_at', dateThreshold.toISOString());
        }

        // Apply quiz filter
        if (quizId) {
          query = query.eq('quiz_id', quizId);
        }

        const { data: quizData, error } = await query;
        if (error) throw error;

        data = quizData || [];
      }

      // Process data to create comprehensive leaderboard
      const userStats = new Map<string, {
        user_id: string;
        full_name: string;
        avatar_url: string | null;
        email: string;
        streak_count: number;
        scores: number[];
        quizzes_completed: number;
        total_score: number;
        highest_score: number;
        average_score: number;
        courses_participated: Set<string>;
        attempts_count: number; // For quiz-specific: number of attempts on this quiz
      }>();

      data.forEach((attempt: any) => {
        const userId = attempt.user_id;
        const user = attempt.users;
        const existing = userStats.get(userId);

        if (existing) {
          existing.scores.push(attempt.score);
          if (filter === 'quiz') {
            // For quiz-specific, count attempts on this quiz
            existing.attempts_count += 1;
            existing.highest_score = Math.max(existing.highest_score, attempt.score);
          } else {
            // For overall/course, aggregate across quizzes
            existing.quizzes_completed += 1;
            existing.total_score += attempt.score;
            existing.highest_score = Math.max(existing.highest_score, attempt.score);
            existing.courses_participated.add(attempt.enhanced_quizzes.course_id);
          }
        } else {
          userStats.set(userId, {
            user_id: userId,
            full_name: user?.full_name || user?.email?.split('@')[0] || 'Anonymous User',
            avatar_url: user?.avatar_url || null,
            email: user?.email || '',
            streak_count: user?.streak_count || 0,
            scores: [attempt.score],
            quizzes_completed: filter === 'quiz' ? 0 : 1, // For quiz-specific, we'll count attempts separately
            total_score: filter === 'quiz' ? 0 : attempt.score, // For quiz-specific, total_score will be highest_score
            highest_score: attempt.score,
            average_score: attempt.score,
            courses_participated: new Set([attempt.enhanced_quizzes.course_id]),
            attempts_count: 1 // Start with 1 attempt
          });
        }
      });

      // Calculate final stats and create leaderboard
      const leaderboardData = Array.from(userStats.values())
        .map(user => {
          if (filter === 'quiz') {
            // For quiz-specific leaderboard
            return {
              ...user,
              quizzes_completed: user.attempts_count, // Show attempts count
              total_score: user.highest_score, // Total points = highest score
              average_score: Math.round(user.scores.reduce((a, b) => a + b, 0) / user.scores.length), // Average across attempts
              courses_participated: 1 // Always 1 for quiz-specific
            };
          } else {
            // For overall/course leaderboards
            return {
              ...user,
              average_score: Math.round(user.total_score / user.quizzes_completed),
              courses_participated: user.courses_participated.size,
            };
          }
        })
        // Sort by appropriate criteria
        .sort((a, b) => {
          if (filter === 'quiz') {
            // For quiz-specific: Primary sort by highest score, secondary by attempts
            if (b.highest_score !== a.highest_score) {
              return b.highest_score - a.highest_score;
            }
            return b.attempts_count - a.attempts_count; // More attempts = more engaged
          } else {
            // For overall/course: Original sorting logic
            if (b.total_score !== a.total_score) {
              return b.total_score - a.total_score;
            }
            if (b.quizzes_completed !== a.quizzes_completed) {
              return b.quizzes_completed - a.quizzes_completed;
            }
            if (b.average_score !== a.average_score) {
              return b.average_score - a.average_score;
            }
            return b.highest_score - a.highest_score;
          }
        })
        .slice(0, filter === 'quiz' ? undefined : 100) // Show all users for quiz filter, top 100 for others
        .map((entry, index) => ({
          user_id: entry.user_id,
          full_name: entry.full_name,
          avatar_url: entry.avatar_url,
          total_score: entry.total_score,
          quizzes_completed: entry.quizzes_completed,
          highest_score: entry.highest_score,
          rank: index + 1,
          is_current_user: entry.user_id === currentUserId,
          average_score: entry.average_score,
          streak_count: entry.streak_count,
          courses_participated: entry.courses_participated
        }));

      setLeaderboard(leaderboardData);
      setFilteredLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter leaderboard based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLeaderboard(leaderboard);
    } else {
      const filtered = leaderboard.filter(entry =>
        entry.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLeaderboard(filtered);
    }
  }, [searchTerm, leaderboard]);

  const handleFilterChange = (newFilter: 'overall' | 'course' | 'quiz') => {
    setFilter(newFilter);
    // Reset the specific filters when changing the main filter
    if (newFilter === 'overall') {
      setCourseId(null);
      setQuizId(null);
    } else if (newFilter === 'course') {
      setQuizId(null);
      if (courses.length > 0 && !courseId) {
        setCourseId(courses[0].id);
      }
    } else if (newFilter === 'quiz') {
      setCourseId(null);
      if (quizzes.length > 0 && !quizId) {
        setQuizId(quizzes[0].id);
      }
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="bg-yellow-100 text-yellow-800 p-1 rounded-full">
          <TrophyIcon size={16} />
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="bg-gray-100 text-gray-800 p-1 rounded-full">
          <MedalIcon size={16} />
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="bg-amber-100 text-amber-800 p-1 rounded-full">
          <AwardIcon size={16} />
        </div>
      );
    } else {
      return (
        <div className="bg-blue-100 text-blue-800 h-6 w-6 flex items-center justify-center rounded-full text-xs font-medium">
          {rank}
        </div>
      );
    }
  };

  return (
    <DashboardLayout title="Leaderboard" role="student">
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Global Leaderboard</h1>
            <p className="text-gray-600">
              See how you rank against {leaderboard.length.toLocaleString()} active students
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeframe('all_time')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                timeframe === 'all_time'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                timeframe === 'month'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                timeframe === 'week'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        {leaderboard.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-blue-600">{leaderboard.length}</div>
              <div className="text-sm text-gray-600">Active Students</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-green-600">
                {leaderboard.reduce((sum, entry) => sum + entry.quizzes_completed, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Quizzes Completed</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(leaderboard.reduce((sum, entry) => sum + (entry.average_score || 0), 0) / leaderboard.length)}%
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-orange-600">
                {leaderboard.find(entry => entry.is_current_user)?.rank || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Your Rank</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter By
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleFilterChange('overall')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  filter === 'overall'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overall
              </button>
              <button
                onClick={() => handleFilterChange('course')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  filter === 'course'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                By Course
              </button>
              <button
                onClick={() => handleFilterChange('quiz')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  filter === 'quiz'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                By Quiz
              </button>
            </div>
          </div>

          {filter === 'course' && (
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Course
              </label>
              <select
                value={courseId || ''}
                onChange={(e) => setCourseId(e.target.value || null)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filter === 'quiz' && (
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Quiz
              </label>
              <select
                value={quizId || ''}
                onChange={(e) => setQuizId(e.target.value || null)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Quizzes</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Search Students */}
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name..."
                className="block w-full pl-10 pr-3 py-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredLeaderboard.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <TrophyIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            {searchTerm ? 'No students found' : 'No data available'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `No students found matching "${searchTerm}". Try a different search term.`
              : 'There are no quiz results to display for the selected filters.'
            }
          </p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Top 3 Podium - Only show when not searching */}
          {!searchTerm && leaderboard.length >= 3 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg shadow-sm border border-yellow-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">🏆 Top Performers</h3>
              <div className="flex justify-center items-end space-x-4">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-full mb-2">
                    <MedalIcon size={24} />
                  </div>
                  <div className="h-16 w-20 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div className="text-center mt-2">
                    <div className="text-sm font-medium text-gray-900">{leaderboard[1].full_name}</div>
                    <div className="text-xs text-gray-600">{leaderboard[1].total_score.toLocaleString()} pts</div>
                  </div>
                </div>
                
                {/* 1st Place */}
                <div className="flex flex-col items-center">
                  <div className="bg-yellow-100 text-yellow-800 p-3 rounded-full mb-2">
                    <TrophyIcon size={28} />
                  </div>
                  <div className="h-20 w-20 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                  <div className="text-center mt-2">
                    <div className="text-sm font-semibold text-gray-900">{leaderboard[0].full_name}</div>
                    <div className="text-xs text-gray-600">{leaderboard[0].total_score.toLocaleString()} pts</div>
                  </div>
                </div>
                
                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <div className="bg-amber-100 text-amber-800 p-3 rounded-full mb-2">
                    <AwardIcon size={24} />
                  </div>
                  <div className="h-12 w-20 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div className="text-center mt-2">
                    <div className="text-sm font-medium text-gray-900">{leaderboard[2].full_name}</div>
                    <div className="text-xs text-gray-600">{leaderboard[2].total_score.toLocaleString()} pts</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Full Leaderboard Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {filter === 'quiz' ? 'Attempts' : 'Quizzes'}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Best Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {filter === 'quiz' ? 'Best Score' : 'Total Points'}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Streak
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeaderboard.map((entry) => (
                    <tr
                      key={entry.user_id}
                      className={entry.is_current_user ? 'bg-blue-50 border-l-4 border-blue-400' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRankBadge(entry.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            {entry.avatar_url ? (
                              <img src={entry.avatar_url} alt={entry.full_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium text-sm">
                                {entry.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.full_name}
                              {entry.is_current_user && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            {entry.courses_participated && entry.courses_participated > 0 && (
                              <div className="text-xs text-gray-500">
                                {entry.courses_participated} course{entry.courses_participated !== 1 ? 's' : ''} participated
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.quizzes_completed}
                        </div>
                        <div className="text-xs text-gray-500">
                          {filter === 'quiz' ? 'attempts' : 'completed'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.average_score || Math.round(entry.total_score / entry.quizzes_completed)}%
                          </div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                              style={{ width: `${Math.min(entry.average_score || Math.round(entry.total_score / entry.quizzes_completed), 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.highest_score}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-blue-600">
                          {entry.total_score.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-orange-500 mr-1">🔥</span>
                          <div className="text-sm font-medium text-gray-900">
                            {entry.streak_count || 0}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};