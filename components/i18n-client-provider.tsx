"use client"

import { I18nextProvider } from "react-i18next"
import i18n from "../app/i18n" // i18n.ts faylingiz joylashgan joyga qarab yo'lni to'g'rilang
import type React from "react"

export function I18nClientProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
