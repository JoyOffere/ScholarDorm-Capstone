import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { createAuditLog } from '../lib/supabase-utils';
import { Session } from '@supabase/supabase-js';
import { sessionDaemon, SessionEvent } from '../lib/session-daemon';
import { logger, auth as authLog } from '../lib/logger';
import { sessionCache as persistentCache } from '../lib/session-cache';

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
  handleOAuthCallback: () => Promise<void>;
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
    // Use the new persistent cache to clear everything
    persistentCache.clearSession();
    
    // Clear legacy keys for safety
    localStorage.removeItem('userRole');
    
    // Clear old cache
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
  const [isOAuthProcessing, setIsOAuthProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use refs to track initialization state synchronously
  const initializationRef = useRef({
    complete: false,
    user: null as User | null,
    session: null as Session | null
  });

  // Session daemon event handler - defined outside useEffect for broader scope
  const handleDaemonEvent = (event: SessionEvent) => {
    setDaemonEvents(prev => [event, ...prev.slice(0, 49)]);
    
    switch (event.type) {
      case 'refresh':
        if (event.data?.success) {
          authLog('Session refreshed by daemon');
        }
        break;
        
      case 'expire':
        authLog('Session expired, clearing state');
        setSession(null);
        setUser(null);
        clearAllStorage();
        break;
        
      case 'error':
        if (event.data?.fatal) {
          logger.error('Fatal session error from daemon', event.data);
          setSession(null);
          setUser(null);
          clearAllStorage();
        }
        break;
    }
  };

  useEffect(() => {
    let mounted = true;
    let initializationComplete = false;

    // Skip initialization if OAuth is processing or already initialized
    if (isOAuthProcessing || isInitialized) {
      return;
    }

    // Ensure loading is set to true at the start of initialization
    setLoading(true);

    // Reset ref on each initialization
    initializationRef.current = {
      complete: false,
      user: null,
      session: null
    };
    
    // Modified handler that checks mounted state
    const mountedHandleDaemonEvent = (event: SessionEvent) => {
      if (!mounted || !initializationComplete) return;
      handleDaemonEvent(event);
    };
    
    const initializeAuth = async () => {
      authLog('Initializing authentication...');

      try {
        // First, try to load from persistent cache for immediate UI responsiveness
        const cachedSession = persistentCache.getSession();

        if (cachedSession && cachedSession.session && cachedSession.user && mounted) {
          authLog('Restoring session from persistent cache', { 
            userId: cachedSession.user.id, 
            role: cachedSession.user.role 
          });
          setSession(cachedSession.session);
          setUser(cachedSession.user);

          // Update ref synchronously
          initializationRef.current = {
            complete: true,
            user: cachedSession.user,
            session: cachedSession.session
          };

          // Start session daemon immediately for background validation
          sessionDaemon.addEventListener(mountedHandleDaemonEvent);
          sessionDaemon.start();
          initializationComplete = true;

          // Set loading to false immediately for responsive UI
          setLoading(false);

          // Now validate the session in background
          try {
            const { data: { session: currentSession }, error } = await supabase.auth.getSession();

            if (!mounted) return;

            if (currentSession && !error) {
              authLog('Session validated successfully', { 
                userId: currentSession.user.id,
                expires_at: currentSession.expires_at 
              });

              // Update user role if needed
              try {
                const { data: roleData, error: roleError } = await supabase
                  .from('users')
                  .select('role')
                  .eq('id', currentSession.user.id)
                  .single();

                const userRole = (!roleError && roleData) ? roleData.role as 'student' | 'admin' : cachedSession.user.role;

                if (userRole !== cachedSession.user.role) {
                  const updatedUser: User = {
                    ...cachedSession.user,
                    role: userRole
                  };
                  setUser(updatedUser);
                  persistentCache.saveSession(currentSession, updatedUser);
                } else {
                  persistentCache.saveSession(currentSession, cachedSession.user);
                }

              } catch (roleErr) {
                console.warn('AuthContext: Failed to fetch user role:', roleErr);
              }

            } else {
              authLog('Stored session invalid, clearing');
              if (mounted) {
                setSession(null);
                setUser(null);
                clearAllStorage();
              }
            }

          } catch (validationError) {
            console.warn('AuthContext: Session validation failed, keeping stored session:', validationError);
            // Keep the stored session for now, daemon will handle refresh
          }

        } else {
          // No stored session, try to get from Supabase
          console.log('AuthContext: No stored session, checking Supabase...');
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();

          if (!mounted) return;

          if (currentSession && !error) {
            console.log('AuthContext: Valid session found from Supabase');

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

                // Update ref synchronously
                initializationRef.current = {
                  complete: true,
                  user: userData,
                  session: currentSession
                };

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

                // Update ref synchronously
                initializationRef.current = {
                  complete: true,
                  user: userData,
                  session: currentSession
                };

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
        }

      } catch (error) {
        logger.error('Authentication initialization error', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          clearAllStorage();
          initializationComplete = true;
        }
      } finally {
        // Always set loading to false when initialization completes, regardless of success/failure
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
          initializationComplete = true;
        }
      }
    };

    // Set fallback timer to prevent infinite loading (aggressive timeout for better UX)
    const fallbackTimer = setTimeout(() => {
      if (mounted && loading && !isOAuthProcessing) {
        console.warn('AuthContext: Initialization timeout, forcing loading=false');
        onInitFallback?.();
        setLoading(false);
        setIsInitialized(true);
        initializationComplete = true;
      }
    }, 1000); // Reduced to 1 second for quicker recovery

    // Initialize auth
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      // Only process relevant auth events to prevent infinite loops
      if (event === 'INITIAL_SESSION' && initializationComplete) {
        console.log('AuthContext: Ignoring INITIAL_SESSION after initialization complete');
        return;
      }
      
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
              } else if (roleError?.code === 'PGRST116') {
                // User doesn't exist in our users table - create them in background
                console.log('AuthContext: Creating new user record for:', newSession.user.email);
                
                // Don't await this - let it happen in background to avoid delays
                supabase.from('users').insert({
                  id: newSession.user.id,
                  email: newSession.user.email,
                  full_name: newSession.user.email?.split('@')[0] || 'User',
                  role: 'student',
                  status: 'active',
                  avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    newSession.user.email?.split('@')[0] || 'User',
                  )}&background=0D8ABC&color=fff`,
                  streak_count: 0,
                  longest_streak: 0,
                  email_verified: true,
                }).then(({ error: insertError }) => {
                  if (insertError) {
                    console.warn('AuthContext: Failed to create user record:', insertError);
                  } else {
                    console.log('AuthContext: User record created successfully');
                  }
                });
                
                userRole = 'student'; // Default role while creation happens in background
              }
            } catch (roleErr) {
              console.warn('AuthContext: Failed to fetch user role on auth change:', roleErr);
            }
          }          const userData: User = {
            id: newSession.user.id,
            email: newSession.user.email,
            role: userRole
          };
          
          // Only update if user data has actually changed
          const hasUserChanged = !user || user.id !== userData.id || user.role !== userData.role;
          const hasSessionChanged = !session || session.access_token !== newSession.access_token;
          
          if (hasSessionChanged) {
            setSession(newSession);
          }
          
          if (hasUserChanged) {
            setUser(userData);
            saveSessionToStorage(newSession, userData);
          }
          
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
        sessionDaemon.removeEventListener(mountedHandleDaemonEvent);
        sessionDaemon.stop();
      }
      
      subscription.unsubscribe();
    };
  }, [onInitFallback, isOAuthProcessing, isInitialized]);

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

  const handleOAuthCallback = async () => {
    logger.oauth('Handling OAuth callback...');
    
    setIsOAuthProcessing(true);
    setLoading(true);

    try {
      // First check if we're in an actual OAuth callback by looking at URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const hasOAuthParams = urlParams.has('code') || urlParams.has('access_token') || urlParams.has('error');
      const oauthFlowStarted = sessionStorage.getItem('oauth_flow_started') === 'true';
      
      if (!hasOAuthParams && !oauthFlowStarted) {
        logger.oauth('No OAuth parameters found in URL, not an OAuth callback');
        throw new Error('Not an OAuth callback - no authorization parameters found');
      }

      // For Supabase OAuth, try to get session immediately first
      let { data: { session: oauthSession }, error: sessionError } = await supabase.auth.getSession();
      
      // If no session yet, wait briefly for Supabase to process the URL
      if (!oauthSession && !sessionError) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Reduced wait time
        ({ data: { session: oauthSession }, error: sessionError } = await supabase.auth.getSession());
      }
      
      if (sessionError) {
        throw new Error(`OAuth session error: ${sessionError.message}`);
      }

      if (!oauthSession) {
        // Check if there was an OAuth error in the URL
        const errorCode = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (errorCode) {
          throw new Error(`OAuth failed: ${errorCode} - ${errorDescription || 'Unknown error'}`);
        }
        
        // One more quick retry if still no session
        await new Promise(resolve => setTimeout(resolve, 300));
        const { data: retryData } = await supabase.auth.getSession();
        
        if (!retryData.session) {
          throw new Error('No OAuth session found - authentication may have been cancelled or expired');
        }
        
        oauthSession = retryData.session;
      }

      const oauthUser = oauthSession.user;
      
      if (!oauthUser) {
        throw new Error('No user data in OAuth session');
      }

      logger.oauth('OAuth session retrieved, setting up user...', { 
        userId: oauthUser.id,
        email: oauthUser.email 
      });

      // Check if user exists in our database
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', oauthUser.id)
        .single();

      let userRole: 'student' | 'admin' = 'student';

      if (userError && userError.code !== 'PGRST116') {
        logger.error('Error checking user existence', userError);
      }

      if (existingUser) {
        userRole = existingUser.role || 'student';
        logger.oauth('Existing user found with role', { role: userRole, userId: oauthUser.id });
      } else {
        logger.oauth('New OAuth user, will be created by callback handler', { userId: oauthUser.id });
      }

      // Create user object
      const userData: User = {
        id: oauthUser.id,
        email: oauthUser.email,
        role: userRole
      };

      // Update state
      setSession(oauthSession);
      setUser(userData);

      // Save to storage
      saveSessionToStorage(oauthSession, userData);

      // Update ref synchronously
      initializationRef.current = {
        complete: true,
        user: userData,
        session: oauthSession
      };

                // Start session daemon
                sessionDaemon.addEventListener(handleDaemonEvent);
                sessionDaemon.start();      logger.success('OAuth callback handled successfully');

    } catch (error: any) {
      // Only log as error if it's not an expected "not an OAuth callback" scenario
      if (error.message?.includes('Not an OAuth callback')) {
        logger.oauth('Not an OAuth callback, skipping OAuth processing');
      } else {
        logger.error('OAuth callback error', error);
      }
      
      // Clear any invalid state
      setSession(null);
      setUser(null);
      clearAllStorage();
      
      throw error; // Re-throw for the callback component to handle
    } finally {
      setIsOAuthProcessing(false);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signOut, 
      refreshSession,
      handleOAuthCallback,
      daemonStatus,
      getDaemonEvents
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
