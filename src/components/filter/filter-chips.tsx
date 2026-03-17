'use client'

import { usePathname } from 'next/navigation'

import React from 'react'

import { Badge } from '@/components/ui/badge'

import { getLocaleFromPathname, getMessages } from '@/lib/i18n'
import { cn } from '@/lib/utils'

import { useTopBarFilterChips } from '../../hooks/hook-filter/use-top-bar-filter-chips'

interface Props {
  totalFound?: number | null
  className?: string
}

export const FilterChips: React.FC<Props> = ({ totalFound, className }) => {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const t = getMessages(locale)
  const { chips, removeChip } = useTopBarFilterChips()

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-slate-600">
        {t.common.foundProducts}: {totalFound ?? '...'}
      </span>

      {chips?.map(({ key, value, label }) => (
        <button
          key={`${key}-${value ?? 'single'}`}
          onClick={() => removeChip({ key, value })}
          className="group"
        >
          <Badge
            variant="secondary"
            className="cursor-pointer select-none border border-slate-200 transition-colors hover:border-slate-400"
          >
            {label}
            <span className="ml-1 text-slate-400 group-hover:text-slate-900">×</span>
          </Badge>
        </button>
      ))}
    </div>
  )
}
