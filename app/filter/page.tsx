"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ShoppingCart, BookOpen, Filter, X } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import { getBookItems, getCategories, getKafedras } from "@/lib/api" // Removed getAllBooks
import { getFullImageUrl, isBookNew } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import MagnetButton from "@/components/Magnet"

import type { Category, Kafedra } from "@/types/index"
import type { EnrichedBook } from "@/types/common"

// Legacy interface definitions removed - using centralized types from types/index.ts and types/common.ts
// interface Category {
// interface Kafedra {
// interface EnrichedBook {

const FilterPage = () => {
  const { t, i18n } = useTranslation()
  const router = useRouter()

  // State for data
  const [bookItems, setBookItems] = useState<EnrichedBook[]>([]) // Changed to EnrichedBook[]
  const [categories, setCategories] = useState<Category[]>([])
  const [kafedras, setKafedras] = useState<Kafedra[]>([])
  const [filteredBooks, setFilteredBooks] = useState<EnrichedBook[]>([]) // Use EnrichedBook[]

  // State for filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedKafedras, setSelectedKafedras] = useState<string[]>([])

  // State for UI
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  const booksPerPage = 12
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage)
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage)

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch all data in parallel
        const [bookItemsResponse, categoriesData, kafedrasData] = (await Promise.all([
          getBookItems(), // Only call getBookItems
          getCategories(),
          getKafedras(),
        ])) as any

        // Parse bookItems data and transform to EnrichedBook
        let parsedBookItems: EnrichedBook[] = []
        if (bookItemsResponse.data?.data && Array.isArray(bookItemsResponse.data.data)) {
          parsedBookItems = bookItemsResponse.data.data.map((item: any) => ({
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
            bookItem: item, // Keep the original bookItem nested
          }))
        }

        // Parse categories data
        let parsedCategories: Category[] = []
        if (categoriesData.data && Array.isArray(categoriesData.data.data)) {
          parsedCategories = categoriesData.data.data
        } else if (categoriesData.data && Array.isArray(categoriesData.data)) {
          parsedCategories = categoriesData.data
        }

        // Parse kafedras data
        let parsedKafedras: Kafedra[] = []
        if (kafedrasData.data && Array.isArray(kafedrasData.data.data)) {
          parsedKafedras = kafedrasData.data.data
        } else if (kafedrasData.data && Array.isArray(kafedrasData.data)) {
          parsedKafedras = kafedrasData.data
        }

        // Set state
        setBookItems(parsedBookItems) // Set the enriched book items
        setCategories(parsedCategories)
        setKafedras(parsedKafedras)
        setFilteredBooks(parsedBookItems)
      } catch {
        toast.error(t("common.errorFetchingData"))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [t])

  // Filter books when selections change
  useEffect(() => {

    let result = [...bookItems]
    setCurrentPage(1)

    if (selectedCategories.length > 0 || selectedKafedras.length > 0) {
      result = result.filter((book) => {
        const bookItem = book.bookItem
        if (!bookItem) return false
        
        // Check if BookCategoryKafedras exists (for BookData type)
        const hasBookCategoryKafedras = 'BookCategoryKafedras' in bookItem && Array.isArray((bookItem as any).BookCategoryKafedras)
        // Check if BookCategoryKafedra exists (singular, for other type)
        const hasBookCategoryKafedra = 'BookCategoryKafedra' in bookItem && (bookItem as any).BookCategoryKafedra
        
        if (!hasBookCategoryKafedras && !hasBookCategoryKafedra) {
          return false
        }
        
        const bookCategoryKafedras = hasBookCategoryKafedras 
          ? (bookItem as any).BookCategoryKafedras 
          : (hasBookCategoryKafedra ? [(bookItem as any).BookCategoryKafedra] : [])
        
        if (!Array.isArray(bookCategoryKafedras)) {
          return false
        }

        // Check if any combination in the array matches the selected filters
        const hasMatchingCombination = bookCategoryKafedras.some((combination: { category_id?: string; kafedra_id?: string }) => {
          // If categories are selected, check if this combination matches any selected category
          const categoryMatch =
            selectedCategories.length === 0 ||
            (combination.category_id && selectedCategories.includes(combination.category_id))

          // If kafedras are selected, check if this combination matches any selected kafedra
          const kafedraMatch =
            selectedKafedras.length === 0 ||
            (combination.kafedra_id && selectedKafedras.includes(combination.kafedra_id))

          // This combination must match both category and kafedra filters (if they are applied)
          return categoryMatch && kafedraMatch
        })


        return hasMatchingCombination
      })
    }

    if (result.length === 0 && (selectedCategories.length > 0 || selectedKafedras.length > 0)) {
      toast.warning(t("common.noBooksMatchingFilters"), {
        duration: 4000,
        position: "top-center",
      })
    }

    setFilteredBooks(result)
  }, [selectedCategories, selectedKafedras, bookItems, t]) // Depend on bookItems

  const handleCheckboxChange = (type: "category" | "kafedra", value: string, checked: boolean) => {
    if (type === "category") {
      setSelectedCategories((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)))
    } else if (type === "kafedra") {
      setSelectedKafedras((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)))
    }
  }

  const handleCardClick = (bookId: string) => {
    router.push(`/book/${bookId}`)
  }

  const isTokenyes = (fn: () => void) => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast.warning(t("common.loginRequired"))
      router.push("/login")
    } else {
      fn()
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

    const existingBook = cart.find((item: any) => item.id === targetBook.id && item.userId === userId)

    if (!existingBook) {
      cart.push({ ...targetBook, userId })
      localStorage.setItem("cart", JSON.stringify(cart))
      toast.success(t("common.bookAddedToCart", { bookName: targetBook.name }))
      window.dispatchEvent(new Event("storage"))
    } else {
      toast.warning(t("common.bookAlreadyInCart", { bookName: targetBook.name }))
    }
  }

  const openPDF = (book: EnrichedBook, e: React.MouseEvent) => {
    e.stopPropagation()
    if (book.bookItem?.PDFFile?.file_url) {
      window.open(book.bookItem.PDFFile.file_url, "_blank")
    } else {
      toast.warning(t("common.pdfNotAvailable"))
    }
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedKafedras([])
  }

  const getActiveFiltersCount = () => {
    return selectedCategories.length + selectedKafedras.length
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Prevent body scroll when mobile filter is open
  useEffect(() => {
    if (showMobileFilter) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [showMobileFilter])

  if (!isClient) return null

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen container mx-auto">
        <div className="flex items-center justify-center h-64 w-full">
          <div className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">{t("common.loadingData")}</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div id="top" className="flex flex-col md:flex-row min-h-screen container mx-auto relative">
      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden p-4 border-b bg-white sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("common.books")}</h2>
          <Button onClick={() => setShowMobileFilter(true)} variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            {t("common.filter")}
            {getActiveFiltersCount() > 0 && (
              <Badge className="ml-2 bg-[#21466D] text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-40 md:hidden overflow-y-auto h-full">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilter(false)} />

          {/* Filter Panel */}
          <div className="absolute inset-x-0 top-0 bottom-0 bg-white shadow-xl h-full w-full max-w-md right-0 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <h3 className="text-lg font-semibold">{t("common.filter")}</h3>
              <MagnetButton>
                <Button variant="ghost" size="icon" onClick={() => setShowMobileFilter(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </MagnetButton>
            </div>

            {/* Filter Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Active Filters Summary */}
              {getActiveFiltersCount() > 0 && (
                <div className="bg-[#21466D]/5 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#21466D]">
                      {t("common.activeFilters")} ({getActiveFiltersCount()})
                    </span>
                    <MagnetButton className="w-full">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-xs h-6 px-2 text-[#21466D]"
                      >
                        {t("common.clearAll")}
                      </Button>
                    </MagnetButton>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedCategories.map((catId) => {
                      const category = categories.find((c) => c.id === catId)
                      return category ? (
                        <Badge key={catId} variant="secondary" className="text-xs">
                          {i18n.language.startsWith('ru') ? category.name_ru : category.name_uz}
                        </Badge>
                      ) : null
                    })}
                    {selectedKafedras.map((kafId) => {
                      const kafedra = kafedras.find((k) => k.id === kafId)
                      return kafedra ? (
                        <Badge key={kafId} variant="outline" className="text-xs">
                          {i18n.language.startsWith('ru') ? kafedra.name_ru : kafedra.name_uz}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Categories Filter */}
              <div className="space-y-3">
                <h4 className="font-semibold text-base text-[#21466D]">{t("common.categories")}</h4>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={`mobile-category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={(checked) => handleCheckboxChange("category", category.id, checked as boolean)}
                        className="data-[state=checked]:bg-[#21466D] data-[state=checked]:border-[#21466D]"
                      />
                      <label
                        htmlFor={`mobile-category-${category.id}`}
                        className="text-sm cursor-pointer flex-1 font-medium"
                      >
                        {i18n.language.startsWith('ru') ? category.name_ru : category.name_uz}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kafedras Filter */}
              <div className="space-y-3">
                <h4 className="font-semibold text-base text-[#21466D]">{t("common.kafedras")}</h4>
                <div className="space-y-3">
                  {kafedras.map((kafedra) => (
                    <div key={kafedra.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={`mobile-kafedra-${kafedra.id}`}
                        checked={selectedKafedras.includes(kafedra.id)}
                        onCheckedChange={(checked) => handleCheckboxChange("kafedra", kafedra.id, checked as boolean)}
                        className="data-[state=checked]:bg-[#21466D] data-[state=checked]:border-[#21466D]"
                      />
                      <label
                        htmlFor={`mobile-kafedra-${kafedra.id}`}
                        className="text-sm cursor-pointer flex-1 font-medium"
                      >
                        {i18n.language.startsWith('ru') ? kafedra.name_ru : kafedra.name_uz}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-white p-4 space-y-3">
              <div className="text-sm text-center text-muted-foreground">
                {filteredBooks.length} {t("common.totalBooksFound", { count: filteredBooks.length })}
              </div>
              <MagnetButton className="w-full">
                <Button
                  onClick={() => setShowMobileFilter(false)}
                  className="w-full bg-[#21466D] hover:bg-[#21466D]/90 text-white"
                >
                  {t("common.viewResults")}
                </Button>
              </MagnetButton>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Filter Sidebar */}
      <div className="hidden md:block w-1/4 py-4 space-y-6 sticky top-28 self-start h-fit">
        {/* Categories Filter */}
        <div className="flex flex-col justify-start items-start gap-2">
          <h3 className="font-semibold mb-2">{t("common.categories")}</h3>
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={(checked) => handleCheckboxChange("category", category.id, checked as boolean)}
              />
              <label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
                {i18n.language.startsWith('ru') ? category.name_ru : category.name_uz}
              </label>
            </div>
          ))}
        </div>

        {/* Kafedras Filter */}
        <div className="flex flex-col justify-start items-start gap-2">
          <h3 className="font-semibold mb-2">{t("common.kafedras")}</h3>
          {kafedras.map((kafedra) => (
            <div key={kafedra.id} className="flex items-center gap-2">
              <Checkbox
                id={`kafedra-${kafedra.id}`}
                checked={selectedKafedras.includes(kafedra.id)}
                onCheckedChange={(checked) => handleCheckboxChange("kafedra", kafedra.id, checked as boolean)}
              />
              <label htmlFor={`kafedra-${kafedra.id}`} className="text-sm cursor-pointer">
                {i18n.language.startsWith('ru') ? kafedra.name_ru : kafedra.name_uz}
              </label>
            </div>
          ))}
        </div>

        {/* Clear Filters */}
        {(selectedCategories.length > 0 || selectedKafedras.length > 0) && (
          <MagnetButton className="w-2/3">
            <Button variant="outline" onClick={clearAllFilters} className="w-full bg-transparent">
              {t("common.clearAll")}
            </Button>
          </MagnetButton>
        )}
      </div>

      {/* Books Grid */}
      <div className="w-full md:w-3/4 py-6 md:pl-6 md:border-l">
        {/* Results count - Desktop only */}
        <div className="mb-4 hidden md:block">
          <p className="text-sm text-muted-foreground">
            {t("common.totalBooksFound", { count: filteredBooks.length })}
          </p>
        </div>

        {bookItems.length === 0 ? (
          // 2-variant: umuman kitoblar yo‘q bo‘lsa
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-[30px] font-bold text-[#21466D]">{t("common.booksNotFound")}</h1>
            <p className="text-[15px] text-[#21466D] mb-4">Keyinroq urinib ko'ring</p>
          </div>
        ) : paginatedBooks.length === 0 ? (
          // 1-variant: filtr bo‘yicha kitob topilmasa
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">{t("common.noBooksMatchingFilters")}</p>
            <p className="text-sm text-muted-foreground">{t("common.tryOtherFilters")}</p>
          </div>
        ) : (
          // 3-variant: kitoblar mavjud bo‘lsa, grid ko‘rsatish
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6 mb-8 px-4 md:px-0">
            {paginatedBooks.map((book) => {
              const imageUrl = book.image?.url ? getFullImageUrl(book.image.url) : "/placeholder.svg"
              const isNew = book.bookItem?.Status?.id ? isBookNew(book.bookItem.Status.id) : false

              return (
                <Card
                  key={book.id}
                  onClick={() => isTokenyes(() => handleCardClick(book.id))}
                  className="group hover:shadow-xl transition-all duration-200 border border-[#21466D]/10 rounded-xl cursor-pointer hover:border-[#21466D]/20 h-full flex flex-col"
                >
                  <CardContent className="p-4 flex-grow">
                    <div className="relative mb-3 overflow-hidden rounded-lg">
                      <Image
                        src={(imageUrl as string) || "/placeholder.svg"}
                        alt={book.name}
                        width={150}
                        height={250}
                        className="w-full h-[200px] sm:h-[250px] md:h-[280px] lg:h-[300px]"
                      />
                      {isNew && (
                        <Badge className="absolute top-2 right-2 bg-[#ffc82a] text-[#21466D] text-xs">
                          {t("common.new")}
                        </Badge>
                      )}
                    </div>

                    <h3
                      className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-[#21466D] transition-colors"
                      title={book.name}
                    >
                      {book.name.length > 50 ? book.name.slice(0, 50) + "..." : book.name}
                    </h3>

                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <p>
                        {book.year}-{t("common.year")}
                      </p>
                      <p className="text-xs text-[#21466D]">
                        {t("common.author")}: {book.Auther?.name || t("common.unknown")}
                      </p>

                      {book.bookItem?.BookCategoryKafedras &&
                        Array.isArray(book.bookItem.BookCategoryKafedras) &&
                        book.bookItem.BookCategoryKafedras.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="secondary" className="text-xs bg-[#21466D]/10 text-[#21466D]">
                              {i18n.language.startsWith('ru') ? book.bookItem.BookCategoryKafedras[0].category.name_ru : book.bookItem.BookCategoryKafedras[0].category.name_uz}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-[#21466D]/20 text-[#21466D]">
                              {i18n.language.startsWith('ru') ? book.bookItem.BookCategoryKafedras[0].kafedra.name_ru : book.bookItem.BookCategoryKafedras[0].kafedra.name_uz}
                            </Badge>
                            {/* Show indicator if there are multiple combinations */}
                            {book.bookItem.BookCategoryKafedras.length > 1 && (
                              <Badge variant="outline" className="text-xs border-gray-300 text-gray-500">
                                +{book.bookItem.BookCategoryKafedras.length - 1}
                              </Badge>
                            )}
                          </div>
                        )}
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                    <MagnetButton className="w-full">
                      <Button
                        className="w-full bg-[#21466D] hover:bg-[#21466D]/90 text-white"
                        onClick={(e) => isTokenyes(() => addToCart(book))}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {t("common.addBookToCart")}
                      </Button>
                    </MagnetButton>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {paginatedBooks.length > 0 && totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination>
              <PaginationContent>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={i + 1 === currentPage}
                      onClick={() => setCurrentPage(i + 1)}
                      className={i + 1 === currentPage ? "bg-[#21466D] text-white" : ""}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterPage
