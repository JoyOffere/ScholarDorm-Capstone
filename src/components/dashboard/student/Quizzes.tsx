import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { BookOpenIcon, ClipboardListIcon, ClockIcon, TrophyIcon, ArrowRightIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon } from 'lucide-react';
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
}
export const StudentQuizzes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'available'>('all');
  const [userId, setUserId] = useState<string | null>(null);
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
      // Get all published quizzes with course and lesson info
      const {
        data: quizzesData,
        error: quizzesError
      } = await supabase.from('enhanced_quizzes').select(`
          *,
          lesson:enhanced_lessons(title, course_id),
          enhanced_quiz_questions(count)
        `).eq('is_published', true).order('created_at', {
        ascending: false
      });
      if (quizzesError) throw quizzesError;
      // Get course titles
      const courseIds = quizzesData?.map(quiz => quiz.lesson?.course_id).filter(Boolean) || [];
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
          course_title: quiz.lesson?.course_id ? courseTitleMap[quiz.lesson.course_id] ?? 'Unknown Course' : 'Unknown Course',
          lesson_title: quiz.lesson?.title ?? 'Unknown Lesson',
          user_attempts: attempts?.count ?? 0,
          highest_score: attempts?.highestScore ?? 0,
          status
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
  const startQuiz = (quizId: string) => {
    navigate(`/quiz/${quizId}`);
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
                    <button onClick={() => startQuiz(quiz.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                      Try Again
                      <ArrowRightIcon size={16} className="ml-1" />
                    </button>
                  </div> : <div className="flex justify-between items-center">
                    {(quiz.user_attempts ?? 0) > 0 && <div className="text-sm text-gray-600">
                        Attempts: {quiz.user_attempts ?? 0}
                        {quiz.max_attempts ? `/${quiz.max_attempts}` : ''}
                      </div>}
                    <button onClick={() => startQuiz(quiz.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center" disabled={quiz.max_attempts !== null && (quiz.user_attempts ?? 0) >= quiz.max_attempts}>
                      {quiz.status === 'in_progress' ? 'Continue' : 'Start Quiz'}
                      <ArrowRightIcon size={16} className="ml-1" />
                    </button>
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
    </DashboardLayout>;
};