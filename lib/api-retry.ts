/**
 * API retry utility with exponential backoff
 */

import { AxiosError, InternalAxiosRequestConfig } from "axios"

interface RetryConfig {
  retries?: number
  retryDelay?: number
  retryCondition?: (error: AxiosError) => boolean
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  retries: 3,
  retryDelay: 1000, // 1 second
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    if (!error.response) {
      return true // Network error
    }
    const status = error.response.status
    return status >= 500 && status < 600 // Server errors
  },
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(retryCount: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, retryCount)
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: AxiosError | null = null

  for (let attempt = 0; attempt <= finalConfig.retries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error as AxiosError

      // Check if we should retry
      if (attempt < finalConfig.retries && finalConfig.retryCondition(lastError)) {
        const delay = getRetryDelay(attempt, finalConfig.retryDelay)
        
        // Wait before retrying
        await sleep(delay)
        continue
      }

      // Don't retry, throw the error
      throw lastError
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || new Error("Retry failed")
}

/**
 * Add retry configuration to axios request config
 */
export interface RetryableAxiosRequestConfig extends InternalAxiosRequestConfig {
  retry?: RetryConfig
}

