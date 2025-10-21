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

// Helper functions for session persistence
const saveSessionToStorage = (session: Session | null, user: User | null) => {
  const timestamp = Date.now();
  try {
    if (session && user) {
      // Save to both localStorage and sessionStorage for redundancy
      const sessionData = {
        session,
        user,
        timestamp
      };
      
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, timestamp.toString());
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, user.role || 'student');
      
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      sessionStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, timestamp.toString());
      
      // Update memory cache
      sessionCache = sessionData;
    } else {
      // Clear all storage
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      sessionCache = null;
    }
  } catch (error) {
    console.warn('Failed to save session to storage:', error);
  }
};

const loadSessionFromStorage = (): { session: Session | null; user: User | null } => {
  try {
    // First check memory cache
    if (sessionCache && Date.now() - sessionCache.timestamp < 300000) { // 5 minutes cache
      return { session: sessionCache.session, user: sessionCache.user };
    }

    // Try sessionStorage first (current tab session)
    let sessionStr = sessionStorage.getItem(STORAGE_KEYS.SESSION);
    let userStr = sessionStorage.getItem(STORAGE_KEYS.USER);
    let timestampStr = sessionStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP);

    // Fallback to localStorage (persistent across tabs)
    if (!sessionStr) {
      sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
      userStr = localStorage.getItem(STORAGE_KEYS.USER);
      timestampStr = localStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP);
    }

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
      }
    }
  } catch (error) {
    console.warn('Failed to load session from storage:', error);
  }
  
  return { session: null, user: null };
};

const clearAllStorage = () => {
  try {
    // Clear specific keys first
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear any other auth-related keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('scholardorm'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
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
    let fallbackTimer: NodeJS.Timeout;
    
    // Session daemon event handler
    const handleDaemonEvent = (event: SessionEvent) => {
      if (!mounted) return;
      
      // Add to event log for debugging
      setDaemonEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
      
      switch (event.type) {
        case 'refresh':
          if (event.data?.success) {
            console.log('AuthContext: Session refreshed by daemon');
            // Reload session from storage as daemon updated it
            const { session: updatedSession } = loadSessionFromStorage();
            if (updatedSession) {
              setSession(updatedSession);
            }
          }
          break;
          
        case 'expire':
          console.log('AuthContext: Session expired, clearing state');
          setSession(null);
          setUser(null);
          clearAllStorage();
          break;
          
        case 'error':
          if (event.data?.fatal) {
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
        // First, try to load from storage cache
        const cachedData = loadSessionFromStorage();
        if (cachedData.session && cachedData.user) {
          console.log('AuthContext: Loaded session from storage cache');
          if (mounted) {
            setSession(cachedData.session);
            setUser(cachedData.user);
            setLoading(false);
            
            // Start session daemon immediately for cached sessions
            sessionDaemon.addEventListener(handleDaemonEvent);
            sessionDaemon.start();
          }
          
          // Verify session is still valid in background (non-blocking)
          setTimeout(async () => {
            try {
              const { data: { session: currentSession }, error } = await supabase.auth.getSession();
              if (mounted && currentSession && !error) {
                // Session is valid, update if needed
                if (cachedData.session && currentSession.access_token !== cachedData.session.access_token) {
                  console.log('AuthContext: Session refreshed, updating cache');
                  const userData: User = {
                    id: currentSession.user.id,
                    email: currentSession.user.email,
                    role: cachedData.user?.role || 'student'
                  };
                  setSession(currentSession);
                  setUser(userData);
                  saveSessionToStorage(currentSession, userData);
                }
              } else if (mounted && (!currentSession || error)) {
                console.log('AuthContext: Cached session is invalid, clearing');
                setSession(null);
                setUser(null);
                clearAllStorage();
                sessionDaemon.stop();
              }
            } catch (bgError) {
              console.warn('AuthContext: Background session verification failed:', bgError);
            }
          }, 100); // Small delay to not block UI
          
          return; // Early return if we have cached data
        }

        // No cached session, try to get fresh session
        console.log('AuthContext: No cached session, fetching fresh session...');
        
        // Set fallback timer
        fallbackTimer = setTimeout(() => {
          if (mounted && loading) {
            console.warn('AuthContext: Initialization timeout, forcing loading=false');
            onInitFallback?.();
            setLoading(false);
          }
        }, 3000); // Reduced timeout since we're not blocking

        const { data: { session: freshSession }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (freshSession && !error) {
            console.log('AuthContext: Fresh session obtained');
            
            // Fetch user role from database (non-blocking for UI)
            let userRole: 'student' | 'admin' = 'student';
            
            // Start session daemon early
            sessionDaemon.addEventListener(handleDaemonEvent);
            sessionDaemon.start();
            
            // Set session immediately, fetch role in background
            const userData: User = {
              id: freshSession.user.id,
              email: freshSession.user.email,
              role: userRole
            };
            
            setSession(freshSession);
            setUser(userData);
            saveSessionToStorage(freshSession, userData);
            setLoading(false);
            clearTimeout(fallbackTimer);
            
            // Fetch role in background
            setTimeout(async () => {
              try {
                const { data: roleData, error: roleError } = await supabase
                  .from('users')
                  .select('role')
                  .eq('id', freshSession.user.id)
                  .single();
                
                if (!roleError && roleData && mounted) {
                  const updatedUserData: User = {
                    ...userData,
                    role: roleData.role as 'student' | 'admin'
                  };
                  setUser(updatedUserData);
                  saveSessionToStorage(freshSession, updatedUserData);
                }
              } catch (roleErr) {
                console.warn('AuthContext: Failed to fetch user role:', roleErr);
              }
            }, 100);
            
          } else {
            console.log('AuthContext: No valid session found');
            setSession(null);
            setUser(null);
            clearAllStorage();
            setLoading(false);
            clearTimeout(fallbackTimer);
          }
        }
        
      } catch (error) {
        console.error('AuthContext: Initialization error:', error);
        if (mounted) {
          setLoading(false);
          clearTimeout(fallbackTimer);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      console.log('AuthContext: Auth state changed:', event);
      
      try {
        if (newSession?.user) {
          // Fetch user role for new sessions
          let userRole: 'student' | 'admin' = 'student';
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
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
              // Try to use cached role
              const cachedUser = sessionCache?.user;
              if (cachedUser?.role) {
                userRole = cachedUser.role;
              }
            }
          } else {
            // For other events, try to preserve existing role
            const cachedUser = sessionCache?.user;
            if (cachedUser?.role) {
              userRole = cachedUser.role;
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
          
          // Log successful sign-in
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
      if (fallbackTimer) clearTimeout(fallbackTimer);
      
      // Stop session daemon and remove event listener
      sessionDaemon.removeEventListener(handleDaemonEvent);
      sessionDaemon.stop();
      
      subscription.unsubscribe();
    };
  }, [onInitFallback]);

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
