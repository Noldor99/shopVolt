import React, { ButtonHTMLAttributes } from "react"
import { Checkbox } from "../ui/checkbox"

export interface FilterChecboxProps {
  text: string
  value: string
  endAdornment?: React.ReactNode
  onCheckedChange?: (checked: boolean) => void
  checked?: boolean
  name?: string
}

export const FilterCheckbox: React.FC<FilterChecboxProps> = ({
  text,
  value,
  endAdornment,
  onCheckedChange,
  checked,
  name,
}) => {
  const checkboxId = `checkbox-${name}-${String(value)}`

  return (
    <div className="group/item flex items-center space-x-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100">
      <Checkbox
        onCheckedChange={onCheckedChange}
        checked={checked}
        value={value}
        className="rounded-[8px] [&>div]:size-5 [&>div]:rounded-md [&>div]:border-gray-400 [&>div]:transition-colors group-hover/item:[&>div]:border-black [&>div]:group-data-[selected]/checkbox:bg-black [&>div]:group-data-[selected]/checkbox:text-white [&>div]:group-data-[selected]/checkbox:border-black"
        id={checkboxId}
      />
      <label
        htmlFor={checkboxId}
        className="text-sm1 flex-1 cursor-pointer leading-none transition-colors group-hover/item:text-black"
      >
        {text}
      </label>
      {endAdornment}
    </div>
  )
}
