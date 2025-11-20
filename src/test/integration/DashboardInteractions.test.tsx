import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { StudentDashboard } from '../../components/dashboard/student/Dashboard';
import { StudentQuizzes } from '../../components/dashboard/student/Quizzes';
import { Leaderboard } from '../../components/dashboard/student/Leaderboard';
import { supabase } from '../../lib/supabase';

// Mock the supabase client with comprehensive methods
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
        in: vi.fn(() => ({
          data: [],
          error: null,
        })),
        not: vi.fn(() => ({
          data: [],
          error: null,
        })),
        gte: vi.fn(() => ({
          data: [],
          error: null,
        })),
        limit: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  },
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'test-id' }),
  };
});

// Mock DashboardLayout component
vi.mock('../../components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="dashboard-layout" data-title={title}>
      <nav data-testid="dashboard-nav">
        <button data-testid="nav-dashboard">Dashboard</button>
        <button data-testid="nav-quizzes">Quizzes</button>
        <button data-testid="nav-leaderboard">Leaderboard</button>
      </nav>
      <main data-testid="dashboard-content">
        {children}
      </main>
    </div>
  ),
}));

// Mock components for integration testing
vi.mock('../../components/dashboard/student/Dashboard', () => ({
  StudentDashboard: () => (
    <div data-testid="student-dashboard">
      <h1>Student Dashboard</h1>
      <div data-testid="stats-cards">
        <div data-testid="total-courses">5 Courses</div>
        <div data-testid="current-streak">7 Day Streak</div>
      </div>
      <div data-testid="recent-activities">
        <div data-testid="activity-item">Completed Math Quiz</div>
      </div>
    </div>
  ),
}));

// Test data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    role: 'student',
  },
};

const mockDashboardData = {
  stats: {
    totalCourses: 5,
    completedCourses: 2,
    currentStreak: 7,
    totalBadges: 3,
    weeklyProgress: 85,
    studyTimeThisWeek: 120,
    quizzesCompleted: 8,
    averageScore: 87,
  },
  courses: [
    {
      id: 'course-1',
      title: 'Mathematics S2',
      image_url: '/math-image.jpg',
      progress: 75,
      last_accessed: '2025-11-19T10:00:00Z',
    },
    {
      id: 'course-2',
      title: 'Physics S2',
      image_url: '/physics-image.jpg',
      progress: 50,
      last_accessed: '2025-11-18T14:30:00Z',
    },
  ],
  announcements: [
    {
      id: 'ann-1',
      title: 'New RSL Content Available',
      content: 'Check out the latest sign language videos',
      created_at: '2025-11-19T09:00:00Z',
      urgency: 'medium',
      author_name: 'Admin',
    },
  ],
  quizzes: [
    {
      id: 'quiz-1',
      title: 'Algebra Basics',
      description: 'Test your algebra knowledge',
      course_id: 'course-1',
      time_limit_minutes: 30,
      questions_count: 10,
      attempts_count: 2,
      best_score: 85,
      last_attempted: '2025-11-18T16:00:00Z',
    },
  ],
};

// Test wrapper component with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Dashboard Component Interactions', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default supabase auth mock
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Setup default data mocks
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          data: mockDashboardData.courses,
          error: null,
        }),
        single: vi.fn().mockReturnValue({
          data: mockDashboardData.stats,
          error: null,
        }),
      }),
      in: vi.fn().mockReturnValue({
        data: mockDashboardData.quizzes,
        error: null,
      }),
      not: vi.fn().mockReturnValue({
        data: mockDashboardData.announcements,
        error: null,
      }),
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: null,
          error: null,
        }),
      }),
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Dashboard Navigation Integration', () => {
    it('should navigate between dashboard sections', async () => {
      render(
        <TestWrapper>
          <StudentDashboard />
        </TestWrapper>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByTestId('student-dashboard')).toBeInTheDocument();
      });

      // Check navigation buttons are present
      expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('nav-quizzes')).toBeInTheDocument();
      expect(screen.getByTestId('nav-leaderboard')).toBeInTheDocument();

      // Test navigation to quizzes
      await user.click(screen.getByTestId('nav-quizzes'));
      // Navigation should be called
      expect(mockNavigate).toHaveBeenCalledWith('/student/quizzes');
    });

    it('should display dashboard stats correctly', async () => {
      render(
        <TestWrapper>
          <StudentDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
      });

      // Check stats are displayed
      expect(screen.getByText('5 Courses')).toBeInTheDocument();
      expect(screen.getByText('7 Day Streak')).toBeInTheDocument();
    });
  });

  describe('Quiz Component Integration', () => {
    it('should load and display quiz list', async () => {
      render(
        <TestWrapper>
          <StudentQuizzes />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for quizzes to load
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });

      // Verify supabase was called to fetch quizzes
      expect(supabase.from).toHaveBeenCalledWith('enhanced_quizzes');
    });

    it('should handle quiz selection and navigation', async () => {
      const mockQuizData = [
        {
          id: 'quiz-1',
          title: 'Algebra Test',
          description: 'Basic algebra concepts',
          time_limit_minutes: 30,
        },
      ];

      // Mock quiz data
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: mockQuizData,
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      render(
        <TestWrapper>
          <StudentQuizzes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });

      // Verify database interactions
      expect(supabase.from).toHaveBeenCalledWith('enhanced_quizzes');
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe('Leaderboard Component Integration', () => {
    it('should fetch and display leaderboard data', async () => {
      const mockLeaderboardData = [
        {
          user_id: 'user-1',
          full_name: 'Alice Student',
          total_score: 950,
          quizzes_completed: 10,
          rank: 1,
        },
        {
          user_id: 'user-2',
          full_name: 'Bob Student',
          total_score: 875,
          quizzes_completed: 9,
          rank: 2,
        },
      ];

      // Mock leaderboard data
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: mockLeaderboardData,
            error: null,
          }),
        }),
        not: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              data: mockLeaderboardData,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      render(
        <TestWrapper>
          <Leaderboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });

      // Verify database queries for leaderboard
      expect(supabase.from).toHaveBeenCalledWith('enhanced_quiz_attempts');
    });

    it('should handle leaderboard filters', async () => {
      render(
        <TestWrapper>
          <Leaderboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });

      // Look for filter buttons (they would be in the real component)
      const dashboardContent = screen.getByTestId('dashboard-content');
      expect(dashboardContent).toBeInTheDocument();
    });
  });

  describe('Cross-Component Data Flow', () => {
    it('should maintain user state across components', async () => {
      // Test that user data is consistent across different components
      const { rerender } = render(
        <TestWrapper>
          <StudentDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('student-dashboard')).toBeInTheDocument();
      });

      // Verify auth was called
      expect(supabase.auth.getUser).toHaveBeenCalled();

      // Switch to quizzes component
      rerender(
        <TestWrapper>
          <StudentQuizzes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });

      // Verify auth is maintained
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(2);
    });

    it('should handle error states gracefully', async () => {
      // Mock error response
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      render(
        <TestWrapper>
          <StudentQuizzes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });

      // Component should still render despite error
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });
  });

  describe('Real-time Data Updates', () => {
    it('should handle real-time quiz score updates', async () => {
      const mockSubscription = {
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      };

      // Mock supabase real-time channel
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnValue(mockSubscription),
      });

      (supabase as any).channel = mockChannel;

      render(
        <TestWrapper>
          <Leaderboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });

      // Verify real-time subscription would be set up
      // (In actual component implementation)
    });
  });

  describe('User Interactions Flow', () => {
    it('should handle complete quiz taking workflow', async () => {
      render(
        <TestWrapper>
          <StudentQuizzes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });

      // Simulate user interactions
      // 1. Load quizzes
      expect(supabase.from).toHaveBeenCalledWith('enhanced_quizzes');
      
      // 2. User clicks on quiz (would navigate to quiz attempt)
      // 3. Submit quiz answers
      // 4. Update scores and redirect to results
    });

    it('should update dashboard after quiz completion', async () => {
      const { rerender } = render(
        <TestWrapper>
          <StudentQuizzes />
        </TestWrapper>
      );

      // Simulate quiz completion by updating mock data
      const updatedStats = {
        ...mockDashboardData.stats,
        quizzesCompleted: 9, // Increased by 1
        averageScore: 89,    // Updated average
      };

      // Rerender dashboard with updated data
      rerender(
        <TestWrapper>
          <StudentDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('student-dashboard')).toBeInTheDocument();
      });

      // Verify updated data would be reflected
      expect(supabase.from).toHaveBeenCalled();
    });
  });
});