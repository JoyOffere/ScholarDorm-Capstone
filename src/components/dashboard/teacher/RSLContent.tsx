import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Video, Plus, Search, Filter, MoreVertical, Edit, Eye,
  Upload, Play, Pause, Volume2, VolumeX, Hand, Users,
  BookOpen, Calendar, Clock, CheckCircle, AlertCircle,
  Star, Download, Share2, Copy, Maximize, X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { DashboardLayout } from '../../layout/DashboardLayout';

interface RSLVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  category: 'numbers' | 'letters' | 'words' | 'phrases' | 'mathematics' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  transcript?: string;
  signDescription: string;
  relatedConcepts: string[];
  viewCount: number;
  likes: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  instructor: string;
  course?: string;
  courseId?: string;
  lesson?: string;
  lessonId?: string;
}

interface VideoStats {
  totalVideos: number;
  totalViews: number;
  totalDuration: number;
  averageRating: number;
}

export const TeacherRSLContent = () => {
  const [videos, setVideos] = useState<RSLVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<RSLVideo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | RSLVideo['category']>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | RSLVideo['difficulty']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<RSLVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchRSLVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, categoryFilter, difficultyFilter, statusFilter]);

  const fetchRSLVideos = async () => {
    try {
      // Mock data for now - replace with actual API calls
      const mockVideos: RSLVideo[] = [
        {
          id: '1',
          title: 'Numbers 1-10 in RSL',
          description: 'Learn to sign numbers 1 through 10 in Rwanda Sign Language',
          videoUrl: '/rsl_videos/numbers-1-10.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
          duration: 180, // 3 minutes
          category: 'numbers',
          difficulty: 'beginner',
          tags: ['numbers', 'basic', 'counting', 'foundation'],
          signDescription: 'Clear demonstration of hand positions and movements for each number',
          relatedConcepts: ['counting', 'basic arithmetic', 'number recognition'],
          viewCount: 234,
          likes: 45,
          status: 'published',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-05T00:00:00Z',
          instructor: 'Jean Baptiste Munyanziza',
          course: 'Basic Mathematics with RSL',
          courseId: '1'
        },
        {
          id: '2',
          title: 'Addition Signs and Concepts',
          description: 'Mathematical addition operations using Rwanda Sign Language',
          videoUrl: '/rsl_videos/addition-concepts.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400',
          duration: 300, // 5 minutes
          category: 'mathematics',
          difficulty: 'intermediate',
          tags: ['addition', 'mathematics', 'operations', 'problem-solving'],
          transcript: 'Welcome to addition in RSL. Today we will learn...',
          signDescription: 'Step-by-step demonstration of addition signs with visual examples',
          relatedConcepts: ['arithmetic', 'problem solving', 'mathematical operations'],
          viewCount: 189,
          likes: 38,
          status: 'published',
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-08T00:00:00Z',
          instructor: 'Marie Claire Uwimana',
          course: 'Basic Mathematics with RSL',
          courseId: '1'
        },
        {
          id: '3',
          title: 'Geometric Shapes Vocabulary',
          description: 'Common geometric shapes and their RSL signs',
          videoUrl: '/rsl_videos/geometric-shapes.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
          duration: 240, // 4 minutes
          category: 'words',
          difficulty: 'beginner',
          tags: ['geometry', 'shapes', 'vocabulary', 'visual'],
          signDescription: 'Visual representation of various geometric shapes with corresponding signs',
          relatedConcepts: ['geometry', 'spatial awareness', 'shape recognition'],
          viewCount: 156,
          likes: 29,
          status: 'published',
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-12T00:00:00Z',
          instructor: 'Patrick Nzeyimana',
          course: 'Geometry Fundamentals',
          courseId: '3'
        },
        {
          id: '4',
          title: 'Complex Algebra Expressions',
          description: 'Advanced algebraic expressions and equation solving in RSL',
          videoUrl: '/rsl_videos/algebra-expressions.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1632571401005-458e9d244591?w=400',
          duration: 420, // 7 minutes
          category: 'mathematics',
          difficulty: 'advanced',
          tags: ['algebra', 'expressions', 'equations', 'advanced'],
          signDescription: 'Complex mathematical expressions broken down into clear RSL signs',
          relatedConcepts: ['algebraic thinking', 'equation solving', 'abstract concepts'],
          viewCount: 87,
          likes: 21,
          status: 'draft',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-16T00:00:00Z',
          instructor: 'Solange Mukamana',
          course: 'Advanced Algebra Concepts',
          courseId: '2'
        },
        {
          id: '5',
          title: 'Mathematical Phrases and Questions',
          description: 'Common mathematical phrases and how to ask questions in RSL',
          videoUrl: '/rsl_videos/math-phrases.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1635070041409-e63e783398d4?w=400',
          duration: 360, // 6 minutes
          category: 'phrases',
          difficulty: 'intermediate',
          tags: ['phrases', 'questions', 'communication', 'interaction'],
          signDescription: 'Interactive phrases for mathematical discussions and problem solving',
          relatedConcepts: ['communication', 'questioning', 'mathematical discourse'],
          viewCount: 203,
          likes: 42,
          status: 'published',
          createdAt: '2024-01-08T00:00:00Z',
          updatedAt: '2024-01-10T00:00:00Z',
          instructor: 'Emmanuel Habimana'
        }
      ];
      
      setVideos(mockVideos);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching RSL videos:', error);
      setIsLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = videos;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(video => video.category === categoryFilter);
    }

    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(video => video.difficulty === difficultyFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(video => video.status === statusFilter);
    }

    setFilteredVideos(filtered);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCategoryBadge = (category: string) => {
    const categoryStyles = {
      numbers: 'bg-blue-100 text-blue-600',
      letters: 'bg-green-100 text-green-600',
      words: 'bg-purple-100 text-purple-600',
      phrases: 'bg-orange-100 text-orange-600',
      mathematics: 'bg-red-100 text-red-600',
      general: 'bg-gray-100 text-gray-600'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${categoryStyles[category as keyof typeof categoryStyles]}`}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </span>
    );
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Beginner</span>;
      case 'intermediate':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full">Intermediate</span>;
      case 'advanced':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Advanced</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Published</span>;
      case 'draft':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full">Draft</span>;
      case 'archived':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Archived</span>;
      default:
        return null;
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const fileId = Math.random().toString(36).substr(2, 9);
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const progress = (prev[fileId] || 0) + 5;
          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[fileId];
                return newProgress;
              });
            }, 1000);
          }
          return { ...prev, [fileId]: Math.min(progress, 100) };
        });
      }, 300);
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" title="RSL Content">
        <div className="p-6 flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading RSL content...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats: VideoStats = {
    totalVideos: videos.length,
    totalViews: videos.reduce((acc, video) => acc + video.viewCount, 0),
    totalDuration: videos.reduce((acc, video) => acc + video.duration, 0),
    averageRating: 4.5 // Mock average rating
  };

  return (
    <DashboardLayout role="teacher" title="RSL Content">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RSL Content Library</h1>
            <p className="text-gray-600">Create and manage Rwanda Sign Language educational videos</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center space-x-2">
              <Upload size={16} />
              <span>Upload RSL Video</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleVideoUpload}
                accept="video/*"
              />
            </label>
            <Link
              to="/teacher/rsl-content/create"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Create Video</span>
            </Link>
          </div>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-900 mb-3">Uploading RSL Videos</h3>
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="flex items-center space-x-3">
                  <Video className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 min-w-12">{progress}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Videos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalViews}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Duration</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.totalDuration / 60)}m
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-orange-600">{stats.averageRating}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search RSL videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="numbers">Numbers</option>
              <option value="letters">Letters</option>
              <option value="words">Words</option>
              <option value="phrases">Phrases</option>
              <option value="mathematics">Mathematics</option>
              <option value="general">General</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as typeof difficultyFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Video Thumbnail */}
              <div className="relative h-48 overflow-hidden group cursor-pointer"
                   onClick={() => setSelectedVideo(video)}>
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white bg-opacity-90 rounded-full p-3">
                    <Play className="w-6 h-6 text-gray-900" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                  {formatDuration(video.duration)}
                </div>
                <div className="absolute top-2 left-2 flex space-x-2">
                  {getCategoryBadge(video.category)}
                  {getDifficultyBadge(video.difficulty)}
                </div>
                <div className="absolute top-2 right-2">
                  {getStatusBadge(video.status)}
                </div>
              </div>

              {/* Video Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
                    {video.title}
                  </h3>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {video.description}
                </p>

                {/* Instructor */}
                <div className="flex items-center space-x-2 mb-3">
                  <Hand className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700">{video.instructor}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{video.viewCount} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{video.likes} likes</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {video.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                  {video.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{video.tags.length - 3} more
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/teacher/rsl-content/${video.id}/edit`}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </Link>
                  
                  <button className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1 text-sm">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No RSL videos found</p>
            <p className="text-gray-500 mb-6">
              {searchTerm || categoryFilter !== 'all' || difficultyFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Upload your first RSL video to get started'}
            </p>
            <label className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload Your First RSL Video</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleVideoUpload}
                accept="video/*"
              />
            </label>
          </div>
        )}

        {/* Video Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{selectedVideo.title}</h2>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Video Player Placeholder</p>
                    <p className="text-sm text-gray-500">Duration: {formatDuration(selectedVideo.duration)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600">{selectedVideo.description}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Sign Description</h3>
                    <p className="text-gray-600">{selectedVideo.signDescription}</p>
                  </div>

                  {selectedVideo.relatedConcepts.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Related Concepts</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedVideo.relatedConcepts.map((concept, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};