import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { createAuditLog } from '../lib/supabase-utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

type User = {
  id: string;
  email?: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: ReactNode; onInitFallback?: () => void }> = ({ children, onInitFallback }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
      } catch (err) {
        console.error('Auth init error', err);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    // Provide a safety fallback in case auth init stalls
    const fallback = setTimeout(() => {
      if (mounted && loading) {
        onInitFallback?.();
        setLoading(false);
      }
    }, 8000);

    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(fallback);
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.debug('AuthContext.signOut: start');
    try {
      await supabase.auth.signOut();
      console.debug('AuthContext.signOut: signOut completed');
    } catch (err) {
      console.warn('Sign out failed:', err instanceof Error ? err.message : String(err));
    }

    // Clear all localStorage and sessionStorage forcibly
    localStorage.clear();
    sessionStorage.clear();

    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
};

export default AuthContext;
