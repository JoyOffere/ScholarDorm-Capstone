import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { GamepadIcon, TrophyIcon, ClockIcon, SearchIcon, FilterIcon, PlayIcon, LockIcon, StarIcon } from 'lucide-react';
interface Game {
  id: string;
  title: string;
  description: string;
  image_url: string;
  game_type: string;
  subject: string;
  difficulty_level: string;
  instructions: string;
  is_active: boolean;
  is_unlocked: boolean;
  high_score: number;
  times_played: number;
  last_played: string | null;
}
export const StudentGames: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserAndGames = async () => {
      try {
        // Get current user
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          await fetchGames(user.id);
        }
      } catch (error) {
        console.error('Error fetching user and games:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndGames();
  }, []);
  const fetchGames = async (userId: string) => {
    try {
      setLoading(true);
      // Get all active games
      const {
        data: gamesData,
        error: gamesError
      } = await supabase.from('games').select('*').eq('is_active', true).order('title', {
        ascending: true
      });
      if (gamesError) throw gamesError;
      if (!gamesData || gamesData.length === 0) {
        setGames([]);
        return;
      }
      // Get user's unlocked games
      const {
        data: userGames,
        error: userGamesError
      } = await supabase.from('user_games').select('*').eq('user_id', userId);
      if (userGamesError) throw userGamesError;
      // Create a map of user's game data
      const userGameMap: Record<string, any> = {};
      userGames?.forEach(game => {
        userGameMap[game.game_id] = game;
      });
      // Format the games data
      const formattedGames = gamesData.map(game => ({
        ...game,
        is_unlocked: !!userGameMap[game.id],
        high_score: userGameMap[game.id]?.high_score || 0,
        times_played: userGameMap[game.id]?.times_played || 0,
        last_played: userGameMap[game.id]?.last_played || null
      }));
      // Extract unique subjects
      const uniqueSubjects = Array.from(new Set(formattedGames.map(game => game.subject)));
      setSubjects(uniqueSubjects as string[]);
      // Apply filters
      let filteredGames = formattedGames;
      if (filter === 'unlocked') {
        filteredGames = formattedGames.filter(game => game.is_unlocked);
      } else if (filter === 'locked') {
        filteredGames = formattedGames.filter(game => !game.is_unlocked);
      }
      if (subjectFilter) {
        filteredGames = filteredGames.filter(game => game.subject === subjectFilter);
      }
      if (searchTerm) {
        filteredGames = filteredGames.filter(game => game.title.toLowerCase().includes(searchTerm.toLowerCase()) || game.description.toLowerCase().includes(searchTerm.toLowerCase()) || game.subject.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      setGames(filteredGames);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };
  const playGame = async (gameId: string, isUnlocked: boolean) => {
    if (!userId) return;
    if (!isUnlocked) {
      // Unlock the game first
      try {
        const {
          error
        } = await supabase.from('user_games').insert({
          user_id: userId,
          game_id: gameId,
          unlocked_at: new Date().toISOString(),
          high_score: 0,
          total_score: 0,
          times_played: 0,
          total_time_played_seconds: 0
        });
        if (error) throw error;
        // Update local state
        setGames(games.map(game => game.id === gameId ? {
          ...game,
          is_unlocked: true
        } : game));
      } catch (error) {
        console.error('Error unlocking game:', error);
        return;
      }
    }
    // Navigate to the game
    navigate(`/game/${gameId}`);
  };
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  const formatLastPlayed = (dateString: string | null): string => {
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
  return <DashboardLayout title="Learning Games" role="student">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Learning Games</h1>
            <p className="text-gray-600">
              Fun educational games to reinforce your learning
            </p>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              All Games
            </button>
            <button onClick={() => setFilter('unlocked')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'unlocked' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Unlocked
            </button>
            <button onClick={() => setFilter('locked')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'locked' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Locked
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Search games..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={subjectFilter || ''} onChange={e => setSubjectFilter(e.target.value || null)}>
                <option value="">All Subjects</option>
                {subjects.map((subject, index) => <option key={index} value={subject}>
                    {subject}
                  </option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {loading ? <div className="py-6 text-center text-sm text-gray-600">Loading games…</div> : games.length === 0 ? <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <GamepadIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No games found
          </h3>
          <p className="text-gray-600 mb-6">
            {filter !== 'all' ? `You don't have any ${filter === 'unlocked' ? 'unlocked' : 'locked'} games.` : searchTerm || subjectFilter ? 'No games match your search criteria.' : 'There are no games available at the moment.'}
          </p>
          {(filter !== 'all' || searchTerm || subjectFilter) && <button onClick={() => {
        setFilter('all');
        setSearchTerm('');
        setSubjectFilter(null);
      }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              View All Games
            </button>}
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map(game => <div key={game.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-200 relative">
                {game.image_url ? <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <GamepadIcon size={48} className="text-gray-400" />
                  </div>}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(game.difficulty_level)}`}>
                      {game.difficulty_level.charAt(0).toUpperCase() + game.difficulty_level.slice(1)}
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                      {game.game_type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg text-gray-800 mb-1">
                  {game.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{game.subject}</p>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {game.description}
                </p>
                {game.is_unlocked ? <div className="flex justify-between items-center mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <TrophyIcon size={14} className="mr-1" />
                      <span>High Score: {game.high_score}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <ClockIcon size={14} className="mr-1" />
                      <span>Played: {game.times_played}</span>
                    </div>
                  </div> : <div className="mb-4 text-sm text-center py-2 bg-yellow-50 text-yellow-800 rounded-lg">
                    <LockIcon size={14} className="inline mr-1" />
                    <span>Unlock this game to play</span>
                  </div>}
                <div className="flex justify-between items-center">
                  {game.is_unlocked && game.last_played && <span className="text-xs text-gray-500">
                      Last played: {formatLastPlayed(game.last_played)}
                    </span>}
                  <button onClick={() => playGame(game.id, game.is_unlocked)} className={`px-4 py-2 rounded-lg text-white flex items-center ${game.is_unlocked ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                      {game.is_unlocked ? <>
                        <PlayIcon size={16} className="mr-1" />
                        Play
                      </> : <>
                        <StarIcon size={16} className="mr-1" />
                        Unlock
                      </>}
                  </button>
                </div>
              </div>
            </div>)}
        </div>}
      {/* Game Leaderboard Preview */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Game Leaderboards</h2>
          <button onClick={() => navigate('/leaderboard/games')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All Leaderboards
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* We'll implement the actual leaderboard in a separate component */}
          <p className="text-center text-gray-600">
            Check the leaderboards to see how you rank against other students!
          </p>
        </div>
      </div>
    </DashboardLayout>;
};