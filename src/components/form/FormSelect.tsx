"use client"

import React from "react"
import { useFormContext } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"


interface SelectFormProps {
  name: string
  selectItems: Array<{
    value: string
    label: string
  }>
  placeholder: string
  label?: string
}

export function SelectForm({ name, selectItems, placeholder, label }: SelectFormProps) {
  const form = useFormContext();
  const [isOpen, setIsOpen] = React.useState(false)
  const floatingText = label ?? placeholder

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full">
          <Select
            onValueChange={field.onChange}
            value={field.value ? String(field.value) : ""}
            onOpenChange={setIsOpen}
          >
            <FormControl>
              <div className="relative">
                <SelectTrigger className="peer">
                  <SelectValue placeholder={floatingText ? " " : placeholder} />
                </SelectTrigger>
                {floatingText ? (
                  <label
                    className={cn(
                      "pointer-events-none absolute left-4 select-none rounded-lg",
                      "origin-[0] transition-all duration-200 ease-out",
                      isOpen || String(field.value ?? "").length > 0
                        ? "top-0 z-10 -translate-y-1/2 scale-90 bg-white px-1 text-sm text-gray-500"
                        : "top-1/2 -translate-y-1/2 scale-100 text-sm text-zinc-500"
                    )}
                  >
                    {floatingText}
                  </label>
                ) : null}
              </div>
            </FormControl>
            <SelectContent>
              {selectItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
