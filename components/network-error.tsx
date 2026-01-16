"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WifiOff, Wifi, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

interface NetworkErrorProps {
  onRetry: () => void
  isVisible: boolean
}

export default function NetworkError({ onRetry, isVisible }: NetworkErrorProps) {
  const { t } = useTranslation()
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (isVisible) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isVisible])

  const handleRetry = async () => {
    setIsRetrying(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    onRetry()
    setIsRetrying(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#21466D] overflow-hidden"
        >
          <div className="relative z-10 text-center space-y-12 px-4">
            {/* WiFiOff Icon with animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, -10, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative w-36 h-36 flex items-center justify-center rounded-full border-4 border-[#ffc82a]/40 bg-[#21466D]"
              >
                <WifiOff className="w-16 h-16 text-[#ffc82a]" />

                <motion.div
                  className="absolute inset-0 rounded-full bg-[#ffc82a]/10"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {t("common.noInternet") || "Internetga ulanmagan"}
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-md mx-auto">
                {t("common.checkConnection") || "Internet aloqangizni tekshiring va qayta urinib ko'ring"}
              </p>
            </motion.div>

            {/* Retry Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="bg-[#ffc82a] hover:bg-[#ffc82a]/90 text-[#21466D] px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    {t("common.retrying") || "Qayta urinilmoqda..."}
                  </>
                ) : (
                  <>
                    <Wifi className="w-5 h-5 mr-2" />
                    {t("common.retry") || "Qayta urinish"}
                  </>
                )}
              </Button>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="text-sm text-white/70 space-y-2"
            >
              <p>{t("common.connectionTips") || "Maslahatlar:"}</p>
              <ul className="space-y-1 text-xs">
                <li>• {t("common.wifi")}</li>
                <li>• {t("common.router")}</li>
                <li>• {t("common.sayt")}</li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
