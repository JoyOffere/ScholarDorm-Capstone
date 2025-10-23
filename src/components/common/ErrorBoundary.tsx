import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Store error details for display
    this.setState({
      error,
      errorInfo,
    });

    // Optional: Send error to logging service
    // You can integrate with services like Sentry, LogRocket, etc.
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-6">
          <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold mb-4 text-red-600">Oops! Something went wrong.</h1>
            <p className="text-lg mb-6 text-gray-600">
              We're sorry for the inconvenience. An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>

            {/* Error Details Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Error Details</h2>
              <div className="bg-gray-50 p-4 rounded border overflow-auto max-h-96">
                {error && (
                  <div className="mb-4">
                    <h3 className="font-bold text-red-500">Error Message:</h3>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{error.message}</pre>
                  </div>
                )}
                {error && error.stack && (
                  <div className="mb-4">
                    <h3 className="font-bold text-red-500">Stack Trace:</h3>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
                {errorInfo && (
                  <div>
                    <h3 className="font-bold text-red-500">Component Stack:</h3>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Try Again
              </button>
            </div>

            {/* Additional Info */}
            <p className="text-sm text-gray-500 mt-4">
              If you continue to experience issues, please copy the error details above and report it to our support team.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
