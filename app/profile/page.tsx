"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  User,
  LogOut,
  BookOpen,
  ShoppingBag,
  Menu,
  ChevronDown,
  ChevronUp,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Globe,
  Filter,
  Tag,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/store/auth"
import { getUserOrders, getBookItems } from "@/lib/api"
import Image from "next/image"
import { getFullImageUrl } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Order {
  id: string
  user_id: string
  book_id: string
  book_code: string | null
  status_id: number
  created_at: string
  finished_at: string | null
  taking_at: string | null
  User: {
    id: string
    full_name: string
    phone: string
    telegram_id: string | null
  }
  Book: {
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
  }
  status_message: string
}

interface BookItem {
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
  Book: {
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
  }
}

interface EnrichedOrder extends Order {
  bookDetail?: Order["Book"]
  bookItem?: BookItem
}

interface CategoryFromOrders {
  id: string
  name_uz: string
  name_ru: string
  count: number // How many orders have this category
}

interface KafedraFromOrders {
  id: string
  name_uz: string
  name_ru: string
  count: number // How many orders have this kafedra
}

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState("buyurtmalar")
  const [mobileView, setMobileView] = useState<"menu" | "content">("menu")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState<string[]>([])
  const [profile, setProfile] = useState({
    fullname: "",
    phone: "",
    direction: "",
    group: "",
  })
  const [orders, setOrders] = useState<EnrichedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language)
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  const [categoriesFromOrders, setCategoriesFromOrders] = useState<CategoryFromOrders[]>([])
  const [kafedrasFromOrders, setKafedrasFromOrders] = useState<KafedraFromOrders[]>([])

  const showNotification = (message: string) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 3000)
  }

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Check authentication on mount and when token changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/")
        return false
      }
      return true
    }

    // Check on mount
    if (!checkAuth()) {
      return // If no token, redirect will happen
    }

    // Poll for token changes (for same-tab logout)
    // This checks every 500ms if token still exists
    const authCheckInterval = setInterval(() => {
      const token = localStorage.getItem("token")
      if (!token) {
        clearInterval(authCheckInterval)
        router.push("/")
      }
    }, 500) // Check every 500ms

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" && !e.newValue) {
        clearInterval(authCheckInterval)
        router.push("/")
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(authCheckInterval)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [router])

  useEffect(() => {
    setIsClient(true)
    setProfile({
      fullname: localStorage.getItem("fullname") || "",
      phone: localStorage.getItem("phone") || "",
      direction: "",
      group: "",
    })
    fetchData()
    setCurrentLanguage(i18n.language)
  }, [i18n.language])

  const fetchData = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem("id")
      if (!userId) {
        router.push("/login")
        return
      }

      const [ordersData, bookItemsData] = (await Promise.all([getUserOrders(), getBookItems()])) as any

      const userOrders = ordersData.data.filter((order: Order) => order.user_id === userId)

      if (userOrders.length > 0 && userOrders[0].User) {
        setProfile((prev) => ({
          ...prev,
          fullname: userOrders[0].User.full_name || prev.fullname,
          phone: userOrders[0].User.phone || prev.phone,
        }))
      } else {
        setProfile((prev) => ({
          ...prev,
          fullname: localStorage.getItem("fullname") || "",
          phone: localStorage.getItem("phone") || "",
        }))
      }

      const enrichedOrders: EnrichedOrder[] = userOrders.map((order: Order) => {
        const bookItem = bookItemsData.data.find((item: BookItem) => item.book_id === order.book_id)
        return {
          ...order,
          bookDetail: bookItem?.Book,
          bookItem: bookItem,
        }
      })
      setOrders(enrichedOrders)

      extractCategoriesAndKafedras(enrichedOrders)
    } catch (error) {
      // Error logging - could use logger utility here if needed
      console.error("Ma'lumotlarni olishda xatolik:", error)
      toast.error(t("common.errorFetchingData"))
    } finally {
      setLoading(false)
    }
  }

 const extractCategoriesAndKafedras = (enrichedOrders: EnrichedOrder[]) => {
  const categoryMap = new Map<string, CategoryFromOrders>()
  const kafedraMap = new Map<string, KafedraFromOrders>()

  enrichedOrders.forEach((order) => {
    if (order.bookItem?.BookCategoryKafedras) {
      order.bookItem.BookCategoryKafedras.forEach((item) => {
        const { category, kafedra } = item

        // Count categories
        if (category) {
          const existing = categoryMap.get(category.id)
          if (existing) {
            existing.count += 1
          } else {
            categoryMap.set(category.id, {
              id: category.id,
              name_uz: category.name_uz,
              name_ru: category.name_ru,
              count: 1,
            })
          }
        }

        // Count kafedras
        if (kafedra) {
          const existing = kafedraMap.get(kafedra.id)
          if (existing) {
            existing.count += 1
          } else {
            kafedraMap.set(kafedra.id, {
              id: kafedra.id,
              name_uz: kafedra.name_uz,
              name_ru: kafedra.name_ru,
              count: 1,
            })
          }
        }
      })
    }
  })

  return { categoryMap, kafedraMap }
}


  const handleSave = () => {
    const storedFullname = localStorage.getItem("full_name")
    const storedPhone = localStorage.getItem("phone")
    const isFullnameChanged = storedFullname !== profile.fullname
    const isPhoneChanged = storedPhone !== profile.phone

    if (isFullnameChanged) {
      localStorage.setItem("full_name", profile.fullname)
    }
    if (isPhoneChanged) {
      localStorage.setItem("phone", profile.phone)
    }

    if (isFullnameChanged || isPhoneChanged) {
      showNotification(t("common.infoSaved"))
    } else {
      showNotification(t("common.nothingChanged"))
    }
  }

  const handleLogout = async () => {
    // Import logout utility
    const { performLogout } = await import("@/lib/auth-utils")
    
    showNotification(t("common.loggedOut"))
    
    // Perform logout with redirect to home page
    await performLogout({
      redirectTo: "/",
      callServerLogout: false, // Set to true if backend supports logout endpoint
    })
  }

  const confirmLogout = () => {
    toast.custom((t_toast) => (
      <div className=" dark:bg-zinc-900  rounded-xl w-fit animate-in fade-in zoom-in flex flex-col gap-4">
        <div className="text-lg font-semibold text-[white] dark:text-white">{t("common.confirmLogout")}</div>
        <p className="text-sm text-[white]">{t("common.logoutMessage")}</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => toast.dismiss(t_toast)}
            className="px-4 py-2 rounded-lg border border-[white]/40 hover:bg-[#21466D]/10 text-[white] text-sm font-medium transition-all duration-200"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={() => {
              handleLogout()
              toast.dismiss(t_toast)
            }}
            className="px-4 py-2 rounded-lg bg-[white] text-[#1c3b5c] text-sm font-medium transition-all duration-200"
          >
            {t("common.yesLogout")}
          </button>
        </div>
      </div>
    ))
  }

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }

  const activeOrders = orders.filter((order) => order.status_id === 1 || order.status_id === 2)
  const archivedOrders = orders.filter((order) => order.status_id >= 3)

  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case 1:
        return "bg-[#21466D]"
      case 2:
        return "bg-blue-500"
      case 3:
        return "bg-green-500"
      case 4:
        return "bg-gray-400"
      case 5:
        return "bg-red-500"
      default:
        return "bg-[#21466D]"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language === "uz" ? "uz-UZ" : "ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    setCurrentLanguage(lang)
    localStorage.setItem("i18nextLng", lang)
  }

  const renderOrderCard = (order: EnrichedOrder) => {
    const isExpanded = expandedOrders.includes(order.id)
    const imageUrl = order.bookDetail?.image?.url ? getFullImageUrl(order.bookDetail.image.url) : "/placeholder.svg"
    return (
      <Card
        key={order.id}
        className="animate-slide-up border-[#21466D]/10 hover:border-[#21466D]/20 transition-all duration-200"
      >
        <CardContent className="p-0">
          <div className="p-4 border-b border-[#21466D]/10">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold max-md:text-md text-[#21466D] dark:text-white">
                {t("common.order")} #{order.id}
              </h3>
              <Badge
                className={`text-xs text-white w-fit max-md:text-[12px] flex justify-center items-center text-center ${getStatusColor(
                  order.status_id,
                )}`}
              >
                {t(`common.status.${order.status_id}`)}
              </Badge>
            </div>
            <div className="flex items-start gap-20">
              <Image
                src={(imageUrl as string) || "/placeholder.svg"}
                alt={order.Book.name}
                width={60}
                height={80}
                className="rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="font-medium text-[#21466D] dark:text-white mb-1">{order.Book.name}</h4>
                {order.bookDetail && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {t("common.author")}: {order.bookDetail.Auther?.name || t("common.unknown")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.bookDetail.year}-{t("common.year")} • {order.bookDetail.page} {t("common.page")}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 text-sm mb-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-[#21466D]/60 mt-0.5" />
                <div>
                  <span className="text-muted-foreground">{t("common.orderDate")}:</span>
                  <p className="font-medium text-[#21466D] dark:text-white">{formatDate(order.created_at)}</p>
                </div>
              </div>
              {order.taking_at && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">{t("common.takenDate")}:</span>
                    <p className="font-medium text-green-600">{formatDate(order.taking_at)}</p>
                  </div>
                </div>
              )}
              {order.finished_at && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-600 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">{t("common.returnedDate")}:</span>
                    <p className="font-medium text-gray-600">{formatDate(order.finished_at)}</p>
                  </div>
                </div>
              )}
              {order.book_code && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("common.note")}:</span>
                  <span className="ml-2 font-medium text-[#21466D] dark:text-white">{order.book_code}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {order.bookItem && (
                  <div className="flex flex-wrap gap-1">
                    {order.bookItem?.BookCategoryKafedras &&
                                           Array.isArray(order.bookItem.BookCategoryKafedras) &&
                                           order.bookItem.BookCategoryKafedras.length > 0 && (
                                             <div className="flex flex-wrap gap-1 mt-2">
                                               <Badge variant="secondary" className="text-xs bg-[#21466D]/10 text-[#21466D]">
                                                 {order.bookItem.BookCategoryKafedras[0].category[`name_${i18n.language.slice(0, 2)}`]}
                                               </Badge>
                                               <Badge variant="outline" className="text-xs border-[#21466D]/20 text-[#21466D]">
                                                 {order.bookItem.BookCategoryKafedras[0].kafedra[`name_${i18n.language.slice(0, 2)}`]}
                                               </Badge>
                                               {/* Show indicator if there are multiple combinations */}
                                               {order.bookItem.BookCategoryKafedras.length > 1 && (
                                                 <Badge variant="outline" className="text-xs border-gray-300 text-gray-500">
                                                   +{order.bookItem.BookCategoryKafedras.length - 1}
                                                 </Badge>
                                               )}
                                             </div>
                                           )}

                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleOrderExpansion(order.id)}
                className="text-[#21466D]/60 hover:text-[#21466D] hover:bg-[#21466D]/10"
              >
                {t("common.moreDetails")}
                {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
          {isExpanded && (
            <div className="border-t border-[#21466D]/10 bg-[#21466D]/5 p-4">
              <h4 className="font-medium mb-3 text-[#21466D] dark:text-white">{t("common.aboutBook")}:</h4>
              {order.bookDetail && (
                <div className="space-y-3">
                  <div className="p-3 bg-background rounded-lg border border-[#21466D]/10">
                    <p className="text-sm text-muted-foreground mb-2">{t("common.description")}:</p>
                    <p className="text-sm">{order.bookDetail.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background rounded-lg border border-[#21466D]/10">
                      <p className="text-xs text-muted-foreground">{t("common.booksCount")}</p>
                      <p className="font-medium text-[#21466D]">{order.bookDetail.books}</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg border-[#21466D]/10">
                      <p className="text-xs text-muted-foreground">{t("common.available")}</p>
                      <p className="font-medium text-[#21466D]">{order.bookDetail.book_count}</p>
                    </div>
                  </div>
                  {order.bookItem?.PDFFile?.file_url && (
                    <Button
                      onClick={() => window.open(order.bookItem!.PDFFile.file_url, "_blank")}
                      className="w-full bg-[#21466D] hover:bg-[#21466D]/90 text-white"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      {t("common.openPdf")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const menuItems = [
    { id: "buyurtmalar", label: t("common.activeOrders"), icon: ShoppingBag, count: activeOrders.length },
    { id: "malumotlar", label: t("common.personalInfo"), icon: User },
  ]

  const renderMobileMenu = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-[#21466D]/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <User className="h-10 w-10 text-[#21466D]" />
        </div>
        <h2 className="text-xl font-semibold text-[#21466D]">{profile.fullname || t("common.profile")}</h2>
        <p className="text-sm text-muted-foreground">{profile.phone}</p>
      </div>
      {menuItems.map((item) => {
        const Icon = item.icon
        return (
          <Card
            key={item.id}
            className="border-[#21466D]/10 hover:border-[#21466D]/20 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setActiveTab(item.id)
              setMobileView("content")
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#21466D]/10 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#21466D]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#21466D]">{item.label}</h3>
                    {item.count !== undefined && (
                      <p className="text-sm text-muted-foreground">{t("common.elementCount", { count: item.count })}</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-[#21466D]/60" />
              </div>
            </CardContent>
          </Card>
        )
      })}
      <Card className="border-red-200 hover:border-red-300 transition-all duration-200 cursor-pointer">
        <CardContent className="p-4" onClick={confirmLogout}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-red-600">{t("common.logoutFromSystem")}</h3>
                <p className="text-sm text-red-400">{t("common.logout")}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-red-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-[#21466D]/40 mb-4 animate-pulse" />
            <p className="text-muted-foreground">{t("common.loadingData")}</p>
          </div>
        </div>
      )
    }
    switch (activeTab) {
      case "buyurtmalar":
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              {isMobile && (
                <Button variant="ghost" size="sm" onClick={() => setMobileView("menu")} className="text-[#21466D]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("common.back")}
                </Button>
              )}
              <h2 className="text-2xl font-semibold text-[#21466D] dark:text-white">
                {t("common.activeOrders")} ({activeOrders.length})
              </h2>
            </div>
            <div className="space-y-4">
              {activeOrders.length > 0 ? (
                activeOrders.map((order) => renderOrderCard(order))
              ) : (
                <Card className="border-[#21466D]/10">
                  <CardContent className="p-8 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-[#21466D]/40 mb-4" />
                    <p className="text-muted-foreground">{t("common.noActiveOrders")}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )
      case "kategoriyalar":
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              {isMobile && (
                <Button variant="ghost" size="sm" onClick={() => setMobileView("menu")} className="text-[#21466D]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("common.back")}
                </Button>
              )}
              <h2 className="text-2xl font-semibold text-[#21466D] dark:text-white">
                {t("common.categories")} & {t("common.kafedras")}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Categories Section */}
              <Card className="border-[#21466D]/10">
                <CardHeader className="border-b border-[#21466D]/10">
                  <CardTitle className="text-[#21466D] dark:text-white flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    {t("common.categories")} ({categoriesFromOrders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {categoriesFromOrders.length > 0 ? (
                    <div className="space-y-3">
                      {categoriesFromOrders.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 bg-[#21466D]/5 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-[#21466D] dark:text-white">
                              {category[`name_${i18n.language.slice(0, 2)}` as keyof CategoryFromOrders]}
                            </h4>
                          </div>
                          <Badge className="bg-[#21466D] text-white">
                            {category.count} {t("common.books")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Tag className="mx-auto h-12 w-12 text-[#21466D]/40 mb-4" />
                      <p className="text-muted-foreground">{t("common.noCategoriesFound")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Kafedras Section */}
              <Card className="border-[#21466D]/10">
                <CardHeader className="border-b border-[#21466D]/10">
                  <CardTitle className="text-[#21466D] dark:text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {t("common.kafedras")} ({kafedrasFromOrders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {kafedrasFromOrders.length > 0 ? (
                    <div className="space-y-3">
                      {kafedrasFromOrders.map((kafedra) => (
                        <div
                          key={kafedra.id}
                          className="flex items-center justify-between p-3 bg-[#21466D]/5 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-[#21466D] dark:text-white">
                              {kafedra[`name_${i18n.language.slice(0, 2)}` as keyof KafedraFromOrders]}
                            </h4>
                          </div>
                          <Badge variant="outline" className="border-[#21466D] text-[#21466D]">
                            {kafedra.count} {t("common.books")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto h-12 w-12 text-[#21466D]/40 mb-4" />
                      <p className="text-muted-foreground">{t("common.noKafedrasFound")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary Statistics */}
            <Card className="border-[#21466D]/10 mt-6">
              <CardHeader>
                <CardTitle className="text-[#21466D] dark:text-white">{t("common.summary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-[#21466D]/5 rounded-lg">
                    <h3 className="text-2xl font-bold text-[#21466D]">{orders.length}</h3>
                    <p className="text-sm text-muted-foreground">{t("common.totalOrders")}</p>
                  </div>
                  <div className="text-center p-4 bg-[#21466D]/5 rounded-lg">
                    <h3 className="text-2xl font-bold text-[#21466D]">{categoriesFromOrders.length}</h3>
                    <p className="text-sm text-muted-foreground">{t("common.uniqueCategories")}</p>
                  </div>
                  <div className="text-center p-4 bg-[#21466D]/5 rounded-lg">
                    <h3 className="text-2xl font-bold text-[#21466D]">{kafedrasFromOrders.length}</h3>
                    <p className="text-sm text-muted-foreground">{t("common.uniqueKafedras")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "malumotlar":
        return (
          <Card className="w-full border-[#21466D]/10">
            {notification && (
              <div className="fixed top-[100px] left-1/2 transform -translate-x-1/2 z-50">
                <div className="p-4 w-[30vw] text-white bg-[#21466D] rounded-md shadow animate-fade-in text-center">
                  {notification}
                </div>
              </div>
            )}
            <CardHeader className="border-b border-[#21466D]/10">
              <div className="flex items-center justify-between">
                {isMobile && (
                  <Button variant="ghost" size="sm" onClick={() => setMobileView("menu")} className="text-[#21466D]">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t("common.back")}
                  </Button>
                )}
                <CardTitle className="text-[#21466D] dark:text-white">
                  <User className="inline mr-2" /> {t("common.personalInfo")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
                <div className="space-y-2">
                  <Label htmlFor="fullname" className="text-[#21466D] dark:text-white font-medium">
                    {t("common.fullname")}
                  </Label>
                  <Input
                    disabled={true}
                    id="fullname"
                    value={profile.fullname}
                    onChange={(e) => setProfile({ ...profile, fullname: e.target.value })}
                    className="border-[#21466D]/20 focus:border-[#21466D] focus:ring-[#21466D]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#21466D] dark:text-white font-medium">
                    {t("common.phone")}
                  </Label>
                  <Input
                    disabled={true}
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="border-[#21466D]/20 focus:border-[#21466D] focus:ring-[#21466D]/20"
                  />
                </div>
                <div className=" w-full">
                  <Label htmlFor="language-select" className="text-[#21466D] dark:text-white font-medium">
                    {t("common.language")}
                  </Label>
                  <Select value={currentLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger
                      id="language-select"
                      className="border-[#21466D]/20 focus:border-[#21466D] focus:ring-[#21466D]/20"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t("common.changeLanguage")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uz">O'zbekcha</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className=" flex flex-col justify-end w-full">
                  <Label htmlFor="logout-button" className="text-[#21466D] dark:text-white font-medium sr-only">
                    {t("common.logout")}
                  </Label>
                  <Button
                    id="logout-button"
                    variant="destructive"
                    onClick={confirmLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 max-md:mt-4"
                  >
                    <LogOut className="h-4 w-4" /> {t("common.logoutFromSystem")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      default:
        return null
    }
  }

  if (!isClient) return null

  return (
    <div className="container mx-auto px-4 py-8 max-md:mb-10">
      {!isMobile && (
        <div className="flex items-center justify-between mb-6 ">
          <h1 className="text-3xl font-bold text-[#21466D] dark:text-white md:hidden">
            {profile.fullname || t("common.profile")}
          </h1>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden border-[#21466D]/20 text-[#21466D] hover:bg-[#21466D]/10 bg-transparent"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      )}
      {isMobile ? (
        <div>
          {mobileView === "menu" ? (
            <div>
              <h1 className="text-2xl font-bold text-[#21466D] dark:text-white mb-6 text-center">
                {t("common.profile")}
              </h1>
              {renderMobileMenu()}
            </div>
          ) : (
            renderContent()
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 ">
          <div className={`md:col-span-1  ${isMobileMenuOpen ? "block" : "hidden md:block"}`}>
            <div className="sticky top-[150px]">
              <h1 className="text-[29.9px] font-bold text-[#21466D] dark:text-white">
                {profile.fullname || t("common.profile")}
              </h1>
              <Card className="border-[#21466D]/10 ">
                <CardContent className="p-4">
                  <nav className="space-y-2 ">
                    {menuItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id)
                            setIsMobileMenuOpen(false)
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 font-medium ${
                            activeTab === item.id
                              ? "bg-[#21466D] text-white shadow-md"
                              : "hover:bg-[#21466D]/10 text-[#21466D] dark:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            {item.label}
                          </div>
                          {item.count !== undefined && (
                            <Badge
                              className={`text-xs ${
                                activeTab === item.id ? "bg-white/20 text-white" : "bg-[#21466D]/10 text-[#21466D]"
                              }`}
                            >
                              {item.count}
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="md:col-span-3">{renderContent()}</div>
        </div>
      )}
    </div>
  )
}
