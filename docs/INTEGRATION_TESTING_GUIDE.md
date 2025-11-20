# Integration Testing Guide for ScholarDorm

## Overview

This guide covers comprehensive integration testing for component interactions in the ScholarDorm project. Integration tests verify that multiple components work together correctly and that data flows properly between them.

## Testing Framework Stack

### Core Testing Libraries
```json
{
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1", 
  "@testing-library/user-event": "^14.6.1",
  "vitest": "^4.0.9",
  "jsdom": "^27.2.0"
}
```

### Integration Testing Tools
- **React Testing Library** - Component rendering and interaction
- **User Event** - Realistic user interaction simulation
- **Vitest** - Test runner with mocking capabilities
- **JSDOM** - Browser environment simulation

## Integration Test Structure

### Test Organization
```
src/test/integration/
├── AuthFlow.test.tsx           # Authentication workflow
├── DashboardInteractions.test.tsx  # Dashboard component interactions
├── QuizIntegration.test.tsx    # Quiz workflow integration
└── RealTimeDataFlow.test.tsx   # Real-time data updates
```

## Key Integration Testing Scenarios

### 1. Authentication Flow Integration

**Tests:** Login → Dashboard → Logout workflow

```typescript
// AuthFlow.test.tsx
describe('Authentication Flow Integration', () => {
  it('should complete full login workflow', async () => {
    // Mock successful authentication
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });

    render(<TestApp />);

    // Simulate login process
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByTestId('login-button'));

    // Verify dashboard appears
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });
});
```

**Integration Points Tested:**
- ✅ Login form submission
- ✅ Supabase authentication API calls  
- ✅ Auth context state updates
- ✅ Route protection and redirection
- ✅ Dashboard component rendering
- ✅ Session persistence

### 2. Dashboard Component Interactions

**Tests:** Navigation between dashboard sections and data sharing

```typescript
// DashboardInteractions.test.tsx
describe('Dashboard Component Integration', () => {
  it('should navigate between dashboard sections', async () => {
    render(<StudentDashboard />);

    // Test navigation functionality
    await user.click(screen.getByTestId('nav-quizzes'));
    expect(mockNavigate).toHaveBeenCalledWith('/student/quizzes');
    
    // Verify state persistence across navigation
    expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
  });
});
```

**Integration Points Tested:**
- ✅ Component-to-component navigation
- ✅ Shared state management
- ✅ Data loading coordination
- ✅ Cross-component prop passing
- ✅ Context consumption consistency

### 3. Quiz Workflow Integration  

**Tests:** Complete quiz-taking process from start to finish

```typescript
// QuizIntegration.test.tsx  
describe('Quiz Attempt Integration', () => {
  it('should handle complete quiz workflow', async () => {
    render(<QuizAttempt />);

    // Load quiz → Answer questions → Submit → Show results
    await waitFor(() => {
      expect(screen.getByTestId('quiz-layout')).toBeInTheDocument();
    });

    // Verify database interactions
    expect(supabase.from).toHaveBeenCalledWith('enhanced_quizzes');
  });
});
```

**Integration Points Tested:**
- ✅ Quiz data loading from database
- ✅ Question navigation and state
- ✅ Timer functionality integration
- ✅ Answer submission and scoring
- ✅ Results display and navigation
- ✅ Progress updates and badge awards

### 4. Real-time Data Flow Integration

**Tests:** Real-time updates across multiple components

```typescript
// RealTimeDataFlow.test.tsx
describe('Real-time Data Flow Integration', () => {
  it('should update leaderboard after quiz completion', async () => {
    render(<IntegratedApp />);

    // Complete quiz
    await user.click(screen.getByTestId('complete-quiz'));
    
    // Navigate to leaderboard  
    await user.click(screen.getByTestId('view-leaderboard'));

    // Verify real-time updates
    await waitFor(() => {
      expect(screen.getByTestId('real-time-indicator')).toHaveTextContent('Updates: 2');
    });
  });
});
```

**Integration Points Tested:**
- ✅ Real-time subscription setup
- ✅ Cross-component state synchronization
- ✅ Event-driven updates
- ✅ Data consistency across components
- ✅ Performance under rapid updates

## Advanced Integration Testing Patterns

### 1. Component Mocking Strategy

```typescript
// Mock external dependencies while testing integration
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { 
      signInWithPassword: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: null, error: null })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
    })),
  },
}));
```

### 2. User Interaction Simulation

```typescript
// Realistic user behavior testing
const user = userEvent.setup();

// Simulate complex user workflows
await user.type(screen.getByRole('textbox'), 'test input');
await user.click(screen.getByRole('button', { name: /submit/i }));
await user.selectOptions(screen.getByRole('combobox'), 'option1');
```

### 3. Error Boundary Testing

```typescript
// Test error handling across component boundaries
it('should handle cross-component errors gracefully', async () => {
  // Mock error conditions
  (supabase.from as any).mockReturnValue({
    select: vi.fn().mockRejectedValue(new Error('Database error')),
  });

  render(<IntegratedApp />);
  
  // Component should still render despite errors
  expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
});
```

## Running Integration Tests

### Test Commands

```bash
# Run all integration tests
npm run test:integration

# Run integration tests in watch mode  
npm run test:integration:watch

# Run with coverage
npm run test:coverage

# Run specific integration test
npx vitest src/test/integration/AuthFlow.test.tsx
```

### Test Configuration

```typescript
// vitest.config.ts integration-specific settings
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000, // Longer timeout for integration tests
  },
});
```

## Integration Testing Best Practices

### 1. Test Real User Workflows
```typescript
// ✅ Good: Test complete user journeys
it('should complete student onboarding flow', async () => {
  // Login → Dashboard → Take Quiz → View Results → Check Progress
});

// ❌ Avoid: Testing isolated component methods
it('should call handleClick', () => {
  component.handleClick();
});
```

### 2. Mock External Dependencies  
```typescript
// ✅ Mock Supabase, but test component integration
vi.mock('../../lib/supabase');

// ✅ Don't mock your own components being tested
// ❌ Don't mock React Router, Auth Context in integration tests
```

### 3. Test Data Flow
```typescript
// ✅ Verify data flows correctly between components
expect(screen.getByTestId('dashboard-stats')).toHaveTextContent('5 Courses');
expect(screen.getByTestId('progress-bar')).toHaveAttribute('aria-valuenow', '75');
```

### 4. Handle Async Operations
```typescript
// ✅ Properly wait for async operations
await waitFor(() => {
  expect(screen.getByTestId('quiz-results')).toBeInTheDocument();
});

// ✅ Use act() for state updates
act(() => {
  setRealTimeUpdates(prev => [...prev, newUpdate]);
});
```

## Integration Testing Benefits

### ✅ **Comprehensive Coverage**
- Tests real user workflows end-to-end
- Validates component interaction patterns
- Ensures data consistency across the app

### ✅ **Realistic Scenarios** 
- Simulates actual user behavior
- Tests with realistic data flows
- Validates error handling in context

### ✅ **Confidence in Deployments**
- Catches integration bugs before production
- Validates API contract compatibility  
- Ensures UI/UX consistency

### ✅ **Documentation Value**
- Tests serve as living documentation
- Shows expected component interactions
- Demonstrates proper usage patterns

## Tools and Technologies Used

| Tool | Purpose | Integration Testing Use |
|------|---------|------------------------|
| **React Testing Library** | Component testing | Render components and simulate interactions |
| **User Event** | User interaction simulation | Realistic user behavior testing |
| **Vitest** | Test runner | Fast execution with mocking |
| **JSDOM** | DOM simulation | Browser environment for components |
| **Mock Service Worker** | API mocking | Intercept and mock HTTP requests |

Integration testing ensures that ScholarDorm's complex educational workflows function reliably across all component interactions, providing confidence in the platform's educational delivery! 