import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

// Session daemon configuration
const DAEMON_CONFIG = {
  CHECK_INTERVAL: 30000, // Check every 30 seconds
  REFRESH_THRESHOLD: 300000, // Refresh if expires within 5 minutes
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 seconds between retries
  HEARTBEAT_INTERVAL: 60000, // Send heartbeat every minute
  STORAGE_CLEANUP_INTERVAL: 300000, // Clean up storage every 5 minutes
};

type SessionEventType = 'refresh' | 'expire' | 'error' | 'heartbeat' | 'cleanup';

interface SessionEvent {
  type: SessionEventType;
  timestamp: number;
  data?: any;
  error?: string;
}

type SessionEventListener = (event: SessionEvent) => void;

class SessionDaemon {
  private intervalId: NodeJS.Timeout | null = null;
  private heartbeatId: NodeJS.Timeout | null = null;
  private cleanupId: NodeJS.Timeout | null = null;
  private listeners: Set<SessionEventListener> = new Set();
  private isRunning = false;
  private retryCount = 0;
  private lastSessionCheck = 0;
  private lastHeartbeat = 0;

  // Start the daemon
  start() {
    if (this.isRunning) {
      console.log('SessionDaemon: Already running');
      return;
    }

    console.log('SessionDaemon: Starting background session management...');
    this.isRunning = true;
    this.retryCount = 0;

    // Main session check loop
    this.intervalId = setInterval(() => {
      this.checkAndRefreshSession();
    }, DAEMON_CONFIG.CHECK_INTERVAL);

    // Heartbeat to keep session alive
    this.heartbeatId = setInterval(() => {
      this.sendHeartbeat();
    }, DAEMON_CONFIG.HEARTBEAT_INTERVAL);

    // Storage cleanup
    this.cleanupId = setInterval(() => {
      this.cleanupStorage();
    }, DAEMON_CONFIG.STORAGE_CLEANUP_INTERVAL);

    // Initial check
    setTimeout(() => this.checkAndRefreshSession(), 1000);

    this.emit('heartbeat', { started: true });
  }

  // Stop the daemon
  stop() {
    if (!this.isRunning) return;

    console.log('SessionDaemon: Stopping background session management...');
    this.isRunning = false;

    if (this.intervalId) clearInterval(this.intervalId);
    if (this.heartbeatId) clearInterval(this.heartbeatId);
    if (this.cleanupId) clearInterval(this.cleanupId);

    this.intervalId = null;
    this.heartbeatId = null;
    this.cleanupId = null;

    this.emit('heartbeat', { stopped: true });
  }

  // Add event listener
  addEventListener(listener: SessionEventListener) {
    this.listeners.add(listener);
  }

  // Remove event listener
  removeEventListener(listener: SessionEventListener) {
    this.listeners.delete(listener);
  }

  // Emit event to all listeners
  private emit(type: SessionEventType, data?: any, error?: string) {
    const event: SessionEvent = {
      type,
      timestamp: Date.now(),
      data,
      error
    };

    // Non-blocking event emission
    setTimeout(() => {
      this.listeners.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.warn('SessionDaemon: Event listener error:', err);
        }
      });
    }, 0);
  }

  // Main session check and refresh logic
  private async checkAndRefreshSession() {
    if (!this.isRunning) return;

    const now = Date.now();
    this.lastSessionCheck = now;

    try {
      // Get current session without blocking UI
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('SessionDaemon: Error getting session:', error);
        this.handleSessionError(error);
        return;
      }

      if (!session) {
        // No session - clean up storage
        this.cleanupStorage();
        this.emit('expire', { reason: 'no_session' });
        return;
      }

      // Check if session needs refresh
      const expiresAt = (session.expires_at || 0) * 1000;
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry <= DAEMON_CONFIG.REFRESH_THRESHOLD) {
        console.log('SessionDaemon: Session expiring soon, refreshing...');
        await this.refreshSessionInBackground(session);
      } else {
        // Session is healthy, reset retry count
        this.retryCount = 0;
        this.emit('heartbeat', { 
          healthy: true, 
          expiresIn: Math.floor(timeUntilExpiry / 1000) 
        });
      }

    } catch (error) {
      console.error('SessionDaemon: Unexpected error in session check:', error);
      this.handleSessionError(error);
    }
  }

  // Background session refresh
  private async refreshSessionInBackground(currentSession: Session) {
    try {
      console.log('SessionDaemon: Attempting background session refresh...');
      
      const { data, error } = await supabase.auth.refreshSession(currentSession);

      if (error) {
        throw error;
      }

      if (data.session) {
        console.log('SessionDaemon: Session refreshed successfully');
        this.retryCount = 0;
        
        // Update storage with new session
        this.updateSessionStorage(data.session);
        
        this.emit('refresh', { 
          success: true, 
          expiresAt: data.session.expires_at 
        });
      } else {
        throw new Error('No session returned from refresh');
      }

    } catch (error) {
      console.error('SessionDaemon: Session refresh failed:', error);
      this.handleRefreshError(error);
    }
  }

  // Handle session errors with retry logic
  private handleSessionError(error: any) {
    this.retryCount++;
    
    if (this.retryCount >= DAEMON_CONFIG.MAX_RETRY_ATTEMPTS) {
      console.error('SessionDaemon: Max retry attempts reached, stopping daemon');
      this.emit('error', { 
        fatal: true, 
        error: error.message,
        retryCount: this.retryCount 
      });
      this.stop();
      return;
    }

    console.warn(`SessionDaemon: Session error (attempt ${this.retryCount}/${DAEMON_CONFIG.MAX_RETRY_ATTEMPTS}):`, error);
    
    // Retry after delay
    setTimeout(() => {
      if (this.isRunning) {
        this.checkAndRefreshSession();
      }
    }, DAEMON_CONFIG.RETRY_DELAY * this.retryCount);

    this.emit('error', { 
      error: error.message, 
      retryCount: this.retryCount,
      nextRetryIn: DAEMON_CONFIG.RETRY_DELAY * this.retryCount
    });
  }

  // Handle refresh errors
  private handleRefreshError(error: any) {
    this.emit('error', { 
      type: 'refresh_failed',
      error: error.message 
    });

    // If refresh fails, we might need to redirect to login
    if (error.message?.includes('refresh_token_not_found') || 
        error.message?.includes('invalid_grant')) {
      console.error('SessionDaemon: Session cannot be refreshed, clearing storage');
      this.cleanupStorage();
      this.emit('expire', { reason: 'refresh_failed', error: error.message });
    }
  }

  // Send periodic heartbeat
  private sendHeartbeat() {
    if (!this.isRunning) return;

    const now = Date.now();
    this.lastHeartbeat = now;

    // Simple heartbeat - just emit status
    this.emit('heartbeat', {
      timestamp: now,
      lastCheck: this.lastSessionCheck,
      isRunning: this.isRunning,
      retryCount: this.retryCount
    });
  }

  // Clean up expired storage
  private cleanupStorage() {
    try {
      const keys = [
        'scholardorm_session',
        'scholardorm_user', 
        'scholardorm_user_role',
        'scholardorm_session_timestamp'
      ];

      // Check timestamp and clean if old
      const timestampStr = localStorage.getItem('scholardorm_session_timestamp');
      if (timestampStr) {
        const timestamp = parseInt(timestampStr);
        const age = Date.now() - timestamp;
        
        // Clean if older than 24 hours
        if (age > 24 * 60 * 60 * 1000) {
          console.log('SessionDaemon: Cleaning up old storage data');
          keys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
          
          this.emit('cleanup', { reason: 'expired', age });
        }
      }

      // Clean up any orphaned supabase storage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.includes('supabase.auth.token') && key.includes('undefined')) {
          localStorage.removeItem(key);
        }
      }

    } catch (error) {
      console.warn('SessionDaemon: Storage cleanup error:', error);
    }
  }

  // Update session storage
  private updateSessionStorage(session: Session) {
    try {
      const timestamp = Date.now().toString();
      
      localStorage.setItem('scholardorm_session', JSON.stringify(session));
      localStorage.setItem('scholardorm_session_timestamp', timestamp);
      
      sessionStorage.setItem('scholardorm_session', JSON.stringify(session));
      sessionStorage.setItem('scholardorm_session_timestamp', timestamp);
      
    } catch (error) {
      console.warn('SessionDaemon: Failed to update session storage:', error);
    }
  }

  // Get daemon status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSessionCheck: this.lastSessionCheck,
      lastHeartbeat: this.lastHeartbeat,
      retryCount: this.retryCount,
      config: DAEMON_CONFIG
    };
  }
}

// Singleton instance
const sessionDaemon = new SessionDaemon();

export { sessionDaemon, SessionDaemon };
export type { SessionEvent, SessionEventListener };