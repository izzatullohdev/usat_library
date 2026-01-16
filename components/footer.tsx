"use client"
import Image from "next/image"
import Link from "next/link"
import DarkLogo from "/public/footer2.png"
import { Info, Map, PhoneCall } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next" // i18n import

export default function Footer() {
  const { t } = useTranslation() // useTranslation hook'ini ishlatish
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setMounted(true)
  }, [])

  useEffect(() => {
    // Har route o'zgarganda sahifani yuqoriga scroll qiladi
    window.scrollTo(0, 0)
  }, [pathname])

  // Hide footer on login and register pages
  if (pathname === "/login" || pathname === "/login/" || pathname === "/register" || pathname === "/register/") return <></>
  if (!mounted) return null
  if (!isClient) return null

  return (
    <footer className="bg-[#21466D] text-white py-10 mt-16 max-md:mb-10 max-md:mt-2"  >
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 ">
        {/* Logo va nom */}
        <Link href="/" className="flex items-center space-x-2 max-md:w-full max-md:justify-start">
          <div className="w-[250px]  max-md:flex max-md:justify-center">
            <Image src={DarkLogo || "/placeholder.svg"} alt="Logo" className="w-full" />
          </div>
        </Link>

        {/* Foydali havolalar */}
        <div>
          <h3 className="text-lg font-semibold mb-2">{t("common.usefulLinks")}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-[#ffc82a]">
                {t("common.home")}
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-[#ffc82a]">
                {t("common.books")}
              </Link>
            </li>
            <li>
              <Link href="/filter" className="hover:text-[#ffc82a]">
                {t("common.catalog")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Kontakt */}
        {/* Kontakt */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-lg font-semibold">{t("common.contact")}</h3>

            {/* Joylashuvga link */}
            <a
              href="https://www.google.com/maps?q=University+of+Science+and+Technologies"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white flex items-center gap-3 hover:text-[#ffc82a]"
            >
              <Map /> {t("common.address")}
            </a>

            {/* Qo‘ng‘iroq qilish */}
            <a
              href="tel:+998788883888"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white flex items-center gap-3 hover:text-[#ffc82a]"
            >
              <PhoneCall /> +998 (90) 123-45-67
            </a>

            {/* Email / saytga o‘tish */}
            <a
              href="https://usat.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white flex items-center gap-3 hover:text-[#ffc82a]"
            >
              <Info /> usat.uz
            </a>
          </div>
        </div>
      </div>
      <div className="flex-1 container mx-auto my-10">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d23995.830932484278!2d69.1568639923855!3d41.2549083285244!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ae89998837c2dd%3A0x17a930c5c7d93e28!2sUniversity%20of%20Science%20and%20Technologies!5e0!3m2!1suz!2s!4v1751872009631!5m2!1suz!2s"
          width="100%"
          height="250"
          className="rounded-xl border-0 shadow-md w-full"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
      {/* Pastki chiziq */}
      <div className="mt-10 text-center text-sm text-white border-t border-yellow-400 pt-4">
        © {new Date().getFullYear()} USAT Kutubxonasi. {t("common.allRightsReserved")}
      </div>
    </footer>
  )
}
