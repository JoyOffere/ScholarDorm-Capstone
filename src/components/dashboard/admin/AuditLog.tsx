import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { SearchIcon, FilterIcon, DownloadIcon, ClockIcon, UserIcon, ActivityIcon, EyeIcon, RefreshCwIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AuditLog as AuditLogType, AuditAction } from '../../../lib/supabase-utils';
export const AdminAuditLog: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      // Build query
      let query = supabase.from('audit_logs').select(`
          id,
          user_id,
          action,
          details,
          ip_address,
          created_at
        `).order('created_at', {
        ascending: false
      });
      // Apply filters
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        if (dateFilter === 'today') {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (dateFilter === 'week') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
        } else {
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
        }
        query = query.gte('created_at', startDate.toISOString());
      }
      // Execute query
      const {
        data,
        error
      } = await query.limit(100);
      if (error) throw error;
      // Fetch user names for all unique user IDs
      const userIds = [...new Set(data.map(log => log.user_id))];
      const {
        data: users,
        error: userError
      } = await supabase.from('users').select('id, full_name, email').in('id', userIds);
      if (userError) throw userError;
      // Create a map of user IDs to names
      const userNameMap = users.reduce((acc: Record<string, string>, user: any) => {
        acc[user.id] = user.full_name || user.email;
        return acc;
      }, {});
      setUserMap(userNameMap);
      setAuditLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, dateFilter]);
  const getActionLabel = (action: AuditAction): string => {
    // Convert action from snake_case to Title Case with spaces
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  const getActionIcon = (action: AuditAction) => {
    if (action.includes('login') || action.includes('logout')) {
      return <UserIcon size={16} className="text-blue-500" />;
    } else if (action.includes('update') || action.includes('changed')) {
      return <RefreshCwIcon size={16} className="text-orange-500" />;
    } else if (action.includes('create') || action.includes('earned')) {
      return <ActivityIcon size={16} className="text-green-500" />;
    } else if (action.includes('delete')) {
      return <TrashIcon size={16} className="text-red-500" />;
    } else {
      return <EyeIcon size={16} className="text-purple-500" />;
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  const filteredLogs = auditLogs.filter(log => {
    const userName = userMap[log.user_id] || 'Unknown User';
    const actionName = getActionLabel(log.action);
    return userName.toLowerCase().includes(searchTerm.toLowerCase()) || actionName.toLowerCase().includes(searchTerm.toLowerCase()) || log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
  });
  return <DashboardLayout title="Audit Log" role="admin">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Search logs by user, action, or details..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Action Filter */}
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={actionFilter} onChange={e => setActionFilter(e.target.value as any)}>
                <option value="all">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="profile_update">Profile Update</option>
                <option value="settings_changed">Settings Changed</option>
                <option value="password_changed">Password Changed</option>
                <option value="course_start">Course Start</option>
                <option value="course_progress">Course Progress</option>
                <option value="course_complete">Course Complete</option>
                <option value="badge_earned">Badge Earned</option>
                <option value="admin_user_create">Admin: User Create</option>
                <option value="admin_user_update">Admin: User Update</option>
                <option value="admin_user_delete">Admin: User Delete</option>
                <option value="admin_content_create">
                  Admin: Content Create
                </option>
                <option value="admin_content_update">
                  Admin: Content Update
                </option>
                <option value="admin_content_delete">
                  Admin: Content Delete
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Date Filter */}
            <div className="relative inline-block text-left">
              <select className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={dateFilter} onChange={e => setDateFilter(e.target.value as any)}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ClockIcon size={16} />
              </div>
            </div>
            {/* Refresh Button */}
            <button onClick={fetchAuditLogs} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500" disabled={loading}>
              <RefreshCwIcon size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {/* Export Button */}
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <DownloadIcon size={16} className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>
      {/* Audit Log Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                      <span className="ml-2 text-gray-500">
                        Loading logs...
                      </span>
                    </div>
                  </td>
                </tr> : filteredLogs.length === 0 ? <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No audit logs found matching your criteria
                  </td>
                </tr> : filteredLogs.map(log => <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <ClockIcon size={14} className="mr-1 text-gray-400" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                          <UserIcon size={14} />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {userMap[log.user_id] || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.user_id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-2">{getActionIcon(log.action)}</div>
                        <span className="text-sm text-gray-900">
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs overflow-hidden text-ellipsis">
                        {log.details ? <div className="text-xs bg-gray-50 p-2 rounded font-mono overflow-x-auto max-h-20">
                            {JSON.stringify(log.details, null, 2)}
                          </div> : <span className="text-gray-500 italic">
                            No details
                          </span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address || 'Unknown'}
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{' '}
                <span className="font-medium">{filteredLogs.length}</span> of{' '}
                <span className="font-medium">{filteredLogs.length}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" aria-current="page" className="z-10 bg-purple-50 border-purple-500 text-purple-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                  1
                </a>
                <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>;
};