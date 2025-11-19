import { describe, it, expect, vi } from 'vitest';

// Test utility functions
describe('Utility Functions', () => {
  describe('Quiz Helper Functions', () => {
    it('should calculate quiz progress correctly', () => {
      const calculateProgress = (attempted: number, total: number): number => {
        if (total === 0) return 0;
        return Math.round((attempted / total) * 100);
      };

      expect(calculateProgress(5, 10)).toBe(50);
      expect(calculateProgress(10, 10)).toBe(100);
      expect(calculateProgress(0, 10)).toBe(0);
      expect(calculateProgress(3, 7)).toBe(43);
    });

    it('should format time correctly', () => {
      const formatTime = (minutes: number): string => {
        if (minutes < 60) {
          return `${minutes} min${minutes !== 1 ? 's' : ''}`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
      };

      expect(formatTime(30)).toBe('30 mins');
      expect(formatTime(1)).toBe('1 min');
      expect(formatTime(60)).toBe('1h 0m');
      expect(formatTime(90)).toBe('1h 30m');
      expect(formatTime(125)).toBe('2h 5m');
    });

    it('should determine quiz status correctly', () => {
      const getQuizStatus = (
        attempts: number,
        completed: boolean,
        maxAttempts?: number
      ): 'not_started' | 'in_progress' | 'completed' | 'attempts_exhausted' => {
        if (completed) return 'completed';
        if (attempts === 0) return 'not_started';
        if (maxAttempts && attempts >= maxAttempts && !completed) {
          return 'attempts_exhausted';
        }
        return 'in_progress';
      };

      expect(getQuizStatus(0, false)).toBe('not_started');
      expect(getQuizStatus(1, false)).toBe('in_progress');
      expect(getQuizStatus(2, true)).toBe('completed');
      expect(getQuizStatus(3, false, 3)).toBe('attempts_exhausted');
    });

    it('should validate quiz score', () => {
      const isPassingScore = (score: number, passingScore: number): boolean => {
        return score >= passingScore;
      };

      expect(isPassingScore(85, 80)).toBe(true);
      expect(isPassingScore(75, 80)).toBe(false);
      expect(isPassingScore(80, 80)).toBe(true);
      expect(isPassingScore(100, 90)).toBe(true);
    });

    it('should calculate average score', () => {
      const calculateAverageScore = (scores: number[]): number => {
        if (scores.length === 0) return 0;
        const sum = scores.reduce((acc, score) => acc + score, 0);
        return Math.round(sum / scores.length);
      };

      expect(calculateAverageScore([80, 90, 85])).toBe(85);
      expect(calculateAverageScore([100])).toBe(100);
      expect(calculateAverageScore([])).toBe(0);
      expect(calculateAverageScore([75, 85, 95, 65])).toBe(80);
    });
  });

  describe('RSL (Rwandan Sign Language) Utilities', () => {
    it('should validate RSL video URL', () => {
      const isValidRslUrl = (url: string | null | undefined): boolean => {
        if (!url) return false;
        try {
          new URL(url);
          return url.includes('youtube.com') || url.includes('vimeo.com') || url.endsWith('.mp4');
        } catch {
          return false;
        }
      };

      expect(isValidRslUrl('https://youtube.com/watch?v=123')).toBe(true);
      expect(isValidRslUrl('https://vimeo.com/123456')).toBe(true);
      expect(isValidRslUrl('https://example.com/video.mp4')).toBe(true);
      expect(isValidRslUrl('invalid-url')).toBe(false);
      expect(isValidRslUrl(null)).toBe(false);
      expect(isValidRslUrl(undefined)).toBe(false);
    });

    it('should extract YouTube video ID', () => {
      const extractYouTubeId = (url: string): string | null => {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
      };

      expect(extractYouTubeId('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('https://youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('https://example.com')).toBeNull();
    });
  });

  describe('Data Validation', () => {
    it('should validate email format', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should sanitize user input', () => {
      const sanitizeInput = (input: string): string => {
        return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      };

      expect(sanitizeInput('  normal text  ')).toBe('normal text');
      expect(sanitizeInput('test<script>alert("xss")</script>clean')).toBe('testclean');
      expect(sanitizeInput('safe input')).toBe('safe input');
    });

    it('should validate quiz attempt data', () => {
      const validateQuizAttempt = (attempt: {
        quiz_id: string;
        answers: Record<string, any>;
        time_taken?: number;
      }): boolean => {
        return !!(
          attempt.quiz_id &&
          typeof attempt.quiz_id === 'string' &&
          attempt.answers &&
          typeof attempt.answers === 'object' &&
          Object.keys(attempt.answers).length > 0 &&
          (!attempt.time_taken || typeof attempt.time_taken === 'number')
        );
      };

      expect(validateQuizAttempt({
        quiz_id: 'quiz-123',
        answers: { q1: 'answer1', q2: 'answer2' },
        time_taken: 300
      })).toBe(true);

      expect(validateQuizAttempt({
        quiz_id: '',
        answers: {},
      })).toBe(false);

      expect(validateQuizAttempt({
        quiz_id: 'quiz-123',
        answers: { q1: 'answer1' },
      })).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      const handleApiError = (error: any): string => {
        if (error?.message) {
          return error.message;
        }
        if (typeof error === 'string') {
          return error;
        }
        return 'An unexpected error occurred';
      };

      expect(handleApiError(new Error('Network error'))).toBe('Network error');
      expect(handleApiError('String error')).toBe('String error');
      expect(handleApiError({ message: 'Custom error' })).toBe('Custom error');
      expect(handleApiError(null)).toBe('An unexpected error occurred');
      expect(handleApiError(undefined)).toBe('An unexpected error occurred');
    });

    it('should retry failed operations', async () => {
      const retryOperation = async (
        operation: () => Promise<any>,
        maxRetries: number = 3,
        delay: number = 1000
      ): Promise<any> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await operation();
          } catch (error) {
            if (attempt === maxRetries) {
              throw error;
            }
            // In real implementation, we'd add delay here
            // await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      let attempts = 0;
      const flakyOperation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'Success';
      };

      const result = await retryOperation(flakyOperation, 3, 0);
      expect(result).toBe('Success');
      expect(attempts).toBe(3);
    });
  });
});