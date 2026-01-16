/**
 * Cart helper utilities
 */

import { getStorageItem, setStorageItem, STORAGE_KEYS } from "./storage"
import type { EnrichedBook } from "@/types/common"
import { toast } from "sonner"
import { t } from "i18next"

export interface CartItem extends EnrichedBook {
  userId: string
}

/**
 * Get cart items from storage
 */
export function getCartItems(): CartItem[] {
  const cart = getStorageItem<CartItem[]>(STORAGE_KEYS.CART, [])
  return Array.isArray(cart) ? cart : []
}

/**
 * Add book to cart
 */
export function addToCart(book: EnrichedBook, userId: string): boolean {
  try {
    const cart = getCartItems()
    
    // Check if book already exists in cart for this user
    const existingBook = cart.find((item) => item.id === book.id && item.userId === userId)
    
    if (existingBook) {
      toast.warning(t("common.bookAlreadyInCart") || "Book already in cart")
      return false
    }

    // Add book to cart
    const newCart = [...cart, { ...book, userId }]
    setStorageItem(STORAGE_KEYS.CART, newCart)
    
    toast.success(t("common.bookAddedToCart") || "Book added to cart")
    return true
  } catch (error) {
    console.error("Error adding book to cart:", error)
    toast.error(t("common.errorAddingToCart") || "Error adding book to cart")
    return false
  }
}

/**
 * Remove book from cart
 */
export function removeFromCart(bookId: string, userId: string): boolean {
  try {
    const cart = getCartItems()
    const newCart = cart.filter((item) => !(item.id === bookId && item.userId === userId))
    setStorageItem(STORAGE_KEYS.CART, newCart)
    return true
  } catch (error) {
    console.error("Error removing book from cart:", error)
    return false
  }
}

/**
 * Clear cart for user
 */
export function clearCart(userId: string): void {
  try {
    const cart = getCartItems()
    const newCart = cart.filter((item) => item.userId !== userId)
    setStorageItem(STORAGE_KEYS.CART, newCart)
  } catch (error) {
    console.error("Error clearing cart:", error)
  }
}

/**
 * Get cart count for user
 */
export function getCartCount(userId: string): number {
  const cart = getCartItems()
  return cart.filter((item) => item.userId === userId).length
}

/**
 * Check if book is in cart
 */
export function isBookInCart(bookId: string, userId: string): boolean {
  const cart = getCartItems()
  return cart.some((item) => item.id === bookId && item.userId === userId)
}

