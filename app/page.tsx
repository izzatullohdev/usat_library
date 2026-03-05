"use client"
import { useState, useEffect, useMemo, useRef } from "react"
import React from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, ArrowLeft, ArrowRight, BookOpen } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getBookItems, getBooks } from "@/lib/api"
import { getFullImageUrl, isBookNew } from "@/lib/utils"
import { logger } from "@/lib/logger"
import BookSwiper from "@/components/Swiper"
import { useTranslation } from "react-i18next"
import ScrollToTopButton from "@/components/ScrollToTop"
import MagnetButton from "@/components/Magnet"
import TextType from "@/components/TextType"
import { t } from "i18next"
import type { BookData } from "@/types/index"
import NetworkError from "@/components/network-error"
import { animate, useInView } from "framer-motion"

// Import EnrichedBook from common types
import type { EnrichedBook } from "@/types/common"

// Legacy interface definition removed - using centralized type from types/common.ts
// interface EnrichedBook {

// Global cache for main book data
let cachedBooks: EnrichedBook[] | null = null

// Global cache for swiper book data
let cachedSwiperBooks: BookData[] | null = null

// Loading skeleton component
const BookCardSkeleton = () => (
  <Card className="border border-[#21466D]/10 rounded-xl h-full flex flex-col justify-between animate-pulse">
    <CardContent className="p-4 flex-grow flex flex-col max-md:p-2">
      <div className="relative mb-4 overflow-hidden rounded-lg">
        <div className="w-full h-[350px] bg-gray-200 max-md:h-[250px] rounded-lg"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </CardContent>
    <CardFooter className="p-4 pt-0 max-md:p-2">
      <div className="w-full h-10 bg-gray-200 rounded"></div>
    </CardFooter>
  </Card>
)

// Welcome Loading Screen Component
const WelcomeLoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    // Disable scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const timer = setTimeout(() => {
      onComplete()
    }, 5000)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = originalOverflow // Re-enable scroll
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#21466D] via-[#2a5a8a] to-[#1a3a5c] overflow-hidden">
      {/* Fixed Image that never moves */}
      <div className="absolute top-[37%] left-1/2 -translate-x-1/2 z-50">
        <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
          <img
            src="/logo 6.png"
            alt="logo"
            className="pointer-events-none select-none"
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          />
        </div>
      </div>

      {/* Animated Text Content */}
      <div className="text-center space-y-8 pt-72">
        <div className="space-y-4">
          <TextType
            text={t("common.usat")}
            className="text-4xl md:text-6xl font-bold text-white text-center"
            typingSpeed={80}
            pauseDuration={1000}
            deletingSpeed={50}
            loop={true}
            showCursor={true}
            cursorCharacter="|"
            cursorClassName="text-white animate-pulse"
            textColors={["#ffffff", "#ffc82a", "#87ceeb"]}
            variableSpeed={{ min: 60, max: 120 }}
          />
          <div className="mt-8">
            <TextType
              text={t("common.usat2")}
              className="text-lg md:text-xl text-white/80 text-center"
              typingSpeed={60}
              initialDelay={2000}
              showCursor={false}
              loop={false}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progressBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default function HomePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [books, setBooks] = useState<EnrichedBook[]>([])
  const [swiperBooks, setSwiperBooks] = useState<BookData[]>([])
  const [isClient, setIsClient] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false)
  const [showNetworkError, setShowNetworkError] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const itemsPerPage = 20

  const countRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // scroll qilib ko‘rinadigan joyga kirganda true bo‘ladi
  const isInView = useInView(containerRef, { once: true })

  useEffect(() => {
    if (!isLoading && isInView && countRef.current) {
      const controls = animate(0, books.length, {
        duration: 1.5, // Increased duration for smoother animation
        ease: "easeOut",
        onUpdate(value) {
          if (countRef.current) {
            countRef.current.textContent = Math.floor(value).toString()
          }
        },
      })

      return () => controls.stop()
    }
  }, [books.length, isLoading, isInView])

  // Effect to determine if welcome screen should show (once per browser session)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome")
      if (!hasSeenWelcome) {
        setShowWelcomeScreen(true)
      }
    }
  }, [])

  // Function to check network connectivity
  const checkNetworkAndFetch = async () => {
    try {
      setNetworkError(false)
      setShowNetworkError(false)
      await fetchAllData()
    } catch (error: unknown) {
      logger.error("Network error", error)
      // Check if it's a network error
      if (
        error.code === "NETWORK_ERROR" ||
        error.message?.includes("Network Error") ||
        error.message?.includes("fetch") ||
        !navigator.onLine
      ) {
        setNetworkError(true)
        setShowNetworkError(true)
        setIsLoading(false)
      } else {
        // Other types of errors
        setIsLoading(false)
      }
    }
  }

  // Main data fetching function
  const fetchAllData = async () => {
    // Fetch main books
    if (cachedBooks) {
      setBooks(cachedBooks)
      setIsLoading(false)
    } else {
      setIsLoading(true)
      try {
        const response = await getBookItems()
        const bookItemsData = response.data?.data || []
        const enrichedBooks: EnrichedBook[] = bookItemsData.map((item: BookData) => ({
          id: item.Book.id,
          name: item.Book.name,
          author_id: item.Book.author_id,
          year: item.Book.year,
          page: item.Book.page,
          books: item.Book.books,
          book_count: item.Book.book_count,
          description: item.Book.description,
          image_id: item.Book.image_id,
          createdAt: item.Book.createdAt,
          updatedAt: item.Book.updatedAt,
          auther_id: item.Book.auther_id,
          Auther: item.Book.Auther,
          image: item.Book.image,
          bookItem: item,
        }))
        setBooks(enrichedBooks)
        cachedBooks = enrichedBooks
      } catch (err) {
        throw err // Re-throw to be caught by checkNetworkAndFetch
      } finally {
        setIsLoading(false)
      }
    }

    // Fetch swiper books
    if (cachedSwiperBooks) {
      setSwiperBooks(cachedSwiperBooks)
    } else {
      try {
        const swiperResponse = await getBooks()
        const swiperBooksArray = swiperResponse.data?.data || []
        const parsedSwiperBooks: BookData[] = Array.isArray(swiperBooksArray) ? swiperBooksArray : []
        setSwiperBooks(parsedSwiperBooks)
        cachedSwiperBooks = parsedSwiperBooks
      } catch (error) {
        logger.error("Swiper kitoblarini olishda xatolik", error)
        setSwiperBooks([])
      }
    }
  }

  // Effect to fetch books with network error handling
  useEffect(() => {
    checkNetworkAndFetch()
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.style.scrollBehavior = "smooth"
    }
  }, [])

  const handleCardClick = (bookId: string) => {
    router.push(`/book/${bookId}`)
  }

  // Inline requireAuth function for this component
  const requireAuth = (callback: () => void) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      toast.warning(t("common.loginRequired"))
      router.push("/login")
    } else {
      callback()
    }
  }

  const addToCart = (selectedBook?: EnrichedBook) => {
    const targetBook = selectedBook
    if (!targetBook) return
    const userId = localStorage.getItem("id")
    if (!userId) {
      toast.warning("User ID topilmadi. Iltimos qayta login qiling.")
      return
    }
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    interface CartItem extends EnrichedBook {
      userId: string
    }
    const existingBook = (cart as CartItem[]).find((item) => item.id === targetBook.id && item.userId === userId)
    if (!existingBook) {
      cart.push({ ...targetBook, userId })
      localStorage.setItem("cart", JSON.stringify(cart))
      toast.success(t("common.bookAddedToCart", { bookName: targetBook.name }))
      window.dispatchEvent(new Event("storage"))
    } else {
      toast.warning(t("common.bookAlreadyInCart", { bookName: targetBook.name }))
    }
  }

  const repeatedBooks = useMemo(() => {
    return Array.from({ length: 1 }).flatMap(() => books)
  }, [books])

  const totalPages = Math.ceil(repeatedBooks.length / itemsPerPage)
  const currentBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return repeatedBooks.slice(startIndex, startIndex + itemsPerPage)
  }, [repeatedBooks, currentPage])

  const getPaginationButtons = (currentPage: number, totalPages: number) => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      let end = Math.min(totalPages, start + maxVisiblePages - 1)
      if (end - start + 1 < maxVisiblePages) {
        if (start === 1) {
          end = Math.min(totalPages, start + maxVisiblePages - 1)
        } else if (end === totalPages) {
          start = Math.max(1, totalPages - maxVisiblePages + 1)
        }
      }
      if (start > 1) {
        pages.push(1)
        if (start > 2) {
          pages.push("...")
        }
      }
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push("...")
        }
        pages.push(totalPages)
      }
    }
    return pages
  }

  const handleWelcomeComplete = () => {
    setShowWelcomeScreen(false)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("hasSeenWelcome", "true")
    }
  }

  const handleNetworkRetry = () => {
    setIsLoading(true)
    checkNetworkAndFetch()
  }

  if (!isClient) return null

  // Show network error screen
  if (showNetworkError) {
    return <NetworkError onRetry={handleNetworkRetry} isVisible={showNetworkError} />
  }

  // Show welcome screen only if user hasn't seen it in current session
  if (showWelcomeScreen) {
    return <WelcomeLoadingScreen onComplete={handleWelcomeComplete} />
  }

  return (
    <div className="min-h-screen bg-background mt-10">
      {/* Swiperga yuklangan kitoblarni prop orqali uzatamiz */}
      {books.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-[30px] font-bold text-[#21466D]">{t("common.booksNotFound")}</h1>
          <p className="text-[15px] text-[#21466D] mb-4">Keyinroq urinib ko'ring</p>
        </div>
      ) : (
        <div>
          <BookSwiper initialBooks={swiperBooks} />
          <div className="container mx-auto px-4 py-8">
            <div  className="w-full px-10 py-8 text-start">
              <h1 className="text-[38px] font-[700] text-[#21466D] flex justify-start items-center gap-5">
                {t("common.allBooks")}:
                <span
                  
                  className="inline-block bg-gradient-to-r from-[#21466D] to-[#2a5a8a] bg-clip-text text-transparent font-bold"
                >
                  {books.length}  
                </span>
                {t("common.countUnit")}
              </h1>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 max-md:gap-4">
              {isLoading
                ? // Loading skeletons ko'rsatish
                  Array.from({ length: itemsPerPage }).map((_, index) => <BookCardSkeleton key={index} />)
                : // Haqiqiy kitoblar ko'rsatish
                  currentBooks.map((book, index) => {
                    const imageUrl = book.image?.url ? getFullImageUrl(book.image.url) : "/placeholder.svg"
                    const isNew = book.bookItem?.Status?.id ? isBookNew(book.bookItem.Status.id) : false
                    return (
                      <Card
                        key={`${book.id}-${index}`}
                        onClick={() => requireAuth(() => handleCardClick(book.id))}
                        className="group hover:shadow-xl transition-all duration-200 border border-[#21466D]/10 rounded-xl cursor-pointer hover:border-[#21466D]/20 h-full flex flex-col justify-between"
                      >
                        <CardContent className="p-4 flex-grow flex flex-col max-md:p-2">
                          <div className="relative mb-2 overflow-hidden rounded-xl transition-all duration-500 bg-gradient-to-br from-gray-50 to-gray-100 group-hover:shadow-lg">
                            <div className="relative w-full h-[440px] max-md:h-[220px] overflow-hidden">
                              <Image
                                src={
                                  getFullImageUrl(book.image?.url) ||
                                  "/placeholder.svg?height=400&width=300&query=book cover" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg"
                                }
                                alt={book.name}
                                fill
                                className="object-contain object-center duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                              {isNew && (
                                <Badge className="absolute top-2 right-2 bg-[#ffc82a] text-[#21466D] text-xs">
                                  {t("common.new")}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <h3
                            title={book.name}
                            className="font-semibold text-lg mb-1 group-hover:text-[#21466D] transition-colors line-clamp-2 min-h-[2rem]"
                          >
                            {book.name
                              .split(/[:\s]+/)
                              .slice(0, 3)
                              .join(" ")}
                            {book.name.split(/[:\s]+/).length > 3 ? "..." : ""}
                          </h3>
                          <div className="space-y-1 text-sm text-muted-foreground mb-4">
                            <p className="text-xs text-[#21466D]">
                              {t("common.author")}: {book.Auther?.name || t("common.unknown")}
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex flex-col gap-2 max-md:gap-1 max-md:p-2">
                          <MagnetButton className="w-full">
                            <Button
                              className="w-full bg-[#21466D] hover:bg-[#21466D]/90 text-white flex items-center justify-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                requireAuth(() => addToCart(book))
                              }}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" /> {t("common.addBookToCart")}
                            </Button>
                          </MagnetButton>
                        </CardFooter>
                      </Card>
                    )
                  })}
            </div>
            {!isLoading && totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center space-x-2">
                  <MagnetButton>
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      className="text-[#21466D] border-[#21466D]/40 hover:bg-[#21466D]/10"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </MagnetButton>
                  {getPaginationButtons(currentPage, totalPages).map((page, index) => (
                    <React.Fragment key={index}>
                      {page === "..." ? (
                        <span className="px-4 py-2 text-sm text-gray-500">...</span>
                      ) : (
                        <MagnetButton>
                          <Button
                            onClick={() => setCurrentPage(page as number)}
                            variant={currentPage === page ? "default" : "outline"}
                            className={
                              currentPage === page
                                ? "bg-[#21466D] text-white hover:bg-[#21466D]/90"
                                : "text-[#21466D] border-[#21466D]/40 hover:bg-[#21466D]/10"
                            }
                          >
                            {page}
                          </Button>
                        </MagnetButton>
                      )}
                    </React.Fragment>
                  ))}
                  <MagnetButton>
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      className="text-[#21466D] border-[#21466D]/40 hover:bg-[#21466D]/10"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </MagnetButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <ScrollToTopButton />
    </div>
  )
}
