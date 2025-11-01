import * as React from 'react';
const { useState, useEffect } = React;
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Bell, Check, CheckCheck, Trash2, Filter, Search,
  AlertCircle, Info, CheckCircle, Clock, User, Users, BookOpen,
  MessageSquare, Award, TrendingUp, Calendar, Settings, Eye,
  EyeOff, Archive, Star, Download, RefreshCw, Zap, Circle
} from 'lucide-react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface Notification {
  id: string;
  type: 'streak_reminder' | 'badge_earned' | 'course_recommendation' | 'announcement' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  read_at?: string;
  related_entity_type?: 'course' | 'student' | 'quiz' | 'assignment' | 'message';
  related_entity_id?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

interface NotificationFilters {
  search: string;
  type: 'all' | 'streak_reminder' | 'badge_earned' | 'course_recommendation' | 'announcement' | 'system';
  priority: 'all' | 'low' | 'medium' | 'high';
  status: 'all' | 'unread' | 'read' | 'archived';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

interface NotificationStats {
  total: number;
  unread: number;
  high_priority: number;
  today: number;
}

export const TeacherNotifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    high_priority: 0,
    today: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [filters, setFilters] = useState<NotificationFilters>({
    search: '',
    type: 'all',
    priority: 'all',
    status: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('teacher_notifications')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [notifications, filters]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          title,
          message,
          urgency,
          is_read,
          is_dismissed,
          created_at,
          action_url,
          scheduled_for,
          expires_at,
          sent_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotifications: Notification[] = (data || []).map(notif => ({
        id: notif.id,
        type: notif.type as any, // Map database types to component types
        title: notif.title,
        message: notif.message,
        priority: notif.urgency as any, // Map urgency to priority
        is_read: notif.is_read,
        is_archived: notif.is_dismissed, // Map is_dismissed to is_archived
        created_at: notif.created_at,
        read_at: notif.sent_at, // Use sent_at as read_at approximation
        related_entity_type: undefined, // Not available in current schema
        related_entity_id: undefined, // Not available in current schema
        action_url: notif.action_url,
        metadata: {}, // Not available in current schema
        sender: undefined // Not available in current schema
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(notif =>
        notif.title.toLowerCase().includes(searchLower) ||
        notif.message.toLowerCase().includes(searchLower) ||
        notif.sender?.full_name.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(notif => notif.type === filters.type);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(notif => notif.priority === filters.priority);
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'unread') {
        filtered = filtered.filter(notif => !notif.is_read);
      } else if (filters.status === 'read') {
        filtered = filtered.filter(notif => notif.is_read);
      } else if (filters.status === 'archived') {
        filtered = filtered.filter(notif => notif.is_archived);
      }
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      if (filters.dateRange === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (filters.dateRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (filters.dateRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      }

      filtered = filtered.filter(notif => 
        new Date(notif.created_at) >= startDate
      );
    }

    setFilteredNotifications(filtered);
  };

  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      high_priority: notifications.filter(n => n.priority === 'high').length,
      today: notifications.filter(n => new Date(n.created_at) >= today).length
    };

    setStats(stats);
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds);

      if (error) throw error;

      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAsUnread = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: false })
        .in('id', notificationIds);

      if (error) throw error;

      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as unread:', error);
    }
  };

  const archiveNotifications = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_dismissed: true })
        .in('id', notificationIds);

      if (error) throw error;

      fetchNotifications();
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error('Error archiving notifications:', error);
    }
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    if (!confirm('Are you sure you want to delete these notifications? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds);

      if (error) throw error;

      fetchNotifications();
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  const selectAllVisible = () => {
    const visibleIds = filteredNotifications.map(n => n.id);
    setSelectedNotifications(new Set(visibleIds));
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedNotifications(new Set());
    setShowBulkActions(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quiz_completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'assignment_submitted':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'course_enrollment':
        return <Users className="w-5 h-5 text-purple-600" />;
      case 'message_received':
        return <MessageSquare className="w-5 h-5 text-indigo-600" />;
      case 'achievement_earned':
        return <Award className="w-5 h-5 text-yellow-600" />;
      case 'system_alert':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const exportNotifications = () => {
    const csvContent = [
      'Date,Type,Priority,Title,Message,Status,Sender',
      ...filteredNotifications.map(notif => [
        new Date(notif.created_at).toLocaleDateString(),
        notif.type,
        notif.priority,
        `"${notif.title}"`,
        `"${notif.message}"`,
        notif.is_read ? 'Read' : 'Unread',
        notif.sender?.full_name || 'System'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" title="Notifications">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" title="Notifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">Stay updated with your teaching activities</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchNotifications}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportNotifications}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
              </div>
              <Circle className="w-8 h-8 text-red-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{stats.high_priority}</p>
              </div>
              <Zap className="w-8 h-8 text-orange-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-purple-600">{stats.today}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search notifications..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="streak_reminder">Streak Reminder</option>
                <option value="badge_earned">Badge Earned</option>
                <option value="course_recommendation">Course Recommendation</option>
                <option value="announcement">Announcement</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedNotifications.size} notification{selectedNotifications.size !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={selectAllVisible}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Select all visible
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear selection
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => markAsRead(Array.from(selectedNotifications))}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm"
                  >
                    <Eye size={14} />
                    <span>Mark Read</span>
                  </button>
                  <button
                    onClick={() => markAsUnread(Array.from(selectedNotifications))}
                    className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm"
                  >
                    <EyeOff size={14} />
                    <span>Mark Unread</span>
                  </button>
                  <button
                    onClick={() => archiveNotifications(Array.from(selectedNotifications))}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
                  >
                    <Archive size={14} />
                    <span>Archive</span>
                  </button>
                  <button
                    onClick={() => deleteNotifications(Array.from(selectedNotifications))}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications ({filteredNotifications.length})
            </h3>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications Found</h3>
              <p className="text-gray-600">
                {notifications.length === 0 
                  ? "You don't have any notifications yet."
                  : "No notifications match your current filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  } ${selectedNotifications.has(notification.id) ? 'bg-blue-100' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => toggleNotificationSelection(notification.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className={`text-sm font-medium ${
                              !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                          </div>
                          
                          <p className={`text-sm mb-2 ${
                            !notification.is_read ? 'text-gray-800' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{formatTime(notification.created_at)}</span>
                            {notification.sender && (
                              <span>from {notification.sender.full_name}</span>
                            )}
                            <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                          
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Eye size={16} />
                          </button>
                          
                          <button
                            onClick={() => archiveNotifications([notification.id])}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Archive size={16} />
                          </button>
                          
                          <button
                            onClick={() => deleteNotifications([notification.id])}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};