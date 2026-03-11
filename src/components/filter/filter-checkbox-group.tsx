'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

import { Input } from '../ui/input'
import { FilterChecboxProps, FilterCheckbox } from './filter-checkbox'
import { getLocaleFromPathname, getMessages } from '@/lib/i18n'

type Item = FilterChecboxProps

interface Props {
  title?: string
  items: Item[]
  defaultItems?: Item[]
  limit?: number
  searchInputPlaceholder?: string
  className?: string
  selectedIds?: Set<string>
  onClickCheckbox?: (value: string) => void
  loading?: boolean
  name?: string
}

export const FilterCheckboxGroup: React.FC<Props> = ({
  title,
  items,
  defaultItems,
  limit = 6,
  searchInputPlaceholder,
  className,
  selectedIds,
  onClickCheckbox,
  loading,
  name,
}) => {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const t = getMessages(locale)
  const [showAll, setShowAll] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  const filtredItems = items.filter((item) =>
    item.text.toLowerCase().includes(searchValue.toLowerCase())
  )
  const previewItems = defaultItems ?? filtredItems.slice(0, limit)

  if (loading) {
    return (
      <div className={className}>
        {title && <p className="text-sm1 mb-3 font-bold">{title}</p>}

        {...Array(limit)
          .fill(0)
          .map((_, index) => (
            <div key={index} className="mb-4 h-6 w-full animate-pulse rounded-[8px] bg-gray-200" />
          ))}

        <div className="h-4 w-28 animate-pulse rounded-[8px] bg-gray-200" />
      </div>
    )
  }

  return (
    <div className={className}>
      {title && <p className="mb-3 font-bold">{title}</p>}

      {showAll && (
        <div className="mb-5">
          <Input
            placeholder={searchInputPlaceholder ?? t.filter.searchPlaceholder}
            className="border-none bg-gray-50"
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      )}

      <div className="scrollbar flex max-h-96 flex-col gap-1 overflow-auto pr-2">
        {(showAll ? filtredItems : previewItems).map((item) => (
          <FilterCheckbox
            onCheckedChange={() => onClickCheckbox?.(item.value)}
            checked={selectedIds?.has(item.value)}
            key={String(item.value)}
            value={item.value}
            text={item.text}
            endAdornment={item.endAdornment}
            name={name}
          />
        ))}
      </div>

      {items.length > limit && (
        <div className={showAll ? 'mt-4 border-t border-t-neutral-100' : ''}>
          <button onClick={() => setShowAll(!showAll)} className="mt-3 text-primary">
            {showAll ? t.filter.hide : `+ ${t.filter.showAll}`}
          </button>
        </div>
      )}
    </div>
  )
}
