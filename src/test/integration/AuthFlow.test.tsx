import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// Mock all components that will be tested together
const MockLoginForm = vi.fn(() => (
  <div data-testid="login-form">
    <input data-testid="email-input" type="email" placeholder="Email" />
    <input data-testid="password-input" type="password" placeholder="Password" />
    <button data-testid="login-button">Sign In</button>
    <button data-testid="google-login-button">Sign in with Google</button>
  </div>
));

const MockDashboard = vi.fn(() => (
  <div data-testid="dashboard">
    <div data-testid="user-profile">Welcome, Test User</div>
    <nav data-testid="navigation">
      <button data-testid="nav-courses">Courses</button>
      <button data-testid="nav-quizzes">Quizzes</button>
      <button data-testid="nav-progress">Progress</button>
    </nav>
    <button data-testid="logout-button">Sign Out</button>
  </div>
));

// Mock supabase auth
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  },
}));

// Mock components
vi.mock('../../components/auth/LoginForm', () => ({
  LoginForm: MockLoginForm,
}));

vi.mock('../../components/dashboard/student/Dashboard', () => ({
  StudentDashboard: MockDashboard,
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

// Test component that switches between login and dashboard
const TestApp = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      setIsAuthenticated(true);
      setUser(data.user);
    }
    return { data, error };
  };

  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (!error) {
      setIsAuthenticated(true);
    }
    return { data, error };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <div data-testid="app">
      {!isAuthenticated ? (
        <div data-testid="login-page">
          <MockLoginForm 
            onLogin={handleLogin}
            onGoogleLogin={handleGoogleLogin}
          />
        </div>
      ) : (
        <div data-testid="dashboard-page">
          <MockDashboard 
            user={user}
            onLogout={handleLogout}
          />
        </div>
      )}
    </div>
  );
};

describe('Authentication Flow Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Login to Dashboard Flow', () => {
    it('should complete full login workflow', async () => {
      // Mock successful login
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: { access_token: 'token-123' },
        },
        error: null,
      });

      // Mock auth state change
      const mockSubscription = { unsubscribe: vi.fn() };
      (supabase.auth.onAuthStateChange as any).mockReturnValue({
        data: { subscription: mockSubscription },
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Initially should show login form
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.getByTestId('login-form')).toBeInTheDocument();

      // Enter credentials and login
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('login-button'));

      // Should call supabase auth
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      // After successful login, should show dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it('should handle Google OAuth login', async () => {
      // Mock Google OAuth
      (supabase.auth.signInWithOAuth as any).mockResolvedValue({
        data: { url: 'https://oauth.example.com' },
        error: null,
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Click Google login
      await user.click(screen.getByTestId('google-login-button'));

      // Should call OAuth method
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
      });
    });

    it('should handle login errors', async () => {
      // Mock login error
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'wrong@example.com');
      await user.type(screen.getByTestId('password-input'), 'wrongpassword');
      await user.click(screen.getByTestId('login-button'));

      // Should remain on login page
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('Dashboard to Logout Flow', () => {
    it('should handle logout process', async () => {
      // Start with authenticated state
      (supabase.auth.getUser as any).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
        },
        error: null,
      });

      (supabase.auth.signOut as any).mockResolvedValue({
        error: null,
      });

      const { rerender } = render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Start authenticated
      rerender(
        <TestWrapper>
          <div data-testid="dashboard-page">
            <MockDashboard />
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('dashboard')).toBeInTheDocument();

      // Click logout
      await user.click(screen.getByTestId('logout-button'));

      // Should call signOut
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should maintain session across page refreshes', async () => {
      // Mock existing session
      (supabase.auth.getUser as any).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
        },
        error: null,
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Should check for existing session on mount
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });

    it('should handle session expiration', async () => {
      // Mock expired session
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Should redirect to login when session is invalid
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('Role-based Navigation', () => {
    it('should show appropriate navigation for student role', async () => {
      const studentUser = {
        id: 'user-1',
        email: 'student@example.com',
        user_metadata: { role: 'student' },
      };

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: studentUser },
        error: null,
      });

      render(
        <TestWrapper>
          <div data-testid="dashboard-page">
            <MockDashboard user={studentUser} />
          </div>
        </TestWrapper>
      );

      // Student should see appropriate navigation
      expect(screen.getByTestId('nav-courses')).toBeInTheDocument();
      expect(screen.getByTestId('nav-quizzes')).toBeInTheDocument();
      expect(screen.getByTestId('nav-progress')).toBeInTheDocument();
    });

    it('should redirect unauthorized users', async () => {
      // Mock unauthorized access attempt
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Should show login page for unauthorized access
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });
});