import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { SearchIcon, FilterIcon, PlusIcon, TrashIcon, EditIcon, EyeIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon, AlertCircleIcon, FileTextIcon, CalendarIcon, UsersIcon, TagIcon, XIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { createAuditLog } from '../../../lib/supabase-utils';
import { useAuth } from '../../../contexts/AuthContext';

interface Post {
  id: string;
  title: string;
  content: string;
  summary: string;
  author_id: string;
  is_published: boolean;
  publish_date?: string | null;
  post_type: 'blog' | 'article' | 'resource' | 'tutorial' | 'news';
  target_audience: 'all' | 'students' | 'admins' | 'teachers';
  featured_image_url?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    avatar_url?: string;
  };
}

export const AdminPosts: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [audienceFilter, setAudienceFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    content: '',
    summary: '',
    post_type: 'blog' as 'blog' | 'article' | 'resource' | 'tutorial' | 'news',
    target_audience: 'all' as 'all' | 'students' | 'admins' | 'teachers',
    featured_image_url: '',
    tags: [] as string[],
    is_published: false
  });
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    summary: '',
    post_type: 'blog' as 'blog' | 'article' | 'resource' | 'tutorial' | 'news',
    target_audience: 'all' as 'all' | 'students' | 'admins' | 'teachers',
    featured_image_url: '',
    tags: [] as string[],
    is_published: false
  });

  useEffect(() => {
    fetchPosts();
  }, [searchTerm, typeFilter, audienceFilter, statusFilter, page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('posts')
        .select(
          `
          *,
          author:users!posts_author_id_fkey (
            full_name,
            avatar_url
          )
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      if (typeFilter) {
        query = query.eq('post_type', typeFilter);
      }
      if (audienceFilter) {
        query = query.eq('target_audience', audienceFilter);
      }
      if (statusFilter !== null) {
        query = query.eq('is_published', statusFilter);
      }
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setPosts(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'Failed to fetch posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setPostToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete || !user) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('posts').delete().eq('id', postToDelete);

      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_delete', { entity_type: 'post', entity_id: postToDelete, action: 'delete_post' });

      setPosts(posts.filter(post => post.id !== postToDelete));
      setShowDeleteModal(false);
      setPostToDelete(null);
      fetchPosts(); // Refresh to handle pagination
    } catch (err: any) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  const togglePublishStatus = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      const newStatus = !currentStatus;
      const { data, error } = await supabase
        .from('posts')
        .update({
          is_published: newStatus,
          publish_date: newStatus ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_update', {
        entity_type: 'post',
        entity_id: id,
        action: newStatus ? 'publish_post' : 'unpublish_post'
      });

      setPosts(posts.map(post => post.id === id ? data : post));
    } catch (err: any) {
      console.error('Error toggling post status:', err);
      setError(err.message || 'Failed to update post status');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter(null);
    setAudienceFilter(null);
    setStatusFilter(null);
    setPage(1);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleCreateClick = () => {
    setCreateFormData({
      title: '',
      content: '',
      summary: '',
      post_type: 'blog',
      target_audience: 'all',
      featured_image_url: '',
      tags: [],
      is_published: false
    });
    setShowCreateModal(true);
  };

  const handleEditClick = (post: Post) => {
    setSelectedPost(post);
    setEditFormData({
      title: post.title,
      content: post.content,
      summary: post.summary,
      post_type: post.post_type,
      target_audience: post.target_audience,
      featured_image_url: post.featured_image_url || '',
      tags: post.tags || [],
      is_published: post.is_published
    });
    setShowEditModal(true);
  };

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked ?? false;

    setCreateFormData(prev => ({
      ...prev,
      [name]: name === 'tags' ? value.split(',').map(tag => tag.trim()).filter(tag => tag) :
               type === 'checkbox' ? checked : value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked ?? false;

    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'tags' ? value.split(',').map(tag => tag.trim()).filter(tag => tag) :
               type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          ...createFormData,
          author_id: user.id,
          publish_date: createFormData.is_published ? new Date().toISOString() : null
        }])
        .select(
          `
          *,
          author:users!posts_author_id_fkey (
            full_name,
            avatar_url
          )
        `
        )
        .single();

      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_create', {
        entity_type: 'post',
        entity_id: data.id,
        action: 'create_post'
      });

      setShowCreateModal(false);
      fetchPosts();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPost) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .update({
          ...editFormData,
          publish_date: editFormData.is_published ? (selectedPost.is_published ? selectedPost.publish_date : new Date().toISOString()) : null
        })
        .eq('id', selectedPost.id)
        .select(
          `
          *,
          author:users!posts_author_id_fkey (
            full_name,
            avatar_url
          )
        `
        )
        .single();

      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_update', {
        entity_type: 'post',
        entity_id: selectedPost.id,
        action: 'update_post'
      });

      setPosts(posts.map(post => post.id === selectedPost.id ? data : post));
      setShowEditModal(false);
      setSelectedPost(null);
    } catch (err: any) {
      console.error('Error updating post:', err);
      setError(err.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <DashboardLayout title="Posts Management" role="admin">
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

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={typeFilter || ''}
                onChange={e => setTypeFilter(e.target.value || null)}
              >
                <option value="">All Types</option>
                <option value="blog">Blog</option>
                <option value="article">Article</option>
                <option value="resource">Resource</option>
                <option value="tutorial">Tutorial</option>
                <option value="news">News</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            <div className="relative">
              <select
                className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={audienceFilter || ''}
                onChange={e => setAudienceFilter(e.target.value || null)}
              >
                <option value="">All Audiences</option>
                <option value="all">Everyone</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="admins">Admins</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            <div className="relative">
              <select
                className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={statusFilter === null ? '' : statusFilter ? 'published' : 'draft'}
                onChange={e => {
                  if (e.target.value === '') setStatusFilter(null);
                  else setStatusFilter(e.target.value === 'published');
                }}
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {(searchTerm || typeFilter || audienceFilter || statusFilter !== null) && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <RefreshCwIcon size={16} className="mr-2" />
                Reset
              </button>
            )}
            <button
              onClick={fetchPosts}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <RefreshCwIcon size={16} className="mr-2" />
              Refresh
            </button>
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <PlusIcon size={16} className="mr-2" />
              Create Post
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Post
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audience
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                      <span className="ml-2 text-gray-500">Loading posts...</span>
                    </div>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="text-center py-8">
                      <FileTextIcon size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No posts found</h3>
                      <p className="text-gray-600">
                        {searchTerm || typeFilter || audienceFilter || statusFilter !== null
                          ? 'Try adjusting your search or filter criteria.'
                          : 'Get started by creating your first post.'}
                      </p>
                      {searchTerm || typeFilter || audienceFilter || statusFilter !== null ? (
                        <button onClick={resetFilters} className="mt-4 text-purple-600 hover:text-purple-800 font-medium">
                          Reset all filters
                        </button>
                      ) : (
                        <button
                          onClick={handleCreateClick}
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                        >
                          <PlusIcon size={16} className="mr-2" />
                          Create Post
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                          {post.featured_image_url ? (
                            <img src={post.featured_image_url} alt={post.title} className="h-10 w-10 object-cover" />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center bg-purple-100 text-purple-600">
                              <FileTextIcon size={20} />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{post.title}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{post.summary}</div>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap items-center mt-1 gap-1">
                              {post.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  <TagIcon size={10} className="mr-1" />
                                  {tag}
                                </span>
                              ))}
                              {post.tags.length > 3 && <span className="text-xs text-gray-500">+{post.tags.length - 3} more</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {post.post_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UsersIcon size={14} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 capitalize">
                          {post.target_audience === 'all' ? 'Everyone' : post.target_audience}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => togglePublishStatus(post.id, post.is_published)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.is_published ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {post.is_published ? (
                          <>
                            <CheckCircleIcon size={12} className="mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <XCircleIcon size={12} className="mr-1" />
                            Draft
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon size={14} className="mr-1 text-gray-400" />
                        {formatDate(post.publish_date || post.created_at)}
                      </div>
                      {post.author && (
                        <div className="flex items-center mt-1">
                          <div className="flex-shrink-0 h-4 w-4 rounded-full overflow-hidden bg-gray-100">
                            {post.author.avatar_url ? (
                              <img src={post.author.avatar_url} alt={post.author.full_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gray-300"></div>
                            )}
                          </div>
                          <span className="ml-1.5 text-xs text-gray-500">{post.author.full_name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleEditClick(post)} className="text-purple-600 hover:text-purple-900" title="Edit post">
                          <EditIcon size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(post.id)} className="text-red-600 hover:text-red-900" title="Delete post">
                          <TrashIcon size={16} />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900" title="Preview post">
                          <EyeIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                  Showing <span className="font-medium">{Math.min((page - 1) * pageSize + 1, totalCount)}</span> to{' '}
                  <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
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
                    let pageNum =
                      totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
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
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowCreateModal(false)}>
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowCreateModal(false)}>
                  <XIcon size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Create New Post</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="create-title" className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="create-title"
                        value={createFormData.title}
                        onChange={handleCreateInputChange}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="create-summary" className="block text-sm font-medium text-gray-700">
                        Summary
                      </label>
                      <textarea
                        name="summary"
                        id="create-summary"
                        value={createFormData.summary}
                        onChange={handleCreateInputChange}
                        required
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="create-content" className="block text-sm font-medium text-gray-700">
                        Content
                      </label>
                      <textarea
                        name="content"
                        id="create-content"
                        value={createFormData.content}
                        onChange={handleCreateInputChange}
                        required
                        rows={10}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="create-post_type" className="block text-sm font-medium text-gray-700">
                          Post Type
                        </label>
                        <select
                          name="post_type"
                          id="create-post_type"
                          value={createFormData.post_type}
                          onChange={handleCreateInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        >
                          <option value="blog">Blog</option>
                          <option value="article">Article</option>
                          <option value="resource">Resource</option>
                          <option value="tutorial">Tutorial</option>
                          <option value="news">News</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="create-target_audience" className="block text-sm font-medium text-gray-700">
                          Target Audience
                        </label>
                        <select
                          name="target_audience"
                          id="create-target_audience"
                          value={createFormData.target_audience}
                          onChange={handleCreateInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        >
                          <option value="all">Everyone</option>
                          <option value="students">Students</option>
                          <option value="admins">Admins</option>
                          <option value="teachers">Teachers</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="create-featured_image_url" className="block text-sm font-medium text-gray-700">
                        Featured Image URL
                      </label>
                      <input
                        type="url"
                        name="featured_image_url"
                        id="create-featured_image_url"
                        value={createFormData.featured_image_url}
                        onChange={handleCreateInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="create-tags" className="block text-sm font-medium text-gray-700">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        name="tags"
                        id="create-tags"
                        value={createFormData.tags.join(', ')}
                        onChange={handleCreateInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_published"
                        id="create-is_published"
                        checked={createFormData.is_published}
                        onChange={handleCreateInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="create-is_published" className="ml-2 block text-sm font-medium text-gray-700">
                        Publish immediately
                      </label>
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
                    onClick={() => setShowCreateModal(false)}
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

      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowEditModal(false)}>
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowEditModal(false)}>
                  <XIcon size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit Post</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="edit-title"
                        value={editFormData.title}
                        onChange={handleEditInputChange}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-summary" className="block text-sm font-medium text-gray-700">
                        Summary
                      </label>
                      <textarea
                        name="summary"
                        id="edit-summary"
                        value={editFormData.summary}
                        onChange={handleEditInputChange}
                        required
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700">
                        Content
                      </label>
                      <textarea
                        name="content"
                        id="edit-content"
                        value={editFormData.content}
                        onChange={handleEditInputChange}
                        required
                        rows={10}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="edit-post_type" className="block text-sm font-medium text-gray-700">
                          Post Type
                        </label>
                        <select
                          name="post_type"
                          id="edit-post_type"
                          value={editFormData.post_type}
                          onChange={handleEditInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        >
                          <option value="blog">Blog</option>
                          <option value="article">Article</option>
                          <option value="resource">Resource</option>
                          <option value="tutorial">Tutorial</option>
                          <option value="news">News</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="edit-target_audience" className="block text-sm font-medium text-gray-700">
                          Target Audience
                        </label>
                        <select
                          name="target_audience"
                          id="edit-target_audience"
                          value={editFormData.target_audience}
                          onChange={handleEditInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        >
                          <option value="all">Everyone</option>
                          <option value="students">Students</option>
                          <option value="admins">Admins</option>
                          <option value="teachers">Teachers</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="edit-featured_image_url" className="block text-sm font-medium text-gray-700">
                        Featured Image URL
                      </label>
                      <input
                        type="url"
                        name="featured_image_url"
                        id="edit-featured_image_url"
                        value={editFormData.featured_image_url}
                        onChange={handleEditInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        name="tags"
                        id="edit-tags"
                        value={editFormData.tags.join(', ')}
                        onChange={handleEditInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_published"
                        id="edit-is_published"
                        checked={editFormData.is_published}
                        onChange={handleEditInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="edit-is_published" className="ml-2 block text-sm font-medium text-gray-700">
                        Published
                      </label>
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

      {showDeleteModal && (
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
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Post</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this post? This action cannot be undone and the post will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};