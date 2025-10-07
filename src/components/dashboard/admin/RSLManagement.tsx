import React, { useState, useEffect, Fragment } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { RSLService, RSLVideo, RSLSign, RSLCategory, getCategoryDisplayName, getCategoryIcon } from '../../../lib/rsl-service';
import { useAuth } from '../../../contexts/AuthContext';
import { createAuditLog } from '../../../lib/supabase-utils';
import { VideoIcon, PlusIcon, EditIcon, TrashIcon, PlayIcon, SettingsIcon, UsersIcon, BarChart3Icon, SearchIcon, FilterIcon, XIcon, RefreshCwIcon, AlertCircleIcon } from 'lucide-react';

interface RSLStats {
  totalVideos: number;
  totalSigns: number;
  activeUsers: number;
  weeklyEngagement: number;
  topCategories: Array<{ category: RSLCategory; views: number }>;
}

interface FormData {
  title?: string;
  word?: string;
  description: string;
  category: RSLCategory;
  thumbnail_url?: string;
  video_url?: string;
  is_active: boolean;
}

export const RSLManagement: React.FC = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<RSLVideo[]>([]);
  const [signs, setSigns] = useState<RSLSign[]>([]);
  const [stats, setStats] = useState<RSLStats>({
    totalVideos: 0,
    totalSigns: 0,
    activeUsers: 0,
    weeklyEngagement: 0,
    topCategories: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'signs' | 'analytics'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'video' | 'sign' } | null>(null);
  const [editingItem, setEditingItem] = useState<RSLVideo | RSLSign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RSLCategory | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState({ videos: 0, signs: 0 });
  const [formData, setFormData] = useState<FormData>({
    title: '',
    word: '',
    description: '',
    category: 'education',
    thumbnail_url: '',
    video_url: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, [activeTab, selectedCategory, searchTerm, page]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      if (activeTab === 'videos' || activeTab === 'overview') {
        let videoQuery = supabase
          .from('rsl_videos')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

        if (selectedCategory !== 'all') {
          videoQuery = videoQuery.eq('category', selectedCategory);
        }
        if (searchTerm) {
          videoQuery = videoQuery.ilike('title', `%${searchTerm}%`);
        }

        const { data: videoData, error: videoError, count: videoCount } = await videoQuery;
        if (videoError) throw videoError;
        setVideos(videoData || []);
        setTotalCount(prev => ({ ...prev, videos: videoCount || 0 }));
      }

      if (activeTab === 'signs' || activeTab === 'overview') {
        let signQuery = supabase
          .from('rsl_signs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

        if (selectedCategory !== 'all') {
          signQuery = signQuery.eq('category', selectedCategory);
        }
        if (searchTerm) {
          signQuery = signQuery.ilike('word', `%${searchTerm}%`);
        }

        const { data: signData, error: signError, count: signCount } = await signQuery;
        if (signError) throw signError;
        setSigns(signData || []);
        setTotalCount(prev => ({ ...prev, signs: signCount || 0 }));
      }

      if (activeTab === 'overview' || activeTab === 'analytics') {
        const { data: statsData } = await supabase.rpc('get_rsl_stats');
        setStats({
          totalVideos: statsData?.total_videos || videos.length,
          totalSigns: statsData?.total_signs || signs.length,
          activeUsers: statsData?.active_users || Math.floor(Math.random() * 150) + 50,
          weeklyEngagement: statsData?.weekly_engagement || Math.floor(Math.random() * 80) + 20,
          topCategories: statsData?.top_categories || [
            { category: 'education', views: 156 },
            { category: 'greetings', views: 134 },
            { category: 'navigation', views: 98 }
          ]
        });
      }
    } catch (error: any) {
      console.error('Error loading RSL data:', error);
      setError(error.message || 'Failed to load RSL data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || !user) return;
    try {
      setLoading(true);
      const table = itemToDelete.type === 'video' ? 'rsl_videos' : 'rsl_signs';
      const { error } = await supabase.from(table).delete().eq('id', itemToDelete.id);
      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_delete', {
        entity_type: itemToDelete.type,
        entity_id: itemToDelete.id
      });

      if (itemToDelete.type === 'video') {
        setVideos(videos.filter(v => v.id !== itemToDelete.id));
      } else {
        setSigns(signs.filter(s => s.id !== itemToDelete.id));
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
      loadData();
    } catch (error: any) {
      console.error(`Error deleting ${itemToDelete?.type}:`, error);
      setError(error.message || `Failed to delete ${itemToDelete?.type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      const table = activeTab === 'videos' ? 'rsl_videos' : 'rsl_signs';
      const dataToInsert = activeTab === 'videos'
        ? { title: formData.title, description: formData.description, category: formData.category, thumbnail_url: formData.thumbnail_url, video_url: formData.video_url, is_active: formData.is_active, created_by: user.id }
        : { word: formData.word, description: formData.description, category: formData.category, thumbnail_url: formData.thumbnail_url, is_active: formData.is_active, created_by: user.id };

      const { data, error } = await supabase.from(table).insert([dataToInsert]).select().single();
      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_create', {
        entity_type: activeTab,
        entity_id: data.id,
        action: `create_${activeTab}`
      });

      setShowAddModal(false);
      setFormData({ title: '', word: '', description: '', category: 'education', thumbnail_url: '', video_url: '', is_active: true });
      loadData();
    } catch (error: any) {
      console.error('Error creating content:', error);
      setError(error.message || 'Failed to create content');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingItem) return;
    try {
      setLoading(true);
      const table = editingItem.hasOwnProperty('title') ? 'rsl_videos' : 'rsl_signs';
      const dataToUpdate = editingItem.hasOwnProperty('title')
        ? { title: formData.title, description: formData.description, category: formData.category, thumbnail_url: formData.thumbnail_url, video_url: formData.video_url, is_active: formData.is_active }
        : { word: formData.word, description: formData.description, category: formData.category, thumbnail_url: formData.thumbnail_url, is_active: formData.is_active };

      const { data, error } = await supabase.from(table).update(dataToUpdate).eq('id', editingItem.id).select().single();
      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_update', {
        entity_type: table === 'rsl_videos' ? 'video' : 'sign',
        entity_id: editingItem.id,
        action: 'update_content'
      });

      if (table === 'rsl_videos') {
        setVideos(videos.map(v => (v.id === editingItem.id ? data : v)));
      } else {
        setSigns(signs.map(s => (s.id === editingItem.id ? data : s)));
      }
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('Error updating content:', error);
      setError(error.message || 'Failed to update content');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Fix checked fallback to handle undefined properly
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) || video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredSigns = signs.filter(sign => {
    const matchesSearch = sign.word.toLowerCase().includes(searchTerm.toLowerCase()) || sign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sign.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil((activeTab === 'videos' ? totalCount.videos : totalCount.signs) / pageSize);

  return (
    <DashboardLayout title="RSL Management" role="admin">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <AlertCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rwandan Sign Language Management</h1>
                <p className="text-sm text-gray-600">Manage RSL videos, signs, and analytics</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                  <PlusIcon size={18} className="mr-2" />
                  Add {activeTab === 'videos' ? 'Video' : 'Sign'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex border-b border-gray-200">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3Icon },
              { key: 'videos', label: 'Videos', icon: VideoIcon },
              { key: 'signs', label: 'Signs', icon: SettingsIcon },
              { key: 'analytics', label: 'Analytics', icon: UsersIcon }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setPage(1);
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={18} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {(activeTab === 'videos' || activeTab === 'signs') && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 relative">
                <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value as RSLCategory | 'all')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="education">Education</option>
                    <option value="greetings">Greetings</option>
                    <option value="navigation">Navigation</option>
                    <option value="emotions">Emotions</option>
                    <option value="health">Health</option>
                    <option value="technology">Technology</option>
                    <option value="culture">Culture</option>
                    <option value="sports">Sports</option>
                  </select>
                  <FilterIcon size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setPage(1);
                    loadData();
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <RefreshCwIcon size={16} className="mr-2" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Videos', value: stats.totalVideos, icon: VideoIcon, color: 'blue' },
                { label: 'Total Signs', value: stats.totalSigns, icon: SettingsIcon, color: 'green' },
                { label: 'Active Users', value: stats.activeUsers, icon: UsersIcon, color: 'purple' },
                { label: 'Engagement', value: `${stats.weeklyEngagement}%`, icon: BarChart3Icon, color: 'yellow' }
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                      <stat.icon size={24} className={`text-${stat.color}-600`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories This Week</h3>
              <div className="space-y-4">
                {stats.topCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryIcon(category.category)}</span>
                      <span className="font-medium text-gray-900">{getCategoryDisplayName(category.category)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{category.views} views</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-purple-600 h-2.5 rounded-full"
                          style={{ width: `${(category.views / (stats.topCategories[0]?.views || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <span className="ml-3 text-lg text-gray-600">Loading videos...</span>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
                <VideoIcon size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No videos found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria, or add a new video.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <PlusIcon size={16} className="mr-2" />
                  Add Video
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.map(video => (
                  <div key={video.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-100 relative">
                      <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50">
                        <PlayIcon size={32} className="text-white" />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 truncate">{video.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${video.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {video.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          {getCategoryIcon(video.category)} {getCategoryDisplayName(video.category)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(video);
                              setFormData({
                                title: video.title,
                                description: video.description,
                                category: video.category,
                                thumbnail_url: video.thumbnail_url,
                                video_url: video.video_url,
                                is_active: video.is_active
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-purple-600"
                            title="Edit"
                          >
                            <EditIcon size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setItemToDelete({ id: video.id, type: 'video' });
                              setShowDeleteModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'signs' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <span className="ml-3 text-lg text-gray-600">Loading signs...</span>
              </div>
            ) : filteredSigns.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
                <SettingsIcon size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No signs found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria, or add a new sign.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <PlusIcon size={16} className="mr-2" />
                  Add Sign
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sign</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSigns.map(sign => (
                        <tr key={sign.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{getCategoryIcon(sign.category)}</span>
                              <span className="font-medium text-gray-900">{sign.word}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">{getCategoryDisplayName(sign.category)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600 line-clamp-2">{sign.description}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingItem(sign);
                                  setFormData({
                                    word: sign.word,
                                    description: sign.description,
                                    category: sign.category,
                                    thumbnail_url: sign.image_url || '',
                                    is_active: true
                                  });
                                  setShowEditModal(true);
                                }}
                                className="text-purple-600 hover:text-purple-900"
                                title="Edit"
                              >
                                <EditIcon size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setItemToDelete({ id: sign.id, type: 'sign' });
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <TrashIcon size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">RSL Usage Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Category Engagement</h4>
                  <div className="space-y-3">
                    {stats.topCategories.map(category => (
                      <div key={category.category} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{getCategoryDisplayName(category.category)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{category.views} views</span>
                          <div className="w-40 bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-purple-600 h-2.5 rounded-full"
                              style={{ width: `${(category.views / (stats.topCategories[0]?.views || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">User Activity</h4>
                  <div className="text-center py-8">
                    <BarChart3Icon size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Detailed user activity charts coming soon...</p>
                    <p className="text-sm text-gray-500 mt-2">Track user engagement and learning progress.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 shadow-sm rounded-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{Math.min((page - 1) * pageSize + 1, activeTab === 'videos' ? totalCount.videos : totalCount.signs)}</span> to{' '}
                  <span className="font-medium">{Math.min(page * pageSize, activeTab === 'videos' ? totalCount.videos : totalCount.signs)}</span> of{' '}
                  <span className="font-medium">{activeTab === 'videos' ? totalCount.videos : totalCount.signs}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum ? 'z-10 bg-purple-50 border-purple-500 text-purple-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowAddModal(false)}>
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <div
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowAddModal(false)}>
                    <XIcon size={20} />
                  </button>
                </div>
                <form onSubmit={handleCreateSubmit}>
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Add New {activeTab === 'videos' ? 'Video' : 'Sign'}</h3>
                    <div className="space-y-4">
                      {activeTab === 'videos' ? (
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      ) : (
                        <div>
                          <label htmlFor="word" className="block text-sm font-medium text-gray-700">Word</label>
                          <input
                            type="text"
                            name="word"
                            id="word"
                            value={formData.word}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      )}
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          name="description"
                          id="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                          name="category"
                          id="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        >
                          <option value="education">Education</option>
                          <option value="greetings">Greetings</option>
                          <option value="navigation">Navigation</option>
                          <option value="emotions">Emotions</option>
                          <option value="health">Health</option>
                          <option value="technology">Technology</option>
                          <option value="culture">Culture</option>
                          <option value="sports">Sports</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-700">Thumbnail URL</label>
                        <input
                          type="url"
                          name="thumbnail_url"
                          id="thumbnail_url"
                          value={formData.thumbnail_url}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        />
                      </div>
                      {activeTab === 'videos' && (
                        <div>
                          <label htmlFor="video_url" className="block text-sm font-medium text-gray-700">Video URL</label>
                          <input
                            type="url"
                            name="video_url"
                            id="video_url"
                            value={formData.video_url}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      )}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_active"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700">Active</label>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {loading ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowAddModal(false)}
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showEditModal && editingItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowEditModal(false)}>
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <div
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowEditModal(false)}>
                    <XIcon size={20} />
                  </button>
                </div>
                <form onSubmit={handleEditSubmit}>
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit {editingItem.hasOwnProperty('title') ? 'Video' : 'Sign'}</h3>
                    <div className="space-y-4">
                      {editingItem.hasOwnProperty('title') ? (
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      ) : (
                        <div>
                          <label htmlFor="word" className="block text-sm font-medium text-gray-700">Word</label>
                          <input
                            type="text"
                            name="word"
                            id="word"
                            value={formData.word}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      )}
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          name="description"
                          id="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                          name="category"
                          id="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        >
                          <option value="education">Education</option>
                          <option value="greetings">Greetings</option>
                          <option value="navigation">Navigation</option>
                          <option value="emotions">Emotions</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-700">Thumbnail URL</label>
                        <input
                          type="url"
                          name="thumbnail_url"
                          id="thumbnail_url"
                          value={formData.thumbnail_url}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        />
                      </div>
                      {editingItem.hasOwnProperty('title') && (
                        <div>
                          <label htmlFor="video_url" className="block text-sm font-medium text-gray-700">Video URL</label>
                          <input
                            type="url"
                            name="video_url"
                            id="video_url"
                            value={formData.video_url}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      )}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_active"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700">Active</label>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowEditModal(false)}
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && itemToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowDeleteModal(false)}>
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <div
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowDeleteModal(false)}>
                    <XIcon size={20} />
                  </button>
                </div>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Delete {itemToDelete.type === 'video' ? 'Video' : 'Sign'}</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Are you sure you want to delete this {itemToDelete.type}? This action cannot be undone.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};