/**
 * API request and response type definitions
 */

import type { BookData, Category, Kafedra } from "./index"

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T
  success?: boolean
  message?: string
  error?: string
}

/**
 * Books API response - matches actual API structure (uses /book-items endpoint)
 */
export interface BooksResponse {
  success: boolean
  message: string
  data: {
    data: BookData[]  // Nested data array
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

/**
 * Book items response - matches actual API structure
 */
export interface BookItemsResponse {
  success: boolean
  message: string
  data: {
    data: BookData[]  // Nested data array
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

/**
 * Login request payload
 */
export interface LoginRequest {
  passport_id: string
  password: string
}

/**
 * Login response
 */
export interface LoginResponse {
  data: {
    token: string
    user: {
      id: string
      fullname?: string
      full_name?: string
      phone: string
      role?: "teacher" | "student" | string
    }
  }
  success?: boolean
  message?: string
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  passport_id: string
  password: string
  fullname: string
  phone: string
  direction?: string
  group?: string
}

/**
 * Register response
 */
export interface RegisterResponse {
  data: {
    token: string
    user: {
      id: string
      fullname?: string
      full_name?: string
      phone: string
      role?: "teacher" | "student" | string
    }
  }
  success?: boolean
  message?: string
}

/**
 * User order request
 */
export interface UserOrderRequest {
  user_id: string
  book_id: number
}

/**
 * User order response
 */
export interface UserOrderResponse {
  data: {
    id: string
    user_id: string
    book_id: number
    createdAt: string
    updatedAt: string
  }
  success?: boolean
  message?: string
}

/**
 * Categories response
 */
export interface CategoriesResponse {
  data: {
    data?: Category[]
  } | Category[]
  success?: boolean
  message?: string
}

/**
 * Kafedras response
 */
export interface KafedrasResponse {
  data: {
    data?: Kafedra[]
  } | Kafedra[]
  success?: boolean
  message?: string
}

/**
 * Authors response
 */
export interface AuthorsResponse {
  data: Array<{
    id: string
    name: string
    createdAt: string
    updatedAt: string
  }>
  success?: boolean
  message?: string
}

/**
 * Notification interface - matches API response
 * Based on: GET /api/v1/notifications
 */
export interface Notification {
  id: number
  user_id: number
  message: string
  type: "info" | "warning" | "success" | "error"
  is_read: boolean
  related_order_id: number | null
  createdAt: string
  updatedAt: string
}

/**
 * Notifications response with pagination
 * Based on: GET /api/v1/notifications
 */
export interface NotificationsResponse {
  success: boolean
  message: string
  data: {
    items: Notification[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  statusCode?: number
}

/**
 * Unread count response
 * Based on: GET /api/v1/notifications/unread-count
 */
export interface UnreadCountResponse {
  success: boolean
  message: string
  data: {
    unread_count: number
  }
  statusCode?: number
}

/**
 * Mark as read response
 * Based on: PATCH /api/v1/notifications/:id/read
 */
export interface MarkAsReadResponse {
  success: boolean
  message: string
  data: Notification
  statusCode?: number
}

/**
 * Read all response
 * Based on: PATCH /api/v1/notifications/mark-all-read
 */
export interface ReadAllResponse {
  success: boolean
  message: string
  data: {
    updated_count: number
  }
  statusCode?: number
}
