/**
 * Authentication hook for React components
 */

import { useRouter } from "next/navigation"
import { getStorageItem, STORAGE_KEYS } from "@/lib/storage"
import { useAuthStore } from "@/lib/store/auth"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

/**
 * Hook to check authentication and execute callback
 * Shows warning toast and redirects to login if not authenticated
 */
export function useRequireAuth() {
  const router = useRouter()
  const { t } = useTranslation()
  const isTokenValid = useAuthStore((state) => state.isTokenValid)

  const requireAuth = (callback: () => void) => {
    const token = getStorageItem<string>(STORAGE_KEYS.TOKEN)
    
    if (!token || !isTokenValid()) {
      toast.warning(t("common.loginRequired"))
      router.push("/login")
      return
    }

    callback()
  }

  return { requireAuth }
}

