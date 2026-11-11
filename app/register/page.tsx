"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, User, Lock, Phone, GraduationCap, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { register } from "@/lib/api"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"

interface RegisterFormState {
  firstName: string
  lastName: string
  phone: string
  passport: string
  studyGroup: string
  direction: string
  password: string
  confirmPassword: string
}

const EMPTY_FORM: RegisterFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  passport: "",
  studyGroup: "",
  direction: "",
  password: "",
  confirmPassword: "",
}

const NAME_PATTERN = /^[\p{L}][\p{L}\s'’‘`-]*$/u
const GROUP_PATTERN = /^[A-Za-z0-9\u0400-\u04FF][A-Za-z0-9\u0400-\u04FF\s\-_.]*$/
const DIRECTION_PATTERN = /^[\p{L}0-9][\p{L}0-9\s'’‘.,()\-]*$/u

function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "")
  if (digits.length === 9) return `+998${digits}`
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`
  return null
}

function validateForm(form: RegisterFormState, t: (key: string) => string): string | null {
  if (
    !form.firstName.trim() ||
    !form.lastName.trim() ||
    !form.phone.trim() ||
    !form.passport ||
    !form.studyGroup.trim() ||
    !form.direction.trim() ||
    !form.password ||
    !form.confirmPassword
  ) {
    return t("common.allFieldsRequired")
  }

  if (!NAME_PATTERN.test(form.firstName.trim()) || form.firstName.trim().length < 2) {
    return t("common.enterFirstName")
  }

  if (!NAME_PATTERN.test(form.lastName.trim()) || form.lastName.trim().length < 2) {
    return t("common.enterLastName")
  }

  if (!normalizePhone(form.phone)) {
    return "Telefon +998 va 9 ta raqam bo'lishi kerak"
  }

  if (!/^\d{14}$/.test(form.passport)) {
    return "JSHSHIR 14 ta raqamdan iborat bo'lishi kerak"
  }

  if (!GROUP_PATTERN.test(form.studyGroup.trim())) {
    return t("common.enterGroup")
  }

  if (!DIRECTION_PATTERN.test(form.direction.trim()) || form.direction.trim().length < 2) {
    return t("common.enterDirection")
  }

  if (form.password.length < 8) {
    return t("common.passwordMin")
  }

  if (form.password !== form.confirmPassword) {
    return t("common.passwordsMismatch")
  }

  return null
}

function readApiError(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback

  const axiosError = error as {
    response?: { data?: { message?: string; error?: string; errors?: Array<{ message?: string }> } }
    message?: string
  }
  const fieldMessage = axiosError.response?.data?.errors?.[0]?.message
  return (
    fieldMessage ||
    axiosError.response?.data?.message ||
    axiosError.response?.data?.error ||
    axiosError.message ||
    fallback
  )
}

export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [form, setForm] = useState<RegisterFormState>(EMPTY_FORM)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  const updateField = (field: keyof RegisterFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handlePassportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 14)
    updateField("passport", digits)
  }

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    const validationError = validateForm(form, t)
    if (validationError) {
      toast.error(validationError)
      return
    }

    const phone = normalizePhone(form.phone)
    if (!phone) {
      toast.error("Telefon +998 va 9 ta raqam bo'lishi kerak")
      return
    }

    setLoading(true)
    try {
      const registerRes = await register({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone,
        passport_id: form.passport,
        study_group: form.studyGroup.trim(),
        direction: form.direction.trim(),
        password: form.password,
        confirm_password: form.confirmPassword,
      })

      if (registerRes?.success !== true) {
        throw new Error(registerRes?.message ?? t("common.registerError"))
      }

      setForm(EMPTY_FORM)
      toast.success(registerRes.message || t("common.registerSuccess"))
      router.push("/login")
    } catch (error: unknown) {
      toast.error(readApiError(error, t("common.registerError")))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "w-full h-12 pl-10 pr-4 border-2 border-[#ffc82a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc82a]/30 focus:border-[#ffc82a] bg-white text-[#21466D] placeholder-gray-400 transition-all duration-200"

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#21466D]">
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="w-full flex items-center justify-center gap-8">
          <motion.div
            className="w-[min(100%,640px)]"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white w-full max-w-[640px] max-h-[calc(100vh-4rem)] overflow-y-auto rounded-xl shadow-2xl border border-gray-100">
              <CardHeader className="text-center pb-4 pt-8 px-8">
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
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="block text-sm font-medium text-[#21466D]">
                        {t("common.firstName")} <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc82a] h-5 w-5" />
                        <Input
                          id="firstName"
                          value={form.firstName}
                          onChange={(event) => updateField("firstName", event.target.value)}
                          placeholder={t("common.enterFirstName")}
                          autoComplete="given-name"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="block text-sm font-medium text-[#21466D]">
                        {t("common.lastName")} <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc82a] h-5 w-5" />
                        <Input
                          id="lastName"
                          value={form.lastName}
                          onChange={(event) => updateField("lastName", event.target.value)}
                          placeholder={t("common.enterLastName")}
                          autoComplete="family-name"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="block text-sm font-medium text-[#21466D]">
                      {t("common.phone")} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc82a] h-5 w-5" />
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        value={form.phone}
                        onChange={(event) => updateField("phone", event.target.value)}
                        placeholder={t("common.enterPhone")}
                        autoComplete="tel"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passport" className="block text-sm font-medium text-[#21466D]">
                      {t("common.passportId")} (JSHSHIR) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc82a] h-5 w-5" />
                      <Input
                        id="passport"
                        type="text"
                        inputMode="numeric"
                        value={form.passport}
                        onChange={handlePassportChange}
                        placeholder="12345678901234"
                        maxLength={14}
                        autoComplete="off"
                        className={inputClass}
                      />
                    </div>
                    {form.passport.length > 0 && form.passport.length < 14 && (
                      <span className="text-xs text-gray-500 block">{14 - form.passport.length} ta raqam qoldi</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studyGroup" className="block text-sm font-medium text-[#21466D]">
                        {t("common.group")} <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc82a] h-5 w-5" />
                        <Input
                          id="studyGroup"
                          value={form.studyGroup}
                          onChange={(event) => updateField("studyGroup", event.target.value)}
                          placeholder={t("common.enterGroup")}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="direction" className="block text-sm font-medium text-[#21466D]">
                        {t("common.direction")} <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc82a] h-5 w-5" />
                        <Input
                          id="direction"
                          value={form.direction}
                          onChange={(event) => updateField("direction", event.target.value)}
                          placeholder={t("common.enterDirection")}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="block text-sm font-medium text-[#21466D]">
                      {t("common.password")} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc82a] h-5 w-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(event) => updateField("password", event.target.value)}
                        placeholder={t("common.enterPassword")}
                        autoComplete="new-password"
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ffc82a]"
                        tabIndex={-1}
                        aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {form.password.length > 0 && form.password.length < 8 && (
                      <span className="text-xs text-gray-500 block">{t("common.passwordMin")}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="block text-sm font-medium text-[#21466D]">
                      {t("common.confirmPassword")} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc82a] h-5 w-5" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(event) => updateField("confirmPassword", event.target.value)}
                        placeholder={t("common.enterConfirmPassword")}
                        autoComplete="new-password"
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ffc82a]"
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                      <span className="text-xs text-red-500 block">{t("common.passwordsMismatch")}</span>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#ffc82a] hover:bg-[#ffb600] disabled:bg-gray-300 disabled:cursor-not-allowed text-[#21466D] font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                    whileHover={loading ? {} : { scale: 1.02 }}
                    whileTap={loading ? {} : { scale: 0.98 }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-[#21466D] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {loading ? t("common.loading") : t("common.register")}
                  </motion.button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-[#ffc82a]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">{t("common.haveAccount")}</span>
                  </div>
                </div>

                <div className="text-center w-full space-y-3">
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="text-center underline text-[#21466D] hover:text-[#ffc82a] transition-all duration-200 font-bold cursor-pointer block w-full"
                  >
                    {t("common.loginToAccount")}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="text-center underline text-[#21466D] hover:text-[#ffc82a] transition-all duration-200 font-bold cursor-pointer block w-full"
                  >
                    {t("common.backToHome")}
                  </button>
                </div>
              </CardContent>
            </div>
          </motion.div>

          <motion.div
            className="hidden xl:flex flex-col items-center justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.div
              className="relative w-[550px] h-[550px]"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <Image src="/logo 6.png" alt="USAT Logo" width={550} height={550} className="w-full h-full object-contain" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
