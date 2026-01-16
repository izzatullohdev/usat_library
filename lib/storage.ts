/**
 * Type-safe localStorage wrapper with SSR safety
 */

/**
 * Storage keys used in the application
 */
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER_ID: "id",
  FULLNAME: "fullname",
  PHONE: "phone",
  ROLE: "role",
  CART: "cart",
  LANGUAGE: "i18nextLng",
  HAS_SEEN_WELCOME: "hasSeenWelcome",
  PWA_INSTALL_MODAL_SHOWN: "pwa-install-modal-shown",
  STD_TOKEN: "std_token",
  STD_REFRESH: "std_refresh",
} as const

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined"
}

/**
 * Get item from localStorage with type safety
 */
export function getStorageItem<T = string>(key: StorageKey, defaultValue?: T): T | null {
  if (!isBrowser()) {
    return defaultValue ?? null
  }

  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      return defaultValue ?? null
    }

    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(item) as T
    } catch {
      return item as T
    }
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error)
    return defaultValue ?? null
  }
}

/**
 * Set item in localStorage with type safety
 */
export function setStorageItem<T>(key: StorageKey, value: T): boolean {
  if (!isBrowser()) {
    return false
  }

  try {
    const serializedValue = typeof value === "string" ? value : JSON.stringify(value)
    localStorage.setItem(key, serializedValue)
    return true
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error)
    return false
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: StorageKey): boolean {
  if (!isBrowser()) {
    return false
  }

  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing from localStorage key "${key}":`, error)
    return false
  }
}

/**
 * Clear all items from localStorage
 */
export function clearStorage(): boolean {
  if (!isBrowser()) {
    return false
  }

  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error("Error clearing localStorage:", error)
    return false
  }
}

/**
 * Clear authentication-related items from localStorage
 */
export function clearAuthStorage(): void {
  removeStorageItem(STORAGE_KEYS.TOKEN)
  removeStorageItem(STORAGE_KEYS.USER_ID)
  removeStorageItem(STORAGE_KEYS.FULLNAME)
  removeStorageItem(STORAGE_KEYS.PHONE)
  removeStorageItem(STORAGE_KEYS.ROLE)
  removeStorageItem(STORAGE_KEYS.CART)
}

/**
 * Get all items from localStorage (for debugging)
 */
export function getAllStorageItems(): Record<string, string> {
  if (!isBrowser()) {
    return {}
  }

  const items: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      items[key] = localStorage.getItem(key) || ""
    }
  }
  return items
}

/**
 * Storage event handler type
 */
export type StorageEventHandler = (key: StorageKey, newValue: string | null, oldValue: string | null) => void

/**
 * Listen to storage changes (including from other tabs)
 */
export function onStorageChange(callback: StorageEventHandler): () => void {
  if (!isBrowser()) {
    return () => {} // No-op unsubscribe
  }

  const handler = (e: StorageEvent) => {
    if (e.key && Object.values(STORAGE_KEYS).includes(e.key as StorageKey)) {
      callback(e.key as StorageKey, e.newValue, e.oldValue)
    }
  }

  window.addEventListener("storage", handler)

  // Return unsubscribe function
  return () => {
    window.removeEventListener("storage", handler)
  }
}

