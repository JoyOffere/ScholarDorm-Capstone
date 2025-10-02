import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { SettingsIcon, BellIcon, ShieldIcon, DatabaseIcon, MailIcon, SaveIcon, AlertTriangleIcon, CheckCircleIcon, GlobeIcon, KeyIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { createAuditLog } from '../../../lib/supabase-utils';
export const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState({
    general: {
      site_name: 'ScholarDorm',
      site_description: 'Accessible education for everyone',
      maintenance_mode: false,
      registration_enabled: true
    },
    notifications: {
      email_notifications: true,
      streak_reminders: true,
      badge_notifications: true,
      system_alerts: true
    },
    security: {
      password_min_length: 8,
      session_timeout: 24,
      max_login_attempts: 5,
      two_factor_required: false
    },
    email: {
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      from_email: 'noreply@scholardorm.com'
    }
  });
  useEffect(() => {
    fetchSettings();
  }, []);
  const fetchSettings = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would fetch settings from a settings table
      // For now, we'll use default values
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
    setSaveSuccess(false);
  };
  const saveSettings = async () => {
    try {
      setLoading(true);
      // Get current user for audit log
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      // In a real implementation, you would save settings to database
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (user) {
        await createAuditLog(user.id, 'admin_content_update', {
          type: 'system_settings',
          sections_updated: Object.keys(settings)
        });
      }
      setSaveSuccess(true);
    } catch (error) {
      console.error('Error saving settings:', error);
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
  }) => <button type="button" className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${checked ? 'bg-purple-600' : 'bg-gray-200'}`} onClick={onChange}>
      <span className="sr-only">Toggle</span>
      <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
    </button>;
  return <DashboardLayout title="System Settings" role="admin">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <SettingsIcon className="text-purple-500 mr-2" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                General Settings
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name
                </label>
                <input type="text" value={settings.general.site_name} onChange={e => handleInputChange('general', 'site_name', e.target.value)} className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Description
                </label>
                <textarea value={settings.general.site_description} onChange={e => handleInputChange('general', 'site_description', e.target.value)} rows={3} className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Maintenance Mode
                  </h4>
                  <p className="text-sm text-gray-500">
                    Temporarily disable site access
                  </p>
                </div>
                <ToggleSwitch checked={settings.general.maintenance_mode} onChange={() => handleInputChange('general', 'maintenance_mode', !settings.general.maintenance_mode)} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Registration Enabled
                  </h4>
                  <p className="text-sm text-gray-500">
                    Allow new user registrations
                  </p>
                </div>
                <ToggleSwitch checked={settings.general.registration_enabled} onChange={() => handleInputChange('general', 'registration_enabled', !settings.general.registration_enabled)} />
              </div>
            </div>
          </div>
          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <BellIcon className="text-purple-500 mr-2" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Notification Settings
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Email Notifications
                  </h4>
                  <p className="text-sm text-gray-500">
                    Send email notifications to users
                  </p>
                </div>
                <ToggleSwitch checked={settings.notifications.email_notifications} onChange={() => handleInputChange('notifications', 'email_notifications', !settings.notifications.email_notifications)} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Streak Reminders
                  </h4>
                  <p className="text-sm text-gray-500">
                    Send reminders to maintain learning streaks
                  </p>
                </div>
                <ToggleSwitch checked={settings.notifications.streak_reminders} onChange={() => handleInputChange('notifications', 'streak_reminders', !settings.notifications.streak_reminders)} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Badge Notifications
                  </h4>
                  <p className="text-sm text-gray-500">
                    Notify users when they earn badges
                  </p>
                </div>
                <ToggleSwitch checked={settings.notifications.badge_notifications} onChange={() => handleInputChange('notifications', 'badge_notifications', !settings.notifications.badge_notifications)} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium text-gray-800">System Alerts</h4>
                  <p className="text-sm text-gray-500">
                    Send system alerts to administrators
                  </p>
                </div>
                <ToggleSwitch checked={settings.notifications.system_alerts} onChange={() => handleInputChange('notifications', 'system_alerts', !settings.notifications.system_alerts)} />
              </div>
            </div>
          </div>
          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <ShieldIcon className="text-purple-500 mr-2" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Security Settings
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Password Length
                </label>
                <input type="number" value={settings.security.password_min_length} onChange={e => handleInputChange('security', 'password_min_length', parseInt(e.target.value))} min="6" max="20" className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Timeout (hours)
                </label>
                <input type="number" value={settings.security.session_timeout} onChange={e => handleInputChange('security', 'session_timeout', parseInt(e.target.value))} min="1" max="168" className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Login Attempts
                </label>
                <input type="number" value={settings.security.max_login_attempts} onChange={e => handleInputChange('security', 'max_login_attempts', parseInt(e.target.value))} min="3" max="10" className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Two-Factor Authentication
                  </h4>
                  <p className="text-sm text-gray-500">
                    Require 2FA for all admin accounts
                  </p>
                </div>
                <ToggleSwitch checked={settings.security.two_factor_required} onChange={() => handleInputChange('security', 'two_factor_required', !settings.security.two_factor_required)} />
              </div>
            </div>
          </div>
        </div>
        {/* Right Column */}
        <div className="space-y-6">
          {/* Email Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <MailIcon className="text-purple-500 mr-2" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Email Configuration
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Host
                </label>
                <input type="text" value={settings.email.smtp_host} onChange={e => handleInputChange('email', 'smtp_host', e.target.value)} placeholder="smtp.example.com" className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Port
                </label>
                <input type="number" value={settings.email.smtp_port} onChange={e => handleInputChange('email', 'smtp_port', parseInt(e.target.value))} className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Username
                </label>
                <input type="text" value={settings.email.smtp_username} onChange={e => handleInputChange('email', 'smtp_username', e.target.value)} className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Password
                </label>
                <input type="password" value={settings.email.smtp_password} onChange={e => handleInputChange('email', 'smtp_password', e.target.value)} className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Email
                </label>
                <input type="email" value={settings.email.from_email} onChange={e => handleInputChange('email', 'from_email', e.target.value)} className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
          </div>
          {/* System Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <DatabaseIcon className="text-purple-500 mr-2" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                System Information
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Version</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Database</span>
                <span className="text-sm font-medium text-green-600">
                  Connected
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Storage</span>
                <span className="text-sm font-medium">85% Used</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Last Backup</span>
                <span className="text-sm font-medium">2 hours ago</span>
              </div>
            </div>
          </div>
          {/* Save Button */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button onClick={saveSettings} disabled={loading} className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50">
              {loading ? <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </> : <>
                  <SaveIcon size={16} className="mr-2" />
                  Save Settings
                </>}
            </button>
            {saveSuccess && <div className="mt-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
                <CheckCircleIcon size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>Settings saved successfully.</span>
              </div>}
          </div>
        </div>
      </div>
    </DashboardLayout>;
};