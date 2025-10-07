import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import {
  SearchIcon,
  FilterIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  UserIcon,
  DownloadIcon,
  RefreshCwIcon,
  MoreHorizontalIcon,
  XIcon,
  MailIcon,
  ShieldIcon,
  EyeIcon
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
interface EnhancedUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'student' | 'admin' | 'teacher';
  status: 'active' | 'inactive' | 'suspended';
  streak_count: number;
  longest_streak: number;
  last_login: string;
  created_at: string;
  updated_at: string;
  bio?: string;
  phone?: string;
  department?: string;
  email_verified: boolean;
  accessibility_preferences: any;
  // Additional computed fields
  total_courses?: number;
  completed_courses?: number;
  badges_earned?: number;
  quiz_attempts?: number;
  average_score?: number;
}
export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof EnhancedUser>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    role: 'student' as 'student' | 'admin' | 'teacher',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    bio: '',
    phone: '',
    department: ''
  });
  const [addFormData, setAddFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'admin' | 'teacher',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    bio: '',
    phone: '',
    department: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, sortField, sortDirection]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== '') {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();
      console.debug('fetchUsers() start', { page, pageSize, searchTerm, roleFilter, statusFilter, sortField, sortDirection });

      // Build a lightweight main query: select only base user fields (avoid fetching related arrays)
      let baseSelect = 'id, email, full_name, avatar_url, role, status, streak_count, longest_streak, last_login, created_at, updated_at, bio, phone, department, email_verified, accessibility_preferences';
      let query = supabase
        .from('users')
        .select(baseSelect, { count: 'exact' })
        .order(sortField as string, { ascending: sortDirection === 'asc' })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Apply filters
      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        // use ilike on individual columns via or to keep the query readable
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`);
      }

      const { data: baseData, error: baseError, count } = await query;
      console.debug('fetchUsers() base query result', { count, baseError });
      if (baseError) throw baseError;

      // baseData contains only base user fields. We'll batch-fetch aggregated related counts
      const userIds = (baseData || []).map((u: any) => u.id);

      // default enhanced users mapping from baseData
      const enhancedUsers = (baseData || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role || 'student',
        status: user.status || 'active',
        streak_count: user.streak_count || 0,
        longest_streak: user.longest_streak || 0,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at,
        bio: user.bio || '',
        phone: user.phone || '',
        department: user.department || '',
        email_verified: !!user.email_verified,
        accessibility_preferences: user.accessibility_preferences || {},
        total_courses: 0,
        completed_courses: 0,
        badges_earned: 0,
        quiz_attempts: 0,
        average_score: 0
      })) as EnhancedUser[];

      // If we have userIds, fetch aggregated counts in parallel (smaller queries)
      if (userIds.length > 0) {
        const aggStart = performance.now();
        // Fetch course counts per user
        const coursesPromise = supabase
          .from('user_courses')
          .select('user_id, completed', { count: 'exact' })
          .in('user_id', userIds);

        const badgesPromise = supabase
          .from('user_badges')
          .select('user_id', { count: 'exact' })
          .in('user_id', userIds);

        const attemptsPromise = supabase
          .from('quiz_attempts')
          .select('user_id, percentage', { count: 'exact' })
          .in('user_id', userIds);

        const [coursesRes, badgesRes, attemptsRes] = await Promise.all([coursesPromise, badgesPromise, attemptsPromise]);
        console.debug('fetchUsers() related queries', { coursesRes, badgesRes, attemptsRes, aggDuration: performance.now() - aggStart });

        // Map aggregates back to users
        const courseRows = coursesRes.data || [];
        const badgeRows = badgesRes.data || [];
        const attemptRows = attemptsRes.data || [];

        const courseMap: Record<string, { total: number; completed: number }> = {};
        for (const row of courseRows) {
          courseMap[row.user_id] = courseMap[row.user_id] || { total: 0, completed: 0 };
          courseMap[row.user_id].total += 1;
          if (row.completed) courseMap[row.user_id].completed += 1;
        }

        const badgeMap: Record<string, number> = {};
        for (const row of badgeRows) {
          badgeMap[row.user_id] = (badgeMap[row.user_id] || 0) + 1;
        }

        const attemptMap: Record<string, { total: number; sum: number }> = {};
        for (const row of attemptRows) {
          attemptMap[row.user_id] = attemptMap[row.user_id] || { total: 0, sum: 0 };
          attemptMap[row.user_id].total += 1;
          attemptMap[row.user_id].sum += (row.percentage || 0);
        }

        for (const u of enhancedUsers) {
          if (courseMap[u.id]) {
            u.total_courses = courseMap[u.id].total;
            u.completed_courses = courseMap[u.id].completed;
          }
          if (badgeMap[u.id]) u.badges_earned = badgeMap[u.id];
          if (attemptMap[u.id]) {
            u.quiz_attempts = attemptMap[u.id].total;
            u.average_score = attemptMap[u.id].total > 0 ? Math.round(attemptMap[u.id].sum / attemptMap[u.id].total) : 0;
          }
        }
      }

      setUsers(enhancedUsers);
      setTotalCount(typeof count === 'number' ? count : null);
      console.debug('fetchUsers() done', { duration: performance.now() - startTime, fetched: enhancedUsers.length, totalCount });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Removed unused sorting and bulk-action handlers to satisfy strict TS settings.

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };
  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setLoading(true);
      const {
        error
      } = await supabase.from('users').delete().eq('id', userToDelete);
      if (error) throw error;
      setUsers(users.filter(user => user.id !== userToDelete));
      // If we're deleting the currently selected user, close the modal
      if (selectedUser && selectedUser.id === userToDelete) {
        setShowUserModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
      setLoading(false);
    }
  };
  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter(null);
    setStatusFilter(null);
    setSortField('created_at');
    setSortDirection('desc');
  };

  const handleUserClick = (user: EnhancedUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setIsEditing(false);
    setEditFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      bio: user.bio || '',
      phone: user.phone || '',
      department: user.department || ''
    });
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    if (selectedUser) {
      setEditFormData({
        full_name: selectedUser.full_name,
        email: selectedUser.email,
        role: selectedUser.role,
        status: selectedUser.status,
        bio: selectedUser.bio || '',
        phone: selectedUser.phone || '',
        department: selectedUser.department || ''
      });
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editFormData.full_name,
          email: editFormData.email,
          role: editFormData.role,
          status: editFormData.status,
          bio: editFormData.bio,
          phone: editFormData.phone,
          department: editFormData.department,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Refresh users data to get updated information
      await fetchUsers();
      
      // Update selected user with new data
      const updatedUser = users.find(u => u.id === selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };
  const resetUserPassword = async () => {
    if (!selectedUser) return;
    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      alert(`Password reset email sent to ${selectedUser.email}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to send password reset email');
    }
  };

  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddFormData({ ...addFormData, [name]: value });
  };

  const createUser = async () => {
    if (!addFormData.email || !addFormData.password || !addFormData.full_name) {
      alert('Please provide full name, email and password for the new user.');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: addFormData.email,
        password: addFormData.password
      });
      if (error) throw error;

      // Optionally you can create a profile row here, but per your instruction we'll let Supabase handle confirmation
      // and the signup flow. If you want a profile created immediately, we can insert into `users` table too.

      setShowAddUserModal(false);
      setAddFormData({ full_name: '', email: '', password: '', role: 'student', status: 'active', bio: '', phone: '', department: '' });
      alert('User signup initiated. Supabase will send confirmation if configured.');
    } catch (err: any) {
      console.error('Create user (supabase.auth.signUp) failed:', err);
      alert('Failed to create user: ' + (err?.message || String(err)));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout title="User Management" role="admin">
      {/* Filters and actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <form onSubmit={handleSearch}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
              </div>
              <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Search users by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </form>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-2">
            {/* Mobile filter toggle */}
            <button className="md:hidden inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" onClick={() => setShowMobileFilters(!showMobileFilters)}>
              <FilterIcon size={16} className="mr-2" />
              {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {/* Add User button */}
            <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500" onClick={() => {
            // In a real implementation, this would show a form to add a new user
            // Show Add User modal
            setShowAddUserModal(true);
          }}>
              <PlusIcon size={16} className="mr-2" />
              Add User
            </button>
          </div>
          {/* Filters - hidden on mobile unless toggled */}
          <div className={`flex flex-wrap items-center gap-3 ${showMobileFilters ? 'flex' : 'hidden md:flex'}`}>
            {/* Role Filter */}
            <div className="relative inline-block text-left w-full md:w-auto">
              <select className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" value={roleFilter || ''} onChange={e => setRoleFilter(e.target.value || null)}>
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon size={16} />
              </div>
            </div>
            {/* Reset Filters */}
            {(searchTerm || roleFilter) && <button onClick={resetFilters} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-auto">
                <RefreshCwIcon size={16} className="mr-2" />
                Reset Filters
              </button>}
            {/* Export */}
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-auto">
              <DownloadIcon size={16} className="mr-2" />
              Export Users
            </button>
          </div>
        </div>
      </div>
      {/* Users Table - Desktop View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                      <span className="ml-2 text-gray-500">
                        Loading users...
                      </span>
                    </div>
                  </td>
                </tr> : users.length === 0 ? <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="text-center py-8">
                      <UserIcon size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        No users found
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm || roleFilter ? 'Try adjusting your search or filter criteria.' : 'Get started by adding your first user.'}
                      </p>
                      {searchTerm || roleFilter ? <button onClick={resetFilters} className="mt-4 text-purple-600 hover:text-purple-800 font-medium">
                          Reset all filters
                        </button> : <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700" onClick={() => {
                    setShowAddUserModal(true);
                  }}>
                          <PlusIcon size={16} className="mr-2" />
                          Add User
                        </button>}
                    </div>
                  </td>
                </tr> : users.map(user => <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleUserClick(user)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                          {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name} className="h-10 w-10 object-cover" /> : <div className="h-10 w-10 flex items-center justify-center bg-purple-100 text-purple-600">
                              <UserIcon size={20} />
                            </div>}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Streak: {user.streak_count} days
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2" onClick={e => e.stopPropagation()}>
                        <button className="text-purple-600 hover:text-purple-900" title="Edit user" onClick={e => {
                    e.stopPropagation();
                    handleUserClick(user);
                    setIsEditing(true);
                  }}>
                          <EditIcon size={16} />
                        </button>
                        <button onClick={e => {
                    e.stopPropagation();
                    handleDeleteClick(user.id);
                  }} className="text-red-600 hover:text-red-900" title="Delete user">
                          <TrashIcon size={16} />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900" title="View user details" onClick={e => {
                    e.stopPropagation();
                    handleUserClick(user);
                  }}>
                          <EyeIcon size={16} />
                        </button>
                        <button className="text-gray-500 hover:text-gray-700" title="More options">
                          <MoreHorizontalIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {users.length > 0 && <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to{' '}
                  <span className="font-medium">{users.length}</span> of{' '}
                  <span className="font-medium">{users.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L10.586 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" aria-current="page" className="z-10 bg-purple-50 border-purple-500 text-purple-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                    1
                  </a>
                  <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010 1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                </nav>
              </div>
            </div>
          </div>}
      </div>
      {/* Mobile User Cards */}
      <div className="md:hidden">
        {loading ? <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-2 text-gray-500">Loading users...</span>
          </div> : users.length === 0 ? <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <UserIcon size={40} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No users found
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchTerm || roleFilter ? 'Try adjusting your search or filter criteria.' : 'Get started by adding your first user.'}
            </p>
            {searchTerm || roleFilter ? <button onClick={resetFilters} className="w-full text-purple-600 hover:text-purple-800 font-medium">
                Reset all filters
              </button> : <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700" onClick={() => {
          setShowAddUserModal(true);
        }}>
                <PlusIcon size={16} className="mr-2" />
                Add User
              </button>}
          </div> : <div className="space-y-4">
            {users.map(user => <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" onClick={() => handleUserClick(user)}>
                <div className="p-4">
                  <div className="flex justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {user.full_name}
                      </h3>
                      <p className="mt-1 flex items-center text-xs text-gray-500">
                        <MailIcon size={12} className="mr-1" />
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        <ShieldIcon size={12} className="mr-1" />
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>}
      </div>
      {/* User Detail Modal */}
      {showUserModal && selectedUser && <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" style={{
          maxWidth: '90%',
          width: '600px'
        }}>
              {/* Modal Header */}
              <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex justify-between items-center">
                <h3 className="text-lg font-medium text-purple-900">
                  {isEditing ? 'Edit User' : 'User Details'}
                </h3>
                <button onClick={() => setShowUserModal(false)} className="text-purple-500 hover:text-purple-700 focus:outline-none">
                  <XIcon size={20} />
                </button>
              </div>
              {/* Modal Content */}
              <div className="p-6">
                {isEditing /* Edit Form */ ? <div className="space-y-4">
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input type="text" name="full_name" id="full_name" value={editFormData.full_name} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input type="email" name="email" id="email" value={editFormData.email} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <select name="role" id="role" value={editFormData.role} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div> /* View Details */ : <div className="space-y-4">
                    {/* User Avatar */}
                    <div className="flex justify-center">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                        {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} alt={selectedUser.full_name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center bg-purple-100 text-purple-600">
                            <UserIcon size={48} />
                          </div>}
                      </div>
                    </div>
                    {/* User Info */}
                    <div className="text-center">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {selectedUser.full_name}
                      </h2>
                      <div className="flex justify-center items-center mt-1 text-gray-500">
                        <MailIcon size={16} className="mr-1" />
                        <span>{selectedUser.email}</span>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          <ShieldIcon size={12} className="mr-1" />
                          {selectedUser.role}
                        </span>
                      </div>
                    </div>
                    {/* User Stats */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xs text-gray-500 uppercase">
                          Streak
                        </div>
                        <div className="font-medium text-gray-800">
                          {selectedUser.streak_count} days
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xs text-gray-500 uppercase">
                          Last Login
                        </div>
                        <div className="font-medium text-gray-800">
                          {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                    </div>
                    {/* Additional Info */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Account Created:</span>
                        <span className="font-medium text-gray-800">
                          {new Date(selectedUser.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>}
              </div>
              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {isEditing ? <>
                    <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={handleEditSubmit}>
                      Save Changes
                    </button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={handleEditCancel}>
                      Cancel
                    </button>
                  </> : <>
                    <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={handleEditClick}>
                      Edit User
                    </button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => handleDeleteClick(selectedUser.id)}>
                      Delete
                    </button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={resetUserPassword}>
                      Reset Password
                    </button>
                  </>}
              </div>
            </div>
          </div>
        </div>}
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
                      Delete User
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this user? This action
                        cannot be undone, and all associated data will be
                        permanently removed.
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
      }
      {/* Add User Modal (renders independently) */}
      {showAddUserModal && <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" style={{ maxWidth: '90%', width: '600px' }}>
              <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex justify-between items-center">
                <h3 className="text-lg font-medium text-purple-900">Add New User</h3>
                <button onClick={() => setShowAddUserModal(false)} className="text-purple-500 hover:text-purple-700 focus:outline-none">
                  <XIcon size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="add_full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input autoFocus required placeholder="e.g. Jane Doe" type="text" name="full_name" id="add_full_name" value={addFormData.full_name} onChange={handleAddInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="add_email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input required placeholder="name@example.com" type="email" name="email" id="add_email" value={addFormData.email} onChange={handleAddInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="add_password" className="block text-sm font-medium text-gray-700">Temporary Password</label>
                    <input required placeholder="Temporary password (min 8 chars)" type="password" name="password" id="add_password" value={addFormData.password} onChange={handleAddInputChange} aria-describedby="add-password-help" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                    <p id="add-password-help" className="text-xs text-gray-500 mt-1">Provide a temporary password — user can change it later.</p>
                  </div>
                  <div>
                    <label htmlFor="add_role" className="block text-sm font-medium text-gray-700">Role</label>
                    <select name="role" id="add_role" value={addFormData.role} onChange={handleAddInputChange} aria-label="Role" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Select a role for the new user. Default: Student.</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" disabled={isCreating} className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${isCreating ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm`} onClick={createUser}>
                  {isCreating ? <span className="flex items-center"><svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"></path></svg>Creating...</span> : 'Create User'}
                </button>
                <button type="button" disabled={isCreating} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setShowAddUserModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>}
    </DashboardLayout>
  );
};

