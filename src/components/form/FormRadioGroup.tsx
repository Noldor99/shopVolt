"use client"

import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

export type TRadioItem = {
  value: string
  label: string
}

interface FormRadioGroupProps {
  name: string
  radioItems: TRadioItem[]
  grid?: boolean
  label?: string
  direction?: "horizontal" | "vertical"
}

export function FormRadioGroup({
  name,
  radioItems,
  grid,
  label,
  direction = "horizontal",
}: FormRadioGroupProps) {
  const form = useFormContext()
  const isVertical = grid || direction === "vertical"

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn((label || isVertical) && "space-y-3")}>
          {label ? (
            <FormLabel className="whitespace-nowrap text-black font-medium">
              {label}
            </FormLabel>
          ) : null}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className={cn(
                "flex",
                isVertical ? "flex-col space-y-2" : "items-center space-x-2"
              )}
            >
              {radioItems.map((item) => (
                <FormItem
                  key={item.value}
                  className={cn(
                    "flex items-center ",
                    isVertical ? "space-x-3" : "space-x-1 justify-center"
                  )}
                >
                  <FormControl>
                    <RadioGroupItem id={`${name}-${item.value}`} value={item.value} />
                  </FormControl>
                  <FormLabel
                    htmlFor={`${name}-${item.value}`}
                    className="cursor-pointer whitespace-nowrap text-black font-normal"
                  >
                    {item.label}
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
