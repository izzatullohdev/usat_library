/**
 * Token validation and utility functions
 */

/**
 * JWT token payload interface
 */
export interface JwtPayload {
  exp?: number
  iat?: number
  sub?: string
  [key: string]: unknown
}

/**
 * Decode JWT token to extract payload
 * @param token JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1]
    if (!base64Url) {
      return null
    }
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

/**
 * Check if token is expired
 * @param token JWT token string
 * @returns true if token is expired or invalid, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  if (!token) {
    return true
  }

  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) {
    return true
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000
  const currentTime = Date.now()

  // Add 5 minute buffer to prevent using tokens that are about to expire
  const bufferTime = 5 * 60 * 1000 // 5 minutes

  return currentTime >= expirationTime - bufferTime
}

/**
 * Get token expiration date
 * @param token JWT token string
 * @returns Expiration date or null if invalid
 */
export function getTokenExpirationDate(token: string): Date | null {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) {
    return null
  }

  return new Date(decoded.exp * 1000)
}

/**
 * Get time until token expires in milliseconds
 * @param token JWT token string
 * @returns Milliseconds until expiration, or 0 if expired/invalid
 */
export function getTokenTimeUntilExpiry(token: string): number {
  const expirationDate = getTokenExpirationDate(token)
  if (!expirationDate) {
    return 0
  }

  const currentTime = Date.now()
  const expirationTime = expirationDate.getTime()

  return Math.max(0, expirationTime - currentTime)
}

/**
 * Validate token format (basic check)
 * @param token Token string to validate
 * @returns true if token appears to be valid JWT format
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false
  }

  // JWT tokens have 3 parts separated by dots
  const parts = token.split(".")
  return parts.length === 3
}

