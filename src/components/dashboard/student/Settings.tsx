import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { BellIcon, EyeIcon, GlobeIcon, LockIcon, SaveIcon, ShieldIcon, ToggleLeftIcon, ToggleRightIcon, VideoIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { createAuditLog } from '../../../lib/supabase-utils';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../common/Button';
export const StudentSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    notifications: {
      streak_reminders: true,
      badge_notifications: true,
      course_recommendations: true,
      system_updates: true
    },
    accessibility: {
      high_contrast: false,
      large_text: false,
      show_rsl: true
    },
    language: 'en',
    privacy: {
      show_profile: true,
      share_achievements: true
    }
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  useEffect(() => {
    const fetchUserSettings = async () => {
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
        // Get user settings
        const {
          data: userSettings,
          error
        } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        // If settings exist, update state
        if (userSettings) {
          setSettings({
            notifications: userSettings.notification_preferences || settings.notifications,
            accessibility: userSettings.accessibility_settings || settings.accessibility,
            language: userSettings.language_preference || 'en',
            privacy: userSettings.privacy_settings || settings.privacy
          });
        } else {
          // Create default settings
          await supabase.from('user_settings').insert({
            user_id: user.id,
            notification_preferences: settings.notifications,
            accessibility_settings: settings.accessibility,
            language_preference: settings.language,
            privacy_settings: settings.privacy
          });
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserSettings();
  }, []);
  const handleToggleChange = (category: string, setting: string) => {
    setSettings(prev => {
      const updatedCategory = {
        ...(prev as any)[category],
        [setting]: !(prev as any)[category]?.[setting]
      };
      return {
        ...(prev as any),
        [category]: updatedCategory
      } as any;
    });
    // Clear success message when changes are made
    setSaveSuccess(false);
  };
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({
      ...prev,
      language: e.target.value
    }));
    // Clear success message when changes are made
    setSaveSuccess(false);
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when typing
    setPasswordError(null);
    setPasswordSuccess(null);
  };
  const saveSettings = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const {
        error
      } = await supabase.from('user_settings').update({
        notification_preferences: settings.notifications,
        accessibility_settings: settings.accessibility,
        language_preference: settings.language,
        privacy_settings: settings.privacy,
        updated_at: new Date().toISOString()
      }).eq('user_id', userId);
      if (error) throw error;
      // Create audit log
      await createAuditLog(userId, 'settings_changed', {
        settings_updated: ['notifications', 'accessibility', 'language', 'privacy']
      });
      setSaveSuccess(true);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };
  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    // Validate passwords
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    try {
      setLoading(true);
      // Update password
      const {
        error
      } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      });
      if (error) throw error;
      // Create audit log
      await createAuditLog(userId, 'password_changed', {
        timestamp: new Date().toISOString()
      });
      // Reset form and show success
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setPasswordSuccess('Password updated successfully');
    } catch (error: any) {
      setPasswordError(error.message || 'Error updating password');
    } finally {
      setLoading(false);
    }
  };
  const ToggleSwitch = ({
    checked,
    onChange
  }: {
    checked: boolean;
    onChange: () => void;
  }) => <button type="button" className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200'}`} onClick={onChange} aria-pressed={checked} aria-labelledby="toggle-label">
      <span className="sr-only">Toggle</span>
      <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
    </button>;
  if (loading && !userId) {
    return <DashboardLayout title="Settings" role="student">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>;
  }
  return <DashboardLayout title="Settings" role="student">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <BellIcon className="text-blue-500 mr-2" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Notification Settings
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Streak Reminders
                  </h4>
                  <p className="text-sm text-gray-500">
                    Receive reminders to maintain your learning streak
                  </p>
                </div>
                <ToggleSwitch checked={settings.notifications.streak_reminders} onChange={() => handleToggleChange('notifications', 'streak_reminders')} />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Badge Notifications
                  </h4>
                  <p className="text-sm text-gray-500">
                    Get notified when you earn new badges
                  </p>
                </div>
                <ToggleSwitch checked={settings.notifications.badge_notifications} onChange={() => handleToggleChange('notifications', 'badge_notifications')} />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Course Recommendations
                  </h4>
                  <p className="text-sm text-gray-500">
                    Receive personalized course recommendations
                  </p>
                </div>
                <ToggleSwitch checked={settings.notifications.course_recommendations} onChange={() => handleToggleChange('notifications', 'course_recommendations')} />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-800">System Updates</h4>
                  <p className="text-sm text-gray-500">
                    Get notified about platform updates and new features
                  </p>
                </div>
                <ToggleSwitch checked={settings.notifications.system_updates} onChange={() => handleToggleChange('notifications', 'system_updates')} />
              </div>
            </div>
          </div>
          {/* Accessibility Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <EyeIcon className="text-blue-500 mr-2" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Accessibility Settings
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium text-gray-800">
                    High Contrast Mode
                  </h4>
                  <p className="text-sm text-gray-500">
                    Increase contrast for better visibility
                  </p>
                </div>
                <ToggleSwitch checked={settings.accessibility.high_contrast} onChange={() => handleToggleChange('accessibility', 'high_contrast')} />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-800">Large Text</h4>
                  <p className="text-sm text-gray-500">
                    Increase text size throughout the platform
                  </p>
                </div>
                <ToggleSwitch checked={settings.accessibility.large_text} onChange={() => handleToggleChange('accessibility', 'large_text')} />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Rwandan Sign Language Videos
                  </h4>
                  <p className="text-sm text-gray-500">
                    Show RSL videos when available
                  </p>
                </div>
                <ToggleSwitch checked={settings.accessibility.show_rsl} onChange={() => handleToggleChange('accessibility', 'show_rsl')} />
              </div>
            </div>
          </div>
          {/* Language Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <GlobeIcon className="text-blue-500 mr-2" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Language Settings
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Language
                </label>
                <select id="language" name="language" value={settings.language} onChange={handleLanguageChange} className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="en">English</option>
                  <option value="rw">Kinyarwanda</option>
                  <option value="fr">French</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  This will change the language of the platform interface
                </p>
              </div>
            </div>
          </div>
          {/* Privacy Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <ShieldIcon className="text-blue-500 mr-2" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Privacy Settings
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium text-gray-800">Public Profile</h4>
                  <p className="text-sm text-gray-500">
                    Allow other students to view your profile
                  </p>
                </div>
                <ToggleSwitch checked={settings.privacy.show_profile} onChange={() => handleToggleChange('privacy', 'show_profile')} />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Share Achievements
                  </h4>
                  <p className="text-sm text-gray-500">
                    Display your badges and achievements on your profile
                  </p>
                </div>
                <ToggleSwitch checked={settings.privacy.share_achievements} onChange={() => handleToggleChange('privacy', 'share_achievements')} />
              </div>
            </div>
          </div>
          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={saveSettings} icon={<SaveIcon size={16} />} isLoading={loading} disabled={loading}>
              Save Settings
            </Button>
          </div>
          {saveSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
              <CheckCircleIcon size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>Your settings have been saved successfully.</span>
            </div>}
        </div>
        {/* Right Column */}
        <div className="space-y-6">
          {/* Password Change */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <LockIcon className="text-blue-500 mr-2" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Change Password
              </h3>
            </div>
            <form onSubmit={updatePassword} className="space-y-4">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input type="password" id="current_password" name="current_password" value={passwordForm.current_password} onChange={handlePasswordChange} className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input type="password" id="new_password" name="new_password" value={passwordForm.new_password} onChange={handlePasswordChange} className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input type="password" id="confirm_password" name="confirm_password" value={passwordForm.confirm_password} onChange={handlePasswordChange} className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              {passwordError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                  <AlertCircleIcon size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>}
              {passwordSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
                  <CheckCircleIcon size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>}
              <div>
                <Button type="submit" fullWidth isLoading={loading} disabled={loading}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
          {/* RSL Video Preferences */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <VideoIcon className="text-blue-500 mr-2" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                RSL Video Settings
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Customize how Rwandan Sign Language videos are displayed
              throughout the platform.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Auto-Play Videos
                  </h4>
                  <p className="text-sm text-gray-500">
                    Automatically play RSL videos when available
                  </p>
                </div>
                <ToggleSwitch checked={true} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Show Video Controls
                  </h4>
                  <p className="text-sm text-gray-500">
                    Display playback controls for RSL videos
                  </p>
                </div>
                <ToggleSwitch checked={true} onChange={() => {}} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>;
};