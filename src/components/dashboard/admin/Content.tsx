import React, { useEffect, useState, Fragment } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { SearchIcon, FilterIcon, PlusIcon, TrashIcon, EditIcon, EyeIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon, AlertCircleIcon, LayersIcon, FolderIcon, FileIcon, ImageIcon, FileTextIcon, VideoIcon, LinkIcon, DownloadIcon, UploadIcon, MoreHorizontalIcon, XIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { createAuditLog } from '../../../lib/supabase-utils';

interface ContentItem {
  id: string;
  title: string;
  type: 'folder' | 'file' | 'image' | 'video' | 'document' | 'audio' | 'link';
  size?: number;
  thumbnail_url?: string;
  url?: string;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_published: boolean;
}

export const AdminContent: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Root' }]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    type: 'folder' as 'folder' | 'file' | 'image' | 'video' | 'document' | 'audio' | 'link',
    url: '',
    thumbnail_url: '',
    is_published: true
  });
  const [editFormData, setEditFormData] = useState({
    title: '',
    type: 'folder' as 'folder' | 'file' | 'image' | 'video' | 'document' | 'audio' | 'link',
    url: '',
    thumbnail_url: '',
    is_published: true
  });

  useEffect(() => {
    fetchContent();
  }, [currentFolder, typeFilter, statusFilter, page, searchTerm]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('content')
        .select('*', { count: 'exact' });

      if (currentFolder === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', currentFolder);
      }

      query = query.order('created_at', { ascending: false }).range(from, to);

      if (typeFilter) {
        query = query.eq('type', typeFilter);
      }
      if (statusFilter !== null) {
        query = query.eq('is_published', statusFilter);
      }
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setContent(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching content:', err);
      setError(err.message || 'Failed to fetch content');
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    setCurrentFolder(folderId);
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: 'Root' }]);
    } else {
      setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
    }
    setPage(1);
  };

  const navigateToBreadcrumb = (index: number) => {
    const targetBreadcrumb = breadcrumbs[index];
    setCurrentFolder(targetBreadcrumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setPage(1);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !user) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('content').delete().eq('id', itemToDelete);

      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_delete', {
        entity_type: 'content',
        entity_id: itemToDelete
      });

      setContent(content.filter(item => item.id !== itemToDelete));
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchContent();
    } catch (err: any) {
      console.error('Error deleting content:', err);
      setError(err.message || 'Failed to delete content');
    } finally {
      setLoading(false);
    }
  };

  const togglePublishStatus = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('content')
        .update({ is_published: newStatus })
        .eq('id', id);

      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_update', {
        entity_type: 'content',
        entity_id: id,
        action: newStatus ? 'publish_content' : 'unpublish_content'
      });

      setContent(content.map(item => (item.id === id ? { ...item, is_published: newStatus } : item)));
    } catch (err: any) {
      console.error('Error toggling content status:', err);
      setError(err.message || 'Failed to update content status');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter(null);
    setStatusFilter(null);
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return <FolderIcon className="text-yellow-500" size={24} />;
      case 'file':
        return <FileIcon className="text-blue-500" size={24} />;
      case 'image':
        return <ImageIcon className="text-green-500" size={24} />;
      case 'video':
        return <VideoIcon className="text-red-500" size={24} />;
      case 'document':
        return <FileTextIcon className="text-purple-500" size={24} />;
      case 'link':
        return <LinkIcon className="text-cyan-500" size={24} />;
      default:
        return <FileIcon className="text-gray-500" size={24} />;
    }
  };

  const handleCreateClick = () => {
    setCreateFormData({
      title: '',
      type: 'folder',
      url: '',
      thumbnail_url: '',
      is_published: true
    });
    setShowCreateModal(true);
  };

  const handleEditClick = (item: ContentItem) => {
    setSelectedItem(item);
    setEditFormData({
      title: item.title,
      type: item.type,
      url: item.url || '',
      thumbnail_url: item.thumbnail_url || '',
      is_published: item.is_published
    });
    setShowEditModal(true);
  };

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked ?? false;

    setCreateFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked ?? false;

    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content')
        .insert([{ ...createFormData, parent_id: currentFolder, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_create', {
        entity_type: 'content',
        entity_id: data.id,
        action: 'create_content'
      });

      setShowCreateModal(false);
      fetchContent();
    } catch (err: any) {
      console.error('Error creating content:', err);
      setError(err.message || 'Failed to create content');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedItem) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content')
        .update(editFormData)
        .eq('id', selectedItem.id)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_update', {
        entity_type: 'content',
        entity_id: selectedItem.id,
        action: 'update_content'
      });

      setContent(content.map(item => (item.id === selectedItem.id ? data : item)));
      setShowEditModal(false);
      setSelectedItem(null);
    } catch (err: any) {
      console.error('Error updating content:', err);
      setError(err.message || 'Failed to update content');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <DashboardLayout title="Content Management" role="admin">
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
              placeholder="Search content..."
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
                <option value="folder">Folders</option>
                <option value="file">Files</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
                <option value="link">Links</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            <div className="relative">
              <select
                className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={statusFilter === null ? '' : statusFilter ? 'published' : 'unpublished'}
                onChange={e => {
                  if (e.target.value === '') setStatusFilter(null);
                  else setStatusFilter(e.target.value === 'published');
                }}
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            <div className="flex border border-gray-300 rounded-lg">
              <button
                className={`p-2 ${view === 'grid' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-500'}`}
                onClick={() => setView('grid')}
                aria-label="Grid view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button
                className={`p-2 ${view === 'list' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-500'}`}
                onClick={() => setView('list')}
                aria-label="List view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
            </div>
            {(searchTerm || typeFilter || statusFilter !== null) && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <RefreshCwIcon size={16} className="mr-2" />
                Reset
              </button>
            )}
            <button
              onClick={fetchContent}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <RefreshCwIcon size={16} className="mr-2" />
              Refresh
            </button>
            <button
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <UploadIcon size={16} className="mr-2" />
              Upload
            </button>
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <PlusIcon size={16} className="mr-2" />
              New
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6 flex items-center overflow-x-auto">
        <div className="flex items-center space-x-2">
          <FolderIcon size={16} className="text-gray-500" />
          <nav className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={index}>
                {index > 0 && <span className="text-gray-400">/</span>}
                <button
                  className={`text-sm ${index === breadcrumbs.length - 1 ? 'font-medium text-purple-600' : 'text-gray-600 hover:text-purple-600'}`}
                  onClick={() => navigateToBreadcrumb(index)}
                >
                  {crumb.name}
                </button>
              </Fragment>
            ))}
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-lg text-gray-600">Loading content...</span>
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-16">
            <LayersIcon size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No content found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || typeFilter || statusFilter !== null
                ? 'Try adjusting your search or filter criteria.'
                : currentFolder === null
                ? 'Get started by uploading content or creating a folder.'
                : 'This folder is empty. Upload content or create a subfolder.'}
            </p>
            {searchTerm || typeFilter || statusFilter !== null ? (
              <button onClick={resetFilters} className="text-purple-600 hover:text-purple-800 font-medium">
                Reset all filters
              </button>
            ) : (
              <div className="flex items-center justify-center space-x-4">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <UploadIcon size={16} className="mr-2" />
                  Upload Files
                </button>
                <button
                  onClick={handleCreateClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <PlusIcon size={16} className="mr-2" />
                  New Folder
                </button>
              </div>
            )}
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {content.map(item => (
              <div key={item.id} className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                <div
                  className="h-32 flex items-center justify-center bg-gray-50 relative"
                  onClick={() => item.type === 'folder' ? navigateToFolder(item.id, item.title) : null}
                >
                  {item.thumbnail_url && item.type !== 'folder' ? (
                    <img src={item.thumbnail_url} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center">{getItemIcon(item.type)}</div>
                  )}
                  {item.type !== 'folder' && (
                    <div className="absolute top-2 right-2">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          item.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-medium text-gray-900 truncate ${
                          item.type === 'folder' ? 'cursor-pointer hover:text-purple-600' : ''
                        }`}
                        onClick={() => item.type === 'folder' ? navigateToFolder(item.id, item.title) : null}
                      >
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{item.type !== 'folder' && item.type !== 'link' ? formatSize(item.size) : ''}</p>
                    </div>
                    <div className="ml-2">
                      <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
                        <MoreHorizontalIcon size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>Updated {formatDate(item.updated_at)}</span>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.type !== 'folder' && (
                        <button
                          onClick={() => togglePublishStatus(item.id, item.is_published)}
                          className="p-1 rounded-full hover:bg-gray-100"
                          title={item.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {item.is_published ? <XCircleIcon size={14} className="text-gray-600" /> : <CheckCircleIcon size={14} className="text-gray-600" />}
                        </button>
                      )}
                      <button onClick={() => handleEditClick(item)} className="p-1 rounded-full hover:bg-gray-100" title="Edit">
                        <EditIcon size={14} className="text-gray-600" />
                      </button>
                      <button onClick={() => handleDeleteClick(item.id)} className="p-1 rounded-full hover:bg-gray-100" title="Delete">
                        <TrashIcon size={14} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {content.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">{getItemIcon(item.type)}</div>
                        <div className="ml-4">
                          <div
                            className={`text-sm font-medium text-gray-900 ${item.type === 'folder' ? 'cursor-pointer hover:text-purple-600' : ''}`}
                            onClick={() => item.type === 'folder' ? navigateToFolder(item.id, item.title) : null}
                          >
                            {item.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">{item.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type !== 'folder' && item.type !== 'link' ? formatSize(item.size) : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.type !== 'folder' ? (
                        <button
                          onClick={() => togglePublishStatus(item.id, item.is_published)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.is_published ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }`}
                        >
                          {item.is_published ? (
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
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.updated_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {item.type !== 'folder' && (
                          <button className="text-blue-600 hover:text-blue-900" title="Preview">
                            <EyeIcon size={16} />
                          </button>
                        )}
                        {item.type !== 'folder' && item.type !== 'link' && (
                          <button className="text-green-600 hover:text-green-900" title="Download">
                            <DownloadIcon size={16} />
                          </button>
                        )}
                        <button onClick={() => handleEditClick(item)} className="text-purple-600 hover:text-purple-900" title="Edit">
                          <EditIcon size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(item.id)} className="text-red-600 hover:text-red-900" title="Delete">
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Item</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Are you sure you want to delete this item? This action cannot be undone.</p>
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

      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowCreateModal(false)}>
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowCreateModal(false)}>
                  <XIcon size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Create New Content</h3>
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
                      <label htmlFor="create-type" className="block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        name="type"
                        id="create-type"
                        value={createFormData.type}
                        onChange={handleCreateInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      >
                        <option value="folder">Folder</option>
                        <option value="file">File</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="document">Document</option>
                        <option value="audio">Audio</option>
                        <option value="link">Link</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="create-url" className="block text-sm font-medium text-gray-700">
                        URL
                      </label>
                      <input
                        type="url"
                        name="url"
                        id="create-url"
                        value={createFormData.url}
                        onChange={handleCreateInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="create-thumbnail_url" className="block text-sm font-medium text-gray-700">
                        Thumbnail URL
                      </label>
                      <input
                        type="url"
                        name="thumbnail_url"
                        id="create-thumbnail_url"
                        value={createFormData.thumbnail_url}
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
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit Content</h3>
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
                      <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        name="type"
                        id="edit-type"
                        value={editFormData.type}
                        onChange={handleEditInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      >
                        <option value="folder">Folder</option>
                        <option value="file">File</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="document">Document</option>
                        <option value="audio">Audio</option>
                        <option value="link">Link</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="edit-url" className="block text-sm font-medium text-gray-700">
                        URL
                      </label>
                      <input
                        type="url"
                        name="url"
                        id="edit-url"
                        value={editFormData.url}
                        onChange={handleEditInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-thumbnail_url" className="block text-sm font-medium text-gray-700">
                        Thumbnail URL
                      </label>
                      <input
                        type="url"
                        name="thumbnail_url"
                        id="edit-thumbnail_url"
                        value={editFormData.thumbnail_url}
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
    </DashboardLayout>
  );
};