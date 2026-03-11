import React, { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface SmalCardIconProps {
  img?: ReactNode
  title: string
  subTitle?: string
  children: ReactNode
  imgWidth?: string
}

const SmalCard = (props: SmalCardIconProps) => {
  const { title, subTitle, children, img, imgWidth } = props
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between bg-white shadow-md",
        "flex-col sm:flex-row"
      )}
    >
      {img && <div className={`w-full sm:flex-[${imgWidth}px]`}>{img}</div>}

      <div
        className={cn(
          "flex-col sm:flex-row",
          "flex w-full gap-3 p-5 sm:items-center sm:justify-between"
        )}
      >
        <div className="flex flex-col">
          <p className="overflow-hidden text-ellipsis">{title}</p>
          <p className="text-sm1 text-muted-foreground">{subTitle}</p>
        </div>
        <div className="flex justify-end gap-4">{children}</div>
      </div>
    </div>
  )
}

export default SmalCard
