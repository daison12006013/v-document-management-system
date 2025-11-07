/**
 * Centralized logging system
 * Replaces console.log/error with proper structured logging
 */

import { env } from './config/env';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;
  private isDebug: boolean;

  constructor() {
    this.isDevelopment = env.NODE_ENV === 'development';
    this.isDebug = env.APP_DEBUG;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDebug || this.isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment || this.isDebug) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  error(message: string, context?: LogContext & { error?: Error | unknown }): void {
    const errorContext = { ...context };
    if (context?.error instanceof Error) {
      errorContext.error = {
        message: context.error.message,
        stack: context.error.stack,
        name: context.error.name,
      };
    }
    console.error(this.formatMessage('ERROR', message, errorContext));
  }

  // For production, consider using structured logging libraries like pino or winston
  // This is a basic implementation suitable for development
}

export const logger = new Logger();

