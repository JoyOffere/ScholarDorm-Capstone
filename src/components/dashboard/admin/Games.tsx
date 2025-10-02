import React, { useEffect, useState, useRef, memo, Component } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { GamepadIcon, SearchIcon, FilterIcon, PlusIcon, TrashIcon, EditIcon, EyeIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon, AlertCircleIcon, UsersIcon, StarIcon, XIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { createAuditLog } from '../../../lib/supabase-utils';
import { Link } from 'react-router-dom';
interface Game {
  id: string;
  title: string;
  description: string;
  image_url: string;
  game_type: string;
  subject: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  instructions?: string;
  config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  plays_count?: number;
  avg_rating?: number;
}
interface GameFormData {
  title: string;
  description: string;
  image_url: string;
  game_type: string;
  subject: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  instructions: string;
  is_active: boolean;
  config: any;
}
export const AdminGames: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gameTypeFilter, setGameTypeFilter] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [gameTypes, setGameTypes] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<GameFormData>({
    title: '',
    description: '',
    image_url: '',
    game_type: 'quiz',
    subject: '',
    difficulty_level: 'medium',
    instructions: '',
    is_active: true,
    config: {
      time_limit: 60,
      questions_count: 10,
      difficulty: 'medium'
    }
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fetchGames();
    fetchGameTypes();
  }, [gameTypeFilter, difficultyFilter, statusFilter]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowAddModal(false);
      }
    };
    if (showAddModal) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddModal]);
  const fetchGameTypes = async () => {
    try {
      // Get unique game types from the database
      const {
        data,
        error
      } = await supabase.from('games').select('game_type').order('game_type');
      if (error) throw error;
      // Extract unique game types
      const uniqueTypes = [...new Set(data.map(item => item.game_type))];
      setGameTypes(uniqueTypes.length > 0 ? uniqueTypes : ['quiz', 'memory', 'word']);
    } catch (err) {
      console.error('Error fetching game types:', err);
      setGameTypes(['quiz', 'memory', 'word']); // Fallback
    }
  };
  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);
      // Build query with filters
      let query = supabase.from('games').select('*, user_games(count)').order('created_at', {
        ascending: false
      });
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      if (gameTypeFilter) {
        query = query.eq('game_type', gameTypeFilter);
      }
      if (difficultyFilter) {
        query = query.eq('difficulty_level', difficultyFilter);
      }
      if (statusFilter !== null) {
        query = query.eq('is_active', statusFilter);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      // Process the data to include play counts
      const processedGames = data.map(game => ({
        ...game,
        plays_count: game.user_games?.length || 0,
        avg_rating: 4.5 // This would come from a ratings table in a real implementation
      }));
      setGames(processedGames);
    } catch (err: any) {
      console.error('Error fetching games:', err);
      setError(err.message || 'Failed to fetch games');
      setGames([]);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGames();
  };
  const handleDeleteClick = (gameId: string) => {
    setGameToDelete(gameId);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!gameToDelete) return;
    try {
      setLoading(true);
      // Delete the game from the database
      const {
        error
      } = await supabase.from('games').delete().eq('id', gameToDelete);
      if (error) throw error;
      // Log the action
      const {
        data: userData
      } = await supabase.auth.getUser();
      if (userData.user) {
        await createAuditLog(userData.user.id, 'admin_content_delete', {
          entity_type: 'game',
          entity_id: gameToDelete
        });
      }
      // Update the UI
      setGames(games.filter(game => game.id !== gameToDelete));
      setShowDeleteModal(false);
      setGameToDelete(null);
    } catch (err: any) {
      console.error('Error deleting game:', err);
      setError(err.message || 'Failed to delete game');
    } finally {
      setLoading(false);
    }
  };
  const toggleGameStatus = async (gameId: string, currentStatus: boolean) => {
    try {
      // Update the game status in the database
      const {
        error
      } = await supabase.from('games').update({
        is_active: !currentStatus,
        updated_at: new Date().toISOString()
      }).eq('id', gameId);
      if (error) throw error;
      // Log the action
      const {
        data: userData
      } = await supabase.auth.getUser();
      if (userData.user) {
        await createAuditLog(userData.user.id, 'admin_content_update', {
          entity_type: 'game',
          entity_id: gameId,
          field: 'is_active',
          new_value: !currentStatus
        });
      }
      // Update the UI
      setGames(games.map(game => game.id === gameId ? {
        ...game,
        is_active: !currentStatus
      } : game));
    } catch (err: any) {
      console.error('Error toggling game status:', err);
      setError(err.message || 'Failed to update game status');
    }
  };
  const resetFilters = () => {
    setSearchTerm('');
    setGameTypeFilter(null);
    setDifficultyFilter(null);
    setStatusFilter(null);
    fetchGames();
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      checked
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [name]: name === 'questions_count' || name === 'time_limit' ? parseInt(value) : value
      }
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);
    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.game_type.trim()) {
        throw new Error('Game type is required');
      }
      // Default image if none provided
      const imageUrl = formData.image_url.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.title)}&background=random&size=300`;
      // Create the game
      const {
        data,
        error
      } = await supabase.from('games').insert({
        title: formData.title,
        description: formData.description,
        image_url: imageUrl,
        game_type: formData.game_type,
        subject: formData.subject,
        difficulty_level: formData.difficulty_level,
        instructions: formData.instructions,
        is_active: formData.is_active,
        config: formData.config
      }).select();
      if (error) throw error;
      // Log the action
      const {
        data: userData
      } = await supabase.auth.getUser();
      if (userData.user && data) {
        await createAuditLog(userData.user.id, 'admin_content_create', {
          entity_type: 'game',
          entity_id: data[0].id
        });
      }
      // Update UI and close modal
      setGames([data[0], ...games]);
      setShowAddModal(false);
      // Reset form
      setFormData({
        title: '',
        description: '',
        image_url: '',
        game_type: 'quiz',
        subject: '',
        difficulty_level: 'medium',
        instructions: '',
        is_active: true,
        config: {
          time_limit: 60,
          questions_count: 10,
          difficulty: 'medium'
        }
      });
    } catch (err: any) {
      console.error('Error adding game:', err);
      setFormError(err.message || 'Failed to add game');
    } finally {
      setFormSubmitting(false);
    }
  };
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Easy
          </span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Medium
          </span>;
      case 'hard':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Hard
          </span>;
      default:
        return null;
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  return <DashboardLayout title="Game Management" role="admin">
      {/* Error Message */}
      {error && <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <AlertCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>}

      {/* Filters and actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <form onSubmit={handleSearch}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
              </div>
              <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Search games by title or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </form>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Game Type Filter */}
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={gameTypeFilter || ''} onChange={e => setGameTypeFilter(e.target.value || null)}>
                <option value="">All Types</option>
                {gameTypes.map(type => <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Difficulty Filter */}
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={difficultyFilter || ''} onChange={e => setDifficultyFilter(e.target.value || null)}>
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Status Filter */}
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={statusFilter === null ? '' : statusFilter ? 'active' : 'inactive'} onChange={e => {
              const value = e.target.value;
              if (value === '') setStatusFilter(null);else setStatusFilter(value === 'active');
            }}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Reset Filters */}
            {(searchTerm || gameTypeFilter || difficultyFilter || statusFilter !== null) && <button onClick={resetFilters} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <RefreshCwIcon size={16} className="mr-2" />
                Reset
              </button>}
            {/* Create Game */}
            <button onClick={() => setShowAddModal(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <PlusIcon size={16} className="mr-2" />
              Add Game
            </button>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        {loading ? <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-lg text-gray-600">Loading games...</span>
          </div> : games.length === 0 ? <div className="text-center py-16">
            <GamepadIcon size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No games found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || gameTypeFilter || difficultyFilter || statusFilter !== null ? 'Try adjusting your search or filter criteria.' : 'Get started by adding your first game.'}
            </p>
            {searchTerm || gameTypeFilter || difficultyFilter || statusFilter !== null ? <button onClick={resetFilters} className="text-purple-600 hover:text-purple-800 font-medium">
                Reset all filters
              </button> : <button onClick={() => setShowAddModal(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                <PlusIcon size={16} className="mr-2" />
                Add Game
              </button>}
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map(game => <div key={game.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-48 bg-gray-100">
                  {game.image_url ? <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full bg-gray-200">
                      <GamepadIcon size={48} className="text-gray-400" />
                    </div>}
                  <div className="absolute top-2 right-2">
                    {game.is_active ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon size={12} className="mr-1" />
                        Active
                      </span> : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircleIcon size={12} className="mr-1" />
                        Inactive
                      </span>}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {game.title}
                    </h3>
                    {getDifficultyBadge(game.difficulty_level)}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {game.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="inline-flex items-center">
                      <UsersIcon size={14} className="mr-1" />
                      {game.plays_count} plays
                    </span>
                    <span className="inline-flex items-center">
                      <StarIcon size={14} className="mr-1 text-yellow-500" />
                      {game.avg_rating || '—'}
                    </span>
                    <span className="capitalize">{game.game_type}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-xs text-gray-500">
                      Updated {formatDate(game.updated_at)}
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => toggleGameStatus(game.id, game.is_active)} className={`p-1.5 rounded-full ${game.is_active ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`} title={game.is_active ? 'Deactivate' : 'Activate'}>
                        {game.is_active ? <XCircleIcon size={16} /> : <CheckCircleIcon size={16} />}
                      </button>
                      <button className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200" title="Preview">
                        <EyeIcon size={16} />
                      </button>
                      <button className="p-1.5 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200" title="Edit">
                        <EditIcon size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(game.id)} className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200" title="Delete">
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>}
      </div>

      {/* Add Game Modal */}
      {showAddModal && <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div ref={modalRef} className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="flex justify-between items-center bg-purple-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-purple-900">
                  Add New Game
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                  <XIcon size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 py-4">
                  {formError && <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                      <div className="flex">
                        <AlertCircleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{formError}</p>
                        </div>
                      </div>
                    </div>}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Title */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                    </div>
                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Game Type */}
                      <div>
                        <label htmlFor="game_type" className="block text-sm font-medium text-gray-700 mb-1">
                          Game Type *
                        </label>
                        <select id="game_type" name="game_type" value={formData.game_type} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" required>
                          {gameTypes.map(type => <option key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>)}
                        </select>
                      </div>
                      {/* Difficulty */}
                      <div>
                        <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700 mb-1">
                          Difficulty
                        </label>
                        <select id="difficulty_level" name="difficulty_level" value={formData.difficulty_level} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>
                    {/* Subject */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                    {/* Image URL */}
                    <div>
                      <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL
                      </label>
                      <input type="url" id="image_url" name="image_url" value={formData.image_url} onChange={handleInputChange} placeholder="https://example.com/image.jpg" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
                      <p className="mt-1 text-xs text-gray-500">
                        Leave blank for auto-generated image
                      </p>
                    </div>
                    {/* Instructions */}
                    <div>
                      <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions
                      </label>
                      <textarea id="instructions" name="instructions" rows={2} value={formData.instructions} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                    {/* Game Config - Depends on game type */}
                    {formData.game_type === 'quiz' && <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                        <h4 className="font-medium text-sm text-gray-700 mb-3">
                          Quiz Configuration
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="time_limit" className="block text-sm font-medium text-gray-700 mb-1">
                              Time Limit (seconds)
                            </label>
                            <input type="number" id="time_limit" name="time_limit" value={formData.config.time_limit} onChange={handleConfigChange} min="10" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
                          </div>
                          <div>
                            <label htmlFor="questions_count" className="block text-sm font-medium text-gray-700 mb-1">
                              Number of Questions
                            </label>
                            <input type="number" id="questions_count" name="questions_count" value={formData.config.questions_count} onChange={handleConfigChange} min="1" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
                          </div>
                        </div>
                      </div>}
                    {/* Is Active */}
                    <div className="flex items-center">
                      <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleCheckboxChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                        Publish game immediately
                      </label>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                  <button type="button" onClick={() => setShowAddModal(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mr-2">
                    Cancel
                  </button>
                  <button type="submit" disabled={formSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    {formSubmitting ? 'Creating...' : 'Create Game'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && <div className="fixed inset-0 z-50 overflow-y-auto">
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
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Game
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this game? This action
                        cannot be undone and all associated data will be
                        permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={confirmDelete}>
                  Delete
                </button>
                <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>}
    </DashboardLayout>;
};