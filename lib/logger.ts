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
   * Warning log (development only; production: no console output to avoid leaking config/API info)
   */
  warn(message: string, data?: unknown): void {
    if (isDevelopment) {
      const entry = formatLog(LogLevel.WARN, message, data)
      console.warn("[WARN]", entry.message, data || "")
    }
  }

  /**
   * Error log (development: full details; production: message only to avoid leaking API/stack)
   */
  error(message: string, error?: Error | unknown): void {
    if (isDevelopment) {
      const entry = formatLog(LogLevel.ERROR, message, error)
      console.error("[ERROR]", entry.message, error || "")
      if (error instanceof Error && error.stack) {
        console.error("[ERROR] Stack:", error.stack)
      }
    } else {
      console.error("[ERROR]", message)
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

