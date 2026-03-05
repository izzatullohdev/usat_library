"use client"

import { useState, useEffect } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper/modules"
import { Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useMediaQuery } from "@/lib/hooks/useMediaQuery"
import { getFullImageUrl } from "@/lib/utils"
import { getBooks } from "@/lib/api"
import { useTranslation } from "react-i18next"
import Image from "next/image"
import type { BookData } from "@/types/index"
import { motion } from "framer-motion"

// Swiper stillarini import qilamiz
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

// Shadcn/ui komponentlarini import qilamiz
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import MagnetButton from "./Magnet"

interface SwipperProps {
  initialBooks?: BookData[]
}

// Swiper uchun skeleton komponenti
const SwiperCardSkeleton = () => (
  <Card className="group hover:shadow-xl transition-all duration-300 border border-[#21466D]/10 rounded-2xl h-[520px] flex flex-col justify-between animate-pulse overflow-hidden">
    <CardContent className="p-5 flex-grow flex flex-col max-sm:p-4 max-xs:p-3">
      <div className="relative mb-5 overflow-hidden rounded-xl bg-gradient-to-br from-gray-200 to-gray-300">
        <div className="w-full h-[300px] bg-gray-200 rounded-xl"></div>
      </div>
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 rounded-lg mb-3"></div>
        <div className="h-5 bg-gray-200 rounded-lg mb-4 w-3/4"></div>
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-gray-200 rounded-md w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded-md w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded-md w-2/3"></div>
        </div>
      </div>
    </CardContent>
  </Card>
)

// Title skeleton component
const TitleSkeleton = () => (
  <div className="container mx-auto px-4 py-8 text-start max-w-[1800px]">
    <div className="h-14 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-72 animate-pulse max-sm:h-12 max-sm:w-56 max-xs:h-10 max-xs:w-48"></div>
  </div>
)

export default function Swipper({ initialBooks }: SwipperProps) {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1023px)")
  const [books, setBooks] = useState<BookData[]>(initialBooks || [])
  const [loading, setLoading] = useState(!initialBooks)

  useEffect(() => {
    const fetchData = async () => {
      if (initialBooks && initialBooks.length > 0) {
        setBooks(initialBooks)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const booksResponse = (await getBooks()) as any
        const booksArray = booksResponse.data?.data || []
        const parsedBooks: BookData[] = Array.isArray(booksArray) ? booksArray : []
        setBooks(parsedBooks)
      } catch {
        setBooks([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [initialBooks, t])

  // Eng oxirgi 6 ta kitobni olish
const lastSixBooks: BookData[] = books.slice(-6)

// Agar loop uchun duplicatsiya kerak bo‘lsa
const duplicatedBooks = lastSixBooks.length > 0 ? [...lastSixBooks] : []

  const handleCardClick = (bookId: string) => {
    router.push(`/book/${bookId}`)
  }

  const isTokenyes = (callback: () => void) => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast.warning(t("common.loginRequired"))
      router.push("/login")
    } else {
      callback()
    }
  }

  const getSkeletonCount = () => {
    if (isMobile) return 1
    if (isTablet) return 2
    return 4
  }

  return (
    <div className="w-full mx-auto px-4 py-4 max-w-[1920px] ">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full mx-auto max-w-[1800px]"
      >
        <div className="relative px-4">
          <Swiper
            slidesPerView={1}
            spaceBetween={20}
            autoplay={{
              delay: 4500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            modules={[Autoplay, Pagination]}
            loop={duplicatedBooks.length > 0}
            className="book-swiper"
            breakpoints={{
              320: {
                slidesPerView: 1,
                spaceBetween: 16,
              },
              480: {
                slidesPerView: 1.4,
                spaceBetween: 16,
              },
              640: {
                slidesPerView: 1.9,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 2.9,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3.9,
                spaceBetween: 24,
              },
              1280: {
                slidesPerView: 3.9,
                spaceBetween: 24,
              },
              1536: {
                slidesPerView: 4.2,
                spaceBetween: 28,
              },
            }}
          >
            {loading
              ? Array.from({ length: getSkeletonCount() }).map((_, index) => (
                  <SwiperSlide key={`skeleton-${index}`}>
                    <SwiperCardSkeleton />
                  </SwiperSlide>
                ))
              : duplicatedBooks.map((book, index) => {
                  const isNew = true
                  return (
                    <SwiperSlide key={`${book.Book.id}-${index}`}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeInOut", delay: index * 0.1 }}
                        className="h-full"
                      >
                        <Card
                          className="group transition-all duration-500 border border-[#21466D]/10
                                     rounded-2xl cursor-pointer hover:border-[#21466D]/30
                                     flex flex-col justify-between hover:scale-[1.02] transform
                                     bg-white/80 backdrop-blur-sm hover:bg-white overflow-hidden
                                     h-[480px]" // Increased fixed height for better content spacing
                        >
                          <CardContent className="p-4 flex-grow flex flex-col">
                            <div
                              className="relative mb-2 overflow-hidden rounded-xl transition-all duration-500
                                             bg-gradient-to-br from-gray-50 to-gray-100 group-hover:shadow-lg"
                            >
                              <div className="relative w-full h-[440px] overflow-hidden">
                                <Image
                                  src={
                                    getFullImageUrl(book.Book.image?.url) ||
                                    "/placeholder.svg?height=400&width=300&query=book cover" ||
                                    "/placeholder.svg" ||
                                    "/placeholder.svg" ||
                                    "/placeholder.svg"
                                  }
                                  alt={book.Book.name}
                                  fill
                                  className="object-contain object-center duration-500 group-hover:scale-105"
                                  loading="lazy"
                                />

                                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10">
                                  <div className="absolute bottom-4 left-4 right-4">
                                    <h4
                                      className="font-bold text-white text-xl line-clamp-2 drop-shadow-lg"
                                    >
                                      {book.Book.name
                                        .split(/[:\s]+/)
                                        .slice(0, 4)
                                        .join(" ")}
                                      {book.Book.name.split(/[:\s]+/).length > 4 ? "..." : ""}
                                    </h4>
                                  </div>
                                </div>

                                <div
                                  className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 
                                               transition-all duration-500 flex flex-col items-center justify-center z-20 w-full"
                                >
                                  <div
                                    className="text-center w-full text-white p-4 transform translate-y-4 
                                                 group-hover:translate-y-0 transition-all duration-500 delay-100"
                                  >
                                    <div className="space-y-2 text-sm mb-6">
                                      <p className="font-medium">
                                        {t("common.author")}: {book.Book.Auther?.name || t("common.unknown")}
                                      </p>
                                      <p className="font-medium">
                                        {t("common.year")}: {book.Book.year}
                                      </p>
                                      <p className="font-medium">
                                        {book.Book.page} {t("common.page")}
                                      </p>
                                    </div>

                                    <MagnetButton className="w-full ">
                                      <Button
                                        className="w-full bg-gradient-to-r from-[#21466D] to-[#4A90E2] text-white
                                                  hover:from-white hover:to-white font-bold border-0
                                                  hover:border-2 hover:border-[#21466D] hover:text-[#21466D]
                                                  flex items-center justify-center gap-2 transition-all duration-500
                                                  rounded-xl shadow-lg hover:shadow-xl text-sm sm:text-xs h-10"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          isTokenyes(() => handleCardClick(book.Book.id))
                                        }}
                                      >
                                        <Info className="h-4 w-4 sm:h-3 sm:w-3 transition-transform group-hover:rotate-12" />
                                        {t("common.details")}
                                      </Button>
                                    </MagnetButton>
                                  </div>
                                </div>
                              </div>

                              {isNew && (
                                <Badge
                                  className="absolute top-3 right-3 bg-gradient-to-r from-[#ffc82a] to-[#ffb700]
                                                   text-[#21466D] text-xs font-bold shadow-lg border-0 px-2 py-1 z-30"
                                >
                                  {t("common.new")}
                                </Badge>
                              )}
                            </div>

                           
                          </CardContent>
                        </Card>
                      </motion.div>
                    </SwiperSlide>
                  )
                })}
          </Swiper>
        </div>
      </motion.div>

      <style jsx global>{`
        .book-swiper {
          padding: 25px 0 50px 0 !important;
          overflow-x: hidden;
        }

        .book-swiper .swiper-pagination {
          bottom: 15px !important;
          text-align: center;
        }

        .book-swiper .swiper-pagination-bullet {
          background: linear-gradient(135deg, #21466D, #4A90E2);
          opacity: 0.4;
          width: 10px;
          height: 10px;
          margin: 0 6px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .book-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          transform: scale(1.3);
          box-shadow: 0 4px 12px rgba(33, 70, 109, 0.4);
        }

        .book-swiper .swiper-slide {
          height: auto;
          display: flex;
        }

        .book-swiper .swiper-slide > div {
          width: 100%;
          height: 100%;
        }

        /* Smooth scrolling */
        .book-swiper .swiper-wrapper {
          transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .book-swiper {
            padding: 20px 0 45px 0 !important;
          }

          .book-swiper .swiper-pagination-bullet {
            width: 8px;
            height: 8px;
            margin: 0 4px;
          }
        }

        @media (max-width: 640px) {
          .book-swiper {
            padding: 18px 0 40px 0 !important;
          }

          .book-swiper .swiper-pagination-bullet {
            width: 7px;
            height: 7px;
            margin: 0 3px;
          }
        }

        @media (max-width: 480px) {
          .book-swiper {
            padding: 15px 0 35px 0 !important;
          }

          .book-swiper .swiper-pagination {
            bottom: 12px !important;
          }
        }

        @media (max-width: 320px) {
          .book-swiper {
            padding: 12px 0 30px 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
