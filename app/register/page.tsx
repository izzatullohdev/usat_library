"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, User, Lock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/store/auth"
import Image from "next/image"
import { register } from "@/lib/api"
import { useProfileStore } from "@/lib/store/profile"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"

export default function RegisterPage() {
  const { t } = useTranslation()
  const [passport, setPassport] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingUser, setCheckingUser] = useState(false)
  const [userExists, setUserExists] = useState<boolean | null>(null)
  const [studentData, setStudentData] = useState<{
    full_name: string
    pinfl: string
    phone: string
    group_id: number
  } | null>(null)
  const auth = useAuthStore()
  const profile = useProfileStore()

  // Get STD bot token when component mounts
  useEffect(() => {
    setIsClient(true)
    
    const fetchStdBotToken = async () => {
      try {
        const { getStdBotToken } = await import("@/lib/api")
        await getStdBotToken()
      } catch (error) {
        // Silently fail - this should not block registration
        // Silently fail in production, log in development
        if (process.env.NODE_ENV === "development") {
          console.warn("Failed to fetch STD bot token:", error)
        }
      }
    }

    fetchStdBotToken()
  }, [])

  // Check user existence when passport ID is complete (14 digits)
  useEffect(() => {
    if (!isClient) return // Don't check if not mounted on client
    
    const checkUser = async () => {
      if (passport.length === 14) {
        setCheckingUser(true)
        try {
          const { checkStdUserExists } = await import("@/lib/api")
          const student = await checkStdUserExists(passport)
          if (student) {
            setUserExists(true)
            setStudentData({
              full_name: student.full_name,
              pinfl: student.pinfl,
              phone: student.phone,
              group_id: student.group_id,
            })
          } else {
            setUserExists(false)
            setStudentData(null)
          }
        } catch (error) {
          logger.warn("Failed to check user existence", error)
          setUserExists(null)
          setStudentData(null)
        } finally {
          setCheckingUser(false)
        }
      } else {
        setUserExists(null)
        setStudentData(null)
      }
    }

    // Debounce the check - wait 500ms after user stops typing
    const timeoutId = setTimeout(() => {
      checkUser()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [passport, isClient])

  if (!isClient) return null

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "") // Faqat raqamlarni qabul qilish
    if (value.length <= 14) {
      setPassport(value)
      setUserExists(null) // Reset user exists state when passport changes
      setStudentData(null) // Reset student data when passport changes
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (!passport || !password || !confirmPassword) {
      toast.error(t("common.allFieldsRequired"))
      setLoading(false)
      return
    }

    if (passport.length !== 14) {
      toast.error("JSHSHIR 14 ta raqamdan iborat bo'lishi kerak")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      toast.error("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      toast.error("Parollar mos kelmayapti")
      setLoading(false)
      return
    }

    // Check if passport is verified (student data exists)
    if (!studentData || userExists !== true) {
      toast.error("Passport ID tasdiqlanmagan. Iltimos, passport ID'ni to'g'ri kiriting va tasdiqlashni kutib turing.")
      setLoading(false)
      return
    }

    try {
      const registerRes = await register(
        studentData.pinfl, // Use pinfl from API response
        password,
        studentData.full_name, // Use full_name from API response
        studentData.phone, // Use phone from API response
        3 // group_id is always 3 as specified
      )
      
      logger.debug("Register response received", { success: !!registerRes?.success })
      
      // Check if registration was successful based on success flag
      const isSuccess = registerRes?.success === true || registerRes?.data?.success === true
      
      if (!isSuccess) {
        // Registration failed
        const errorMessage = registerRes?.message || registerRes?.data?.message || t("common.registerError")
        throw new Error(errorMessage)
      }
      
      // Registration successful - extract user data
      // Response structure: { success: true, message: "...", data: { id, full_name, passport_id, phone, ... } }
      const userData = registerRes?.data || registerRes?.data?.data || null
      
      // Try to extract token (might not be present in response)
      let token: string | undefined
      
      if (registerRes?.data?.token) {
        token = registerRes.data.token
      } else if (registerRes?.token) {
        token = registerRes.token
      } else if (registerRes?.data?.data?.token) {
        token = registerRes.data.data.token
      }
      
      // Set token if available (some APIs don't return token on registration)
      if (token) {
        auth.setToken(token)
        logger.debug("Token saved successfully")
      } else {
        logger.debug("Token not provided in registration response - user will need to login")
      }
      
      // Set profile with user data from response
      if (userData) {
        profile.setProfile({
          id: String(userData.id || ""),
          fullname: userData.full_name || userData.fullname || studentData.full_name,
          full_name: userData.full_name || userData.fullname || studentData.full_name,
          phone: userData.phone || studentData.phone,
          role: userData.role || "student",
        })
        logger.debug("Profile saved successfully")
      } else {
        // Fallback to studentData if user data not in response
        logger.warn("User data not found in response, using studentData for profile")
        profile.setProfile({
          id: "",
          fullname: studentData.full_name,
          full_name: studentData.full_name,
          phone: studentData.phone,
          role: "student",
        })
      }
      
      // Clear all form inputs after successful registration
      setPassport("")
      setPassword("")
      setConfirmPassword("")
      setUserExists(null)
      setStudentData(null)
      
      setLoading(false)
      toast.success(registerRes?.message || t("common.registerSuccess"))
      
      // Navigate to login page after a short delay to show success message
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (error: unknown) {
      logger.error("Register error", error)
      
      // Extract detailed error message from various error structures
      let errorMessage = t("common.registerError")
      
      if (error && typeof error === "object") {
        const axiosError = error as {
          response?: {
            status?: number
            data?: {
              message?: string
              error?: string
              errors?: unknown
            }
          }
          message?: string
        }
        
        // Try to get error message from response
        if (axiosError.response?.data) {
          errorMessage =
            axiosError.response.data.message ||
            axiosError.response.data.error ||
            `Server error (${axiosError.response.status || 500})`
          
          // Log full error for debugging
          logger.error("Full error response", {
            status: axiosError.response.status,
            data: axiosError.response.data,
          })
        } else if (axiosError.message) {
          errorMessage = axiosError.message
        }
      }
      
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#21466D]">
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="w-full flex items-center justify-center gap-8">
          <motion.div
            className="w-1/2 max-md:w-full lg:w-1/2"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white w-[600px] max-md:w-full rounded-xl shadow-2xl border border-gray-100">
              <CardHeader className="text-center pb-6 pt-8 px-8">
                <motion.div
                  className="flex items-center justify-center gap-2 text-2xl text-[#21466D] mb-2"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <UserPlus className="h-6 w-6 text-[#ffc82a]" />
                  {t("common.registerTitle")}
                </motion.div>
                <p className="text-sm text-gray-600 mt-2">{t("common.registerDesc")}</p>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                <form onSubmit={handleRegister} className="space-y-5">
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <Label htmlFor="passport" className="block text-sm font-medium text-[#21466D]">
                      {t("common.passportId")} (JSHSHIR) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ffc82a] h-5 w-5 z-10" />
                      <Input
                        id="passport"
                        type="text"
                        inputMode="numeric"
                        value={passport}
                        onChange={handlePassportChange}
                        placeholder="12345678901234"
                        maxLength={14}
                        className={`w-full h-12 pl-10 ${
                          passport.length === 14
                            ? userExists === true
                              ? "pr-32 border-green-500 focus:border-green-500"
                              : userExists === false
                              ? "pr-36 border-red-500 focus:border-red-500"
                              : "pr-24"
                            : "pr-4"
                        } border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc82a]/30 bg-white text-[#21466D] placeholder-gray-400 transition-all duration-200 ${
                          userExists === true && passport.length === 14
                            ? "border-green-500 focus:border-green-500"
                            : userExists === false && passport.length === 14
                            ? "border-red-500 focus:border-red-500"
                            : "border-[#ffc82a] focus:border-[#ffc82a]"
                        }`}
                      />
                      {passport.length === 14 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 flex items-center gap-2">
                          {checkingUser ? (
                            <>
                              <Loader2 className="h-4 w-4 text-gray-400 animate-spin flex-shrink-0" />
                              <span className="text-xs text-gray-500 whitespace-nowrap">Tekshirilmoqda...</span>
                            </>
                          ) : userExists === true ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-xs text-green-600 whitespace-nowrap font-medium">Topildi</span>
                            </>
                          ) : userExists === false ? (
                            <>
                              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <span className="text-xs text-red-600 whitespace-nowrap font-medium">Topilmadi</span>
                            </>
                          ) : null}
                        </div>
                      )}
                      {passport.length > 0 && passport.length < 14 && (
                        <span className="text-xs text-gray-500 mt-1 block">
                          {14 - passport.length} ta raqam qoldi
                        </span>
                      )}
                    </div>
                  </motion.div>

                  {/* Password fields - only show when passport is verified */}
                  {userExists === true && (
                    <>
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Label htmlFor="password" className="block text-sm font-medium text-[#21466D]">
                          {t("common.password")} <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ffc82a] h-5 w-5" />
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t("common.enterPassword")}
                            className="w-full h-12 pl-10 pr-4 border-2 border-[#ffc82a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc82a]/30 focus:border-[#ffc82a] bg-white text-[#21466D] placeholder-gray-400 transition-all duration-200"
                          />
                        </div>
                        {password.length > 0 && password.length < 8 && (
                          <span className="text-xs text-gray-500 mt-1 block">
                            Parol kamida 8 ta belgidan iborat bo'lishi kerak
                          </span>
                        )}
                      </motion.div>

                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <Label htmlFor="confirmPassword" className="block text-sm font-medium text-[#21466D]">
                          {t("common.confirmPassword")} <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ffc82a] h-5 w-5" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t("common.enterConfirmPassword")}
                            className="w-full h-12 pl-10 pr-4 border-2 border-[#ffc82a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc82a]/30 focus:border-[#ffc82a] bg-white text-[#21466D] placeholder-gray-400 transition-all duration-200"
                          />
                        </div>
                        {confirmPassword.length > 0 && password !== confirmPassword && (
                          <span className="text-xs text-red-500 mt-1 block">Parollar mos kelmayapti</span>
                        )}
                      </motion.div>
                    </>
                  )}

                  <motion.button
                    type="submit"
                    disabled={
                      loading ||
                      userExists !== true ||
                      !password ||
                      !confirmPassword ||
                      password.length < 8 ||
                      password !== confirmPassword
                    }
                    className="w-full h-12 bg-[#ffc82a] hover:bg-[#ffb600] disabled:bg-gray-300 disabled:cursor-not-allowed text-[#21466D] font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                    whileHover={
                      loading ||
                      userExists !== true ||
                      !password ||
                      !confirmPassword ||
                      password.length < 8 ||
                      password !== confirmPassword
                        ? {}
                        : { scale: 1.02 }
                    }
                    whileTap={
                      loading ||
                      userExists !== true ||
                      !password ||
                      !confirmPassword ||
                      password.length < 8 ||
                      password !== confirmPassword
                        ? {}
                        : { scale: 0.98 }
                    }
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-[#21466D] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {loading ? t("common.loading") : t("common.register")}
                  </motion.button>
                </form>
                <motion.div
                  className="relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-[#ffc82a]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">{t("common.haveAccount")}</span>
                  </div>
                </motion.div>
                <motion.div
                  className="text-center w-full space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75, duration: 0.4 }}
                >
                  <motion.button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="text-center underline text-[#21466D] hover:text-[#ffc82a] transition-all duration-200 font-bold cursor-pointer block w-full"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t("common.loginToAccount")}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => router.push("/")}
                    className="text-center underline text-[#21466D] hover:text-[#ffc82a] transition-all duration-200 font-bold cursor-pointer block w-full"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t("common.backToHome")}
                  </motion.button>
                </motion.div>
              </CardContent>
            </div>
          </motion.div>
          <motion.div
            className="hidden xl:flex flex-col items-center justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="relative">
              <motion.div
                className="relative w-[550px] h-[550px]"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/logo 6.png"
                  alt="USAT Logo"
                  width={550}
                  height={550}
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
