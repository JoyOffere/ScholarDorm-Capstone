import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { PlusIcon, TrashIcon, EditIcon, EyeIcon, SearchIcon, FilterIcon, CheckCircleIcon, XCircleIcon, MegaphoneIcon, CalendarIcon, UsersIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Link } from 'react-router-dom';
import { createAuditLog } from '../../../lib/supabase-utils';
interface Announcement {
  id: string;
  title: string;
  content: string;
  summary: string;
  author_id: string;
  is_published: boolean;
  publish_date: string;
  post_type: 'announcement' | 'update' | 'motivational' | 'news' | 'blog';
  target_audience: 'all' | 'students' | 'admins' | 'teachers';
  featured_image_url?: string;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    avatar_url?: string;
  };
}
export const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [audienceFilter, setAudienceFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  useEffect(() => {
    fetchAnnouncements();
  }, [typeFilter, audienceFilter, statusFilter]);
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      let query = supabase.from('posts').select(`
          *,
          author:users!author_id(full_name, avatar_url)
        `).order('created_at', {
        ascending: false
      });
      // Apply filters
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
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      setAnnouncements(data as Announcement[]);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnnouncements();
  };
  const handleDeleteClick = (id: string) => {
    setAnnouncementToDelete(id);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!announcementToDelete) return;
    try {
      setLoading(true);
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      const {
        error
      } = await supabase.from('posts').delete().eq('id', announcementToDelete);
      if (error) throw error;
      // Create audit log
      if (user) {
        await createAuditLog(user.id, 'admin_content_delete', {
          content_type: 'announcement',
          content_id: announcementToDelete
        });
      }
      // Update local state
      setAnnouncements(announcements.filter(a => a.id !== announcementToDelete));
      setShowDeleteModal(false);
      setAnnouncementToDelete(null);
    } catch (error) {
      console.error('Error deleting announcement:', error);
    } finally {
      setLoading(false);
    }
  };
  const togglePublishStatus = async (id: string, currentStatus: boolean) => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      const {
        error
      } = await supabase.from('posts').update({
        is_published: !currentStatus,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      // Create audit log
      if (user) {
        await createAuditLog(user.id, 'admin_content_update', {
          content_type: 'announcement',
          content_id: id,
          action: currentStatus ? 'unpublish' : 'publish'
        });
      }
      // Update local state
      setAnnouncements(announcements.map(a => a.id === id ? {
        ...a,
        is_published: !currentStatus
      } : a));
    } catch (error) {
      console.error('Error toggling announcement status:', error);
    }
  };
  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter(null);
    setAudienceFilter(null);
    setStatusFilter(null);
  };
  return <DashboardLayout title="Announcements" role="admin">
      {/* Filters and actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <form onSubmit={handleSearch}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
              </div>
              <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Search announcements..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </form>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={typeFilter || ''} onChange={e => setTypeFilter(e.target.value || null)}>
                <option value="">All Types</option>
                <option value="announcement">Announcement</option>
                <option value="update">Update</option>
                <option value="motivational">Motivational</option>
                <option value="news">News</option>
                <option value="blog">Blog</option>
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
                <option value="admins">Admins</option>
                <option value="teachers">Teachers</option>
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
                Reset Filters
              </button>}
            {/* Create Announcement */}
            <Link to="/admin/announcements/create" className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <PlusIcon size={16} className="mr-2" />
              New Announcement
            </Link>
          </div>
        </div>
      </div>
      {/* Announcements Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Announcement
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
                        Loading announcements...
                      </span>
                    </div>
                  </td>
                </tr> : announcements.length === 0 ? <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="text-center py-8">
                      <MegaphoneIcon size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        No announcements found
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm || typeFilter || audienceFilter || statusFilter !== null ? 'Try adjusting your search or filter criteria.' : 'Get started by creating your first announcement.'}
                      </p>
                      {searchTerm || typeFilter || audienceFilter || statusFilter !== null ? <button onClick={resetFilters} className="mt-4 text-purple-600 hover:text-purple-800 font-medium">
                          Reset all filters
                        </button> : <Link to="/admin/announcements/create" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                          <PlusIcon size={16} className="mr-2" />
                          Create Announcement
                        </Link>}
                    </div>
                  </td>
                </tr> : announcements.map(announcement => <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                          {announcement.featured_image_url ? <img src={announcement.featured_image_url} alt={announcement.title} className="h-10 w-10 object-cover" /> : <div className="h-10 w-10 flex items-center justify-center bg-purple-100 text-purple-600">
                              <MegaphoneIcon size={20} />
                            </div>}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {announcement.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {announcement.summary}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {announcement.post_type.charAt(0).toUpperCase() + announcement.post_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UsersIcon size={14} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {announcement.target_audience.charAt(0).toUpperCase() + announcement.target_audience.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => togglePublishStatus(announcement.id, announcement.is_published)} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${announcement.is_published ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}>
                        {announcement.is_published ? <>
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
                        {new Date(announcement.publish_date || announcement.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/admin/announcements/${announcement.id}/edit`} className="text-purple-600 hover:text-purple-900" title="Edit announcement">
                          <EditIcon size={16} />
                        </Link>
                        <button onClick={() => handleDeleteClick(announcement.id)} className="text-red-600 hover:text-red-900" title="Delete announcement">
                          <TrashIcon size={16} />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900" title="Preview announcement">
                          <EyeIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {announcements.length > 0 && <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to{' '}
                  <span className="font-medium">{announcements.length}</span> of{' '}
                  <span className="font-medium">{announcements.length}</span>{' '}
                  results
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
                      Delete Announcement
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this announcement? This
                        action cannot be undone.
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