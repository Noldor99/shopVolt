import clsx from "clsx"
import React from "react"

type TitleSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"

interface Props {
  size?: TitleSize
  className?: string
  text: string
}

export const Title: React.FC<Props> = ({ text, size = "md", className }) => {
  const mapTagBySize = {
    xs: "p",
    sm: "p",
    md: "p",
    lg: "h4",
    xl: "h3",
    "2xl": "h2",
    "3xl": "h1",
  } as const

  const mapClassNameBySize = {
    xs: "text-[0.7rem] leading-[1.2rem]",
    sm: "text-sm1",
    md: "text-root",
    lg: "text-lg1",
    xl: "text-h3",
    "2xl": "text-h2",
    "3xl": "text-h1",
  } as const

  return React.createElement(
    mapTagBySize[size],
    { className: clsx(mapClassNameBySize[size], className) },
    text
  )
}
