"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { ReactNode, useEffect, useState } from "react"

interface ConditionalLayoutProps {
  children: ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Hide navbar and footer on login and register pages
  // Check both with and without trailing slash
  const hideNavbarFooter = mounted && (
    pathname === "/login" || 
    pathname === "/login/" ||
    pathname === "/register" || 
    pathname === "/register/" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register")
  )

  if (!mounted) {
    return <main className="min-h-screen bg-background">{children}</main>
  }

  return (
    <>
      {!hideNavbarFooter && <Navbar />}
      <main className="min-h-screen bg-background">{children}</main>
      {!hideNavbarFooter && <Footer />}
    </>
  )
}
