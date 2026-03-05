/**
 * Environment variables validation and type-safe access
 */

import { logger } from "./logger"

interface Env {
  NEXT_PUBLIC_API_URL: string
}

/**
 * Validates that all required environment variables are defined
 * Returns empty string if not defined (graceful degradation)
 */
function validateEnv(): Env {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  if (!apiUrl) {
    const errorMessage =
      "❌ NEXT_PUBLIC_API_URL is not defined!\n" +
      "Please create a .env.local file in the root directory with:\n" +
      "NEXT_PUBLIC_API_URL=your_api_base_url\n" +
      "Example: NEXT_PUBLIC_API_URL=http://localhost:8000/api"

    if (process.env.NODE_ENV === "development") {
      logger.warn(errorMessage)
    }
  }

  // Validate API URL format (only in development)
  if (apiUrl && typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    try {
      new URL(apiUrl)
    } catch {
      logger.warn("NEXT_PUBLIC_API_URL does not appear to be a valid URL")
    }
  }

  return {
    NEXT_PUBLIC_API_URL: apiUrl || "",
  }
}

/**
 * Type-safe environment variables
 * Use this instead of process.env directly
 */
export const env = validateEnv()

/**
 * Get API base URL
 */
export const getApiUrl = (): string => {
  return env.NEXT_PUBLIC_API_URL
}

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development"
}

/**
 * Check if we're in production mode
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production"
}

