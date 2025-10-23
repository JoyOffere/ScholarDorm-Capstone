/**
 * Logging demonstration script
 * Shows the improved logging capabilities
 */

import { logger, debug, info, warn, error, success, auth, oauth, inspect } from '../src/lib/logger.js';

console.log('🚀 Demonstrating improved logging system\n');

// Basic logging levels
logger.debug('This is a debug message with structured data', { 
  data: { userId: '123', action: 'test' }
});

logger.info('Application started successfully');

logger.warn('This is a warning message', {
  data: { component: 'AuthForm', issue: 'slow response' }
});

logger.error('This is an error message', new Error('Test error'));

logger.success('Operation completed successfully', {
  data: { duration: '1.2s', records: 42 }
});

// Specialized logging
auth('User authentication attempt', { email: 'user@example.com' });
oauth('Google OAuth callback received', { provider: 'google', userId: '123' });

// Group logging
logger.group('OAuth Configuration', () => {
  info('Checking environment variables...');
  info('Validating redirect URLs...');
  success('OAuth configuration valid');
});

// Performance timing
logger.time('Database Query');
setTimeout(() => {
  logger.timeEnd('Database Query');
}, 100);

// Table output for structured data
const userData = [
  { id: 1, name: 'John', role: 'student' },
  { id: 2, name: 'Jane', role: 'admin' }
];
logger.table(userData);

// Object inspection
const complexObject = {
  user: { id: 123, profile: { name: 'Test User' } },
  session: { expires: new Date(), token: 'abc123' }
};
inspect(complexObject, 'Session Data');

console.log('\n✅ Logging demonstration complete!');
console.log('📝 Benefits:');
console.log('  - Structured logging with prefixes and timestamps');
console.log('  - Environment-aware (debug logs only in development)');
console.log('  - Specialized methods for different contexts');
console.log('  - Better error handling and data inspection');
console.log('  - Production-safe with level controls');