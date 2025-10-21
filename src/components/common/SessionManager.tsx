import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { RefreshCwIcon, AlertCircleIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';

interface SessionManagerProps {
  showDebugInfo?: boolean;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ showDebugInfo = false }) => {
  const { user, session, loading, refreshSession, daemonStatus, getDaemonEvents } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [sessionAge, setSessionAge] = useState<string>('');
  const [daemonInfo, setDaemonInfo] = useState<any>(null);

  useEffect(() => {
    if (session?.expires_at) {
      const updateSessionAge = () => {
        const now = new Date();
        const expiresAt = new Date(session.expires_at! * 1000);
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        
        if (timeUntilExpiry > 0) {
          const hours = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
          const minutes = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));
          setSessionAge(`Expires in ${hours}h ${minutes}m`);
        } else {
          setSessionAge('Session expired');
        }
      };

      updateSessionAge();
      const interval = setInterval(updateSessionAge, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [session]);

  // Update daemon status periodically
  useEffect(() => {
    const updateDaemonStatus = () => {
      setDaemonInfo(daemonStatus());
    };

    updateDaemonStatus();
    const interval = setInterval(updateDaemonStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [daemonStatus]);

  const handleRefreshSession = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshSession();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh session:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSessionStatus = () => {
    if (loading) return { icon: RefreshCwIcon, color: 'text-yellow-500', text: 'Loading...' };
    if (!session) return { icon: XCircleIcon, color: 'text-red-500', text: 'No session' };
    if (session && user) return { icon: CheckCircleIcon, color: 'text-green-500', text: 'Active' };
    return { icon: AlertCircleIcon, color: 'text-orange-500', text: 'Partial' };
  };

  const status = getSessionStatus();
  const StatusIcon = status.icon;

  if (!showDebugInfo) {
    // Minimal status indicator
    return (
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <StatusIcon size={12} className={status.color} />
        <span>{status.text}</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Session Status</h3>
        <button
          onClick={handleRefreshSession}
          disabled={isRefreshing || !session}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCwIcon size={12} className={isRefreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="font-medium text-gray-600">Status:</span>
          <div className="flex items-center space-x-1 mt-1">
            <StatusIcon size={14} className={status.color} />
            <span>{status.text}</span>
          </div>
        </div>

        <div>
          <span className="font-medium text-gray-600">User:</span>
          <div className="mt-1 text-gray-800">
            {user ? `${user.email} (${user.role})` : 'None'}
          </div>
        </div>

        <div>
          <span className="font-medium text-gray-600">Session Age:</span>
          <div className="mt-1 text-gray-800">
            {session ? sessionAge : 'No session'}
          </div>
        </div>

        <div>
          <span className="font-medium text-gray-600">Last Refresh:</span>
          <div className="mt-1 text-gray-800">
            {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
          </div>
        </div>
      </div>

      {session && (
        <div className="space-y-2">
          <div>
            <span className="font-medium text-gray-600 text-xs">Session ID:</span>
            <div className="mt-1 text-xs font-mono bg-gray-100 p-1 rounded break-all">
              {session.access_token.substring(0, 20)}...
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 border-t space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Storage: {localStorage.getItem('scholardorm_session') ? 'Cached' : 'Empty'}</span>
          <span>Memory: {session ? 'Loaded' : 'Empty'}</span>
        </div>
        
        {daemonInfo && (
          <div className="text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Daemon:</span>
              <span className={daemonInfo.isRunning ? 'text-green-600' : 'text-red-600'}>
                {daemonInfo.isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            {daemonInfo.isRunning && (
              <div className="flex justify-between">
                <span>Last Check:</span>
                <span>
                  {daemonInfo.lastSessionCheck 
                    ? new Date(daemonInfo.lastSessionCheck).toLocaleTimeString() 
                    : 'Never'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Simplified session status indicator for headers/navbars
export const SessionStatusIndicator: React.FC = () => {
  const { user, session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center space-x-1 text-xs text-gray-400">
        <RefreshCwIcon size={10} className="animate-spin" />
        <span>Loading</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center space-x-1 text-xs text-red-400">
        <XCircleIcon size={10} />
        <span>No session</span>
      </div>
    );
  }

  if (session && user) {
    return (
      <div className="flex items-center space-x-1 text-xs text-green-400">
        <CheckCircleIcon size={10} />
        <span>Active</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 text-xs text-orange-400">
      <AlertCircleIcon size={10} />
      <span>Partial</span>
    </div>
  );
};