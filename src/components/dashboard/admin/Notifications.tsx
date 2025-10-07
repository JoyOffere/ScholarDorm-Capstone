import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { BellIcon, SearchIcon, FilterIcon, PlusIcon, SendIcon, EyeIcon, TrashIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon, UsersIcon, CalendarIcon, RefreshCwIcon, ClockIcon, XIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { createAuditLog } from '../../../lib/supabase-utils';
import { useAuth } from '../../../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'streak_reminder' | 'badge_earned' | 'course_recommendation' | 'announcement' | 'system';
  urgency: 'low' | 'medium' | 'high';
  action_url?: string;
  target_audience: 'all' | 'students' | 'admins' | 'teachers';
  is_sent: boolean;
  is_read?: boolean;
  scheduled_for?: string;
  sent_at?: string;
  expires_at?: string;
  recipient_count?: number;
  created_at: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export const AdminNotifications: React.FC = () => {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'draft' | 'scheduled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'streak_reminder' | 'badge_earned' | 'course_recommendation' | 'announcement' | 'system'>('all');
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'students' | 'admins' | 'teachers' | 'all_users'>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'system' as Notification['type'],
    urgency: 'medium' as Notification['urgency'],
    target_audience: 'all' as Notification['target_audience'],
    action_url: '',
    scheduled_for: '',
  });

  useEffect(() => {
    fetchNotifications();
  }, [statusFilter, typeFilter, audienceFilter, page, pageSize]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('notifications')
        .select(
          `
          *,
          author:users!author_id (id, full_name, avatar_url)
        `,
          { count: 'exact' }
        )
        .range(from, to)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        if (statusFilter === 'sent') {
          query = query.eq('is_sent', true);
        } else if (statusFilter === 'draft') {
          query = query.eq('is_sent', false).is('scheduled_for', null);
        } else if (statusFilter === 'scheduled') {
          query = query.eq('is_sent', false).not('scheduled_for', 'is', null);
        }
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (audienceFilter !== 'all') {
        query = query.eq('target_audience', audienceFilter === 'all_users' ? 'all' : audienceFilter);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setTotalCount(count || 0);
      setNotifications((data as Notification[]) || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'badge_earned':
        return <CheckCircleIcon size={16} className="text-green-500" />;
      case 'streak_reminder':
        return <AlertCircleIcon size={16} className="text-yellow-500" />;
      case 'announcement':
        return <BellIcon size={16} className="text-purple-500" />;
      case 'system':
      case 'course_recommendation':
        return <InfoIcon size={16} className="text-blue-500" />;
      default:
        return <InfoIcon size={16} className="text-blue-500" />;
    }
  };

  const getUrgencyColor = (urgency: Notification['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (notification: Notification) => {
    if (notification.is_sent) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Sent
        </span>
      );
    } else if (notification.scheduled_for) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          Scheduled
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        Draft
      </span>
    );
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a notification');

      const notificationData = {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        urgency: newNotification.urgency,
        target_audience: newNotification.target_audience,
        action_url: newNotification.action_url || null,
        is_sent: false,
        author_id: user.id,
        created_at: new Date().toISOString(),
        scheduled_for: newNotification.scheduled_for ? new Date(newNotification.scheduled_for).toISOString() : null,
      };

      const { data, error } = await supabase.from('notifications').insert(notificationData).select();
      if (error) throw error;

      if (data && data[0]) {
        await createAuditLog(user.id, 'admin_content_create', {
          content_type: 'notification',
          content_id: data[0].id,
          title: newNotification.title,
        });
      }

      setNewNotification({
        title: '',
        message: '',
        type: 'system',
        urgency: 'medium',
        target_audience: 'all',
        action_url: '',
        scheduled_for: '',
      });
      setShowCreateModal(false);
      fetchNotifications();
    } catch (err: any) {
      console.error('Error creating notification:', err);
      setError(err.message || 'Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to send a notification');

      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('target_audience')
        .eq('id', notificationId)
        .single();
      if (fetchError) throw fetchError;

      let recipientCount = 0;
      if (notification) {
        const { count, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq(notification.target_audience !== 'all' ? 'role' : 'id', notification.target_audience !== 'all' ? notification.target_audience : 'id');
        if (countError) throw countError;
        recipientCount = count || 0;
      }

      const { error } = await supabase
        .from('notifications')
        .update({
          is_sent: true,
          sent_at: new Date().toISOString(),
          recipient_count: recipientCount,
        })
        .eq('id', notificationId);
      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_update', {
        content_type: 'notification',
        content_id: notificationId,
        action: 'send',
      });

      fetchNotifications();
    } catch (err: any) {
      console.error('Error sending notification:', err);
      setError(err.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (notificationId: string) => {
    setNotificationToDelete(notificationId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!notificationToDelete) return;
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to delete a notification');

      const { error } = await supabase.from('notifications').delete().eq('id', notificationToDelete);
      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_delete', {
        content_type: 'notification',
        content_id: notificationToDelete,
      });

      setNotifications(notifications.filter(n => n.id !== notificationToDelete));
      setShowDeleteModal(false);
      setNotificationToDelete(null);
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      setError(err.message || 'Failed to delete notification');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    if (diffHour > 0) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    if (diffMin > 0) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    return 'Just now';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <DashboardLayout title="Notifications Management" role="admin">
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
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && fetchNotifications()}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            <div className="relative">
              <select
                className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
              >
                <option value="all">All Types</option>
                <option value="system">System</option>
                <option value="announcement">Announcement</option>
                <option value="streak_reminder">Streak Reminder</option>
                <option value="badge_earned">Badge Earned</option>
                <option value="course_recommendation">Course Recommendation</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            <div className="relative">
              <select
                className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={audienceFilter}
                onChange={e => setAudienceFilter(e.target.value as typeof audienceFilter)}
              >
                <option value="all">All Audiences</option>
                <option value="all_users">Everyone</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="admins">Admins</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || audienceFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setAudienceFilter('all');
                  setPage(1);
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <RefreshCwIcon size={16} className="mr-2" />
                Reset
              </button>
            )}
            <button
              onClick={fetchNotifications}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <RefreshCwIcon size={16} className="mr-2" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <PlusIcon size={16} className="mr-2" />
              New Notification
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <span className="ml-2 text-gray-500">Loading notifications...</span>
                    </div>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="text-center py-8">
                      <BellIcon size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No notifications found</h3>
                      <p className="text-gray-600">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || audienceFilter !== 'all'
                          ? 'Try adjusting your search or filter criteria.'
                          : 'Create your first notification to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                notifications.map(notification => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">{getTypeIcon(notification.type)}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                          <div className="text-sm text-gray-500 mt-1 max-w-md truncate">{notification.message}</div>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(notification.urgency)}`}>
                              {notification.urgency.charAt(0).toUpperCase() + notification.urgency.slice(1)} Priority
                            </span>
                            {notification.recipient_count !== undefined && notification.recipient_count > 0 && (
                              <span className="text-xs text-gray-500">Sent to {notification.recipient_count} users</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">{notification.type.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UsersIcon size={14} className="mr-1 text-gray-400" />
                        <span className="text-sm text-gray-900 capitalize">{notification.target_audience}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(notification)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarIcon size={14} className="mr-1 text-gray-400" />
                        {formatTimeAgo(notification.created_at)}
                      </div>
                      {notification.scheduled_for && !notification.is_sent && (
                        <div className="text-xs text-blue-600 mt-1 flex items-center">
                          <ClockIcon size={12} className="mr-1" />
                          Scheduled: {formatDate(notification.scheduled_for)}
                        </div>
                      )}
                      {notification.sent_at && (
                        <div className="text-xs text-green-600 mt-1 flex items-center">
                          <CheckCircleIcon size={12} className="mr-1" />
                          Sent: {formatTimeAgo(notification.sent_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-900" title="View details">
                          <EyeIcon size={16} />
                        </button>
                        {!notification.is_sent && (
                          <button
                            onClick={() => handleSendNotification(notification.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Send now"
                          >
                            <SendIcon size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(notification.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && notifications.length > 0 && totalPages > 1 && (
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
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
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
                          page === pageNum
                            ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowCreateModal(false)}>
                  <XIcon size={20} />
                </button>
              </div>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                    <BellIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Notification</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={newNotification.title}
                          onChange={e => setNewNotification({ ...newNotification, title: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Notification title..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                          value={newNotification.message}
                          onChange={e => setNewNotification({ ...newNotification, message: e.target.value })}
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Notification message..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={newNotification.type}
                            onChange={e => setNewNotification({ ...newNotification, type: e.target.value as Notification['type'] })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="system">System</option>
                            <option value="announcement">Announcement</option>
                            <option value="course_recommendation">Course Recommendation</option>
                            <option value="streak_reminder">Streak Reminder</option>
                            <option value="badge_earned">Badge Earned</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                          <select
                            value={newNotification.urgency}
                            onChange={e => setNewNotification({ ...newNotification, urgency: e.target.value as Notification['urgency'] })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                        <select
                          value={newNotification.target_audience}
                          onChange={e => setNewNotification({ ...newNotification, target_audience: e.target.value as Notification['target_audience'] })}
                          className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="all">All Users</option>
                          <option value="students">Students Only</option>
                          <option value="teachers">Teachers Only</option>
                          <option value="admins">Admins Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Action URL (Optional)</label>
                        <input
                          type="text"
                          value={newNotification.action_url}
                          onChange={e => setNewNotification({ ...newNotification, action_url: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="https://example.com/action"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule For (Optional)</label>
                        <input
                          type="datetime-local"
                          value={newNotification.scheduled_for}
                          onChange={e => setNewNotification({ ...newNotification, scheduled_for: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleCreateNotification}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Create Notification
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Notification</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this notification? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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