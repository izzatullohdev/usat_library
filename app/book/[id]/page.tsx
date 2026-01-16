"use client"
export const dynamicParams = true // ✅ bu yerda bo‘lishi kerak

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Eye,
  ShoppingCart,
  BookOpen,
  User,
  Calendar,
  Building,
  Globe,
  Hash,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Languages,
  Type,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { getBookItems } from "@/lib/api"
import { getFullImageUrl } from "@/lib/utils"
import { useMediaQuery } from "@/lib/hooks/useMediaQuery"
import { useTranslation } from "react-i18next"
import Link from "next/link"

// Define the EnrichedBook interface to match the new data structure
interface EnrichedBook {
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
    url: string
  }
  bookItem: {
    id: string
    book_id: string
    language_id: string
    alphabet_id: string
    status_id: number
    pdf_id: string
    createdAt: string
    updatedAt: string
    kafedra_id: string | null
    PDFFile: {
      id: string
      file_url: string
      original_name: string
      file_size: number
    }
    BookCategoryKafedras: {
      category_id: string
      kafedra_id: string
      category: {
      [key: string]: any;
        id: string
        name_uz: string
        name_ru: string
      }
      kafedra: {
      [key: string]: any;
        id: string
        name_uz: string
        name_ru: string
      }
    }[]
    Language: {
      id: string
      name: string
    }
    Alphabet: {
      id: string
      name: string
    }
    Status: {
      id: string
      name: string
    }
  }
}

export default function BookDetailPageClient() {
  const { t, i18n } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  const [book, setBook] = useState<EnrichedBook | null>(null)
  const [allEnrichedBooks, setAllEnrichedBooks] = useState<EnrichedBook[]>([]) // Store all enriched books for related books
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const swiperRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        setLoading(true)
        const bookItemsResponse = (await getBookItems()) as any
        const bookItemsData = bookItemsResponse.data?.data || []

        // Transform all bookItemsData into EnrichedBook structure
        const enrichedBooksList: EnrichedBook[] = bookItemsData.map((item: any) => ({
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
        setAllEnrichedBooks(enrichedBooksList) // Store all for related books

        // Find the current book
        const currentBook = enrichedBooksList.find((b) => b.id === bookId)
        if (currentBook) {
          setBook(currentBook)
        } else {
          toast.error(t("common.bookNotFound"))
          router.push("/")
        }
      } catch (err) {
        console.error("Kitob ma'lumotlarini olishda xatolik:", err)
        toast.error(t("common.errorFetchingBook"))
        router.push("/")
      } finally {
        setLoading(false)
      }
    }
    fetchBookData()
  }, [bookId, router, t])

  const addToCart = (selectedBook?: EnrichedBook) => {
    const targetBook = selectedBook || book
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

  const openPDF = () => {
    if (book?.bookItem?.PDFFile?.file_url) {
      window.open(book.bookItem.PDFFile.file_url, "_blank")
    } else {
      toast.warning(t("common.pdfNotAvailable"))
    }
  }

  const downloadPDF = () => {
    if (book?.bookItem?.PDFFile?.file_url) {
      const downloadUrl = book.bookItem.PDFFile.file_url
      const filename = book.bookItem.PDFFile.original_name || `${book.name}.pdf`

      // HTML content that triggers download and auto-closes tab
      const downloadPage = `
        <html>
          <body>
            <a id="dl" href="${downloadUrl}" download="${filename}"></a>
            <script>
              document.getElementById("dl").click();
              setTimeout(() => window.close(), 1000);
            </script>
          </body>
        </html>
      `

      // Open new tab
      const newWindow = window.open()
      if (newWindow) {
        newWindow.document.write(downloadPage)
        newWindow.document.close()
      }

      toast.success(t("common.pdfDownloading"))
    } else {
      toast.warning(t("common.pdfNotAvailable"))
    }
  }

  // Get related books (exclude current book)
  const getRelatedBooks = () => {
    // Hozirgi kitobni exclude qilish
    const otherBooks = allEnrichedBooks.filter((b) => b.id !== bookId)
    if (otherBooks.length === 0) return []

    // Hozirgi kitobning kategoriya va kafedra ma'lumotlari
    const currentCategories = book?.bookItem?.BookCategoryKafedras?.map((item) => item.category?.id) || []
    const currentKafedras = book?.bookItem?.BookCategoryKafedras?.map((item) => item.kafedra?.id) || []

    // Birinchi navbatda bir xil kategoriya va kafedradagi kitoblar
    const sameCategoryAndKafedra = otherBooks.filter((relatedBook) => {
      const bookCategories = relatedBook.bookItem?.BookCategoryKafedras?.map((item) => item.category?.id) || []
      const bookKafedras = relatedBook.bookItem?.BookCategoryKafedras?.map((item) => item.kafedra?.id) || []

      // Check if there's any overlap in both categories and kafedras
      const hasCommonCategory = bookCategories.some((cat) => currentCategories.includes(cat))
      const hasCommonKafedra = bookKafedras.some((kaf) => currentKafedras.includes(kaf))

      return hasCommonCategory && hasCommonKafedra
    })

    // Ikkinchi navbatda bir xil kategoriyali kitoblar
    const sameCategoryBooks = otherBooks.filter((relatedBook) => {
      const bookCategories = relatedBook.bookItem?.BookCategoryKafedras?.map((item) => item.category?.id) || []
      const hasCommonCategory = bookCategories.some((cat) => currentCategories.includes(cat))
      return hasCommonCategory && !sameCategoryAndKafedra.includes(relatedBook)
    })

    // Uchinchi navbatda bir xil kafedradagi kitoblar
    const sameKafedraBooks = otherBooks.filter((relatedBook) => {
      const bookKafedras = relatedBook.bookItem?.BookCategoryKafedras?.map((item) => item.kafedra?.id) || []
      const hasCommonKafedra = bookKafedras.some((kaf) => currentKafedras.includes(kaf))
      return (
        hasCommonKafedra && !sameCategoryAndKafedra.includes(relatedBook) && !sameCategoryBooks.includes(relatedBook)
      )
    })

    // Qolgan kitoblar
    const otherRelatedBooks = otherBooks.filter((relatedBook) => {
      return (
        !sameCategoryAndKafedra.includes(relatedBook) &&
        !sameCategoryBooks.includes(relatedBook) &&
        !sameKafedraBooks.includes(relatedBook)
      )
    })

    // Tartib bo'yicha birlashtirish va 12 taga cheklash
    const relatedBooksList = [
      ...sameCategoryAndKafedra,
      ...sameCategoryBooks,
      ...sameKafedraBooks,
      ...otherRelatedBooks,
    ].slice(0, 12)

    return relatedBooksList
  }

  const relatedBooks = getRelatedBooks()

  // Mobile uchun 1 ta, desktop uchun 4 ta
  const itemsPerSlide = isMobile ? 1 : 4
  const slidesCount = Math.ceil(relatedBooks.length / itemsPerSlide)

  // Auto-play swiper
  useEffect(() => {
    if (!isDragging && relatedBooks.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slidesCount)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [slidesCount, isDragging, relatedBooks.length])

  // Touch/Mouse handlers for swiper
  const handleStart = (clientX: number) => {
    setIsDragging(true)
    setStartX(clientX)
    setCurrentX(clientX)
  }

  const handleMove = (clientX: number) => {
    if (!isDragging) return
    setCurrentX(clientX)
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    const diff = startX - currentX
    const threshold = 50
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left - next slide
        setCurrentSlide((prev) => (prev + 1) % slidesCount)
      } else {
        // Swipe right - previous slide
        setCurrentSlide((prev) => (prev - 1 + slidesCount) % slidesCount)
      }
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slidesCount)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slidesCount) % slidesCount)
  }

  const handleBookClick = (bookId: string) => {
    router.push(`/book/${bookId}`)
  }

  // Kitob nomini kesish funksiyasi
  const truncateBookName = (name: string, maxLength = 20) => {
    if (name.length <= maxLength) return name
    return name.slice(0, maxLength) + "..."
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">{t("common.loadingBooks")}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("common.bookNotFound")}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/">
        <Button variant="ghost" className="mb-6 bg-[#21466D] hover:bg-[#21466D]/10 text-[white]">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>
      </Link>

      <div className="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-8">
        {/* Book Image */}
        <div className="lg:col-span-1 h-full">
          <Card className="border-[#21466D]/10 h-full">
            <CardContent className="p-6">
              <div className="aspect-[3/4] overflow-hidden rounded-lg mb-11">
                <Image
                  src={book.image?.url ? getFullImageUrl(book.image.url) : "/placeholder.svg"}
                  alt={book.name}
                  width={300}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center mb-4">
                {book.book_count > 0 ? (
                  <p className="text-lg font-semibold text-[#21466D]">
                    {t("common.available")}: {book.book_count}
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-red-500">{t("common.outOfStock")}</p>
                )}
              </div>
              {/* Action Buttons */}
              <div className="space-y-3">
                {book.bookItem?.PDFFile?.file_url ? ( // Check for file_url existence
                  <>
                    <Button
                      variant="outline"
                      onClick={openPDF}
                      className="w-full hover:bg-[#21466D]/10 transition-all bg-transparent border-[#21466D]/20 text-[#21466D]"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t("common.onlineRead")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadPDF}
                      className="w-full hover:bg-[#21466D]/10 transition-all bg-transparent border-[#21466D]/20 text-[#21466D]"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t("common.downloadPdf")}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed">
                    <FileText className="h-4 w-4 mr-2" />
                    {t("common.pdfNotAvailable")}
                  </Button>
                )}
                {book.book_count > 0 && (
                  <Button
                    className="w-full bg-[#21466D] hover:bg-[#21466D]/90 text-white mb-10"
                    onClick={() => addToCart()}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {t("common.addToCart")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Book Details */}
        <div className="lg:col-span-2 gap-5 flex justify-between items-center flex-col w-full">
          {/* Main Info */}
          <Card className="border-[#21466D]/10 w-full">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl text-[#21466D]">{book.name}</CardTitle>
              <div className="flex flex-wrap gap-2">
                {book.bookItem?.BookCategoryKafedras && book.bookItem.BookCategoryKafedras.length > 0 && (
                  <>
                    {/* Display all categories */}
                    {book.bookItem.BookCategoryKafedras.map((item, index) => (
                      <Badge key={`category-${index}`} variant="secondary" className="bg-[#21466D]/10 text-[#21466D]">
                        {item.category[`name_${i18n.language}` as keyof typeof item.category]}
                      </Badge>
                    ))}
                    {/* Display all kafedras */}
                    {book.bookItem.BookCategoryKafedras.map((item, index) => (
                      <Badge key={`kafedra-${index}`} variant="outline" className="border-[#21466D]/20 text-[#21466D]">
                        {item.kafedra[`name_${i18n.language}` as keyof typeof item.kafedra]}
                      </Badge>
                    ))}
                  </>
                )}
                <Badge variant="outline" className="border-[#21466D]/20 text-[#21466D]">
                  {book.year}-{t("common.year")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">{book.description}</p>
            </CardContent>
          </Card>

          {/* Detailed Information */}
          <Card className="border-[#21466D]/10 w-full">
            <CardHeader>
              <CardTitle className="text-xl text-[#21466D]">{t("common.bookInfo")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-[#21466D]" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.author")}</p>
                      <p className="font-medium text-[#21466D]">{book.Auther?.name || t("common.unknown")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-[#21466D]" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.publishYear")}</p>
                      <p className="font-medium text-[#21466D]">{book.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-[#21466D]" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.pageCount")}</p>
                      <p className="font-medium text-[#21466D]">
                        {book.page} {t("common.page")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {book.bookItem?.BookCategoryKafedras && book.bookItem.BookCategoryKafedras.length > 0 && (
                    <>
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-[#21466D]" />
                        <div>
                          <p className="text-sm text-muted-foreground">{t("common.department")}</p>
                          <div className="flex flex-wrap gap-1">
                            {book.bookItem.BookCategoryKafedras.map((item, index) => (
                              <span key={index} className="font-medium text-[#21466D] text-sm">
                                {item.kafedra[`name_${i18n.language}` as keyof typeof item.kafedra]}
                                {index < book.bookItem.BookCategoryKafedras.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-[#21466D]" />
                        <div>
                          <p className="text-sm text-muted-foreground">{t("common.category")}</p>
                          <div className="flex flex-wrap gap-1">
                            {book.bookItem.BookCategoryKafedras.map((item, index) => (
                              <span key={index} className="font-medium text-[#21466D] text-sm">
                                {item.category[`name_${i18n.language}` as keyof typeof item.category]}
                                {index < book.bookItem.BookCategoryKafedras.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {/* Language and Alphabet */}
                  {book.bookItem?.Language && (
                    <div className="flex items-center gap-3">
                      <Languages className="h-5 w-5 text-[#21466D]" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("common.language")}</p>
                        <p className="font-medium text-[#21466D]">{book.bookItem.Language.name}</p>
                      </div>
                    </div>
                  )}
                  {book.bookItem?.Alphabet && (
                    <div className="flex items-center gap-3">
                      <Type className="h-5 w-5 text-[#21466D]" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("common.alphabet")}</p>
                        <p className="font-medium text-[#21466D]">{book.bookItem.Alphabet.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Hash className="h-5 w-5 text-[#21466D]" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.bookId")}</p>
                      <p className="text-2xl font-bold text-[#21466D]">#{book.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="border-[#21466D]/10 w-full">
            <CardHeader>
              <CardTitle className="text-xl text-[#21466D]">{t("common.additionalInfo")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-lg bg-[#21466D]/5">
                  <p className="text-2xl font-bold text-[#21466D]">{book.page}</p>
                  <p className="text-sm text-muted-foreground">{t("common.page")}</p>
                </div>
                <div className="p-4 rounded-lg bg-[#21466D]/5">
                  <p className="text-2xl font-bold text-[#21466D]">{book.year}</p>
                  <p className="text-sm text-muted-foreground">{t("common.year")}</p>
                </div>
                <div className="p-4 rounded-lg bg-[#21466D]/5">
                  <p className="text-2xl font-bold text-[#21466D]">{book.books}</p>
                  <p className="text-sm text-muted-foreground">{t("common.copies")}</p>
                </div>
                <div className="p-4 rounded-lg bg-[#21466D]/5">
                  <p className="text-2xl font-bold text-[#21466D]">{book.book_count}</p>
                  <p className="text-sm text-muted-foreground">{t("common.mavjud")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Books Swiper */}
      {relatedBooks.length > 0 && (
        <div className="mt-12">
          <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-[#21466D]/10 hover:border-[#21466D]/20 h-auto flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-[#21466D]">
                  {book?.bookItem?.BookCategoryKafedras && book.bookItem.BookCategoryKafedras.length > 0
                    ? `${book.bookItem.BookCategoryKafedras[0].category[`name_${i18n.language}`] as string} ${t("common.relatedBooks")}`
                    : t("common.relatedBooks")}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevSlide}
                    className="border-[#21466D]/20 text-[#21466D] hover:bg-[#21466D]/10 bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextSlide}
                    className="border-[#21466D]/20 text-[#21466D] hover:bg-[#21466D]/10 bg-transparent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden">
                <div
                  ref={swiperRef}
                  className="flex transition-transform duration-500 ease-in-out cursor-grab active:cursor-grabbing"
                  style={{
                    transform: `translateX(-${currentSlide * 100}%)`,
                    ...(isDragging && { transitionDuration: "0ms" }),
                  }}
                  onMouseDown={(e) => handleStart(e.clientX)}
                  onMouseMove={(e) => handleMove(e.clientX)}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onTouchStart={(e) => handleStart(e.touches[0].clientX)}
                  onTouchMove={(e) => handleMove(e.touches[0].clientX)}
                  onTouchEnd={handleEnd}
                >
                  {Array.from({ length: slidesCount }).map((_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0">
                      <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-4"}`}>
                        {relatedBooks
                          .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                          .map((relatedBook) => (
                            <Card
                              key={relatedBook.id}
                              className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-[#21466D]/10 hover:border-[#21466D]/20 h-[420px] flex flex-col"
                              onClick={() => handleBookClick(relatedBook.id)}
                            >
                              <CardContent className="p-4 flex-col h-full">
                                <div className="aspect-[3/4] overflow-hidden rounded-lg mb-3 flex-shrink-0 max-h-[280px]">
                                  <Image
                                    src={
                                      relatedBook.image?.url
                                        ? getFullImageUrl(relatedBook.image.url)
                                        : "/placeholder.svg"
                                    }
                                    alt={relatedBook.name}
                                    width={150}
                                    height={250}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <div className="flex flex-col flex-grow">
                                  <h4
                                    className="font-semibold text-sm mb-2 group-hover:text-[#21466D] transition-colors truncate"
                                    title={relatedBook.name}
                                  >
                                    {truncateBookName(relatedBook.name, 40)}
                                  </h4>
                                  <div className="space-y-1 text-xs text-muted-foreground mb-3 flex-grow">
                                    <p>{relatedBook.Auther?.name || t("common.unknown")}</p>
                                    <p>
                                      {relatedBook.page} {t("common.page")} • {relatedBook.year}
                                    </p>
                                    {relatedBook.bookItem?.BookCategoryKafedras &&
                                      relatedBook.bookItem.BookCategoryKafedras.length > 0 && (
                                        <Badge variant="secondary" className="text-xs bg-[#21466D]/10 text-[#21466D]">
                                          {
                                            relatedBook.bookItem.BookCategoryKafedras[0].category[
                                              `name_${i18n.language}`
                                            ] as string
                                          }
                                        </Badge>
                                      )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Pagination Dots */}
              <div className="flex justify-center mt-6 gap-2">
                {Array.from({ length: slidesCount }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-[#21466D] scale-125" : "bg-[#21466D]/30 hover:bg-[#21466D]/60"}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
