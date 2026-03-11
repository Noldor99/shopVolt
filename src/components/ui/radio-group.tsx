"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "group relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full",
        "border-2 border-zinc-400 bg-white text-[#6764F1]",
        "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
        "hover:border-zinc-500",
        "data-[state=checked]:border-current",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#6764F1]/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-full bg-[#6764F1]/10 scale-0 opacity-0 transition-all duration-200 ease-out group-data-[state=checked]:scale-100 group-data-[state=checked]:opacity-100"
      />
      <RadioGroupPrimitive.Indicator
        forceMount
        className="flex items-center justify-center"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-current transition-transform duration-200 ease-out scale-0 group-data-[state=checked]:scale-100" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
