/**
 * Common type definitions used across the application
 */

import type { BookData } from "./index"

/**
 * Enriched book data structure with nested book item information
 * This is the unified interface used across all components
 */
export interface EnrichedBook {
  id: string
  name: string
  author_id: string | null
  year: number
  page: number
  books: number
  book_count: number
  description: string
  image_id: string
  createdAt: string
  updatedAt: string
  auther_id: string
  Auther: {
    id: string
    name: string
  }
  image: {
    id: string
    filename?: string
    path?: string
    url: string
    mimetype?: string
    size?: number
    createdAt?: string
    updatedAt?: string
  }
  bookItem?: BookData | {
    id: string
    book_id: string
    language_id: string
    alphabet_id: string
    status_id: number
    pdf_id: string
    createdAt: string
    updatedAt: string
    kafedra_id: string | null
    PDFFile?: {
      id: string
      file_url: string
      original_name: string
      file_size: number
    }
    BookCategoryKafedra?: {
      category_id: string
      kafedra_id: string
      category: {
        id: string
        name_uz: string
        name_ru: string
      }
      kafedra: {
        id: string
        name_uz: string
        name_ru: string
      }
    }
    Language?: {
      id: string
      name: string
    }
    Alphabet?: {
      id: string
      name: string
    }
    Status?: {
      id: string
      name: string
    }
  }
  Status?: {
    id: string
    name: string
  }
}

