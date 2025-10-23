// Session cache utility for persistent authentication state
// This ensures users never hang and sessions are properly cached

export interface CachedSession {
  session: any;
  user: {
    id: string;
    email?: string;
    role?: 'student' | 'admin';
  };
  timestamp: number;
  dashboardData?: any;
  profileData?: any;
}

export interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  key: string;
}

class SessionCacheManager {
  private static instance: SessionCacheManager;
  private memoryCache = new Map<string, CachedSession>();
  
  // Cache TTL configurations
  private readonly TTL_CONFIG = {
    SESSION: 24 * 60 * 60 * 1000, // 24 hours
    DASHBOARD: 5 * 60 * 1000, // 5 minutes
    PROFILE: 10 * 60 * 1000, // 10 minutes
    QUICK_ACCESS: 30 * 1000, // 30 seconds for ultra-fast access
  };

  private readonly STORAGE_KEYS = {
    SESSION: 'scholardorm_session_v2',
    USER: 'scholardorm_user_v2',
    DASHBOARD: 'scholardorm_dashboard_v2',
    PROFILE: 'scholardorm_profile_v2',
    TIMESTAMP: 'scholardorm_timestamp_v2',
  };

  static getInstance(): SessionCacheManager {
    if (!SessionCacheManager.instance) {
      SessionCacheManager.instance = new SessionCacheManager();
    }
    return SessionCacheManager.instance;
  }

  // Save session with all related data
  saveSession(session: any, user: any, options?: { dashboardData?: any; profileData?: any }): void {
    try {
      const cachedSession: CachedSession = {
        session,
        user: {
          id: user.id,
          email: user.email,
          role: user.role || 'student',
        },
        timestamp: Date.now(),
        dashboardData: options?.dashboardData,
        profileData: options?.profileData,
      };

      // Save to memory cache
      this.memoryCache.set('current_session', cachedSession);

      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(session));
      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(this.STORAGE_KEYS.TIMESTAMP, Date.now().toString());

      if (options?.dashboardData) {
        localStorage.setItem(this.STORAGE_KEYS.DASHBOARD, JSON.stringify(options.dashboardData));
      }

      if (options?.profileData) {
        localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(options.profileData));
      }

      console.log('Session cached successfully:', { userId: user.id, role: user.role });
    } catch (error) {
      console.warn('Failed to cache session:', error);
    }
  }

  // Get session with fast memory lookup
  getSession(): CachedSession | null {
    try {
      // First check memory cache for ultra-fast access
      const memoryCached = this.memoryCache.get('current_session');
      if (memoryCached && this.isValid(memoryCached.timestamp, this.TTL_CONFIG.QUICK_ACCESS)) {
        return memoryCached;
      }

      // Check localStorage
      const sessionStr = localStorage.getItem(this.STORAGE_KEYS.SESSION);
      const userStr = localStorage.getItem(this.STORAGE_KEYS.USER);
      const timestampStr = localStorage.getItem(this.STORAGE_KEYS.TIMESTAMP);

      if (!sessionStr || !userStr || !timestampStr) {
        return null;
      }

      const timestamp = parseInt(timestampStr);
      if (!this.isValid(timestamp, this.TTL_CONFIG.SESSION)) {
        this.clearSession();
        return null;
      }

      const session = JSON.parse(sessionStr);
      const user = JSON.parse(userStr);

      // Load additional cached data
      const dashboardData = this.getCachedData(this.STORAGE_KEYS.DASHBOARD, this.TTL_CONFIG.DASHBOARD);
      const profileData = this.getCachedData(this.STORAGE_KEYS.PROFILE, this.TTL_CONFIG.PROFILE);

      const cachedSession: CachedSession = {
        session,
        user,
        timestamp,
        dashboardData,
        profileData,
      };

      // Update memory cache
      this.memoryCache.set('current_session', cachedSession);

      return cachedSession;
    } catch (error) {
      console.warn('Failed to retrieve cached session:', error);
      return null;
    }
  }

  // Save dashboard data separately for fast access
  saveDashboardData(userId: string, data: any): void {
    try {
      const cachedData = {
        data,
        timestamp: Date.now(),
        userId,
      };

      localStorage.setItem(this.STORAGE_KEYS.DASHBOARD, JSON.stringify(cachedData));
      
      console.log('Dashboard data cached for user:', userId);
    } catch (error) {
      console.warn('Failed to cache dashboard data:', error);
    }
  }

  // Get cached dashboard data
  getDashboardData(userId: string): any | null {
    try {
      // Check localStorage
      return this.getCachedData(this.STORAGE_KEYS.DASHBOARD, this.TTL_CONFIG.DASHBOARD);
    } catch (error) {
      console.warn('Failed to retrieve cached dashboard data:', error);
      return null;
    }
  }

  // Clear all session data
  clearSession(): void {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear localStorage
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear legacy keys
      const legacyKeys = ['scholardorm_session', 'scholardorm_user', 'scholardorm_user_role', 'scholardorm_session_timestamp'];
      legacyKeys.forEach(key => localStorage.removeItem(key));

      console.log('Session cache cleared');
    } catch (error) {
      console.warn('Failed to clear session cache:', error);
    }
  }

  // Check if timestamp is still valid
  private isValid(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp < ttl;
  }

  // Get cached data from localStorage with TTL check
  private getCachedData(key: string, ttl: number): any | null {
    try {
      const dataStr = localStorage.getItem(key);
      if (!dataStr) return null;

      const parsed = JSON.parse(dataStr);
      if (parsed.timestamp && this.isValid(parsed.timestamp, ttl)) {
        return parsed.data || parsed;
      }

      // Remove expired data
      localStorage.removeItem(key);
      return null;
    } catch (error) {
      localStorage.removeItem(key);
      return null;
    }
  }

  // Get cache statistics for debugging
  getCacheStats(): any {
    return {
      memoryCache: this.memoryCache.size,
      localStorage: Object.values(this.STORAGE_KEYS).filter(key => 
        localStorage.getItem(key) !== null
      ).length,
      session: !!this.getSession(),
    };
  }
}

export const sessionCache = SessionCacheManager.getInstance();