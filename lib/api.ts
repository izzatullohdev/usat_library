// lib/api.ts
import axios from "axios"

import { getApiUrl } from "./env"
import { handleAxiosError } from "./errors"
import { logger } from "./logger"
import type {
  LoginRequest,
  LoginResponse,
  RegisterResponse,
  BooksResponse,
  BookItemsResponse,
  CategoriesResponse,
  KafedrasResponse,
  AuthorsResponse,
  UserOrderRequest,
  UserOrderResponse,
  NotificationsResponse,
  UnreadCountResponse,
  MarkAsReadResponse,
  ReadAllResponse,
} from "@/types/api"

const apiUrl = getApiUrl()

// BaseURL is set from env; only warn in development to avoid exposing config
if ((!apiUrl || apiUrl === "your_api_url_here") && typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  logger.warn("NEXT_PUBLIC_API_URL is not configured. Set it in .env.local")
}

const axiosInstance = axios.create({
  baseURL: apiUrl && apiUrl !== "your_api_url_here" ? `${apiUrl}` : "", 
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
})

// Request interceptor - automatically add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Check if API URL is configured and warn if not
    if (!apiUrl && typeof window !== "undefined") {
        if (process.env.NODE_ENV === "development") {
          logger.warn(
            "⚠️ API request attempted without NEXT_PUBLIC_API_URL configured. " +
            "Request may fail. Please set NEXT_PUBLIC_API_URL in .env.local"
          )
        }
    }

    if (typeof window !== "undefined") {
      // Synchronously get token from localStorage
      try {
        // Use dynamic import but handle it synchronously via localStorage directly
        const token = localStorage.getItem("token")
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (e) {
        // Storage not available, skip
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors and convert to AppError
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Type guard for axios error
    const axiosError = error as {
      response?: { status: number; data?: unknown }
      message?: string
      code?: string
    }
    
    if (axiosError.response) {
      const status = axiosError.response.status
      
      // Handle authentication errors
      if (status === 401 || status === 403) {
        if (typeof window !== "undefined") {
          // Use logout utility to clear all auth state
          import("./auth-utils").then(({ performLogout }) => {
            performLogout({
              redirectTo: "/login",
              callServerLogout: false, // Don't call server logout on 401/403
            })
          })
        }
      }
    }
    
    // Convert axios error to AppError for better error handling
    const appError = handleAxiosError(error)
    return Promise.reject(appError)
  }
)

// POST: /login
export const login = async (passport_id: string, password: string): Promise<LoginResponse> => {
  const requestPayload: LoginRequest = {
    passport_id,
    password,
  }
  
  logger.debug("Login request", { passport_id: requestPayload.passport_id })
  
  const res = await axiosInstance.post<LoginResponse>("/website/login", requestPayload)
  
  logger.debug("Login response", { success: !!res.data })
  
  return res.data
}

// POST: /register
export const register = async (
  passport_id: string,
  password: string,
  fullname: string,
  phone: string,
  group_id: number = 3
): Promise<RegisterResponse> => {
  const requestPayload = {
    passport_id,
    password,
    full_name: fullname,
    phone,
    group_id,
  }
  
  logger.debug("Register request", { passport_id: requestPayload.passport_id, group_id: requestPayload.group_id })
  
  const res = await axiosInstance.post<RegisterResponse>("/website/register", requestPayload)
  
  logger.debug("Register response", { success: !!res.data?.success })
  
  return res.data
}

/**
 * Get telegram bot token from STD API
 * This is used for telegram bot operations
 */
export interface StdBotTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export const getStdBotToken = async (): Promise<StdBotTokenResponse> => {
  try {
    // Use separate axios instance for STD API (different base URL)
    const stdAxiosInstance = axios.create({
      baseURL: "http://std-back.usat-ai-lab.uz/api/v1",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      timeout: 10000,
    })

    const response = await stdAxiosInstance.post<StdBotTokenResponse>("/auth/login", {
      username: "telegram_bot",
      password: "telegram_bot123",
    })

    // Save tokens to localStorage
    if (typeof window !== "undefined" && response.data) {
      const { setStorageItem, STORAGE_KEYS } = await import("./storage")
      setStorageItem(STORAGE_KEYS.STD_TOKEN, response.data.access_token)
      setStorageItem(STORAGE_KEYS.STD_REFRESH, response.data.refresh_token)
    }

    return response.data
  } catch (error: any) {
    logger.error("Failed to get STD bot token", error)
    // Return error but don't throw - this should not block registration
    throw error
  }
}

/**
 * Student data structure from STD API
 */
export interface StdStudentResponse {
  id: number
  full_name: string
  pinfl: string
  phone: string
  group_id: number
  type_id: number
  group: {
    title: string
    is_active: boolean
    course: number
    field_id: number
    learning_type_id: number
    id: number
    field: {
      title: string
      id: number
      created_at: string
    }
    learning_type: {
      title: string
      id: number
      created_at: string
    }
    created_at: string
    updated_at: string
  }
  student_type: {
    title: string
    id: number
    created_at: string
  }
  created_at: string
  updated_at: string
}

/**
 * Check if user exists in STD API by passport ID and get student data
 * @param passportId - User's passport ID (14 digits)
 * @returns Student data if exists, null otherwise
 */
export const checkStdUserExists = async (passportId: string): Promise<StdStudentResponse | null> => {
  try {
    if (!passportId || passportId.length !== 14) {
      return null
    }

    // Get STD token from localStorage
    if (typeof window === "undefined") {
      return null
    }

    const { getStorageItem, STORAGE_KEYS } = await import("./storage")
    let stdToken = getStorageItem<string>(STORAGE_KEYS.STD_TOKEN)

    if (!stdToken) {
      // Try to get token first
      try {
        await getStdBotToken()
        stdToken = getStorageItem<string>(STORAGE_KEYS.STD_TOKEN)
      } catch (error) {
        logger.warn("Failed to get STD bot token", error)
        return null
      }
      
      if (!stdToken) {
        logger.warn("STD token not available after fetch attempt")
        return null
      }
    }

    // Validate token format (should be a non-empty string)
    if (!stdToken || typeof stdToken !== "string" || stdToken.trim() === "") {
      logger.warn("Invalid STD token format")
      // Try to refresh token
      try {
        await getStdBotToken()
        stdToken = getStorageItem<string>(STORAGE_KEYS.STD_TOKEN)
        if (!stdToken) {
          return null
        }
      } catch (error) {
        logger.warn("Failed to refresh STD token", error)
        return null
      }
    }

    // Use Next.js API route as proxy to avoid CORS issues
    // This calls our internal API route which then proxies to STD API
    // Create a simple axios instance without baseURL for internal Next.js routes
    const internalAxios = axios.create({
      baseURL: typeof window !== "undefined" ? window.location.origin : "",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    })

    // Remove trailing slash from URL
    const url = `/api/std/fields/${passportId}`.replace(/\/+$/, "")
    
    const response = await internalAxios.get<StdStudentResponse>(url, {
      headers: {
        Authorization: `Bearer ${stdToken}`,
      },
    })
    
    // If response is successful (200-299), return student data
    if (response.status >= 200 && response.status < 300) {
      return response.data
    }
    return null
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { status: number; data?: unknown }
      message?: string
      code?: string
    }
    const status = axiosError?.response?.status
    
    // 404 means user doesn't exist
    if (status === 404) {
      return null
    }
    
    // 403 might mean user doesn't exist or token doesn't have permission
    // In this case, try to refresh token and retry once
    if (status === 403 || status === 401) {
      try {
        const { getStorageItem, STORAGE_KEYS } = await import("./storage")
        // Try refreshing token
        await getStdBotToken()
        const newToken = getStorageItem<string>(STORAGE_KEYS.STD_TOKEN)
        
        if (newToken) {
          // Retry once with new token
          const internalAxios = axios.create({
            baseURL: typeof window !== "undefined" ? window.location.origin : "",
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000,
          })
          
          // Remove trailing slash from URL
          const retryUrl = `/api/std/fields/${passportId}`.replace(/\/+$/, "")
          
          const retryResponse = await internalAxios.get<StdStudentResponse>(retryUrl, {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          })
          
          if (retryResponse.status >= 200 && retryResponse.status < 300) {
            return retryResponse.data
          }
        }
      } catch (retryError) {
        logger.warn("Failed to retry with refreshed token", retryError)
      }
      
      // If retry fails, treat as user not found (403 could mean no permission or user doesn't exist)
      return null
    }
    
    // Other errors - log but don't throw
    logger.warn("Failed to check STD user existence", error)
    return null
  }
}

// GET: /website/authers
export const getAuthers = async () => {
  const res = await axiosInstance.get<AuthorsResponse>("/website/authers")
  return res
}

// GET: /website/categories
export const getCategories = async () => {
  const res = await axiosInstance.get<CategoriesResponse>("/website/categories")
  return res
}

// GET: /website/kafedras
export const getKafedras = async () => {
  const res = await axiosInstance.get<KafedrasResponse>("/website/kafedras")
  return res
}

// GET: /book-items
export const getBookItems = async (): Promise<BookItemsResponse> => {
  const res = await axiosInstance.get<BookItemsResponse>("/book-items")
  return res.data
}

export const getBooks = async (): Promise<BooksResponse> => {
  const res = await axiosInstance.get<BooksResponse>("/book-items")
  return res.data
}



// GET: /books (using /book-items endpoint as /books doesn't exist)
export const getAllBooks = async (): Promise<BooksResponse> => {
  const res = await axiosInstance.get<BooksResponse>("/book-items")
  return res.data
}



// GET: /website/alluser-order
export const getUserOrders = async (): Promise<unknown> => {
  const res = await axiosInstance.get("/website/alluser-order")
  // TODO: Define proper type for user orders response
  return res.data
}


// POST: /user-order
export const postUserOrder = async (book_id: number): Promise<UserOrderResponse> => {
  if (typeof window === "undefined") {
    throw new Error("postUserOrder can only be called on the client side")
  }
  
  const { getStorageItem, STORAGE_KEYS } = await import("./storage")
  const userId = getStorageItem<string>(STORAGE_KEYS.USER_ID)
  if (!userId) {
    throw new Error("User ID not found. Please login again.")
  }

  const requestPayload: UserOrderRequest = {
    user_id: userId,
    book_id: book_id,
  }
  
  const res = await axiosInstance.post<UserOrderResponse>("/website/user-order", requestPayload)
  return res.data
}

// GET: /api/v1/notifications
// Base URL: /api/v1/notifications
// Note: baseURL is already set to apiUrl (e.g., http://localhost:3001/api)
// So we use /v1/notifications (not /api/v1/notifications) to avoid duplication
export const getNotifications = async (params?: {
  page?: number
  limit?: number
  is_read?: boolean
  type?: "info" | "warning" | "success" | "error"
}): Promise<NotificationsResponse> => {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append("page", params.page.toString())
  if (params?.limit) queryParams.append("limit", params.limit.toString())
  if (params?.is_read !== undefined) queryParams.append("is_read", params.is_read.toString())
  if (params?.type) queryParams.append("type", params.type)

  const queryString = queryParams.toString()
  // baseURL already includes /api, so we use /v1/notifications
  const url = `/v1/notifications${queryString ? `?${queryString}` : ""}`
  
  const res = await axiosInstance.get<NotificationsResponse>(url)
  return res.data
}

// GET: /api/v1/notifications/unread-count
export const getUnreadNotificationsCount = async (): Promise<UnreadCountResponse> => {
  const res = await axiosInstance.get<UnreadCountResponse>("/v1/notifications/unread-count")
  return res.data
}

// PATCH: /api/v1/notifications/:id/read
export const markNotificationAsRead = async (notificationId: number): Promise<MarkAsReadResponse> => {
  const res = await axiosInstance.patch<MarkAsReadResponse>(`/v1/notifications/${notificationId}/read`)
  return res.data
}

// PATCH: /api/v1/notifications/mark-all-read
export const markAllNotificationsAsRead = async (): Promise<ReadAllResponse> => {
  const res = await axiosInstance.patch<ReadAllResponse>("/v1/notifications/mark-all-read")
  return res.data
}

// DELETE: /api/v1/notifications/:id
export const deleteNotification = async (notificationId: number): Promise<{ success: boolean; message: string; statusCode?: number }> => {
  const res = await axiosInstance.delete<{ success: boolean; message: string; statusCode?: number }>(`/v1/notifications/${notificationId}`)
  return res.data
}