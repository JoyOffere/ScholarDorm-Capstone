import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { UserIcon, EditIcon, SaveIcon, XIcon, CameraIcon, BadgeIcon, CalendarIcon, BookOpenIcon, ClockIcon, AwardIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { createAuditLog } from '../../../lib/supabase-utils';
import { Button } from '../../common/Button';
export const StudentProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    education: ''
  });
  const [badges, setBadges] = useState<any[]>([]);
  const [stats, setStats] = useState({
    streak_count: 0,
    longest_streak: 0,
    courses_completed: 0,
    badges_earned: 0,
    total_learning_time: 0
  });
  useEffect(() => {
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
        // Get user badges
        const {
          data: userBadges,
          error: badgesError
        } = await supabase.from('user_badges').select(`
            id,
            earned_at,
            badges (
              id,
              name,
              description,
              image_url
            )
          `).eq('user_id', user.id);
        if (badgesError) throw badgesError;
        // Get user stats
        const {
          data: coursesCompleted,
          error: coursesError
        } = await supabase.from('user_progress').select('id').eq('user_id', user.id).eq('completed', true);
        if (coursesError) throw coursesError;
        // Set state
        setUser(profile);
        setFormData({
          full_name: profile.full_name || '',
          bio: profile.bio || '',
          location: profile.location || '',
          education: profile.education || ''
        });
        setBadges(userBadges?.map(badge => badge.badges) || []);
        setStats({
          streak_count: profile.streak_count || 0,
          longest_streak: profile.longest_streak || 0,
          courses_completed: coursesCompleted?.length || 0,
          badges_earned: userBadges?.length || 0,
          total_learning_time: 0 // Would calculate from activity logs in a real implementation
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);
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
        location: formData.location,
        education: formData.education,
        updated_at: new Date().toISOString()
      }).eq('id', user.id).select();
      if (error) throw error;
      // Create audit log
      await createAuditLog(user.id, 'profile_update', {
        fields_updated: Object.keys(formData)
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
      bio: user.bio || '',
      location: user.location || '',
      education: user.education || ''
    });
    setEditMode(false);
  };
  if (loading && !user) {
    return <DashboardLayout title="Profile" role="student">
        <div className="py-6 text-center text-sm text-gray-600">Loading profile…</div>
      </DashboardLayout>;
  }
  return <DashboardLayout title="My Profile" role="student">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-700"></div>
            <div className="p-6 relative">
              <div className="absolute -top-12 left-6 rounded-full border-4 border-white">
                {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name || 'Profile'} className="h-24 w-24 rounded-full object-cover" /> : <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon size={40} className="text-blue-500" />
                  </div>}
                {editMode && <button className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full">
                    <CameraIcon size={16} />
                  </button>}
              </div>
              <div className="ml-32">
                {editMode ? <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} className="text-2xl font-bold w-full border-b border-gray-300 pb-1 focus:outline-none focus:border-blue-500" placeholder="Your name" /> : <h2 className="text-2xl font-bold">
                    {user.full_name || 'Student'}
                  </h2>}
                <p className="text-gray-500">{user.email}</p>
                {!editMode && <button onClick={() => setEditMode(true)} className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                    <EditIcon size={14} className="mr-1" />
                    Edit Profile
                  </button>}
                {editMode && <div className="flex space-x-2 mt-2">
                    <Button onClick={handleSaveProfile} icon={<SaveIcon size={14} />} className="py-1 px-3 text-sm" isLoading={loading}>
                      Save
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outline" icon={<XIcon size={14} />} className="py-1 px-3 text-sm" disabled={loading}>
                      Cancel
                    </Button>
                  </div>}
              </div>
            </div>
          </div>
          {/* Profile Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">About Me</h3>
            {editMode ? <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tell us about yourself..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Where are you from?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education
                  </label>
                  <input type="text" name="education" value={formData.education} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your school or institution" />
                </div>
              </div> : <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Bio</h4>
                  <p className="text-gray-600 mt-1">
                    {user.bio || 'No bio provided yet.'}
                  </p>
                </div>
                <div className="flex">
                  <div className="w-1/2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Location
                    </h4>
                    <p className="text-gray-600 mt-1">
                      {user.location || 'Not specified'}
                    </p>
                  </div>
                  <div className="w-1/2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Education
                    </h4>
                    <p className="text-gray-600 mt-1">
                      {user.education || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>}
          </div>
          {/* Learning Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Learning Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center text-blue-600 mb-2">
                  <CalendarIcon size={16} className="mr-1" />
                  <span className="text-sm font-medium">Current Streak</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.streak_count} days
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center text-purple-600 mb-2">
                  <BadgeIcon size={16} className="mr-1" />
                  <span className="text-sm font-medium">Longest Streak</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.longest_streak} days
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center text-green-600 mb-2">
                  <BookOpenIcon size={16} className="mr-1" />
                  <span className="text-sm font-medium">Courses Completed</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.courses_completed}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center text-yellow-600 mb-2">
                  <AwardIcon size={16} className="mr-1" />
                  <span className="text-sm font-medium">Badges Earned</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.badges_earned}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center text-gray-600 mb-2">
                <ClockIcon size={16} className="mr-1" />
                <span className="text-sm font-medium">Total Learning Time</span>
              </div>
              <p className="text-gray-800">
                {stats.total_learning_time > 0 ? `${Math.floor(stats.total_learning_time / 60)} hours ${stats.total_learning_time % 60} minutes` : 'Not enough data yet'}
              </p>
            </div>
          </div>
        </div>
        {/* Right Column - Badges & Achievements */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">My Badges</h3>
              <span className="text-sm text-gray-500">
                {badges.length} earned
              </span>
            </div>
            {badges.length > 0 ? <div className="grid grid-cols-2 gap-4">
                {badges.map((badge, index) => <div key={index} className="border rounded-lg p-3 flex flex-col items-center text-center">
                    <img src={badge.image_url || `https://ui-avatars.com/api/?name=${badge.name}&background=4338CA&color=fff`} alt={badge.name} className="w-12 h-12 rounded-full mb-2" />
                    <h4 className="font-medium text-gray-800 text-sm">
                      {badge.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {badge.description}
                    </p>
                  </div>)}
              </div> : <div className="text-center py-8">
                <AwardIcon size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No badges earned yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Complete courses and maintain streaks to earn badges
                </p>
              </div>}
            <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all badges
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Next Achievements
            </h3>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <CalendarIcon size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        7-Day Streak
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Log in for 7 consecutive days
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {stats.streak_count}/7
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{
                  width: `${Math.min(100, stats.streak_count / 7 * 100)}%`
                }}></div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <BookOpenIcon size={16} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        First Course
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Complete your first course
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {stats.courses_completed}/1
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                  <div className="bg-green-600 h-1.5 rounded-full" style={{
                  width: `${Math.min(100, stats.courses_completed * 100)}%`
                }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>;
};