import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { SearchIcon, FilterIcon, PlusIcon, TrashIcon, EditIcon, EyeIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon, AlertCircleIcon, FileTextIcon, CalendarIcon, UsersIcon, TagIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Link } from 'react-router-dom';
import { createAuditLog } from '../../../lib/supabase-utils';
interface Post {
  id: string;
  title: string;
  content: string;
  summary: string;
  author_id: string;
  is_published: boolean;
  publish_date: string;
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [audienceFilter, setAudienceFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchPosts();
  }, [typeFilter, audienceFilter, statusFilter]);
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      // In a real app, this would fetch from the database
      // For now, we'll simulate some data
      const mockPosts: Post[] = [{
        id: '1',
        title: 'Getting Started with Online Learning',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        summary: 'A comprehensive guide for beginners to online learning platforms',
        author_id: '123',
        is_published: true,
        publish_date: '2023-06-15T10:30:00Z',
        post_type: 'tutorial',
        target_audience: 'students',
        featured_image_url: 'https://via.placeholder.com/800x400?text=Online+Learning',
        tags: ['beginner', 'guide', 'online learning'],
        created_at: '2023-06-10T14:25:00Z',
        updated_at: '2023-06-15T10:30:00Z',
        author: {
          full_name: 'John Doe',
          avatar_url: 'https://via.placeholder.com/150?text=JD'
        }
      }, {
        id: '2',
        title: 'Latest Updates to Our Platform',
        content: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        summary: 'Check out the newest features and improvements',
        author_id: '456',
        is_published: true,
        publish_date: '2023-06-20T09:15:00Z',
        post_type: 'news',
        target_audience: 'all',
        featured_image_url: 'https://via.placeholder.com/800x400?text=Platform+Updates',
        tags: ['updates', 'features', 'platform'],
        created_at: '2023-06-18T16:40:00Z',
        updated_at: '2023-06-20T09:15:00Z',
        author: {
          full_name: 'Jane Smith',
          avatar_url: 'https://via.placeholder.com/150?text=JS'
        }
      }, {
        id: '3',
        title: 'Best Practices for Teaching Online',
        content: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        summary: 'Tips and tricks for effective online teaching',
        author_id: '789',
        is_published: false,
        publish_date: '2023-07-01T13:00:00Z',
        post_type: 'article',
        target_audience: 'teachers',
        featured_image_url: 'https://via.placeholder.com/800x400?text=Teaching+Online',
        tags: ['teaching', 'best practices', 'education'],
        created_at: '2023-06-25T11:30:00Z',
        updated_at: '2023-06-28T15:20:00Z',
        author: {
          full_name: 'Robert Johnson',
          avatar_url: 'https://via.placeholder.com/150?text=RJ'
        }
      }, {
        id: '4',
        title: 'The Future of E-Learning',
        content: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        summary: 'Exploring trends and innovations in online education',
        author_id: '123',
        is_published: true,
        publish_date: '2023-06-12T08:45:00Z',
        post_type: 'blog',
        target_audience: 'all',
        featured_image_url: 'https://via.placeholder.com/800x400?text=Future+E-Learning',
        tags: ['future', 'trends', 'e-learning', 'innovation'],
        created_at: '2023-06-08T09:20:00Z',
        updated_at: '2023-06-12T08:45:00Z',
        author: {
          full_name: 'John Doe',
          avatar_url: 'https://via.placeholder.com/150?text=JD'
        }
      }, {
        id: '5',
        title: 'Study Resources for Advanced Mathematics',
        content: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
        summary: 'Collection of resources for advanced math students',
        author_id: '456',
        is_published: true,
        publish_date: '2023-06-05T14:30:00Z',
        post_type: 'resource',
        target_audience: 'students',
        featured_image_url: 'https://via.placeholder.com/800x400?text=Math+Resources',
        tags: ['mathematics', 'resources', 'advanced'],
        created_at: '2023-06-01T10:15:00Z',
        updated_at: '2023-06-05T14:30:00Z',
        author: {
          full_name: 'Jane Smith',
          avatar_url: 'https://via.placeholder.com/150?text=JS'
        }
      }];
      // Apply filters
      let filteredPosts = [...mockPosts];
      if (searchTerm) {
        filteredPosts = filteredPosts.filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.content.toLowerCase().includes(searchTerm.toLowerCase()) || post.summary.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      if (typeFilter) {
        filteredPosts = filteredPosts.filter(post => post.post_type === typeFilter);
      }
      if (audienceFilter) {
        filteredPosts = filteredPosts.filter(post => post.target_audience === audienceFilter);
      }
      if (statusFilter !== null) {
        filteredPosts = filteredPosts.filter(post => post.is_published === statusFilter);
      }
      setPosts(filteredPosts);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'Failed to fetch posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };
  const handleDeleteClick = (id: string) => {
    setPostToDelete(id);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      setLoading(true);
      // In a real app, this would delete from the database
      setPosts(posts.filter(post => post.id !== postToDelete));
      setShowDeleteModal(false);
      setPostToDelete(null);
    } catch (err: any) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Failed to delete post');
    } finally {
      setLoading(false);
    }
  };
  const togglePublishStatus = async (id: string, currentStatus: boolean) => {
    try {
      // In a real app, this would update the database
      setPosts(posts.map(post => post.id === id ? {
        ...post,
        is_published: !currentStatus
      } : post));
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
    fetchPosts();
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  return <DashboardLayout title="Posts Management" role="admin">
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
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <form onSubmit={handleSearch}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
              </div>
              <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Search posts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </form>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={typeFilter || ''} onChange={e => setTypeFilter(e.target.value || null)}>
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
            {/* Audience Filter */}
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={audienceFilter || ''} onChange={e => setAudienceFilter(e.target.value || null)}>
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
            {/* Status Filter */}
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={statusFilter === null ? '' : statusFilter ? 'published' : 'draft'} onChange={e => {
              if (e.target.value === '') setStatusFilter(null);else setStatusFilter(e.target.value === 'published');
            }}>
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Reset Filters */}
            {(searchTerm || typeFilter || audienceFilter || statusFilter !== null) && <button onClick={resetFilters} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <RefreshCwIcon size={16} className="mr-2" />
                Reset
              </button>}
            {/* Create Post */}
            <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <PlusIcon size={16} className="mr-2" />
              Create Post
            </button>
          </div>
        </div>
      </div>
      {/* Posts Table */}
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
              {loading ? <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                      <span className="ml-2 text-gray-500">
                        Loading posts...
                      </span>
                    </div>
                  </td>
                </tr> : posts.length === 0 ? <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="text-center py-8">
                      <FileTextIcon size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        No posts found
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm || typeFilter || audienceFilter || statusFilter !== null ? 'Try adjusting your search or filter criteria.' : 'Get started by creating your first post.'}
                      </p>
                      {searchTerm || typeFilter || audienceFilter || statusFilter !== null ? <button onClick={resetFilters} className="mt-4 text-purple-600 hover:text-purple-800 font-medium">
                          Reset all filters
                        </button> : <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                          <PlusIcon size={16} className="mr-2" />
                          Create Post
                        </button>}
                    </div>
                  </td>
                </tr> : posts.map(post => <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                          {post.featured_image_url ? <img src={post.featured_image_url} alt={post.title} className="h-10 w-10 object-cover" /> : <div className="h-10 w-10 flex items-center justify-center bg-purple-100 text-purple-600">
                              <FileTextIcon size={20} />
                            </div>}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {post.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {post.summary}
                          </div>
                          {post.tags && post.tags.length > 0 && <div className="flex flex-wrap items-center mt-1 gap-1">
                              {post.tags.slice(0, 3).map((tag, index) => <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  <TagIcon size={10} className="mr-1" />
                                  {tag}
                                </span>)}
                              {post.tags.length > 3 && <span className="text-xs text-gray-500">
                                  +{post.tags.length - 3} more
                                </span>}
                            </div>}
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
                      <button onClick={() => togglePublishStatus(post.id, post.is_published)} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.is_published ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}>
                        {post.is_published ? <>
                            <CheckCircleIcon size={12} className="mr-1" />
                            Published
                          </> : <>
                            <XCircleIcon size={12} className="mr-1" />
                            Draft
                          </>}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon size={14} className="mr-1 text-gray-400" />
                        {formatDate(post.publish_date || post.created_at)}
                      </div>
                      {post.author && <div className="flex items-center mt-1">
                          <div className="flex-shrink-0 h-4 w-4 rounded-full overflow-hidden bg-gray-100">
                            {post.author.avatar_url ? <img src={post.author.avatar_url} alt={post.author.full_name} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gray-300"></div>}
                          </div>
                          <span className="ml-1.5 text-xs text-gray-500">
                            {post.author.full_name}
                          </span>
                        </div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-purple-600 hover:text-purple-900" title="Edit post">
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
                  </tr>)}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {posts.length > 0 && <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to{' '}
                  <span className="font-medium">{posts.length}</span> of{' '}
                  <span className="font-medium">{posts.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button aria-current="page" className="z-10 bg-purple-50 border-purple-500 text-purple-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>}
      </div>
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
                      Delete Post
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this post? This action
                        cannot be undone and the post will be permanently
                        removed.
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