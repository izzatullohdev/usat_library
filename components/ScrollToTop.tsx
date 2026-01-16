 "use client"

import { ArrowUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [isNearFooter, setIsNearFooter] = useState(false)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    const onScroll = () => {
      const headerElement = document.getElementById("header")
      const footerElement = document.querySelector("footer")
      const scrollY = window.scrollY + window.innerHeight

      if (headerElement) {
        const headerBottom = headerElement.getBoundingClientRect().bottom + window.scrollY
        setIsVisible(window.scrollY > headerBottom)
      } else {
        setIsVisible(window.scrollY > 100)
      }

      if (footerElement) {
        const footerTop = footerElement.getBoundingClientRect().top + window.scrollY
        setIsNearFooter(scrollY > footerTop - 50) // 50px yaqinlashganda rang o'zgaradi
      }
    }

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const defaultColor = {
    backgroundColor: "#21466d",
    color: "#ffffff",
  }

  const nearFooterColor = {
    backgroundColor: "#ffc82a",
    color: "#21466d",
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="scroll-to-top"
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            duration: 0.5,
            ease: "easeInOut",
          }}
          whileHover={{
            scale: 1.1,
            y: -5,
            boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
          }}
          whileTap={{ scale: 0.95 }}
          style={isNearFooter ? nearFooterColor : defaultColor}
          className="fixed bottom-12 max-md:bottom-20 right-12 max-lg:right-4 max-lg:bottom-5 z-[99] rounded-full h-16 w-16 max-md:h-12 max-md:w-12 flex items-center justify-center shadow-lg cursor-pointer transition-colors duration-300"
        >
          <button
            onClick={scrollToTop}
            className="w-full h-full flex items-center justify-center"
            aria-label="Scroll to top"
          >
            <ArrowUp size={32} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
