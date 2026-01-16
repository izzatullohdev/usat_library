"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      <BookOpen className="mx-auto h-20 w-20 text-[#21466D] mb-6" />
      <h1 className="text-[40px] font-bold text-[#21466D] mb-2">404</h1>
      <h2 className="text-[22px] text-[#21466D] mb-4">Sahifa topilmadi 😔</h2>
      <p className="text-muted-foreground mb-6">
        Siz izlagan sahifa mavjud emas yoki o‘chirib yuborilgan.
      </p>

      <Link
        href="/"
        className="px-6 py-3 bg-[#21466D] hover:bg-[#21466D]/90 text-white rounded-lg shadow transition"
      >
        Bosh sahifaga qaytish
      </Link>
    </div>
  )
}
