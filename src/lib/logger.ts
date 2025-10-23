/**
 * Enhanced logging utility for ScholarDorm
 * Provides structured logging with levels, prefixes, and better formatting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LogOptions {
  prefix?: string;
  data?: Record<string, unknown>;
  timestamp?: boolean;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private enabledLevels: Set<LogLevel> = new Set(['info', 'warn', 'error', 'success']);

  constructor() {
    // Enable debug logs in development
    if (this.isDevelopment) {
      this.enabledLevels.add('debug');
    }
  }

  private formatMessage(level: LogLevel, message: string, options: LogOptions = {}): string {
    const { prefix, timestamp = true } = options;
    
    let formatted = '';
    
    if (timestamp) {
      formatted += `[${new Date().toISOString().split('T')[1].split('.')[0]}] `;
    }
    
    const levelIcons = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    };
    
    formatted += `${levelIcons[level]} `;
    
    if (prefix) {
      formatted += `[${prefix}] `;
    }
    
    formatted += message;
    
    return formatted;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.enabledLevels.has(level);
  }

  debug(message: string, options: LogOptions = {}): void {
    if (!this.shouldLog('debug')) return;
    
    const formatted = this.formatMessage('debug', message, options);
    console.debug(formatted);
    
    if (options.data) {
      console.debug('Debug data:', options.data);
    }
  }

  info(message: string, options: LogOptions = {}): void {
    if (!this.shouldLog('info')) return;
    
    const formatted = this.formatMessage('info', message, options);
    console.info(formatted);
    
    if (options.data) {
      console.info('Info data:', options.data);
    }
  }

  warn(message: string, options: LogOptions = {}): void {
    if (!this.shouldLog('warn')) return;
    
    const formatted = this.formatMessage('warn', message, options);
    console.warn(formatted);
    
    if (options.data) {
      console.warn('Warning data:', options.data);
    }
  }

  error(message: string, error?: Error | unknown, options: LogOptions = {}): void {
    if (!this.shouldLog('error')) return;
    
    const formatted = this.formatMessage('error', message, options);
    console.error(formatted);
    
    if (error) {
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        console.error('Error data:', error);
      }
    }
    
    if (options.data) {
      console.error('Additional data:', options.data);
    }
  }

  success(message: string, options: LogOptions = {}): void {
    if (!this.shouldLog('success')) return;
    
    const formatted = this.formatMessage('success', message, options);
    console.log(formatted);
    
    if (options.data) {
      console.log('Success data:', options.data);
    }
  }

  // Specialized logging methods for common use cases
  auth(message: string, data?: Record<string, unknown>): void {
    this.info(message, { prefix: 'AUTH', data });
  }

  oauth(message: string, data?: Record<string, unknown>): void {
    this.info(message, { prefix: 'OAUTH', data });
  }

  api(message: string, data?: Record<string, unknown>): void {
    this.debug(message, { prefix: 'API', data });
  }

  ui(message: string, data?: Record<string, unknown>): void {
    this.debug(message, { prefix: 'UI', data });
  }

  db(message: string, data?: Record<string, unknown>): void {
    this.debug(message, { prefix: 'DB', data });
  }

  // Group logging for related operations
  group(title: string, callback: () => void): void {
    if (!this.isDevelopment) return;
    
    console.group(`🔗 ${title}`);
    try {
      callback();
    } finally {
      console.groupEnd();
    }
  }

  // Performance timing
  time(label: string): void {
    if (!this.isDevelopment) return;
    console.time(`⏱️ ${label}`);
  }

  timeEnd(label: string): void {
    if (!this.isDevelopment) return;
    console.timeEnd(`⏱️ ${label}`);
  }

  // Table logging for structured data
  table(data: Record<string, unknown>[] | Record<string, unknown>): void {
    if (!this.isDevelopment) return;
    console.table(data);
  }

  // Environment-based logging control
  enableLevel(level: LogLevel): void {
    this.enabledLevels.add(level);
  }

  disableLevel(level: LogLevel): void {
    this.enabledLevels.delete(level);
  }

  // Production-safe assertion
  assert(condition: boolean, message: string): void {
    if (!condition) {
      this.error(`Assertion failed: ${message}`);
      if (this.isDevelopment) {
        console.assert(condition, message);
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export individual methods for convenience - bind to preserve 'this' context
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const success = logger.success.bind(logger);
export const auth = logger.auth.bind(logger);
export const oauth = logger.oauth.bind(logger);
export const api = logger.api.bind(logger);
export const ui = logger.ui.bind(logger);
export const db = logger.db.bind(logger);
export const group = logger.group.bind(logger);
export const time = logger.time.bind(logger);
export const timeEnd = logger.timeEnd.bind(logger);
export const table = logger.table.bind(logger);
export const assert = logger.assert.bind(logger);

// Development helper to inspect objects
export const inspect = (obj: unknown, label?: string): void => {
  if (!import.meta.env.DEV) return;
  
  if (label) {
    console.log(`🔍 ${label}:`);
  }
  console.dir(obj, { depth: 3, colors: true });
};

export default logger;