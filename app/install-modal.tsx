"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useTranslation } from "react-i18next" // i18n import

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
  prompt(): Promise<void>
}

export default function PWAInstallModal() {
  const { t } = useTranslation() // useTranslation hook'ini ishlatish
  const [isOpen, setIsOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    // PWA o'rnatish mumkinligini tekshirish
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
      // Agar avval modal ko'rsatilmagan bo'lsa, ko'rsatish
      const hasShownModal = localStorage.getItem("pwa-install-modal-shown")
      if (!hasShownModal) {
        setIsOpen(true)
      }
    }

    // PWA allaqachon o'rnatilganligini tekshirish
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    if (!isStandalone && !isInWebAppiOS) {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        console.log("PWA o'rnatildi")
      }
      setDeferredPrompt(null)
      setIsOpen(false)
      localStorage.setItem("pwa-install-modal-shown", "true")
    } catch (error) {
      console.error("PWA o'rnatishda xatolik:", error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem("pwa-install-modal-shown", "true")
  }

  if (!isInstallable) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[#21466D] flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t("pwa.installApp")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">{t("pwa.installDescription")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-[#21466D] rounded-lg flex items-center justify-center">
              <img src="/logo 6.png" alt="USAT Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h4 className="font-medium text-[#21466D]">{t("pwa.appName")}</h4>
              <p className="text-sm text-gray-600">{t("pwa.fastAndConvenient")}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>✓ {t("pwa.featureFastAccess")}</p>
            <p>✓ {t("pwa.featureOffline")}</p>
            <p>✓ {t("pwa.featureNotifications")}</p>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
            {t("pwa.later")}
          </Button>
          <Button onClick={handleInstall} className="flex-1 bg-[#21466D] hover:bg-[#1a3a5c] text-white">
            {t("pwa.install")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
