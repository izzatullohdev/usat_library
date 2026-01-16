/**
 * Authentication utility functions
 */

import { useAuthStore } from "./store/auth"
import { useProfileStore } from "./store/profile"
import { clearAuthStorage as clearAuthStorageUtil } from "./storage"

/**
 * List of all localStorage keys used by the application
 */
const STORAGE_KEYS = [
  "token",
  "fullname",
  "phone",
  "role",
  "id",
  "cart",
  "i18nextLng", // Keep language preference
  "hasSeenWelcome", // Keep welcome screen preference
  "pwa-install-modal-shown", // Keep PWA modal preference
] as const

/**
 * List of localStorage keys to clear on logout
 */
const LOGOUT_STORAGE_KEYS = [
  "token",
  "fullname",
  "phone",
  "role",
  "id",
  "cart",
] as const

/**
 * Clear all authentication-related data from localStorage
 */
export function clearAuthStorage(): void {
  if (typeof window === "undefined") {
    return
  }

  LOGOUT_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key)
  })
}

/**
 * Clear all storage (including preferences)
 * Use with caution - only for complete reset
 */
export function clearAllStorage(): void {
  if (typeof window === "undefined") {
    return
  }

  STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key)
  })

  // Also clear sessionStorage
  sessionStorage.clear()
}

/**
 * Perform logout - clears all auth state and storage
 * Optionally calls server-side logout endpoint
 * @param options Configuration options
 */
export async function performLogout(options?: {
  redirectTo?: string
  callServerLogout?: boolean
}): Promise<void> {
  const { redirectTo = "/login", callServerLogout = false } = options || {}

  try {
    // Call server-side logout if requested and token exists
    if (callServerLogout && typeof window !== "undefined") {
      const { getStorageItem, STORAGE_KEYS } = await import("./storage")
      const token = getStorageItem<string>(STORAGE_KEYS.TOKEN)
      if (token) {
        try {
          // Import dynamically to avoid circular dependencies
          const { axiosInstance } = await import("./api")
          await axiosInstance.post("/logout")
        } catch (error) {
          // Ignore errors - we'll still clear local state
          console.warn("Server logout failed, clearing local state anyway:", error)
        }
      }
    }
  } catch (error) {
    // Ignore errors - we'll still clear local state
    console.warn("Error during logout:", error)
  }

  // Clear auth state stores
  useAuthStore.getState().clearToken()
  useProfileStore.getState().clearProfile()

  // Clear localStorage using utility
  clearAuthStorageUtil()

  // Dispatch custom event to notify other parts of the app about logout
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth-logout"))
  }

  // Redirect if in browser
  if (typeof window !== "undefined" && redirectTo) {
    window.location.href = redirectTo
  }
}

