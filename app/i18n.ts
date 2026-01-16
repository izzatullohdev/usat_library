import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import uzTranslation from "../public/locales/uz/translation.json"
import ruTranslation from "../public/locales/ru/translation.json"

const supportedLanguages = ["uz", "ru"]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uzTranslation },
      ru: { translation: ruTranslation },
    },
    fallbackLng: "uz", // Default til
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
      // Custom lookup callback:
      checkWhitelist: true, // Faqat supportedLanguages dan foydalanish
    },
    whitelist: supportedLanguages, // eski versiyalarda
    supportedLngs: supportedLanguages, // yangi versiyalarda
  })

// Brauzer tili "en" bo‘lsa ham, `uz` qilib qo‘yish:
const detected = i18n.language
if (!supportedLanguages.includes(detected)) {
  i18n.changeLanguage("uz")
  localStorage.setItem("i18nextLng", "uz")
}

export default i18n
