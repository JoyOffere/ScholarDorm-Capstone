import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { UserIcon, EditIcon, SaveIcon, XIcon, CameraIcon, ShieldIcon, ClockIcon, ActivityIcon, KeyIcon, MailIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { createAuditLog } from '../../../lib/supabase-utils';
export const AdminProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    bio: '',
    phone: '',
    department: ''
  });
  const [stats, setStats] = useState({
    total_logins: 0,
    last_login: '',
    account_created: '',
    actions_performed: 0,
    users_managed: 0,
    courses_created: 0
  });
  useEffect(() => {
    fetchUserData();
  }, []);
  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Get current user
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      // Get user profile
      const {
        data: profile,
        error: profileError
      } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (profileError) throw profileError;
      // Get admin stats
      const {
        count: actionsCount
      } = await supabase.from('audit_logs').select('id', {
        count: 'exact',
        head: true
      }).eq('user_id', user.id);
      const {
        count: usersCount
      } = await supabase.from('users').select('id', {
        count: 'exact',
        head: true
      });
      const {
        count: coursesCount
      } = await supabase.from('courses').select('id', {
        count: 'exact',
        head: true
      }).eq('created_by', user.id);
      // Set state
      setUser(profile);
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        department: profile.department || 'Administration'
      });
      setStats({
        total_logins: 0,
        last_login: profile.last_login || '',
        account_created: profile.created_at || '',
        actions_performed: actionsCount || 0,
        users_managed: usersCount || 0,
        courses_created: coursesCount || 0
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('users').update({
        full_name: formData.full_name,
        bio: formData.bio,
        phone: formData.phone,
        department: formData.department,
        updated_at: new Date().toISOString()
      }).eq('id', user.id).select();
      if (error) throw error;
      // Create audit log
      await createAuditLog(user.id, 'profile_update', {
        fields_updated: Object.keys(formData),
        admin_profile: true
      });
      setUser(data[0]);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleCancelEdit = () => {
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      bio: user.bio || '',
      phone: user.phone || '',
      department: user.department || 'Administration'
    });
    setEditMode(false);
  };
  if (loading && !user) {
    return <DashboardLayout title="Admin Profile" role="admin">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </DashboardLayout>;
  }
  return <DashboardLayout title="Admin Profile" role="admin">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-purple-500 to-purple-700"></div>
            <div className="p-6 relative">
              <div className="absolute -top-12 left-6 rounded-full border-4 border-white">
                {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name || 'Admin Profile'} className="h-24 w-24 rounded-full object-cover" /> : <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center">
                    <ShieldIcon size={40} className="text-purple-500" />
                  </div>}
                {editMode && <button className="absolute bottom-0 right-0 bg-purple-500 text-white p-1.5 rounded-full">
                    <CameraIcon size={16} />
                  </button>}
              </div>
              <div className="ml-32">
                {editMode ? <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} className="text-2xl font-bold w-full border-b border-gray-300 pb-1 focus:outline-none focus:border-purple-500" placeholder="Your name" /> : <h2 className="text-2xl font-bold">
                    {user.full_name || 'Administrator'}
                  </h2>}
                <p className="text-gray-500">{user.email}</p>
                <div className="flex items-center mt-2 text-sm text-purple-600">
                  <ShieldIcon size={14} className="mr-1" />
                  <span>Administrator</span>
                </div>
                {!editMode && <button onClick={() => setEditMode(true)} className="mt-3 inline-flex items-center text-sm text-purple-600 hover:text-purple-800">
                    <EditIcon size={14} className="mr-1" />
                    Edit Profile
                  </button>}
                {editMode && <div className="flex space-x-2 mt-3">
                    <button onClick={handleSaveProfile} disabled={loading} className="inline-flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50">
                      <SaveIcon size={14} className="mr-1" />
                      Save
                    </button>
                    <button onClick={handleCancelEdit} disabled={loading} className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">
                      <XIcon size={14} className="mr-1" />
                      Cancel
                    </button>
                  </div>}
              </div>
            </div>
          </div>
          {/* Profile Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Profile Information
            </h3>
            {editMode ? <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50 text-gray-500" />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Tell us about yourself..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="+250 XXX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input type="text" name="department" value={formData.department} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Administration" />
                  </div>
                </div>
              </div> : <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">
                    Email Address
                  </h4>
                  <p className="text-gray-600 mt-1 flex items-center">
                    <MailIcon size={14} className="mr-2 text-gray-400" />
                    {user.email}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Bio</h4>
                  <p className="text-gray-600 mt-1">
                    {user.bio || 'No bio provided yet.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Phone</h4>
                    <p className="text-gray-600 mt-1">
                      {user.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">
                      Department
                    </h4>
                    <p className="text-gray-600 mt-1">
                      {user.department || 'Administration'}
                    </p>
                  </div>
                </div>
              </div>}
          </div>
          {/* Admin Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Admin Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center text-purple-600 mb-2">
                  <ActivityIcon size={16} className="mr-1" />
                  <span className="text-sm font-medium">Actions Performed</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.actions_performed}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center text-blue-600 mb-2">
                  <UserIcon size={16} className="mr-1" />
                  <span className="text-sm font-medium">Users Managed</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.users_managed}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center text-green-600 mb-2">
                  <ActivityIcon size={16} className="mr-1" />
                  <span className="text-sm font-medium">Courses Created</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.courses_created}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Right Column */}
        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Account Information
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Account Created</span>
                <p className="text-sm font-medium">
                  {stats.account_created ? new Date(stats.account_created).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Last Login</span>
                <p className="text-sm font-medium">
                  {stats.last_login ? new Date(stats.last_login).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Role</span>
                <p className="text-sm font-medium text-purple-600">
                  Administrator
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <p className="text-sm font-medium text-green-600">Active</p>
              </div>
            </div>
          </div>
          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Security</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <KeyIcon size={16} className="mr-3 text-gray-400" />
                  <div>
                    <h4 className="text-sm font-medium">Change Password</h4>
                    <p className="text-xs text-gray-500">
                      Update your account password
                    </p>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <ShieldIcon size={16} className="mr-3 text-gray-400" />
                  <div>
                    <h4 className="text-sm font-medium">
                      Two-Factor Authentication
                    </h4>
                    <p className="text-xs text-gray-500">
                      Add an extra layer of security
                    </p>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <ActivityIcon size={16} className="mr-3 text-gray-400" />
                  <div>
                    <h4 className="text-sm font-medium">Login History</h4>
                    <p className="text-xs text-gray-500">
                      View recent login activity
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 mr-3"></div>
                <div>
                  <p className="text-sm text-gray-800">
                    Updated system settings
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 mr-3"></div>
                <div>
                  <p className="text-sm text-gray-800">Created new course</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="h-2 w-2 rounded-full bg-purple-500 mt-2 mr-3"></div>
                <div>
                  <p className="text-sm text-gray-800">Reviewed user reports</p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>;
};