"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ShoppingCart, User, LogIn, LogOut, BookAIcon, Search, X, Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/lib/store/auth"
import { toast } from "sonner"
import { usePathname, useRouter } from "next/navigation"
import { getAllBooks } from "@/lib/api"
import { getFullImageUrl } from "@/lib/utils"
import { normalizeToEnrichedBooks } from "@/lib/book-normalizer"
import { useTranslation } from "react-i18next"
import MagnetButton from "@/components/Magnet"
import type { EnrichedBook } from "@/types/common"

export default function Navbar() {
  const { t } = useTranslation()
  const { token } = useAuthStore()
  const [cartCount, setCartCount] = useState(0)
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDirections, setSelectedDirections] = useState<string[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [filteredBooks, setFilteredBooks] = useState<EnrichedBook[]>([])
  const [allboks, setbooks] = useState<EnrichedBook[]>([])

  // UI states
  const [, setShowSearch] = useState(false)
  const [showBooksPanel, setShowBooksPanel] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const books = await getAllBooks()
        const res = books as { data?: unknown }
        const rawArray = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as { data?: unknown[] })?.data)
            ? (res.data as { data: unknown[] }).data
            : []
        if (rawArray.length > 0) {
          const enrichedBooks = normalizeToEnrichedBooks(rawArray)
          setbooks(enrichedBooks)
        }
      } catch {
        // Fail silently; books panel will stay empty
      }
    }
    fetchBooks()
  }, [])

  // Filter books based on selected criteria
  useEffect(() => {
    const filtered = allboks.filter((book) => {
      // Safety check: ensure book and book.name exist
      if (!book || !book.name) return false
      const matchesSearch = book.name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
    setFilteredBooks(filtered)

    // Show books panel if there are any filters applied
    const hasFilters =
      Boolean(searchTerm) ||
      selectedDirections.length > 0 ||
      selectedDepartments.length > 0 ||
      selectedTopics.length > 0
    setShowBooksPanel(hasFilters)
  }, [searchTerm, selectedDirections, selectedDepartments, selectedTopics, allboks])

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowBooksPanel(false)
        setSearchTerm("")
      }
    }
    if (showBooksPanel) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showBooksPanel])

  useEffect(() => {
    if (showBooksPanel) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [showBooksPanel])

  useEffect(() => {
    setIsClient(true)
    setMounted(true)

    const userId = localStorage.getItem("id")
    if (!userId) return

    // Get cart count
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    const userCart = cart.filter((item: any) => item.userId === userId)
    setCartCount(userCart.length)

    // Get active orders count
    const activeOrders = localStorage.getItem("activeOrdersCount")
    if (activeOrders) {
      const count = parseInt(activeOrders, 10)
      if (!isNaN(count) && count >= 0) {
        setActiveOrdersCount(count)
      }
    } else {
      // Initialize to 0 if not exists
      setActiveOrdersCount(0)
    }

    // Get unread notifications count
    const unreadNotifications = localStorage.getItem("unreadNotificationsCount")
    if (unreadNotifications) {
      const count = parseInt(unreadNotifications, 10)
      if (!isNaN(count) && count >= 0) {
        setUnreadCount(count)
      }
    } else {
      // Initialize to 0 if not exists
      setUnreadCount(0)
    }

    const handleStorageChange = () => {
      const updatedCart = JSON.parse(localStorage.getItem("cart") || "[]")
      const updatedUserCart = updatedCart.filter((item: any) => item.userId === userId)
      setCartCount(updatedUserCart.length)

      // Update active orders count
      const updatedActiveOrders = localStorage.getItem("activeOrdersCount")
      if (updatedActiveOrders) {
        const count = parseInt(updatedActiveOrders, 10)
        if (!isNaN(count)) {
          setActiveOrdersCount(count)
        }
      }

      // Update unread notifications count
      const updatedUnread = localStorage.getItem("unreadNotificationsCount")
      if (updatedUnread) {
        const count = parseInt(updatedUnread, 10)
        if (!isNaN(count)) {
          setUnreadCount(count)
        }
      }
    }

    // Listen for custom events from profile page
    const handleOrdersUpdate = () => {
      const activeOrders = localStorage.getItem("activeOrdersCount")
      if (activeOrders !== null) {
        const count = parseInt(activeOrders, 10)
        if (!isNaN(count) && count >= 0) {
          setActiveOrdersCount(count)
        } else {
          setActiveOrdersCount(0)
        }
      } else {
        setActiveOrdersCount(0)
      }
    }

    const handleNotificationsUpdate = () => {
      const unreadNotifications = localStorage.getItem("unreadNotificationsCount")
      if (unreadNotifications !== null) {
        const count = parseInt(unreadNotifications, 10)
        if (!isNaN(count) && count >= 0) {
          setUnreadCount(count)
        } else {
          setUnreadCount(0)
        }
      } else {
        setUnreadCount(0)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("ordersUpdated", handleOrdersUpdate)
    window.addEventListener("notificationsUpdated", handleNotificationsUpdate)

    // Poll for updates every 2 seconds for better UX
    const interval = setInterval(() => {
      handleOrdersUpdate()
      handleNotificationsUpdate()
    }, 2000)
    
    // Also check immediately
    handleOrdersUpdate()
    handleNotificationsUpdate()

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("ordersUpdated", handleOrdersUpdate)
      window.removeEventListener("notificationsUpdated", handleNotificationsUpdate)
      clearInterval(interval)
    }
  }, [pathname])

  useEffect(() => {
    if (pathname.includes("/book/")) {
      const timer = setTimeout(clearAllFilters, 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [pathname])

  const clearAllFilters = () => {
    setSearchTerm("")
    setSelectedDirections([])
    setSelectedDepartments([])
    setSelectedTopics([])
    setShowBooksPanel(false)
    setShowSearch(false)
    setShowMobileSearch(false)
  }

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch)
    if (showMobileSearch) {
      setSearchTerm("")
      clearAllFilters()
    }
  }

  const [, setNotification] = useState<string | null>(null)

  const showNotification = (message: string) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 3000)
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
      <div className="dark:bg-zinc-900 rounded-xl w-fit animate-in fade-in zoom-in flex flex-col gap-4">
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

  const handleBookClick = (bookId: string, event?: React.MouseEvent) => {
    // Prevent any event bubbling that might interfere
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Navigate to the book page
    router.push(`/book/${bookId}`)

    // Close mobile search panel immediately after navigation
    setShowMobileSearch(false)
    setShowBooksPanel(false)
    setSearchTerm("")
  }

  // Hide navbar on login and register pages
  if (pathname === "/login" || pathname === "/login/" || pathname === "/register" || pathname === "/register/") return <></>
  if (!mounted) return null
  if (!isClient) return null

  return (
    <>
      <nav className="md:sticky top-0 z-50 w-full border-b bg-background py-5">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/#top" className="flex items-center space-x-2 max-md:justify-center">
            <div className="w-[250px] max-md:w-[180px] max-md:flex max-md:justify-center">
              <Image src={"/navbar2.png"} alt="Logo" width={500} height={500} className="w-full" />
            </div>
          </Link>

          <div className="hidden md:flex container mx-auto items-center gap-4 relative w-[70%] text-[#21466D]">
            <Search className="absolute left-10 w-5 h-5" />
            <Input
              type="text"
              placeholder={t("common.searchBooks")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none focus:border-none px-10 focus:outline-none focus:ring-0 w-[50%] py-6"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => {
                setShowSearch(false)
                setSearchTerm("")
              }}
              className="absolute right-10 border-none bg-white hover:bg-white"
            >
              {searchTerm !== "" && <X className="h-4 w-4 border-none bg-none" />}
            </Button>

            {showBooksPanel && (
              <>
                {/* Backdrop - removed onClick handler to prevent interference */}
                <div className="fixed top-[108px] left-0 right-0 bottom-0 z-20 backdrop-brightness-50" />
                <div
                  ref={panelRef}
                  className="absolute top-[75px] w-[92.4%] max-h-[400px] z-30 bg-white border shadow-lg overflow-y-auto rounded-md"
                >
                  <div className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex justify-between items-center text-[#21466D]">
                      <span>
                        {t("common.results")} ({filteredBooks.length})
                      </span>
                      <span className="cursor-pointer hover:underline" onClick={() => clearAllFilters()}>
                        {t("common.close")}
                      </span>
                    </h3>
                    {filteredBooks.map((book) => (
                      <div
                        key={book.id}
                        onClick={(e) => handleBookClick(book.id, e)}
                        className="border-b border-gray-200 py-3 flex items-start gap-4 hover:bg-gray-50 transition cursor-pointer"
                      >
                        <Image
                          src={book.image?.url ? getFullImageUrl(book.image.url) : "/placeholder.svg"}
                          alt={book.name}
                          width={60}
                          height={90}
                          className="rounded-md object-cover flex-shrink-0"
                        />
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-[#21466D] line-clamp-1">{book.name}</h4>
                          <p className="text-sm text-[#21466D]/70 line-clamp-2">{book.description}</p>
                        </div>
                      </div>
                    ))}
                    {filteredBooks.length === 0 && (
                      <div className="text-center text-[#21466D]/60 text-sm">{t("common.noResultsFound")}</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Search Icon */}
          <div className="md:hidden">
            <MagnetButton>
              <Button onClick={toggleMobileSearch} className="text-[#21466D]">
                <Search className="w-5 h-5" />
              </Button>
            </MagnetButton>
          </div>

          {/* Desktop Katalog Button - Hidden on mobile */}
          <Link href="/filter" className="mr-5 hidden md:block">
            <MagnetButton>
              <Button
                className="px-8 py-6 text-white hover:!bg-white hover:text-[#21466D]"
                style={{ border: "1px solid ", backgroundColor: "#21466D" }}
              >
                <Layers />
                {t("common.catalog")}
              </Button>
            </MagnetButton>
          </Link>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {token ? (
              <>
                <Link href="/cart">
                  <MagnetButton>
                    <Button
                      variant="outline"
                      size="sm"
                      className="relative !bg-[#21466D] hover:!bg-[white] hover:text-[#21466D] px-8 py-6 animate-scale-in text-white bg-transparent"
                      style={{ border: "1px solid #21466D", backgroundColor: "transparent" }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {t("common.cart")}
                      {cartCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex justify-center items-center primary-gradient">
                          {cartCount}
                        </Badge>
                      )}
                    </Button>
                  </MagnetButton>
                </Link>
                <Link href="/profile">
                  <MagnetButton>
                    <Button
                      variant="outline"
                      style={{ border: "1px solid #21466D", backgroundColor: "transparent" }}
                      className="relative rounded-full flex w-[50px] h-[50px] text-[30px] hover:text-[white] flex-col justify-center items-center hover:!bg-[#21466D] hover:border-transparent transition-all duration-300 bg-transparent"
                    >
                      <User className="w-5 h-5" />
                      {(activeOrdersCount > 0 || unreadCount > 0) && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex justify-center items-center primary-gradient border-transparent text-[#21466D] font-semibold z-10 min-w-[20px]">
                          {activeOrdersCount + unreadCount > 9 ? "9+" : activeOrdersCount + unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </MagnetButton>
                </Link>
              </>
            ) : (
              <Link href="/login">
                <MagnetButton>
                  <Button
                    size="sm"
                    variant="outline"
                    className="relative !bg-[#21466D] hover:!bg-[white] hover:text-[#21466D] px-8 py-6 animate-scale-in text-white bg-transparent"
                    style={{ border: "1px solid #21466D", backgroundColor: "transparent" }}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    {t("common.login")}
                  </Button>
                </MagnetButton>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {showMobileSearch && (
        <div className="fixed top-[100px] left-0 right-0 z-50 bg-white border-b shadow-lg md:hidden">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t("common.searchBooks")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-3"
                autoFocus
              />
              <Button
                size="sm"
                onClick={toggleMobileSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-transparent hover:bg-gray-100"
              >
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </div>

            {/* Mobile Search Results */}
            {showBooksPanel && (
              <div className="mt-4 max-h-[300px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#21466D]">
                    {t("common.results")} ({filteredBooks.length})
                  </h3>
                  {filteredBooks.map((book) => (
                    <div
                      key={book.id}
                      onClick={(e) => handleBookClick(book.id, e)}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition cursor-pointer active:bg-gray-100"
                      style={{
                        // Improve touch target size for mobile
                        minHeight: "60px",
                        touchAction: "manipulation",
                      }}
                    >
                      <Image
                        src={book.image?.url ? getFullImageUrl(book.image.url) : "/placeholder.svg"}
                        alt={book.name}
                        width={40}
                        height={60}
                        className="rounded-md object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-[#21466D] line-clamp-1">{book.name}</h4>
                        <p className="text-xs text-[#21466D]/70 line-clamp-2">{book.description}</p>
                      </div>
                    </div>
                  ))}
                  {filteredBooks.length === 0 && (
                    <div className="text-center text-[#21466D]/60 text-sm py-4">{t("common.noResultsFound")}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Navigation - Fixed and Improved */}
      <div className="fixed bottom-0 z-50 w-full bg-background border-t md:hidden">
        <div className="flex items-center justify-around h-16 px-2 safe-area-pb">
          {/* Home/Books */}
          <Link href="/" className="flex justify-center">
            <MagnetButton>
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center h-full p-3 text-xs hover:bg-accent transition rounded-lg ${
                  pathname === "/" || pathname === "/#top" ? "text-yellow-500" : "text-gray-600"
                }`}
              >
                <BookAIcon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium leading-none">{t("common.books")}</span>
              </Button>
            </MagnetButton>
          </Link>

          {/* Catalog */}
          <Link href="/filter" className="flex justify-center">
            <MagnetButton>
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center h-full p-3 text-xs hover:bg-accent transition rounded-lg ${
                  pathname === "/filter" || pathname.startsWith("/filter") ? "text-yellow-500" : "text-gray-600"
                }`}
              >
                <Layers className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium leading-none">{t("common.catalog")}</span>
              </Button>
            </MagnetButton>
          </Link>

          {/* Cart */}
          <Link href="/cart" className="flex justify-center relative">
            <MagnetButton>
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center h-full p-3 text-xs hover:bg-accent transition rounded-lg ${
                  pathname === "/cart" || pathname.startsWith("/cart") ? "text-yellow-500" : "text-gray-600"
                }`}
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 mb-1" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[10px] flex justify-center items-center primary-gradient">
                      {cartCount > 9 ? "9+" : cartCount}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none">{t("common.cart")}</span>
              </Button>
            </MagnetButton>
          </Link>

          {/* Profile or Login */}
          {token ? (
            <>
              <Link href="/profile" className="flex justify-center">
                <MagnetButton>
                  <Button
                    variant="ghost"
                    className={`flex flex-col items-center justify-center h-full p-3 text-xs hover:bg-accent transition rounded-lg ${
                      pathname === "/profile" || pathname.startsWith("/profile") ? "text-yellow-500" : "text-gray-600"
                    }`}
                  >
                    <User className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium leading-none">{t("common.profile")}</span>
                  </Button>
                </MagnetButton>
              </Link>

              {/* Logout */}
              <div className="flex justify-center">
                <MagnetButton>
                  <Button
                    variant="ghost"
                    className="flex flex-col items-center justify-center h-full p-3 text-xs text-red-500 hover:bg-red-50 transition rounded-lg"
                    onClick={() => confirmLogout()}
                  >
                    <LogOut className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium leading-none">{t("common.logout")}</span>
                  </Button>
                </MagnetButton>
              </div>
            </>
          ) : (
            <Link href="/login" className="flex justify-center">
              <MagnetButton>
                <Button
                  variant="ghost"
                  className={`flex flex-col items-center justify-center h-full p-3 text-xs hover:bg-accent transition rounded-lg ${
                    pathname === "/login" || pathname.startsWith("/login") ? "text-yellow-500" : "text-gray-600"
                  }`}
                >
                  <LogIn className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium leading-none">{t("common.login")}</span>
                </Button>
              </MagnetButton>
            </Link>
          )}
        </div>
      </div>

      {/* Add bottom padding to body content to prevent overlap with fixed navbar */}
      <style jsx global>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 64px;
          }
        }
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </>
  )
}
