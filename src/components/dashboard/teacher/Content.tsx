import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileText, Plus, Search, Filter, MoreVertical, Edit, Eye,
  Download, Upload, Folder, Video, FileImage, File,
  Calendar, Clock, CheckCircle, AlertCircle, Tag, Share2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { TeacherService } from '../../../lib/teacher-service';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'image' | 'audio' | 'rsl_video';
  url: string;
  thumbnailUrl?: string;
  size: number; // in bytes
  course?: string;
  courseId?: string;
  lesson?: string;
  lessonId?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  downloadCount: number;
  viewCount: number;
  category: string;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  itemCount: number;
  createdAt: string;
}

export const TeacherContent = () => {
  const { user } = useAuth();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'document' | 'image' | 'audio' | 'rsl_video'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchContent();
    fetchFolders();
  }, []);

  useEffect(() => {
    filterContent();
  }, [contentItems, searchTerm, typeFilter, statusFilter]);

  const fetchContent = async () => {
    try {
      
      if (!user) return;

      const teacherService = new TeacherService(user.id);
      const contentData = await teacherService.getContent(
        searchTerm,
        typeFilter === 'all' ? undefined : typeFilter,
        statusFilter === 'all' ? undefined : statusFilter
      );
      
      setContentItems(contentData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching content:', error);
      setIsLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const mockFolders: Folder[] = [
        {
          id: '1',
          name: 'Mathematics Videos',
          itemCount: 15,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'RSL Content',
          itemCount: 8,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          name: 'Worksheets',
          itemCount: 23,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];
      
      setFolders(mockFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const filterContent = () => {
    let filtered = contentItems;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredItems(filtered);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
      case 'rsl_video':
        return <Video className="w-6 h-6" />;
      case 'image':
        return <FileImage className="w-6 h-6" />;
      case 'document':
        return <FileText className="w-6 h-6" />;
      case 'audio':
        return <File className="w-6 h-6" />;
      default:
        return <File className="w-6 h-6" />;
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      // Simulate upload progress
      const fileId = Math.random().toString(36).substr(2, 9);
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const progress = (prev[fileId] || 0) + 10;
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
      }, 200);
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" title="Content Library">
        <div className="p-6 flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading content...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" title="Content Library">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
            <p className="text-gray-600">Manage your educational content and resources</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/teacher/content/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Create Content</span>
            </Link>
            <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center space-x-2">
              <Upload size={16} />
              <span>Upload Content</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                accept="video/*,image/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx"
              />
            </label>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Folder size={16} />
              <span>New Folder</span>
            </button>
          </div>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-900 mb-3">Uploading Files</h3>
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="flex items-center space-x-3">
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
                <p className="text-sm text-gray-600">Total Files</p>
                <p className="text-2xl font-bold text-gray-900">{contentItems.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm text-gray-600">RSL Videos</p>
                <p className="text-2xl font-bold text-green-600">
                  {contentItems.filter(item => item.type === 'rsl_video').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Video className="w-6 h-6 text-green-600" />
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
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-purple-600">
                  {contentItems.reduce((acc, item) => acc + item.viewCount, 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600" />
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
                <p className="text-sm text-gray-600">Downloads</p>
                <p className="text-2xl font-bold text-orange-600">
                  {contentItems.reduce((acc, item) => acc + item.downloadCount, 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Download className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="video">Videos</option>
              <option value="rsl_video">RSL Videos</option>
              <option value="document">Documents</option>
              <option value="image">Images</option>
              <option value="audio">Audio</option>
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

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative h-32 bg-gray-100 flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">
                      {getFileIcon(item.type)}
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Content Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                      {item.title}
                    </h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{formatFileSize(item.size)}</span>
                    <span>{item.viewCount} views</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-purple-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-orange-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-gray-400">
                            {getFileIcon(item.type)}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-600 max-w-md truncate">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-sm text-gray-900">
                          {item.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{item.course || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-900">{formatFileSize(item.size)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-900">{item.viewCount}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-orange-600 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No content found</p>
            <p className="text-gray-500 mb-6">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Upload your first content to get started'}
            </p>
            <label className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload Your First Content</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                accept="video/*,image/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx"
              />
            </label>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};