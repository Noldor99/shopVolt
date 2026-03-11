'use client'

import { usePathname } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { RangeSlider } from '@/components/ui/range-slider'

import { getLocaleFromPathname, getMessages } from '@/lib/i18n'

interface Props {
  minPrice: number
  maxPrice: number
  minLimit: number
  maxLimit: number
  onChange: (values: { minPrice: string | null; maxPrice: string | null }) => void
}

export const FilterPrice = ({ minPrice, maxPrice, minLimit, maxLimit, onChange }: Props) => {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const t = getMessages(locale)
  const normalizedMin = Math.min(Math.max(minPrice, minLimit), maxLimit)
  const normalizedMax = Math.max(Math.min(maxPrice, maxLimit), minLimit)

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold">{t.filter.priceRange}:</p>
      <div className="flex gap-3">
        <Input
          type="number"
          min={minLimit}
          max={maxLimit}
          value={normalizedMin || ''}
          onChange={(e) =>
            onChange({ minPrice: e.target.value || null, maxPrice: String(normalizedMax) })
          }
        />
        <Input
          type="number"
          min={minLimit}
          max={maxLimit}
          value={normalizedMax || ''}
          onChange={(e) =>
            onChange({ minPrice: String(normalizedMin), maxPrice: e.target.value || null })
          }
        />
      </div>
      <RangeSlider
        min={minLimit}
        max={maxLimit}
        showLabels={false}
        step={1}
        value={[normalizedMin, normalizedMax]}
        onValueChange={([min, max]) => onChange({ minPrice: String(min), maxPrice: String(max) })}
      />
    </div>
  )
}
