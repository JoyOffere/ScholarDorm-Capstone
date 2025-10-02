import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { BellIcon, CheckIcon, TrashIcon, CalendarIcon, AwardIcon, BookOpenIcon, InfoIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { createAuditLog } from '../../../lib/supabase-utils';
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  urgency: string;
  is_read: boolean;
  created_at: string;
}
export const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        // Get current user
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) throw new Error('User not found');
        setUserId(user.id);
        // Get notifications
        const {
          data,
          error
        } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', {
          ascending: false
        });
        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);
  const filteredNotifications = filter === 'all' ? notifications : notifications.filter(notification => !notification.is_read);
  const markAsRead = async (id: string) => {
    if (!userId) return;
    try {
      // Update notification
      const {
        error
      } = await supabase.from('notifications').update({
        is_read: true
      }).eq('id', id);
      if (error) throw error;
      // Update local state
      setNotifications(prev => prev.map(notification => notification.id === id ? {
        ...notification,
        is_read: true
      } : notification));
      // Create audit log
      await createAuditLog(userId, 'notification_read', {
        notification_id: id
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      // Update all notifications
      const {
        error
      } = await supabase.from('notifications').update({
        is_read: true
      }).eq('user_id', userId).eq('is_read', false);
      if (error) throw error;
      // Update local state
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        is_read: true
      })));
      // Create audit log
      await createAuditLog(userId, 'all_notifications_read', {
        count: filteredNotifications.filter(n => !n.is_read).length
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  const deleteNotification = async (id: string) => {
    if (!userId) return;
    try {
      // Delete notification
      const {
        error
      } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      // Create audit log
      await createAuditLog(userId, 'notification_deleted', {
        notification_id: id
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  const getNotificationIcon = (type: string, urgency: string) => {
    switch (type) {
      case 'streak_reminder':
        return <CalendarIcon size={20} className={getUrgencyColor(urgency)} />;
      case 'badge_earned':
        return <AwardIcon size={20} className="text-yellow-500" />;
      case 'course_recommendation':
        return <BookOpenIcon size={20} className="text-green-500" />;
      case 'system':
        return <InfoIcon size={20} className="text-blue-500" />;
      default:
        return <BellIcon size={20} className="text-gray-500" />;
    }
  };
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      case 'low':
      default:
        return 'text-blue-500';
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };
  return <DashboardLayout title="Notifications" role="student">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header with filters */}
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <BellIcon size={20} className="text-blue-500 mr-2" />
            <h2 className="text-lg font-bold text-gray-800">
              Your Notifications
            </h2>
            <div className="ml-3 flex">
              <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-l-md ${filter === 'all' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                All
              </button>
              <button onClick={() => setFilter('unread')} className={`px-3 py-1 text-sm rounded-r-md ${filter === 'unread' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Unread
              </button>
            </div>
          </div>
          <div>
            <button onClick={markAllAsRead} disabled={!filteredNotifications.some(n => !n.is_read)} className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${filteredNotifications.some(n => !n.is_read) ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`}>
              <CheckIcon size={16} className="mr-1" />
              Mark all as read
            </button>
          </div>
        </div>
        {/* Notifications List */}
        <div className="divide-y divide-gray-200">
          {loading ? <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div> : filteredNotifications.length === 0 ? <div className="py-16 text-center">
              <BellIcon size={40} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">
                No notifications
              </h3>
              <p className="text-gray-500">
                {filter === 'all' ? "You don't have any notifications yet." : "You don't have any unread notifications."}
              </p>
            </div> : filteredNotifications.map(notification => <div key={notification.id} className={`px-6 py-4 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.urgency)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <h3 className={`text-sm font-medium ${!notification.is_read ? 'text-blue-800' : 'text-gray-800'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm ${!notification.is_read ? 'text-blue-700' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    {!notification.is_read && <button onClick={() => markAsRead(notification.id)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100" aria-label="Mark as read">
                        <CheckCircleIcon size={16} />
                      </button>}
                    <button onClick={() => deleteNotification(notification.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-100" aria-label="Delete notification">
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>)}
        </div>
      </div>
    </DashboardLayout>;
};