import { create } from "zustand"
import { isTokenExpired, isValidTokenFormat } from "../token-utils"
import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from "../storage"

interface AuthState {
  token: string | null
  setToken: (token: string) => void
  clearToken: () => void
  isTokenValid: () => boolean
  getValidToken: () => string | null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStorageItem<string>(STORAGE_KEYS.TOKEN),
  setToken: (token: string) => {
    // Validate token format before setting
    if (!isValidTokenFormat(token)) {
      console.warn("Invalid token format")
      return
    }

    // Check if token is expired before setting
    if (isTokenExpired(token)) {
      console.warn("Token is expired")
      // Still set it, but it will be cleared on next validation check
    }

    setStorageItem(STORAGE_KEYS.TOKEN, token)
    set({ token })
  },
  clearToken: () => {
    removeStorageItem(STORAGE_KEYS.TOKEN)
    set({ token: null })
  },
  isTokenValid: () => {
    const token = get().token
    if (!token) {
      return false
    }

    if (!isValidTokenFormat(token)) {
      return false
    }

    if (isTokenExpired(token)) {
      // Auto clear expired token
      get().clearToken()
      return false
    }

    return true
  },
  getValidToken: () => {
    const state = get()
    if (state.isTokenValid()) {
      return state.token
    }
    return null
  },
}))
