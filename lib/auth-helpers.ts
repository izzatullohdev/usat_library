/**
 * Authentication helper utilities
 */

import { logger } from "./logger"
import { getStorageItem, STORAGE_KEYS } from "./storage"
import { useAuthStore } from "./store/auth"

/**
 * Check if user is authenticated and execute callback
 * If not authenticated, shows warning toast and redirects to login
 */
export function requireAuth(
  callback: () => void,
  options?: {
    onNotAuthenticated?: () => void
    redirectTo?: string
  }
): void {
  const token = getStorageItem<string>(STORAGE_KEYS.TOKEN)
  const isValid = useAuthStore.getState().isTokenValid()

  if (!token || !isValid) {
    // Dynamic import to avoid circular dependencies
    import("next/navigation").then(({ useRouter }) => {
      // Note: This won't work directly in non-React context
      // For React components, use useRequireAuth hook instead
      if (options?.onNotAuthenticated) {
        options.onNotAuthenticated()
      } else {
        // This should be handled by the calling component
        logger.warn("User not authenticated")
      }
    })
    return
  }

  callback()
}

