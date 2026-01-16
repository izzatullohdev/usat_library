"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Register page error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#21466D]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle className="text-2xl">Xatolik yuz berdi</CardTitle>
          </div>
          <CardDescription>
            Ro'yxatdan o'tish sahifasida muammo bor. Qayta urinib ko'ring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={reset} variant="default" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Qayta urinib ko'rish
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
