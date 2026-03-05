/**
 * Normalizes book data from API to handle both formats:
 * 1. Nested: { Book: { id, name, ... }, Language, ... } (book-items format)
 * 2. Flat: { id, name, auther_id, image: {...}, ... } (direct books format)
 */

import type { EnrichedBook } from "@/types/common"
import type { BookData } from "@/types/index"

/** Raw book object - can be nested inside Book or flat at root */
interface RawBookFields {
  id: string
  name: string
  author_id?: string | null
  auther_id?: string
  year?: number
  page?: number
  books?: number
  book_count?: number
  description?: string
  image_id?: string
  createdAt?: string
  updatedAt?: string
  image?: { id?: string; url: string; filename?: string; path?: string }
  Auther?: { id: string; name: string }
}

/** API item - either nested (Book inside) or flat (book fields at root) */
type RawBookItem =
  | (RawBookFields & { Book?: RawBookFields })
  | (BookData & { Book?: RawBookFields })

/**
 * Extracts the book object from raw API item (handles both flat and nested)
 */
function getBookFromItem(item: RawBookItem): RawBookFields {
  if (item && typeof item === "object" && "Book" in item && item.Book) {
    return item.Book as RawBookFields
  }
  return item as RawBookFields
}

/**
 * Normalizes raw API item to EnrichedBook
 * Works with both flat and nested response formats
 */
export function normalizeToEnrichedBook(item: RawBookItem): EnrichedBook {
  const book = getBookFromItem(item)
  return {
    id: String(book.id ?? ""),
    name: String(book.name ?? ""),
    author_id: book.author_id ?? book.auther_id ?? null,
    year: Number(book.year ?? 0),
    page: Number(book.page ?? 0),
    books: Number(book.books ?? 0),
    book_count: Number(book.book_count ?? 0),
    description: String(book.description ?? ""),
    image_id: String(book.image_id ?? ""),
    createdAt: String(book.createdAt ?? ""),
    updatedAt: String(book.updatedAt ?? ""),
    auther_id: String(book.auther_id ?? book.author_id ?? ""),
    Auther: book.Auther ?? { id: "", name: "" },
    image: book.image ?? { id: "", url: "" },
    bookItem: item as BookData,
  }
}

/**
 * Normalizes raw API item to BookData format for Swiper
 * Swiper expects book.Book.id, book.Book.name etc.
 * Wraps flat items so book.Book exists
 */
export function normalizeToSwiperBook(item: RawBookItem): { Book: RawBookFields } {
  const book = getBookFromItem(item)
  return { Book: book }
}

/**
 * Normalizes array of raw items to EnrichedBook[]
 */
export function normalizeToEnrichedBooks(items: unknown[]): EnrichedBook[] {
  if (!Array.isArray(items)) return []
  return items
    .filter((item): item is RawBookItem => item != null && typeof item === "object")
    .map(normalizeToEnrichedBook)
}
