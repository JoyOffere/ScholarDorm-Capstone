import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { createAuditLog } from '../lib/supabase-utils';
import { Session } from '@supabase/supabase-js';
import { sessionDaemon, SessionEvent } from '../lib/session-daemon';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

type User = {
  id: string;
  email?: string | null;
  role?: 'student' | 'admin';
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  daemonStatus: () => any;
  getDaemonEvents: () => SessionEvent[];
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session storage keys
const STORAGE_KEYS = {
  SESSION: 'scholardorm_session',
  USER: 'scholardorm_user',
  USER_ROLE: 'scholardorm_user_role',
  SESSION_TIMESTAMP: 'scholardorm_session_timestamp'
};

// Session cache in memory for faster access
let sessionCache: {
  session: Session | null;
  user: User | null;
  timestamp: number;
} | null = null;

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Simplified session storage - only use localStorage
const saveSessionToStorage = (session: Session | null, user: User | null) => {
  try {
    if (session && user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, user.role || 'student');
      localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());
      
      // Update memory cache
      sessionCache = { session, user, timestamp: Date.now() };
    } else {
      // Clear all storage
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      sessionCache = null;
    }
  } catch (error) {
    console.warn('Failed to save session to storage:', error);
  }
};

const loadSessionFromStorage = (): { session: Session | null; user: User | null } => {
  try {
    // Check memory cache first (valid for 5 minutes)
    if (sessionCache && Date.now() - sessionCache.timestamp < 300000) {
      return { session: sessionCache.session, user: sessionCache.user };
    }

    const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    const timestampStr = localStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP);

    if (sessionStr && userStr && timestampStr) {
      const timestamp = parseInt(timestampStr);
      const sessionAge = Date.now() - timestamp;
      
      // Check if session is not older than 24 hours
      if (sessionAge < 24 * 60 * 60 * 1000) {
        const session = JSON.parse(sessionStr);
        const user = JSON.parse(userStr);
        
        // Update cache
        sessionCache = { session, user, timestamp: Date.now() };
        
        return { session, user };
      } else {
        // Clear expired session
        clearAllStorage();
      }
    }
  } catch (error) {
    console.warn('Failed to load session from storage:', error);
    clearAllStorage();
  }
  
  return { session: null, user: null };
};

const clearAllStorage = () => {
  try {
    // Clear specific auth keys
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear legacy userRole key
    localStorage.removeItem('userRole');
    
    // Clear cache
    sessionCache = null;
  } catch (error) {
    console.warn('Failed to clear storage:', error);
  }
};

export const AuthProvider: React.FC<{ children: ReactNode; onInitFallback?: () => void }> = ({ children, onInitFallback }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [daemonEvents, setDaemonEvents] = useState<SessionEvent[]>([]);

  useEffect(() => {
    let mounted = true;
    let initializationComplete = false;
    
    // Session daemon event handler
    const handleDaemonEvent = (event: SessionEvent) => {
      if (!mounted || !initializationComplete) return;
      
      setDaemonEvents(prev => [event, ...prev.slice(0, 49)]);
      
      switch (event.type) {
        case 'refresh':
          if (event.data?.success) {
            console.log('AuthContext: Session refreshed by daemon');
          }
          break;
          
        case 'expire':
          console.log('AuthContext: Session expired, clearing state');
          if (mounted) {
            setSession(null);
            setUser(null);
            clearAllStorage();
          }
          break;
          
        case 'error':
          if (event.data?.fatal && mounted) {
            console.error('AuthContext: Fatal session error from daemon');
            setSession(null);
            setUser(null);
            clearAllStorage();
          }
          break;
      }
    };
    
    const initializeAuth = async () => {
      console.log('AuthContext: Initializing authentication...');
      
      try {
        // Simplified initialization - get current session directly
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (currentSession && !error) {
          console.log('AuthContext: Valid session found');
          
          // Fetch user role from database
          try {
            const { data: roleData, error: roleError } = await supabase
              .from('users')
              .select('role')
              .eq('id', currentSession.user.id)
              .single();
            
            const userRole = (!roleError && roleData) ? roleData.role as 'student' | 'admin' : 'student';
            
            const userData: User = {
              id: currentSession.user.id,
              email: currentSession.user.email,
              role: userRole
            };
            
            if (mounted) {
              setSession(currentSession);
              setUser(userData);
              saveSessionToStorage(currentSession, userData);
              
              // Start session daemon after successful initialization
              sessionDaemon.addEventListener(handleDaemonEvent);
              sessionDaemon.start();
              initializationComplete = true;
            }
            
          } catch (roleErr) {
            console.warn('AuthContext: Failed to fetch user role:', roleErr);
            
            // Create user with default role if needed
            const userData: User = {
              id: currentSession.user.id,
              email: currentSession.user.email,
              role: 'student'
            };
            
            if (mounted) {
              setSession(currentSession);
              setUser(userData);
              saveSessionToStorage(currentSession, userData);
              initializationComplete = true;
            }
          }
          
        } else {
          console.log('AuthContext: No valid session found');
          if (mounted) {
            setSession(null);
            setUser(null);
            clearAllStorage();
            initializationComplete = true;
          }
        }
        
      } catch (error) {
        console.error('AuthContext: Initialization error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          clearAllStorage();
          initializationComplete = true;
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set fallback timer to prevent infinite loading
    const fallbackTimer = setTimeout(() => {
      if (mounted && loading && !initializationComplete) {
        console.warn('AuthContext: Initialization timeout, forcing loading=false');
        onInitFallback?.();
        setLoading(false);
        initializationComplete = true;
      }
    }, 5000);

    // Initialize auth
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      console.log('AuthContext: Auth state changed:', event);
      
      try {
        if (newSession?.user) {
          // Preserve existing role if available, otherwise fetch from database
          let userRole: 'student' | 'admin' = user?.role || 'student';
          
          if (event === 'SIGNED_IN') {
            try {
              const { data: roleData, error: roleError } = await supabase
                .from('users')
                .select('role')
                .eq('id', newSession.user.id)
                .single();
              
              if (!roleError && roleData) {
                userRole = roleData.role as 'student' | 'admin';
              }
            } catch (roleErr) {
              console.warn('AuthContext: Failed to fetch user role on auth change:', roleErr);
            }
          }
          
          const userData: User = {
            id: newSession.user.id,
            email: newSession.user.email,
            role: userRole
          };
          
          setSession(newSession);
          setUser(userData);
          saveSessionToStorage(newSession, userData);
          
          // Create audit log for sign-in
          if (event === 'SIGNED_IN') {
            try {
              await createAuditLog(newSession.user.id, 'login', {
                method: 'email',
                role: userRole
              });
            } catch (auditError) {
              console.warn('AuthContext: Failed to create audit log:', auditError);
            }
          }
        } else {
          // No session - user signed out or session expired
          console.log('AuthContext: Clearing session data');
          setSession(null);
          setUser(null);
          clearAllStorage();
        }
      } catch (error) {
        console.error('AuthContext: Error in auth state change handler:', error);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      
      // Stop session daemon and remove event listener
      if (initializationComplete) {
        sessionDaemon.removeEventListener(handleDaemonEvent);
        sessionDaemon.stop();
      }
      
      subscription.unsubscribe();
    };
  }, [onInitFallback, user?.role]);

  const refreshSession = async () => {
    console.log('AuthContext: Manually refreshing session...');
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (refreshedSession && !error) {
        console.log('AuthContext: Session refreshed successfully');
        
        // Preserve existing user role if available
        let userRole: 'student' | 'admin' = user?.role || 'student';
        
        const userData: User = {
          id: refreshedSession.user.id,
          email: refreshedSession.user.email,
          role: userRole
        };
        
        setSession(refreshedSession);
        setUser(userData);
        saveSessionToStorage(refreshedSession, userData);
      } else {
        console.warn('AuthContext: Session refresh failed:', error);
        // Clear invalid session
        setSession(null);
        setUser(null);
        clearAllStorage();
      }
    } catch (error) {
      console.error('AuthContext: Error refreshing session:', error);
    }
  };

  const signOut = async () => {
    console.log('AuthContext: Starting sign out process...');
    
    try {
      // Store current user for audit log
      const currentUser = user;
      
      // Stop session daemon first
      sessionDaemon.stop();
      
      // Clear our local state immediately for responsive UI
      setSession(null);
      setUser(null);
      setLoading(true);
      
      // Clear all storage
      clearAllStorage();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('AuthContext: Supabase sign out error:', error);
        // Even if Supabase signout fails, we've cleared local state
      } else {
        console.log('AuthContext: Sign out completed successfully');
      }
      
      // Create audit log for sign out
      try {
        if (currentUser) {
          await createAuditLog(currentUser.id, 'logout', {
            method: 'manual',
            role: currentUser.role
          });
        }
      } catch (auditError) {
        console.warn('AuthContext: Failed to create logout audit log:', auditError);
      }
      
    } catch (error) {
      console.error('AuthContext: Sign out error:', error);
    } finally {
      setLoading(false);
      console.log('AuthContext: Sign out process completed');
    }
  };

  const daemonStatus = () => sessionDaemon.getStatus();
  const getDaemonEvents = () => daemonEvents;

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signOut, 
      refreshSession,
      daemonStatus,
      getDaemonEvents
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
