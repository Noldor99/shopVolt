'use client'

import * as SliderPrimitive from '@radix-ui/react-slider'

import React from 'react'

import { cn } from '@/lib/utils'

type SliderProps = {
  className?: string
  min: number
  max: number
  step: number
  formatLabel?: (value: number) => string
  value?: number[] | readonly number[]
  onValueChange?: (values: number[]) => void
  showLabels?: boolean // Додаємо новий параметр
}

const RangeSlider = React.forwardRef(
  (
    {
      className,
      min,
      max,
      step,
      formatLabel,
      value,
      onValueChange,
      showLabels = true,
      ...props
    }: SliderProps,
    ref
  ) => {
    const initialValue = Array.isArray(value) ? value : [min, max]
    const [localValues, setLocalValues] = React.useState(initialValue)

    React.useEffect(() => {
      setLocalValues(Array.isArray(value) ? value : [min, max])
    }, [min, max, value])

    const handleValueChange = (newValues: number[]) => {
      setLocalValues(newValues)
      if (onValueChange) {
        onValueChange(newValues)
      }
    }

    return (
      <SliderPrimitive.Root
        ref={ref as React.RefObject<HTMLDivElement>}
        min={min}
        max={max}
        step={step}
        value={localValues}
        onValueChange={handleValueChange}
        className={cn('relative mb-6 flex w-full touch-none select-none items-center', className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-gray-200">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>

        {localValues.map((value, index) => (
          <React.Fragment key={index}>
            {/* Рендеримо текст тільки якщо showLabels === true */}
            {showLabels && (
              <div
                className="absolute text-center"
                style={{
                  left: `calc(${((value - min) / (max - min)) * 100}% - 10px)`, // Виправив відсоток для точності
                  top: `15px`,
                }}
              >
                <span className="text-xs text-gray-500">
                  {formatLabel ? formatLabel(value) : value}
                </span>
              </div>
            )}

            <SliderPrimitive.Thumb
              className={cn(
                'border-primary/50 block h-4 w-4 rounded-full border bg-white shadow transition-colors',
                'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1',
                'cursor-pointer disabled:pointer-events-none disabled:opacity-50'
              )}
            />
          </React.Fragment>
        ))}
      </SliderPrimitive.Root>
    )
  }
)

RangeSlider.displayName = 'RangeSlider'

export { RangeSlider }
