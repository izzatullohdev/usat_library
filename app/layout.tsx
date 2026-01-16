import type React from "react"
import type { Metadata, Viewport } from "next"
import { Comfortaa } from "next/font/google"
import "./globals.css"
import ErrorBoundary from "@/components/ErrorBoundary"
import { Toaster } from "sonner"
import PWAInstallModal from "./install-modal"
import { I18nClientProvider } from "@/components/i18n-client-provider" // Yangi komponentni import qilish
import ScrollToTopButton from "@/components/ScrollToTop"
import ConditionalLayout from "@/components/ConditionalLayout"

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-comfortaa",
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "USAT Kutubxonasi",
  description: "USAT Universiteti Kutubxonasi",
  generator: "abddev09@gmail.com",
  manifest: "/manifest.json",
  icons: {
    icon: "/light-logo.png",
    apple: "/light-logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "USAT Kutubxonasi",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  themeColor: "#21466D",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz" suppressHydrationWarning className={comfortaa.variable}>
      <body>
        <ErrorBoundary>
          <I18nClientProvider>
            <ScrollToTopButton/>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  width: "90%",
                  fontSize: "16px",
                  padding: "16px 18px",
                  borderRadius: "10px",
                  backgroundColor: "#21466D",
                  color: "white",
                  textAlign: "center",
                },
                duration: 3000,
              }}
            />
            <PWAInstallModal />
          </I18nClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
