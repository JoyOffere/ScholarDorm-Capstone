import React from 'react';
import { supabase } from './supabase';

// Enhanced database utility with timeout and retry logic
export class DatabaseUtils {
  private static readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  // Wrapper for database queries with timeout and retry
  static async queryWithTimeout<T>(
    queryFn: () => Promise<T>,
    timeout = this.DEFAULT_TIMEOUT,
    retries = this.MAX_RETRIES
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), timeout);
    });

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await Promise.race([queryFn(), timeoutPromise]);
        return result;
      } catch (error) {
        console.error(`Database query attempt ${attempt + 1} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (attempt + 1)));
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  // Enhanced user data fetching with error handling
  static async fetchUserData(userId: string, signal?: AbortSignal) {
    return this.queryWithTimeout(async () => {
      let query = supabase
        .from('users')
        .select('*')
        .eq('id', userId);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query.single();

      if (error) throw error;
      return data;
    });
  }

  // Enhanced course fetching with error handling
  static async fetchUserCourses(userId: string, limit = 10, signal?: AbortSignal) {
    return this.queryWithTimeout(async () => {
      let query = supabase
        .from('user_courses')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('user_id', userId)
        .order('last_accessed', { ascending: false })
        .limit(limit);
      if (signal) query = query.abortSignal(signal);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    });
  }

  // Enhanced announcements fetching
  static async fetchAnnouncements(limit = 5, signal?: AbortSignal) {
    return this.queryWithTimeout(async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:users!author_id(full_name, avatar_url)
        `)
        .eq('post_type', 'announcement')
        .eq('is_published', true)
        .or('target_audience.eq.all,target_audience.eq.students')
        .order('publish_date', { ascending: false })
        .limit(limit);
      if (signal) query = query.abortSignal(signal);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    });
  }

  // Enhanced quiz fetching
  static async fetchUserQuizzes(userId: string, signal?: AbortSignal) {
    return this.queryWithTimeout(async () => {
      let enrolledQuery = supabase
        .from('user_courses')
        .select('course_id')
        .eq('user_id', userId);
      if (signal) enrolledQuery = enrolledQuery.abortSignal(signal);

      const { data: enrolledCourses, error: enrolledError } = await enrolledQuery;
      if (enrolledError) throw enrolledError;
      if (!enrolledCourses || enrolledCourses.length === 0) return [];

      const courseIds = enrolledCourses.map(item => item.course_id);

      // Get lessons
      let lessonsQuery = supabase
        .from('lessons')
        .select('id, course_id, title')
        .in('course_id', courseIds);
      if (signal) lessonsQuery = lessonsQuery.abortSignal(signal);

      const { data: lessons, error: lessonsError } = await lessonsQuery;
      if (lessonsError) throw lessonsError;
      if (!lessons || lessons.length === 0) return [];

      const lessonIds = lessons.map(lesson => lesson.id);

      // Get quizzes
      let quizzesQuery = supabase
        .from('quizzes')
        .select('*, lesson:lessons(title, course_id, course:courses(title))')
        .in('lesson_id', lessonIds)
        .eq('is_published', true)
        .limit(5);
      if (signal) quizzesQuery = quizzesQuery.abortSignal(signal);

      const { data: quizzesData, error: quizzesError } = await quizzesQuery;
      if (quizzesError) throw quizzesError;

      // Get attempts
      let attemptsQuery = supabase
        .from('quiz_attempts')
        .select('quiz_id, passed')
        .eq('user_id', userId);
      if (signal) attemptsQuery = attemptsQuery.abortSignal(signal);

      const { data: attempts, error: attemptsError } = await attemptsQuery;
      if (attemptsError) throw attemptsError;

      // Process results
      return quizzesData?.map(quiz => {
        const quizAttempts = attempts?.filter(a => a.quiz_id === quiz.id) || [];
        return {
          ...quiz,
          attempted: quizAttempts.length > 0,
          passed: quizAttempts.some(a => a.passed)
        };
      }) || [];
    });
  }

  // Connection health check
  static async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      return !error;
    } catch (e) {
      return false;
    }
  }

  // Clear cached data on connection issues
  static clearCache() {
    // Clear any cached data that might be causing issues
    localStorage.removeItem('lastFetchTime');
    sessionStorage.clear();
  }
}

// Custom hook for safe database operations
export function useSafeQuery<T>(
  queryFn: (signal: AbortSignal) => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const abortController = new AbortController();
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await queryFn(abortController.signal);
        
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted && !abortController.signal.aborted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          console.error('Safe query error:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, dependencies);

  return { data, loading, error };
}

export default DatabaseUtils;