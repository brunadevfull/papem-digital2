/**
 * Server-side Logger utility with environment-based log levels
 * Production logs are minimal and structured
 * Development logs are verbose and detailed
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';
const VERBOSE_LOGS = process.env.VERBOSE_LOGS === 'true';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!isDevelopment && level === 'debug') {
      return false;
    }
    return true;
  }

  /**
   * Debug logs - only in development
   * Use for verbose logging during development
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Info logs - development and production (important state changes only)
   * Use for important state changes
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Warning logs - always shown
   * Use for recoverable errors
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Error logs - always shown
   * Use for critical errors
   */
  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (this.shouldLog('error')) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${message}`, {
          message: error.message,
          stack: error.stack,
          ...args
        });
      } else {
        console.error(`[ERROR] ${message}`, error, ...args);
      }
    }
  }

  /**
   * Log de acesso HTTP - apenas em desenvolvimento ou VERBOSE_LOGS
   */
  access(method: string, url: string, clientIP?: string | string[]): void {
    if (isDevelopment || VERBOSE_LOGS) {
      const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;
      console.log(`🌐 ${method} ${url}${ip ? ` | ${ip}` : ''}`);
    }
  }

  /**
   * Log de resposta HTTP - apenas em desenvolvimento ou VERBOSE_LOGS
   */
  response(
    method: string,
    path: string,
    status: number,
    duration: number,
    clientIP?: string | string[]
  ): void {
    if (isDevelopment || VERBOSE_LOGS) {
      const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;
      const statusIcon = status >= 400 ? '❌' : '✅';
      console.log(`${statusIcon} ${method} ${path} ${status} em ${duration}ms${ip ? ` | ${ip}` : ''}`);
    }
  }

  /**
   * Log de operação de banco de dados - apenas em desenvolvimento ou VERBOSE_LOGS
   */
  database(operation: string, details?: string): void {
    if (isDevelopment || VERBOSE_LOGS) {
      console.log(`📊 PostgreSQL: ${operation}${details ? ` - ${details}` : ''}`);
    }
  }

  /**
   * Log de arquivo - apenas em desenvolvimento ou VERBOSE_LOGS
   */
  file(operation: string, filename: string): void {
    if (isDevelopment || VERBOSE_LOGS) {
      console.log(`📁 ${operation}: ${filename}`);
    }
  }

  /**
   * Log de sucesso de operação - apenas em desenvolvimento ou VERBOSE_LOGS
   */
  success(message: string, ...args: any[]): void {
    if (isDevelopment || VERBOSE_LOGS) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  /**
   * Log de inicialização do sistema - sempre exibido
   */
  startup(message: string, ...args: any[]): void {
    console.log(message, ...args);
  }

  /**
   * Group start - only in development
   */
  group(label: string): void {
    if (isDevelopment) {
      console.group(label);
    }
  }

  /**
   * Group end - only in development
   */
  groupEnd(): void {
    if (isDevelopment) {
      console.groupEnd();
    }
  }
}

export const logger = new Logger();
export default logger;
