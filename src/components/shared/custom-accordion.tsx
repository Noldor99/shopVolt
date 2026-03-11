"use client"

import { ReactNode } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface CustomAccordionProps {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}

const CustomAccordion = ({
  title,
  isOpen,
  onToggle,
  children,
}: CustomAccordionProps) => {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left font-medium"
        aria-expanded={isOpen}
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div className={cn("px-6 pb-4", !isOpen && "hidden")}>{children}</div>
    </div>
  )
}

export default CustomAccordion
