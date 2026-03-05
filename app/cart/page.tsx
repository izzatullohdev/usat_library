"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { postUserOrder, getUserOrders } from "@/lib/api"
import { getFullImageUrl } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import MagnetButton from "@/components/Magnet"

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

export default function CartPage() {
  const { t, i18n } = useTranslation()
  const [cartItems, setCartItems] = useState<EnrichedBook[]>([]) // Use EnrichedBook type
  const [selectedItems, setSelectedItems] = useState<string[]>([]) // Changed to string[] for book IDs
  const [isClient, setIsClient] = useState(false)
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem("id")
    if (!userId) return // agar user login qilmagan bo‘lsa, hech nima ko‘rsatmaymiz
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    const userCart = cart.filter((item: any) => item.userId === userId)
    setCartItems(userCart)
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const truncateDescription = (text: string, maxLength = 30) => {
    if (!text) return t("common.descriptionNotAvailable")
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  const handleCardClick = (bookId: string, e: React.MouseEvent) => {
    // Changed to string
    // Prevent navigation if clicking on checkbox or delete button
    const target = e.target as any
    if (target.type === "checkbox" || target.closest("button")) {
      return
    }
    router.push(`/book/${bookId}`)
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(cartItems.map((item) => item.id))
    }
  }

  const toggleItemSelection = (id: string) => {
    // Changed to string
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]))
  }

  const confirmRemoveFromCart = (bookId: string) => {
    // Changed to string
    const updatedCart = cartItems.filter((item) => item.id !== bookId)
    setCartItems(updatedCart)
    setSelectedItems((prev) => prev.filter((id) => id !== bookId))
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    window.dispatchEvent(new Event("storage"))
    toast.success(t("common.bookRemovedFromCart"))
  }

  const placeOrder = async () => {
    if (selectedItems.length === 0) {
      toast.warning(t("common.selectAtLeastOneBook"))
      return
    }
    setIsLoadingOrder(true)
    const userId = localStorage.getItem("id")
    if (!userId) {
      toast.warning(t("common.loginRequired"))
      router.push("/login")
      setIsLoadingOrder(false)
      return
    }
    try {
      const userOrdersResponse = (await getUserOrders()) as any
      // Handle different response structures - ensure we get an array
      let userOrders: any[] = []
      if (Array.isArray(userOrdersResponse)) {
        userOrders = userOrdersResponse
      } else if (userOrdersResponse?.data) {
        userOrders = Array.isArray(userOrdersResponse.data) ? userOrdersResponse.data : []
      }

      // Tanlangan kitoblarni avval buyurtma qilinganmi tekshirish
      for (const selectedBookId of selectedItems) {
        const alreadyOrdered = userOrders.some((order: any) => {
          return (
            order.user_id === userId && order.book_id === selectedBookId && ![6, 8].includes(order.status_id) // status_id 6 yoki 8 bo'lmasa (ya'ni, bekor qilinmagan yoki tugallanmagan bo'lsa)
          )
        })
        // Agar kitob allaqachon buyurtma qilingan bo'lsa, ogohlantirish beramiz
        if (alreadyOrdered) {
          // <--- O'ZGARTIRILGAN QATOR
          const bookName = cartItems.find((item) => item.id === selectedBookId)?.name || selectedBookId
          toast.warning(t("common.bookAlreadyOrdered", { bookName: bookName }))
          setIsLoadingOrder(false)
          return // Jarayonni to'xtatamiz
        }
      }

      // Har bir tanlangan kitob uchun post yuboramiz
      const successfulOrders: string[] = []
      const failedOrders: Array<{ bookId: string; error: any }> = []

      await Promise.allSettled(
        selectedItems.map(async (bookId) => {
          try {
            await postUserOrder(bookId as any)
            successfulOrders.push(bookId)
          } catch (err: any) {
            // Handle 409 Conflict (buyurtma allaqachon mavjud)
            if (err?.response?.status === 409 || err?.statusCode === 409) {
              const bookName = cartItems.find((item) => item.id === bookId)?.name || bookId
              toast.warning(t("common.bookAlreadyOrdered", { bookName }))
              // 409 xatolik - bu normal, kitob allaqachon buyurtma qilingan
              // Savatdan olib tashlaymiz, lekin xatolik deb ko'rsatmaymiz
              successfulOrders.push(bookId)
            } else {
              // Boshqa xatoliklar
              failedOrders.push({ bookId, error: err })
              const bookName = cartItems.find((item) => item.id === bookId)?.name || bookId
              toast.error(`${bookName}: ${t("common.errorPlacingOrder")}`)
            }
          }
        }),
      )

      // Muvaffaqiyatli buyurtmalarni savatdan olib tashlaymiz
      if (successfulOrders.length > 0) {
        const remainingCart = cartItems.filter((item) => !successfulOrders.includes(item.id))
        setCartItems(remainingCart)
        const remainingSelected = selectedItems.filter((id) => !successfulOrders.includes(id))
        setSelectedItems(remainingSelected)
        localStorage.setItem("cart", JSON.stringify(remainingCart))
        window.dispatchEvent(new Event("storage"))

        if (successfulOrders.length === selectedItems.length) {
          toast.success(t("common.orderPlacedSuccessfully"))
        } else if (successfulOrders.length > 0) {
          toast.success(
            `${successfulOrders.length} ${successfulOrders.length === 1 ? t("common.selectedBooks").slice(0, -1) : t("common.selectedBooks")} ${t("common.orderPlacedSuccessfully").toLowerCase()}`
          )
        }
      }

      if (successfulOrders.length === 0 && failedOrders.length > 0) {
        // Error toasts already shown per item
      }
    } catch {
      toast.error(t("common.errorPlacingOrder"))
    } finally {
      setIsLoadingOrder(false)
    }
  }

  const clearCart = () => {
    setCartItems([])
    setSelectedItems([])
    localStorage.setItem("cart", JSON.stringify([]))
    window.dispatchEvent(new Event("storage"))
    toast.success(t("common.cartCleared"))
  }

  if (!isClient) return null

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 mt-10">
        <div className="text-center animate-fade-in">
          <ShoppingBag className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-2 text-[#21466D]">{t("common.cartEmpty")}</h1>
          <p className="text-muted-foreground mb-8">{t("common.noBooksInCart")}</p>
          <Link href="/">
            <MagnetButton>
              <Button className="bg-[#21466D] text-white hover:bg-[#21466D]/90">{t("common.viewBooks")}</Button>
            </MagnetButton>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-10">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#21466D]">{t("common.cart")}</h1>
          <div className="flex justify-center items-center gap-5 p-5">
            <input
              type="checkbox"
              checked={selectedItems.length === cartItems.length}
              onChange={toggleSelectAll}
              className="accent-[#21466D] w-5 h-5"
            />
            <p className="text-sm text-[#21466D]">{t("common.selectAll")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <MagnetButton>
            <Button variant="destructive" onClick={clearCart}>
            {t("common.clearCart")}
          </Button>
          </MagnetButton>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((book, index) => (
            <Card
              key={book.id}
              className="animate-slide-up p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-[#21466D]/20"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={(e) => handleCardClick(book.id, e)}
            >
              <div className="flex gap-4 flex-col sm:flex-row">
                {" "}
                {/* Added flex-col for mobile */}
                <input
                  type="checkbox"
                  checked={selectedItems.includes(book.id)}
                  onChange={() => toggleItemSelection(book.id)}
                  className="mt-2 accent-[#21466D] w-5 h-5 self-start sm:self-auto"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="w-full sm:w-28 h-40 flex-shrink-0">
                  {" "}
                  {/* Adjusted width for mobile */}
                  <img
                    src={getFullImageUrl(book.image?.url) || "/placeholder.svg"}
                    alt={book.name}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-xl mb-2 text-[#21466D] hover:text-[#21466D]/80 transition-colors">
                    {book.name}
                  </h3>
                  <p
                    className="text-sm text-gray-600 mb-1 cursor-pointer"
                    title={book.description || t("common.descriptionNotAvailable")}
                  >
                    {truncateDescription(book.description)}
                  </p>
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    <p>
                      {book.page} {t("common.page")}
                    </p>
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
                                                  {book.bookItem.BookCategoryKafedras[0].category[`name_${i18n.language.slice(0, 2)}`]}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs border-[#21466D]/20 text-[#21466D]">
                                                  {book.bookItem.BookCategoryKafedras[0].kafedra[`name_${i18n.language.slice(0, 2)}`]}
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
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    confirmRemoveFromCart(book.id)
                  }}
                  className="text-destructive hover:text-destructive self-end sm:self-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <div className="lg:col-span-1">
          <Card className="sticky top-28 animate-scale-in">
            <CardHeader>
              <CardTitle>{t("common.orderSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>{t("common.selectedBooks")}:</span>
                <span className="font-semibold">
                  {selectedItems.length} {t("common.countUnit")}
                </span>
              </div>
              <div className="border-t pt-4">
                <MagnetButton className="w-full">
                  <Button
                  onClick={placeOrder}
                  disabled={isLoadingOrder || selectedItems.length === 0}
                  className="px-8 py-6 w-full text-white hover:!bg-white hover:text-[#21466D]"
                  style={{
                    border: "1px solid",
                    backgroundColor: "#21466D",
                  }}
                >
                  {isLoadingOrder ? t("common.placingOrder") : t("common.placeOrder")}
                </Button>
                </MagnetButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
