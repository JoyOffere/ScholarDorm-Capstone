import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SessionManager } from '../common/SessionManager';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Button } from '../common/Button';
import { supabase } from '../../lib/supabase';
import { RefreshCwIcon, Trash2Icon, DownloadIcon, UploadIcon } from 'lucide-react';

export const SessionDebugPage: React.FC = () => {
  const { user, session, loading, signOut, refreshSession, daemonStatus, getDaemonEvents } = useAuth();
  const [isClearing, setIsClearing] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const handleClearAllStorage = async () => {
    if (!confirm('Are you sure you want to clear all storage? This will sign you out.')) return;
    
    setIsClearing(true);
    addLog('Clearing all storage...');
    
    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear IndexedDB (Supabase might use it)
      if ('indexedDB' in window) {
        const databases = ['supabase-auth', 'supabase'];
        for (const dbName of databases) {
          try {
            await new Promise((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(dbName);
              deleteReq.onsuccess = () => resolve(null);
              deleteReq.onerror = () => reject(deleteReq.error);
            });
            addLog(`Cleared IndexedDB: ${dbName}`);
          } catch (err) {
            addLog(`Failed to clear IndexedDB ${dbName}: ${err}`);
          }
        }
      }
      
      addLog('All storage cleared');
      
      // Sign out from Supabase
      await signOut();
      
    } catch (error) {
      addLog(`Error clearing storage: ${error}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportSession = () => {
    const sessionData = {
      user,
      session: session ? {
        access_token: session.access_token.substring(0, 20) + '...',
        refresh_token: session.refresh_token?.substring(0, 20) + '...',
        expires_at: session.expires_at,
        user: session.user
      } : null,
      localStorage: {
        scholardorm_session: localStorage.getItem('scholardorm_session') ? 'Present' : 'Empty',
        scholardorm_user: localStorage.getItem('scholardorm_user') ? 'Present' : 'Empty',
        scholardorm_user_role: localStorage.getItem('scholardorm_user_role'),
      },
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addLog('Session data exported');
  };

  const handleTestConnection = async () => {
    addLog('Testing Supabase connection...');
    
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        addLog(`Connection test failed: ${error.message}`);
      } else {
        addLog(`Connection test successful. Session: ${data.session ? 'Present' : 'None'}`);
      }
    } catch (error) {
      addLog(`Connection test error: ${error}`);
    }
  };

  const handleForceRefresh = async () => {
    addLog('Force refreshing session...');
    try {
      await refreshSession();
      addLog('Session refresh completed');
    } catch (error) {
      addLog(`Session refresh failed: ${error}`);
    }
  };

  const role = user?.role || 'student';

  return (
    <DashboardLayout title="Session Debug" role={role}>
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Debug Mode</h2>
          <p className="text-sm text-yellow-700">
            This page is for development and debugging purposes. It shows detailed session information 
            and provides tools to manage authentication state.
          </p>
        </div>

        {/* Session Manager */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Status</h3>
          <SessionManager showDebugInfo={true} />
        </div>

        {/* Action Buttons */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={handleForceRefresh}
              variant="outline"
              disabled={loading || !session}
              className="flex items-center justify-center space-x-2"
            >
              <RefreshCwIcon size={16} />
              <span>Refresh</span>
            </Button>

            <Button
              onClick={handleTestConnection}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <RefreshCwIcon size={16} />
              <span>Test Connection</span>
            </Button>

            <Button
              onClick={handleExportSession}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <DownloadIcon size={16} />
              <span>Export Data</span>
            </Button>

            <Button
              onClick={handleClearAllStorage}
              variant="outline"
              disabled={isClearing}
              className="flex items-center justify-center space-x-2"
            >
              <Trash2Icon size={16} />
              <span>{isClearing ? 'Clearing...' : 'Clear All'}</span>
            </Button>
          </div>
        </div>

        {/* Storage Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Information</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700">localStorage</h4>
                <div className="mt-2 space-y-1 font-mono text-xs">
                  {Object.keys(localStorage)
                    .filter(key => key.includes('scholardorm') || key.includes('supabase'))
                    .map(key => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="text-gray-800 ml-2 truncate max-w-32">
                          {localStorage.getItem(key)?.substring(0, 20)}...
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">sessionStorage</h4>
                <div className="mt-2 space-y-1 font-mono text-xs">
                  {Object.keys(sessionStorage)
                    .filter(key => key.includes('scholardorm') || key.includes('supabase'))
                    .map(key => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="text-gray-800 ml-2 truncate max-w-32">
                          {sessionStorage.getItem(key)?.substring(0, 20)}...
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daemon Events */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Daemon Events</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Daemon Status</h4>
              <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(daemonStatus(), null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Recent Events (Last 10)</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getDaemonEvents().slice(0, 10).map((event, index) => (
                  <div key={index} className="bg-white rounded p-2 border text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-medium ${
                        event.type === 'error' ? 'text-red-600' :
                        event.type === 'refresh' ? 'text-green-600' :
                        event.type === 'expire' ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {event.type.toUpperCase()}
                      </span>
                      <span className="text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {event.data && (
                      <div className="text-gray-600 font-mono">
                        {JSON.stringify(event.data, null, 1)}
                      </div>
                    )}
                    {event.error && (
                      <div className="text-red-600 font-mono">
                        Error: {event.error}
                      </div>
                    )}
                  </div>
                ))}
                {getDaemonEvents().length === 0 && (
                  <div className="text-gray-500 text-center py-4">
                    No daemon events yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Debug Logs */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Debug Logs</h3>
          <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
            {debugLogs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Perform actions above to see logs.</div>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
          <Button
            onClick={() => setDebugLogs([])}
            variant="outline"
            className="mt-2"
          >
            Clear Logs
          </Button>
        </div>

        {/* User Information */}
        {user && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                {JSON.stringify({
                  id: user.id,
                  email: user.email,
                  role: user.role,
                  session_expires: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};