"use client"

import { Container } from "@/components/ui/container"
import { cn } from "@/lib/utils"

import React from "react"

interface Props {
  categories: any
  className?: string
}

export const TopBar: React.FC<Props> = ({ categories, className }) => {
  const [cartVisible, setCartVisible] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 3) {
        setCartVisible(true)
      } else {
        setCartVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <div className={cn("sticky top-0 bg-white py-2 shadow-lg shadow-black/5 z-10", className)}>
      <Container className="flex items-center justify-between ">
        categories
        <div className="flex items-center">
          <p
            className={cn(
              "transition-opacity duration-200",
              !cartVisible ? "invisible opacity-0" : "visible opacity-100"
            )}
          >
            CartButton
          </p>
        </div>
      </Container>
    </div>
  )
}
