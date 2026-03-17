'use client'

import React, { useEffect, useState } from 'react'
import { useDebounce } from 'react-use'

import { Input } from '../ui/input'
import { RangeSlider } from '../ui/range-slider'

interface Props {
  minLimit: number
  maxLimit: number
  initialMin: number
  initialMax: number
  onFilterChange: (values: { minPrice: number; maxPrice: number }) => void
  t: any
}

export const FilterPrice: React.FC<Props> = ({
  minLimit,
  maxLimit,
  initialMin,
  initialMax,
  onFilterChange,
  t,
}) => {
  const [prices, setPrices] = useState({ min: initialMin, max: initialMax })

  // Синхронізація з URL (наприклад, при натисканні "Назад" у браузері або зміні категорії)
  useEffect(() => {
    setPrices({ min: initialMin, max: initialMax })
  }, [initialMin, initialMax])

  useDebounce(
    () => {
      if (prices.min !== initialMin || prices.max !== initialMax) {
        // Передаємо значення з правильними іменами ключів
        onFilterChange({
          minPrice: prices.min,
          maxPrice: prices.max,
        })
      }
    },
    600,
    [prices]
  )
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={prices.min}
          onChange={(e) => setPrices((prev) => ({ ...prev, min: Number(e.target.value) }))}
        />
        <Input
          type="number"
          value={prices.max}
          onChange={(e) => setPrices((prev) => ({ ...prev, max: Number(e.target.value) }))}
        />
      </div>

      <RangeSlider
        min={minLimit}
        max={maxLimit}
        step={1}
        value={[prices.min, prices.max]}
        onValueChange={([min, max]) => setPrices({ min, max })}
        showLabels={false}
      />
    </div>
  )
}
