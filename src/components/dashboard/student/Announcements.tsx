import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { MegaphoneIcon, CalendarIcon, ChevronRightIcon, SearchIcon, FilterIcon, RefreshCwIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Link } from 'react-router-dom';
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
export const StudentAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  useEffect(() => {
    fetchAnnouncements();
  }, [typeFilter]);
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      let query = supabase.from('posts').select(`
          *,
          author:users!author_id(full_name, avatar_url)
        `).eq('is_published', true).or('target_audience.eq.all,target_audience.eq.students').order('publish_date', {
        ascending: false
      });
      if (typeFilter) {
        query = query.eq('post_type', typeFilter);
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
      // Select the first announcement by default if there are any
      if (data && data.length > 0 && !selectedAnnouncement) {
        setSelectedAnnouncement(data[0] as Announcement);
      }
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
  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter(null);
    fetchAnnouncements();
  };
  const getAnnouncementTypeColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-blue-100 text-blue-800';
      case 'update':
        return 'bg-green-100 text-green-800';
      case 'motivational':
        return 'bg-purple-100 text-purple-800';
      case 'news':
        return 'bg-yellow-100 text-yellow-800';
      case 'blog':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return <DashboardLayout title="Announcements" role="student">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Announcements List */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800">
                  Announcements
                </h2>
                {(searchTerm || typeFilter) && <button onClick={resetFilters} className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                    <RefreshCwIcon size={14} className="mr-1" />
                    Reset
                  </button>}
              </div>
              {/* Search and filters */}
              <form onSubmit={handleSearch} className="mb-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon size={16} className="text-gray-400" />
                  </div>
                  <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Search announcements..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </form>
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                <button onClick={() => setTypeFilter(null)} className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${!typeFilter ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                  All
                </button>
                <button onClick={() => setTypeFilter('announcement')} className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${typeFilter === 'announcement' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                  Announcements
                </button>
                <button onClick={() => setTypeFilter('update')} className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${typeFilter === 'update' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                  Updates
                </button>
                <button onClick={() => setTypeFilter('motivational')} className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${typeFilter === 'motivational' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                  Motivational
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {loading ? <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">
                    Loading announcements...
                  </p>
                </div> : announcements.length === 0 ? <div className="py-8 text-center">
                  <MegaphoneIcon size={40} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No announcements found</p>
                  {(searchTerm || typeFilter) && <button onClick={resetFilters} className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                      Clear filters
                    </button>}
                </div> : announcements.map(announcement => <button key={announcement.id} onClick={() => setSelectedAnnouncement(announcement)} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selectedAnnouncement?.id === announcement.id ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        {announcement.featured_image_url ? <img src={announcement.featured_image_url} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center">
                            <MegaphoneIcon size={20} className="text-blue-600" />
                          </div>}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAnnouncementTypeColor(announcement.post_type)}`}>
                            {announcement.post_type.charAt(0).toUpperCase() + announcement.post_type.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(announcement.publish_date || announcement.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate mt-1">
                          {announcement.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {announcement.summary}
                        </p>
                      </div>
                      {selectedAnnouncement?.id === announcement.id && <ChevronRightIcon size={16} className="text-blue-500 ml-2 mt-3" />}
                    </div>
                  </button>)}
            </div>
          </div>
        </div>
        {/* Announcement Detail */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
            {selectedAnnouncement ? <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAnnouncementTypeColor(selectedAnnouncement.post_type)}`}>
                        {selectedAnnouncement.post_type.charAt(0).toUpperCase() + selectedAnnouncement.post_type.slice(1)}
                      </span>
                      <h1 className="text-2xl font-bold text-gray-900 mt-2">
                        {selectedAnnouncement.title}
                      </h1>
                    </div>
                    {selectedAnnouncement.featured_image_url && <div className="hidden md:block h-20 w-20 rounded overflow-hidden">
                        <img src={selectedAnnouncement.featured_image_url} alt="" className="h-full w-full object-cover" />
                      </div>}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <CalendarIcon size={14} className="mr-1" />
                    <span>
                      Posted on{' '}
                      {new Date(selectedAnnouncement.publish_date || selectedAnnouncement.created_at).toLocaleDateString()}
                    </span>
                    {selectedAnnouncement.author && <>
                        <span className="mx-2">•</span>
                        <span>By {selectedAnnouncement.author.full_name}</span>
                      </>}
                  </div>
                </div>
                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                  {selectedAnnouncement.featured_image_url && <div className="md:hidden mb-4">
                      <img src={selectedAnnouncement.featured_image_url} alt="" className="w-full h-40 object-cover rounded-lg" />
                    </div>}
                  <div className="prose max-w-none">
                    {selectedAnnouncement.content.split('\n').map((paragraph, index) => <p key={index} className="mb-4">
                          {paragraph}
                        </p>)}
                  </div>
                </div>
              </div> : <div className="h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <MegaphoneIcon size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No announcement selected
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Select an announcement from the list to view its details.
                  </p>
                </div>
              </div>}
          </div>
        </div>
      </div>
    </DashboardLayout>;
};