import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// Mock real-time data updates
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
  },
}));

// Mock components
const MockLeaderboard = vi.fn(({ onScoreUpdate }: { onScoreUpdate?: (score: number) => void }) => (
  <div data-testid="leaderboard">
    <div data-testid="leaderboard-list">
      <div data-testid="rank-1">Alice - 950 points</div>
      <div data-testid="rank-2">Bob - 875 points</div>
      <div data-testid="current-user-rank">You - Rank #3</div>
    </div>
    <button 
      data-testid="simulate-score-update"
      onClick={() => onScoreUpdate?.(920)}
    >
      Simulate Score Update
    </button>
  </div>
));

const MockQuizResults = vi.fn(({ score, onResultsReady }: { score: number; onResultsReady?: () => void }) => (
  <div data-testid="quiz-results">
    <div data-testid="score-display">Score: {score}%</div>
    <div data-testid="pass-status">{score >= 70 ? 'Passed!' : 'Failed'}</div>
    <button 
      data-testid="view-leaderboard"
      onClick={() => onResultsReady?.()}
    >
      View Updated Leaderboard
    </button>
  </div>
));

const MockProgressTracker = vi.fn(({ progress }: { progress: number }) => (
  <div data-testid="progress-tracker">
    <div data-testid="progress-bar" style={{ width: `${progress}%` }}>
      {progress}% Complete
    </div>
    <div data-testid="milestone-badges">
      {progress >= 25 && <div data-testid="badge-25">25% Badge</div>}
      {progress >= 50 && <div data-testid="badge-50">50% Badge</div>}
      {progress >= 75 && <div data-testid="badge-75">75% Badge</div>}
      {progress >= 100 && <div data-testid="badge-100">100% Badge</div>}
    </div>
  </div>
));

vi.mock('../../components/dashboard/student/Leaderboard', () => ({
  Leaderboard: MockLeaderboard,
}));

vi.mock('../../components/dashboard/student/QuizResults', () => ({
  QuizResults: MockQuizResults,
}));

vi.mock('../../components/dashboard/student/ProgressTracker', () => ({
  ProgressTracker: MockProgressTracker,
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

// Integrated app component that simulates real data flow
const IntegratedApp = () => {
  const [currentScore, setCurrentScore] = React.useState(85);
  const [courseProgress, setCourseProgress] = React.useState(60);
  const [showResults, setShowResults] = React.useState(false);
  const [showLeaderboard, setShowLeaderboard] = React.useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Simulate real-time subscription
    const subscription = supabase.channel('quiz_updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'enhanced_quiz_attempts' },
        (payload: any) => {
          setRealTimeUpdates(prev => [...prev, payload]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleQuizCompletion = (score: number) => {
    setCurrentScore(score);
    setShowResults(true);
    
    // Update progress based on score
    if (score >= 70) {
      setCourseProgress(prev => Math.min(100, prev + 10));
    }

    // Simulate real-time update
    act(() => {
      setRealTimeUpdates(prev => [...prev, {
        type: 'quiz_completion',
        score,
        timestamp: new Date().toISOString(),
      }]);
    });
  };

  const handleScoreUpdate = (newScore: number) => {
    setCurrentScore(newScore);
    
    // Simulate leaderboard position change
    act(() => {
      setRealTimeUpdates(prev => [...prev, {
        type: 'leaderboard_update',
        score: newScore,
        timestamp: new Date().toISOString(),
      }]);
    });
  };

  const handleViewLeaderboard = () => {
    setShowLeaderboard(true);
    setShowResults(false);
  };

  return (
    <div data-testid="integrated-app">
      <div data-testid="real-time-indicator">
        Updates: {realTimeUpdates.length}
      </div>
      
      <div data-testid="quiz-section">
        <button 
          data-testid="complete-quiz"
          onClick={() => handleQuizCompletion(92)}
        >
          Complete Quiz (92%)
        </button>
        <button 
          data-testid="fail-quiz"
          onClick={() => handleQuizCompletion(45)}
        >
          Fail Quiz (45%)
        </button>
      </div>

      {showResults && (
        <MockQuizResults 
          score={currentScore}
          onResultsReady={handleViewLeaderboard}
        />
      )}

      {showLeaderboard && (
        <MockLeaderboard 
          onScoreUpdate={handleScoreUpdate}
        />
      )}

      <MockProgressTracker progress={courseProgress} />
    </div>
  );
};

describe('Real-time Data Flow Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth user
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });

    // Mock real-time channel
    const mockSubscription = { unsubscribe: vi.fn() };
    (supabase.channel as any).mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue(mockSubscription),
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Quiz Completion to Leaderboard Update Flow', () => {
    it('should update leaderboard after quiz completion', async () => {
      render(
        <TestWrapper>
          <IntegratedApp />
        </TestWrapper>
      );

      // Initially no results shown
      expect(screen.queryByTestId('quiz-results')).not.toBeInTheDocument();

      // Complete a quiz
      await user.click(screen.getByTestId('complete-quiz'));

      // Should show quiz results
      await waitFor(() => {
        expect(screen.getByTestId('quiz-results')).toBeInTheDocument();
      });

      expect(screen.getByTestId('score-display')).toHaveTextContent('Score: 92%');
      expect(screen.getByTestId('pass-status')).toHaveTextContent('Passed!');

      // Navigate to leaderboard
      await user.click(screen.getByTestId('view-leaderboard'));

      // Should show updated leaderboard
      await waitFor(() => {
        expect(screen.getByTestId('leaderboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('leaderboard-list')).toBeInTheDocument();
    });

    it('should handle failed quiz and maintain progress', async () => {
      render(
        <TestWrapper>
          <IntegratedApp />
        </TestWrapper>
      );

      // Fail a quiz
      await user.click(screen.getByTestId('fail-quiz'));

      await waitFor(() => {
        expect(screen.getByTestId('quiz-results')).toBeInTheDocument();
      });

      expect(screen.getByTestId('score-display')).toHaveTextContent('Score: 45%');
      expect(screen.getByTestId('pass-status')).toHaveTextContent('Failed');

      // Progress should not increase for failed quiz
      expect(screen.getByTestId('progress-bar')).toHaveTextContent('60% Complete');
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time score updates', async () => {
      render(
        <TestWrapper>
          <IntegratedApp />
        </TestWrapper>
      );

      // Complete quiz to show leaderboard
      await user.click(screen.getByTestId('complete-quiz'));
      await user.click(screen.getByTestId('view-leaderboard'));

      await waitFor(() => {
        expect(screen.getByTestId('leaderboard')).toBeInTheDocument();
      });

      // Simulate real-time score update
      await user.click(screen.getByTestId('simulate-score-update'));

      // Should update real-time indicator
      await waitFor(() => {
        expect(screen.getByTestId('real-time-indicator')).toHaveTextContent('Updates: 2');
      });
    });

    it('should track multiple real-time events', async () => {
      render(
        <TestWrapper>
          <IntegratedApp />
        </TestWrapper>
      );

      const realTimeIndicator = screen.getByTestId('real-time-indicator');
      
      // Initial state
      expect(realTimeIndicator).toHaveTextContent('Updates: 0');

      // Trigger multiple events
      await user.click(screen.getByTestId('complete-quiz'));
      
      await waitFor(() => {
        expect(realTimeIndicator).toHaveTextContent('Updates: 1');
      });

      await user.click(screen.getByTestId('view-leaderboard'));
      await user.click(screen.getByTestId('simulate-score-update'));

      await waitFor(() => {
        expect(realTimeIndicator).toHaveTextContent('Updates: 2');
      });
    });
  });

  describe('Progress and Badge Updates', () => {
    it('should award badges based on progress milestones', async () => {
      render(
        <TestWrapper>
          <IntegratedApp />
        </TestWrapper>
      );

      const progressTracker = screen.getByTestId('progress-tracker');
      
      // Initially should have 25% and 50% badges (60% progress)
      expect(screen.getByTestId('badge-25')).toBeInTheDocument();
      expect(screen.getByTestId('badge-50')).toBeInTheDocument();
      expect(screen.queryByTestId('badge-75')).not.toBeInTheDocument();

      // Complete quiz successfully to increase progress
      await user.click(screen.getByTestId('complete-quiz'));

      await waitFor(() => {
        // Progress should increase to 70%
        expect(screen.getByTestId('progress-bar')).toHaveTextContent('70% Complete');
      });

      // Still no 75% badge yet
      expect(screen.queryByTestId('badge-75')).not.toBeInTheDocument();

      // Complete another quiz
      await user.click(screen.getByTestId('view-leaderboard'));
      await user.click(screen.getByTestId('complete-quiz'));

      await waitFor(() => {
        // Now should have 75% badge (80% progress)
        expect(screen.getByTestId('badge-75')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Component State Synchronization', () => {
    it('should maintain consistent state across components', async () => {
      render(
        <TestWrapper>
          <IntegratedApp />
        </TestWrapper>
      );

      // Complete quiz
      await user.click(screen.getByTestId('complete-quiz'));

      // Check all components reflect the same state
      await waitFor(() => {
        expect(screen.getByTestId('score-display')).toHaveTextContent('92%');
        expect(screen.getByTestId('progress-bar')).toHaveTextContent('70% Complete');
        expect(screen.getByTestId('real-time-indicator')).toHaveTextContent('Updates: 1');
      });
    });

    it('should handle rapid state changes', async () => {
      render(
        <TestWrapper>
          <IntegratedApp />
        </TestWrapper>
      );

      // Trigger rapid events
      await user.click(screen.getByTestId('complete-quiz'));
      await user.click(screen.getByTestId('fail-quiz'));
      await user.click(screen.getByTestId('complete-quiz'));

      // All updates should be tracked
      await waitFor(() => {
        expect(screen.getByTestId('real-time-indicator')).toHaveTextContent('Updates: 3');
      });

      // Final state should reflect last action
      expect(screen.getByTestId('score-display')).toHaveTextContent('Score: 92%');
    });
  });

  describe('Error Handling in Data Flow', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      render(
        <TestWrapper>
          <IntegratedApp />
        </TestWrapper>
      );

      // App should still render despite database errors
      expect(screen.getByTestId('integrated-app')).toBeInTheDocument();
      expect(screen.getByTestId('quiz-section')).toBeInTheDocument();
    });

    it('should handle network interruptions', async () => {
      // Mock network failure
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation(() => {
          throw new Error('Network error');
        }),
      };

      (supabase.channel as any).mockReturnValue(mockChannel);

      render(
        <TestWrapper>
          <IntegratedApp />
        </TestWrapper>
      );

      // Should handle subscription errors gracefully
      expect(screen.getByTestId('integrated-app')).toBeInTheDocument();
    });
  });
});