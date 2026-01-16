/**
 * Custom error classes for better error handling
 */

/**
 * Base custom error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace?.(this, this.constructor)
  }
}

/**
 * API error - for errors from API calls
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    public statusCode: number,
    public response?: unknown,
    code?: string
  ) {
    super(message, code || `API_${statusCode}`, statusCode, { response })
  }
}

/**
 * Network error - for network-related errors
 */
export class NetworkError extends AppError {
  constructor(message: string = "Network error occurred", public originalError?: unknown) {
    super(message, "NETWORK_ERROR", undefined, { originalError })
  }
}

/**
 * Validation error - for input validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, public field?: string, public value?: unknown) {
    super(message, "VALIDATION_ERROR", 400, { field, value })
  }
}

/**
 * Authentication error - for auth-related errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed", public redirectTo?: string) {
    super(message, "AUTH_ERROR", 401, { redirectTo })
  }
}

/**
 * Authorization error - for permission errors
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied", public requiredRole?: string) {
    super(message, "AUTHORIZATION_ERROR", 403, { requiredRole })
  }
}

/**
 * Not found error - for resource not found errors
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", public resource?: string) {
    super(message, "NOT_FOUND", 404, { resource })
  }
}

/**
 * Convert axios error to AppError
 */
export function handleAxiosError(error: unknown): AppError {
  if (typeof error === "object" && error !== null) {
    const axiosError = error as {
      response?: { status: number; data?: unknown }
      message?: string
      code?: string
    }

    if (axiosError.response) {
      return new ApiError(
        axiosError.message || "API request failed",
        axiosError.response.status,
        axiosError.response.data,
        axiosError.code
      )
    }

    if (axiosError.code === "ECONNABORTED" || axiosError.message?.includes("Network")) {
      return new NetworkError("Network request failed", error)
    }
  }

  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, "UNKNOWN_ERROR", undefined, { originalError: error })
  }

  return new AppError("An unexpected error occurred", "UNKNOWN_ERROR")
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred. Please try again."
}

