// lib/api.ts
import axios from "axios"

import { getApiUrl } from "./env"
import { handleAxiosError } from "./errors"
import { logger } from "./logger"
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
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
import type { BookData } from "@/types/index"

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

// POST: /website/register — tashqi tekshiruvsiz, talaba o'zi to'ldiradi
export const register = async (payload: RegisterRequest): Promise<RegisterResponse> => {
  logger.debug("Register request", { passport_id: payload.passport_id })

  const res = await axiosInstance.post<RegisterResponse>("/website/register", payload)

  logger.debug("Register response", { success: !!res.data?.success })

  return res.data
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

type BookCatalogParams = {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  kafedraId?: string
  bookId?: string
}

function catalogQuery(params?: BookCatalogParams) {
  return {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    ...(params?.search ? { search: params.search } : {}),
    ...(params?.categoryId ? { category_id: params.categoryId } : {}),
    ...(params?.kafedraId ? { kafedra_id: params.kafedraId } : {}),
    ...(params?.bookId ? { book_id: params.bookId } : {}),
  }
}

// GET: /book-items
export const getBookItems = async (params?: BookCatalogParams): Promise<BookItemsResponse> => {
  const res = await axiosInstance.get<BookItemsResponse>("/book-items", { params: catalogQuery(params) })
  return res.data
}

const CATALOG_PAGE_LIMIT = 100
const CATALOG_MAX_PAGES = 10

export const getAllBookCatalog = async (params?: Omit<BookCatalogParams, "page" | "limit">): Promise<BookData[]> => {
  const items: BookData[] = []
  let page = 1

  while (page <= CATALOG_MAX_PAGES) {
    const response = await getBookItems({ ...params, page, limit: CATALOG_PAGE_LIMIT })
    const rows = response.data?.data ?? []
    items.push(...rows)
    if (!response.data?.pagination?.hasNext) break
    page += 1
  }

  return items
}

export const getBooks = async (): Promise<BooksResponse> => {
  return getBookItems({ limit: 12 })
}



// GET: /books (using /book-items endpoint as /books doesn't exist)
export const getAllBooks = async (): Promise<BooksResponse> => {
  return getBookItems({ limit: 100 })
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