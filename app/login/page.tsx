"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn, User, Lock } from "lucide-react" // lucide-react ikonalarini import qilamiz
import { useRouter } from "next/navigation"
import { toast } from "sonner" // Toaster komponentini layoutga ko'chiramiz
import { useAuthStore } from "@/lib/store/auth"
import Image from "next/image"
import { login } from "@/lib/api"
import { useProfileStore } from "@/lib/store/profile"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion" // framer-motion import qilamiz

export default function LoginPage() {
  const { t } = useTranslation()
  const [passport, setPassport] = useState("")
  const [password, setPassword] = useState("")
  const { token } = useAuthStore()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const auth = useAuthStore()
  const profile = useProfileStore()

  if (!isClient) return null

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Faqat raqamlarni qabul qilish
    if (value.length <= 14) {
      setPassport(value)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (!passport || !password) {
      toast.error(t("common.allFieldsRequired"))
      setLoading(false)
      return
    }
    if (passport.length !== 14) {
      toast.error("JSHSHIR 14 ta raqamdan iborat bo'lishi kerak")
      setLoading(false)
      return
    }
    try {
      const loginRes = (await login(passport, password)) as any
      auth.setToken(loginRes.data.token as string)
      profile.setProfile(loginRes.data.user as any)
      setLoading(false)
      toast.success(t("common.loginSuccess"))
      router.push("/")
    } catch (error: any) {
      // Error is already logged by error handler
      // Show more detailed error message
      const errorMessage = error?.response?.data?.message || error?.message || t("common.loginError")
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#21466D]">
      {/* Toaster komponentini app/layout.tsx ga ko'chirish tavsiya etiladi */}
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="w-full flex items-center justify-center gap-8">
          <motion.div
            className="w-1/2 max-md:w-full lg:w-1/2" // Original width class
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
                  <LogIn className="h-6 w-6 text-[#ffc82a]" />
                  {t("common.loginTitle")}
                </motion.div>
                <p className="text-sm text-gray-600 mt-2">{t("common.loginDesc")}</p>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <Label htmlFor="passport" className="block text-sm font-medium text-[#21466D]">
                      {t("common.passportId")} (JSHSHIR)
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ffc82a] h-5 w-5" />
                      <Input
                        id="passport"
                        type="text"
                        inputMode="numeric"
                        value={passport}
                        onChange={handlePassportChange}
                        placeholder="12345678901234"
                        maxLength={14}
                        className="w-full h-12 pl-10 pr-4 border-2 border-[#ffc82a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc82a]/30 focus:border-[#ffc82a] bg-white text-[#21466D] placeholder-gray-400 transition-all duration-200"
                      />
                      {passport.length > 0 && passport.length < 14 && (
                        <span className="text-xs text-gray-500 mt-1 block">
                          {14 - passport.length} ta raqam qoldi
                        </span>
                      )}
                    </div>
                  </motion.div>
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <Label htmlFor="password" className="block text-sm font-medium text-[#21466D]">
                      {t("common.password")}
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
                  </motion.div>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#ffc82a] hover:bg-[#ffb600] disabled:bg-gray-300 text-[#21466D] font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-[#21466D] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    {loading ? t("common.loading") : t("common.login")}
                  </motion.button>
                </form>
                <motion.div
                  className="relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-[#ffc82a]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">{t("common.noAccount")}</span>
                  </div>
                </motion.div>
                <motion.div
                  className="text-center w-full space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <motion.button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="text-center underline text-[#21466D] hover:text-[#ffc82a] transition-all duration-200 font-bold cursor-pointer block w-full"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t("common.register")}
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
