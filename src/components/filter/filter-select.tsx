"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import React, { useEffect, useState } from "react"

import { IconChevronDown } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { cn } from "@/lib/utils"

interface FilterProps {
  arrValue: string[]
  paramName: string
  goToFirstPage?: boolean
}

const FilterSelect = ({
  arrValue,
  paramName,
  goToFirstPage = true,
}: FilterProps) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<string>(
    searchParams.get(paramName) || arrValue[0]
  )

  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    if (value !== arrValue[0]) {
      params.set(paramName, value)
      if (goToFirstPage) params.set("page", "1")
    } else {
      params.delete(paramName)
      if (goToFirstPage) params.set("page", "1")
    }

    router.push(`${pathname}?${params.toString()}`)
  }, [value])

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="black_out"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-[200px] justify-between  bg-white capitalize hover:!bg-transparent hover:!text-black",
              open && "border-b-0"
            )}
          >
            {value}
            <IconChevronDown
              className={cn(
                "border-box ml-2 h-6  w-6 p-1 transition-transform",
                open && "rotate-180 transform "
              )}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[200px] p-0" sideOffset={0}>
          <Command>
            <CommandGroup>
              {arrValue
                .filter((i) => i.toLowerCase() !== value)
                .map((framework) => (
                  <CommandItem
                    key={framework}
                    value={framework}
                    onSelect={(currentValue: any) => {
                      setValue(currentValue)
                      setOpen(false)
                    }}
                  >
                    {framework[0].toUpperCase() + framework.slice(1)}
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}

export default FilterSelect
