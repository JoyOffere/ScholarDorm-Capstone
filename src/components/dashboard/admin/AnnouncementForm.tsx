import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { SaveIcon, XIcon, EyeIcon, CalendarIcon, UsersIcon, ImageIcon, AlertCircleIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { createAuditLog } from '../../../lib/supabase-utils';
interface AnnouncementFormProps {
  mode: 'create' | 'edit';
}
export const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  mode
}) => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState({
    title: '',
    summary: '',
    content: '',
    post_type: 'announcement',
    target_audience: 'all',
    is_published: false,
    publish_date: new Date().toISOString().split('T')[0],
    featured_image_url: ''
  });
  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchAnnouncement(id);
    }
  }, [mode, id]);
  const fetchAnnouncement = async (announcementId: string) => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('posts').select('*').eq('id', announcementId).single();
      if (error) throw error;
      if (data) {
        setAnnouncement({
          ...data,
          publish_date: data.publish_date ? new Date(data.publish_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
      setError('Could not load announcement details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setAnnouncement(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      checked
    } = e.target;
    setAnnouncement(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create an announcement');
      }
      const announcementData = {
        ...announcement,
        publish_date: announcement.is_published ? announcement.publish_date : null,
        author_id: user.id,
        updated_at: new Date().toISOString()
      };
      let result;
      if (mode === 'create') {
        result = await supabase.from('posts').insert({
          ...announcementData,
          created_at: new Date().toISOString()
        }).select();
        // Create audit log
        if (result.data && result.data[0]) {
          await createAuditLog(user.id, 'admin_content_create', {
            content_type: 'announcement',
            content_id: result.data[0].id,
            title: announcement.title
          });
        }
      } else {
        result = await supabase.from('posts').update(announcementData).eq('id', id).select();
        // Create audit log
        if (result.data && result.data[0]) {
          await createAuditLog(user.id, 'admin_content_update', {
            content_type: 'announcement',
            content_id: result.data[0].id,
            title: announcement.title
          });
        }
      }
      if (result.error) throw result.error;
      // Redirect back to announcements list
      navigate('/admin/announcements');
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      setError(error.message || 'Failed to save announcement. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <DashboardLayout title={mode === 'create' ? 'Create Announcement' : 'Edit Announcement'} role="admin">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </DashboardLayout>;
  }
  return <DashboardLayout title={mode === 'create' ? 'Create Announcement' : 'Edit Announcement'} role="admin">
      <div className="max-w-4xl mx-auto">
        {error && <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <AlertCircleIcon className="h-5 w-5 text-red-400 mr-2" />
              <div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>}
        <form onSubmit={handleSubmit}>
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            {/* Form Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-800">
                {mode === 'create' ? 'New Announcement' : 'Edit Announcement'}
              </h2>
              <div className="flex items-center space-x-2">
                <button type="button" className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500" onClick={() => navigate('/admin/announcements')}>
                  <XIcon className="h-4 w-4 mr-1" />
                  Cancel
                </button>
                <button type="button" className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Preview
                </button>
                <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500" disabled={saving}>
                  {saving ? <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </> : <>
                      <SaveIcon className="h-4 w-4 mr-1" />
                      Save{' '}
                      {announcement.is_published ? 'and Publish' : 'as Draft'}
                    </>}
                </button>
              </div>
            </div>
            {/* Form Body */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input type="text" name="title" id="title" required value={announcement.title} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="Enter announcement title" />
              </div>
              {/* Summary */}
              <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                  Summary <span className="text-red-500">*</span>
                </label>
                <input type="text" name="summary" id="summary" required value={announcement.summary} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="Brief summary of the announcement" />
                <p className="mt-1 text-xs text-gray-500">
                  A short summary that will be displayed in announcement lists
                  and notifications.
                </p>
              </div>
              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea name="content" id="content" required rows={8} value={announcement.content} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="Enter the full announcement content here..." />
              </div>
              {/* Two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type */}
                <div>
                  <label htmlFor="post_type" className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <select name="post_type" id="post_type" value={announcement.post_type} onChange={handleChange} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                      <option value="announcement">Announcement</option>
                      <option value="update">Update</option>
                      <option value="motivational">Motivational</option>
                      <option value="news">News</option>
                      <option value="blog">Blog</option>
                    </select>
                  </div>
                </div>
                {/* Target Audience */}
                <div>
                  <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700">
                    Target Audience
                  </label>
                  <div className="mt-1 flex items-center">
                    <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <select name="target_audience" id="target_audience" value={announcement.target_audience} onChange={handleChange} className="block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                      <option value="all">Everyone</option>
                      <option value="students">Students Only</option>
                      <option value="admins">Admins Only</option>
                      <option value="teachers">Teachers Only</option>
                    </select>
                  </div>
                </div>
                {/* Featured Image URL */}
                <div>
                  <label htmlFor="featured_image_url" className="block text-sm font-medium text-gray-700">
                    Featured Image URL
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <ImageIcon className="h-4 w-4" />
                    </span>
                    <input type="url" name="featured_image_url" id="featured_image_url" value={announcement.featured_image_url} onChange={handleChange} className="focus:ring-purple-500 focus:border-purple-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300" placeholder="https://example.com/image.jpg" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Optional: URL to an image that will be displayed with the
                    announcement
                  </p>
                </div>
                {/* Publish Date */}
                <div>
                  <label htmlFor="publish_date" className="block text-sm font-medium text-gray-700">
                    Publish Date
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <CalendarIcon className="h-4 w-4" />
                    </span>
                    <input type="date" name="publish_date" id="publish_date" value={announcement.publish_date} onChange={handleChange} className="focus:ring-purple-500 focus:border-purple-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    When this announcement should be published (if publishing
                    now)
                  </p>
                </div>
              </div>
              {/* Published Status */}
              <div className="flex items-center">
                <input id="is_published" name="is_published" type="checkbox" checked={announcement.is_published} onChange={handleCheckboxChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                  Publish immediately
                </label>
                <p className="ml-2 text-xs text-gray-500">
                  If unchecked, the announcement will be saved as a draft
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>;
};