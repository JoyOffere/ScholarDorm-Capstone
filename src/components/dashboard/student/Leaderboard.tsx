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
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchUserData();
  }, []);
  useEffect(() => {
    const fetchCourses = async () => {
      const {
        data,
        error
      } = await supabase.from('courses').select('id, title').eq('is_active', true).order('title', {
        ascending: true
      });
      if (!error && data) {
        setCourses(data);
      }
    };
    const fetchQuizzes = async () => {
      const {
        data,
        error
      } = await supabase.from('enhanced_quizzes').select('id, title').eq('is_published', true).order('title', {
        ascending: true
      });
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
      
      // Simple leaderboard query using quiz attempts directly
      let query = supabase
        .from('enhanced_quiz_attempts')
        .select(`
          user_id,
          score,
          completed_at,
          quiz_id,
          users!inner(id, email),
          enhanced_quizzes!inner(id, title, course_id)
        `)
        .not('completed_at', 'is', null)  // Only completed attempts
        .order('score', { ascending: false })
        .order('completed_at', { ascending: true })
        .limit(50);

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

      // Apply quiz filter
      if (quizId) {
        query = query.eq('quiz_id', quizId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Process data to aggregate by user and match expected interface
      const userScores = new Map<string, {
        user_id: string;
        full_name: string;
        avatar_url: string | null;
        scores: number[];
        quizzes_completed: number;
        total_score: number;
        highest_score: number;
      }>();

      data?.forEach((attempt: any) => {
        const userId = attempt.user_id;
        const existing = userScores.get(userId);
        
        if (existing) {
          existing.scores.push(attempt.score);
          existing.quizzes_completed += 1;
          existing.total_score += attempt.score;
          existing.highest_score = Math.max(existing.highest_score, attempt.score);
        } else {
          userScores.set(userId, {
            user_id: userId,
            full_name: attempt.users?.email?.split('@')[0] || 'Anonymous',
            avatar_url: null,
            scores: [attempt.score],
            quizzes_completed: 1,
            total_score: attempt.score,
            highest_score: attempt.score,
          });
        }
      });

      // Convert to array and sort by total score
      const leaderboardData = Array.from(userScores.values())
        .sort((a, b) => b.total_score - a.total_score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
          is_current_user: entry.user_id === currentUserId,
        }));

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };
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
      return <div className="bg-yellow-100 text-yellow-800 p-1 rounded-full">
          <TrophyIcon size={16} />
        </div>;
    } else if (rank === 2) {
      return <div className="bg-gray-100 text-gray-800 p-1 rounded-full">
          <MedalIcon size={16} />
        </div>;
    } else if (rank === 3) {
      return <div className="bg-amber-100 text-amber-800 p-1 rounded-full">
          <AwardIcon size={16} />
        </div>;
    } else {
      return <div className="bg-blue-100 text-blue-800 h-6 w-6 flex items-center justify-center rounded-full text-xs font-medium">
          {rank}
        </div>;
    }
  };
  return <DashboardLayout title="Leaderboard" role="student">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Leaderboard</h1>
            <p className="text-gray-600">
              See how you rank against other students
            </p>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setTimeframe('all_time')} className={`px-4 py-2 text-sm font-medium rounded-lg ${timeframe === 'all_time' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              All Time
            </button>
            <button onClick={() => setTimeframe('month')} className={`px-4 py-2 text-sm font-medium rounded-lg ${timeframe === 'month' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              This Month
            </button>
            <button onClick={() => setTimeframe('week')} className={`px-4 py-2 text-sm font-medium rounded-lg ${timeframe === 'week' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              This Week
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter By
            </label>
            <div className="flex space-x-2">
              <button onClick={() => handleFilterChange('overall')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'overall' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Overall
              </button>
              <button onClick={() => handleFilterChange('course')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'course' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                By Course
              </button>
              <button onClick={() => handleFilterChange('quiz')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'quiz' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                By Quiz
              </button>
            </div>
          </div>
          {filter === 'course' && <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Course
              </label>
              <select value={courseId || ''} onChange={e => setCourseId(e.target.value || null)} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="">All Courses</option>
                {courses.map(course => <option key={course.id} value={course.id}>
                    {course.title}
                  </option>)}
              </select>
            </div>}
          {filter === 'quiz' && <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Quiz
              </label>
              <select value={quizId || ''} onChange={e => setQuizId(e.target.value || null)} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="">All Quizzes</option>
                {quizzes.map(quiz => <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>)}
              </select>
            </div>}
        </div>
      </div>
      {loading ? <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div> : leaderboard.length === 0 ? <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <TrophyIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No data available
          </h3>
          <p className="text-gray-600">
            There are no quiz results to display for the selected filters.
          </p>
        </div> : <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                    Quizzes Completed
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Highest Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map(entry => <tr key={entry.user_id} className={entry.is_current_user ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankBadge(entry.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {entry.avatar_url ? <img src={entry.avatar_url} alt={entry.full_name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600">
                              <UserIcon size={20} />
                            </div>}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.full_name}
                            {entry.is_current_user && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                You
                              </span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.quizzes_completed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {entry.highest_score}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.total_score}
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>}
    </DashboardLayout>;
};