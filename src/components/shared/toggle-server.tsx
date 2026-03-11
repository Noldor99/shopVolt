"use server"

import Link from "next/link"

import { ReactNode } from "react"

import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type arrtValueType = {
  icon?: ReactNode
  text?: string
  value: string
} & Required<{ icon: ReactNode } | { text: string }>

interface FilterToggleProps extends ButtonProps {
  paramName: string
  activeValue?: string
  saveParam: { [key: string]: string | number }[]
  defaultArrValue: arrtValueType[]
  grid?: boolean
}

export const ToggleServer = (props: FilterToggleProps) => {
  let { activeValue, saveParam, defaultArrValue, paramName, grid, ...simple } = props

  if (!activeValue) activeValue = defaultArrValue[0].value

  const buildQueryParam = (paramValue: string) => {
    let queryParams = []

    saveParam.forEach((param) => {
      for (const key in param) {
        queryParams.push(`${key}=${param[key]}`)
      }
    })

    queryParams.push(`${[paramName]}=${paramValue}`)
    return queryParams.join("&")
  }

  return (
    <div
      className={cn(grid ? "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3" : "flex gap-[16px]")}
    >
      {defaultArrValue.map(({ value, text, icon }) => (
        <Link key={value} className="flex items-center" href={`?${buildQueryParam(value)}`}>
          <Button
            variant="black_out"
            {...simple}
            className={cn(grid && "w-full", activeValue === value ? "bg-black text-white" : "")}
          >
            {icon}
            {text}
          </Button>
        </Link>
      ))}
    </div>
  )
}
