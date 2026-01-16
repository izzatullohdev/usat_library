/**
 * Logger utility for development and production environments
 * In production, console.log calls are disabled
 */

const isDevelopment = process.env.NODE_ENV === "development"

/**
 * Log levels
 */
enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
}

/**
 * Format log entry
 */
function formatLog(level: LogLevel, message: string, data?: unknown): LogEntry {
  return {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Logger class
 */
class Logger {
  /**
   * Debug log (only in development)
   */
  debug(message: string, data?: unknown): void {
    if (isDevelopment) {
      const entry = formatLog(LogLevel.DEBUG, message, data)
      console.debug("[DEBUG]", entry.message, data || "")
    }
  }

  /**
   * Info log (only in development)
   */
  info(message: string, data?: unknown): void {
    if (isDevelopment) {
      const entry = formatLog(LogLevel.INFO, message, data)
      console.info("[INFO]", entry.message, data || "")
    }
  }

  /**
   * Warning log (always enabled)
   */
  warn(message: string, data?: unknown): void {
    const entry = formatLog(LogLevel.WARN, message, data)
    console.warn("[WARN]", entry.message, data || "")
    
    // In production, you might want to send warnings to error tracking service
    if (!isDevelopment) {
      // TODO: Send to error tracking service (e.g., Sentry)
    }
  }

  /**
   * Error log (always enabled)
   */
  error(message: string, error?: Error | unknown): void {
    const entry = formatLog(LogLevel.ERROR, message, error)
    console.error("[ERROR]", entry.message, error || "")
    
    // In production, send errors to error tracking service
    if (!isDevelopment) {
      // TODO: Send to error tracking service (e.g., Sentry)
      if (error instanceof Error) {
        // Log error with stack trace
        console.error("[ERROR] Stack:", error.stack)
      }
    }
  }
}

/**
 * Export singleton logger instance
 */
export const logger = new Logger()

/**
 * Export logger class for advanced usage
 */
export { Logger, LogLevel }

