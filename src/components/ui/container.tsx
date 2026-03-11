import { cn } from "@/lib/utils"
import React from "react"

interface Props {
  className?: string
  // Додаємо пропс для вибору розміру
  size?: "default" | "sm"
}

export const Container: React.FC<React.PropsWithChildren<Props>> = ({
  className,
  children,
  size = "default",
}) => {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 py-[4px] sm:px-6 sm:py-[8px]",

        size === "default" ? "max-w-[1200px]" : "max-w-[800px]",
        className
      )}
    >
      {children}
    </div>
  )
}
