import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// utils.ts
export const getFullImageUrl = (relativePath?: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || ""
  return relativePath ? `${baseUrl}${relativePath}` : "/placeholder.svg"
}

export const checkImageExists = async (url: string): Promise<boolean> => {
  try {
    const res = await fetch(url, { method: "HEAD" })
    return res.ok
  } catch {
    return false
  }
}


export const isBookNew = (createdAt: string): boolean => {
  const createdDate = new Date(createdAt)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  return createdDate > sixMonthsAgo
}
