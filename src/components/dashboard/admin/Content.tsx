import React, { useEffect, useState, Fragment } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { SearchIcon, FilterIcon, PlusIcon, TrashIcon, EditIcon, EyeIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon, AlertCircleIcon, LayersIcon, FolderIcon, FileIcon, ImageIcon, FileTextIcon, VideoIcon, LinkIcon, DownloadIcon, UploadIcon, MoreHorizontalIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
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
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{
    id: string | null;
    name: string;
  }[]>([{
    id: null,
    name: 'Root'
  }]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  useEffect(() => {
    fetchContent();
  }, [currentFolder, typeFilter, statusFilter]);
  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      // In a real app, this would fetch from a content table
      // For now, we'll simulate some data
      const mockContent: ContentItem[] = [{
        id: '1',
        title: 'Course Materials',
        type: 'folder',
        created_at: '2023-06-10T14:25:00Z',
        updated_at: '2023-06-15T10:30:00Z',
        created_by: '123',
        parent_id: null,
        is_published: true
      }, {
        id: '2',
        title: 'Student Resources',
        type: 'folder',
        created_at: '2023-05-22T09:15:00Z',
        updated_at: '2023-06-18T11:30:00Z',
        created_by: '456',
        parent_id: null,
        is_published: true
      }, {
        id: '3',
        title: 'Introduction to Algebra',
        type: 'document',
        size: 1024 * 1024 * 2.5,
        thumbnail_url: 'https://via.placeholder.com/150?text=PDF',
        url: '#',
        created_at: '2023-06-05T16:20:00Z',
        updated_at: '2023-06-05T16:20:00Z',
        created_by: '789',
        parent_id: null,
        is_published: true
      }, {
        id: '4',
        title: 'Campus Tour Video',
        type: 'video',
        size: 1024 * 1024 * 15.8,
        thumbnail_url: 'https://via.placeholder.com/150?text=Video',
        url: '#',
        created_at: '2023-06-12T13:10:00Z',
        updated_at: '2023-06-12T13:10:00Z',
        created_by: '123',
        parent_id: null,
        is_published: true
      }, {
        id: '5',
        title: 'Student Handbook',
        type: 'file',
        size: 1024 * 1024 * 1.2,
        thumbnail_url: 'https://via.placeholder.com/150?text=File',
        url: '#',
        created_at: '2023-06-08T11:25:00Z',
        updated_at: '2023-06-08T11:25:00Z',
        created_by: '456',
        parent_id: null,
        is_published: false
      }, {
        id: '6',
        title: 'Campus Map',
        type: 'image',
        size: 1024 * 1024 * 0.8,
        thumbnail_url: 'https://via.placeholder.com/150?text=Image',
        url: '#',
        created_at: '2023-06-20T10:05:00Z',
        updated_at: '2023-06-20T10:05:00Z',
        created_by: '789',
        parent_id: null,
        is_published: true
      }, {
        id: '7',
        title: 'Online Learning Resources',
        type: 'link',
        url: 'https://example.com/resources',
        created_at: '2023-06-18T09:30:00Z',
        updated_at: '2023-06-18T09:30:00Z',
        created_by: '123',
        parent_id: null,
        is_published: true
      }];
      // Filter by current folder
      let filteredContent = mockContent.filter(item => item.parent_id === currentFolder);
      // Apply filters
      if (searchTerm) {
        filteredContent = filteredContent.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      if (typeFilter) {
        filteredContent = filteredContent.filter(item => item.type === typeFilter);
      }
      if (statusFilter !== null) {
        filteredContent = filteredContent.filter(item => item.is_published === statusFilter);
      }
      setContent(filteredContent);
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
      // Going to root
      setBreadcrumbs([{
        id: null,
        name: 'Root'
      }]);
    } else {
      // Going into a folder
      const newBreadcrumbs = [...breadcrumbs, {
        id: folderId,
        name: folderName
      }];
      setBreadcrumbs(newBreadcrumbs);
    }
    // Reset filters when changing folders
    setSearchTerm('');
    setTypeFilter(null);
    setStatusFilter(null);
  };
  const navigateToBreadcrumb = (index: number) => {
    const targetBreadcrumb = breadcrumbs[index];
    setCurrentFolder(targetBreadcrumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContent();
  };
  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setLoading(true);
      // In a real app, this would delete from the database
      setContent(content.filter(item => item.id !== itemToDelete));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err: any) {
      console.error('Error deleting content:', err);
      setError(err.message || 'Failed to delete content');
    } finally {
      setLoading(false);
    }
  };
  const togglePublishStatus = async (id: string, currentStatus: boolean) => {
    try {
      // In a real app, this would update the database
      setContent(content.map(item => item.id === id ? {
        ...item,
        is_published: !currentStatus
      } : item));
    } catch (err: any) {
      console.error('Error toggling content status:', err);
      setError(err.message || 'Failed to update content status');
    }
  };
  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter(null);
    setStatusFilter(null);
    fetchContent();
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
  return <DashboardLayout title="Content Management" role="admin">
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
              <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Search content..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </form>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={typeFilter || ''} onChange={e => setTypeFilter(e.target.value || null)}>
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
            {/* Status Filter */}
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={statusFilter === null ? '' : statusFilter ? 'published' : 'unpublished'} onChange={e => {
              if (e.target.value === '') setStatusFilter(null);else setStatusFilter(e.target.value === 'published');
            }}>
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg">
              <button className={`p-2 ${view === 'grid' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-500'}`} onClick={() => setView('grid')} aria-label="Grid view">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button className={`p-2 ${view === 'list' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-500'}`} onClick={() => setView('list')} aria-label="List view">
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
            {/* Reset Filters */}
            {(searchTerm || typeFilter || statusFilter !== null) && <button onClick={resetFilters} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <RefreshCwIcon size={16} className="mr-2" />
                Reset
              </button>}
            {/* Upload Button */}
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <UploadIcon size={16} className="mr-2" />
              Upload
            </button>
            {/* Create Folder/Content */}
            <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <PlusIcon size={16} className="mr-2" />
              New
            </button>
          </div>
        </div>
      </div>
      {/* Breadcrumbs */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6 flex items-center overflow-x-auto">
        <div className="flex items-center space-x-2">
          <FolderIcon size={16} className="text-gray-500" />
          <nav className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => <Fragment key={index}>
                {index > 0 && <span className="text-gray-400">/</span>}
                <button className={`text-sm ${index === breadcrumbs.length - 1 ? 'font-medium text-purple-600' : 'text-gray-600 hover:text-purple-600'}`} onClick={() => navigateToBreadcrumb(index)}>
                  {crumb.name}
                </button>
              </Fragment>)}
          </nav>
        </div>
      </div>
      {/* Content Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {loading ? <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-lg text-gray-600">
              Loading content...
            </span>
          </div> : content.length === 0 ? <div className="text-center py-16">
            <LayersIcon size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No content found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || typeFilter || statusFilter !== null ? 'Try adjusting your search or filter criteria.' : currentFolder === null ? 'Get started by uploading content or creating a folder.' : 'This folder is empty. Upload content or create a subfolder.'}
            </p>
            {searchTerm || typeFilter || statusFilter !== null ? <button onClick={resetFilters} className="text-purple-600 hover:text-purple-800 font-medium">
                Reset all filters
              </button> : <div className="flex items-center justify-center space-x-4">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <UploadIcon size={16} className="mr-2" />
                  Upload Files
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                  <PlusIcon size={16} className="mr-2" />
                  New Folder
                </button>
              </div>}
          </div> : view === 'grid' ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {content.map(item => <div key={item.id} className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                {/* Thumbnail or Icon */}
                <div className="h-32 flex items-center justify-center bg-gray-50 relative" onClick={() => item.type === 'folder' ? navigateToFolder(item.id, item.title) : null}>
                  {item.thumbnail_url && item.type !== 'folder' ? <img src={item.thumbnail_url} alt={item.title} className="h-full w-full object-cover" /> : <div className="h-16 w-16 flex items-center justify-center">
                      {getItemIcon(item.type)}
                    </div>}
                  {item.type !== 'folder' && <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${item.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {item.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>}
                </div>
                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-medium text-gray-900 truncate ${item.type === 'folder' ? 'cursor-pointer hover:text-purple-600' : ''}`} onClick={() => item.type === 'folder' ? navigateToFolder(item.id, item.title) : null}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.type !== 'folder' && item.type !== 'link' ? formatSize(item.size) : ''}
                      </p>
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
                      {item.type !== 'folder' && <button onClick={() => togglePublishStatus(item.id, item.is_published)} className="p-1 rounded-full hover:bg-gray-100" title={item.is_published ? 'Unpublish' : 'Publish'}>
                          {item.is_published ? <XCircleIcon size={14} className="text-gray-600" /> : <CheckCircleIcon size={14} className="text-gray-600" />}
                        </button>}
                      <button className="p-1 rounded-full hover:bg-gray-100" title="Edit">
                        <EditIcon size={14} className="text-gray-600" />
                      </button>
                      <button onClick={() => handleDeleteClick(item.id)} className="p-1 rounded-full hover:bg-gray-100" title="Delete">
                        <TrashIcon size={14} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>)}
          </div> : <div className="overflow-x-auto">
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
                {content.map(item => <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                          {getItemIcon(item.type)}
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium text-gray-900 ${item.type === 'folder' ? 'cursor-pointer hover:text-purple-600' : ''}`} onClick={() => item.type === 'folder' ? navigateToFolder(item.id, item.title) : null}>
                            {item.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.type !== 'folder' && item.type !== 'link' ? formatSize(item.size) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.type !== 'folder' ? <button onClick={() => togglePublishStatus(item.id, item.is_published)} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.is_published ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}>
                          {item.is_published ? <>
                              <CheckCircleIcon size={12} className="mr-1" />
                              Published
                            </> : <>
                              <XCircleIcon size={12} className="mr-1" />
                              Draft
                            </>}
                        </button> : <span className="text-sm text-gray-500">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {item.type !== 'folder' && <button className="text-blue-600 hover:text-blue-900" title="Preview">
                            <EyeIcon size={16} />
                          </button>}
                        {item.type !== 'folder' && item.type !== 'link' && <button className="text-green-600 hover:text-green-900" title="Download">
                            <DownloadIcon size={16} />
                          </button>}
                        <button className="text-purple-600 hover:text-purple-900" title="Edit">
                          <EditIcon size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(item.id)} className="text-red-600 hover:text-red-900" title="Delete">
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
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
                      Delete Item
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this item? This action
                        cannot be undone.
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