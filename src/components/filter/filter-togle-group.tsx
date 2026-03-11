'use client'

import React from 'react'

// Імпортуйте вашу кнопку (перевірте правильність шляху)
import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

export interface FilterChecboxProps {
  text: string
  value: string
  endAdornment?: React.ReactNode
  checked?: boolean
}

interface Props {
  title?: string
  items: FilterChecboxProps[]
  className?: string
  selectedIds?: Set<string>
  onClickCheckbox?: (value: string) => void
  loading?: boolean
}

export const FilterTogleGroup: React.FC<Props> = ({
  title,
  items,
  className,
  selectedIds,
  onClickCheckbox,
  loading,
}) => {
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {title && <p className="text-sm font-bold">{title}</p>}
        <div className="flex flex-wrap gap-2">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-gray-100" />
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {title && <p className="mb-4 font-bold text-gray-900">{title}</p>}

      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selectedIds?.has(item.value)

          return (
            <Button
              key={String(item.value)}
              onClick={() => onClickCheckbox?.(item.value)}
              variant={isSelected ? 'black' : 'black_out'}
              size="sm"
            >
              {item.text}
              {item.endAdornment && (
                <span className={cn('ml-1.5 text-xs opacity-60')}>{item.endAdornment}</span>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
