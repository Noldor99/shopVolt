'use client'

import { MONITOR_FILTERS, TABLET_FILTERS } from '@/constants/tabletFilters'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { getLocaleFromPathname, getMessages, stripLocaleFromPathname } from '@/lib/i18n'

type ChipItem = {
  key: string
  value?: string
  label: string
}

export const useTopBarFilterChips = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname)
  const t = getMessages(locale)

  const activeFilters = useMemo(() => {
    const monitorPath = '/category/monitory'
    const cleanPathname = stripLocaleFromPathname(pathname)
    return cleanPathname?.includes(monitorPath) ? MONITOR_FILTERS : TABLET_FILTERS
  }, [pathname])

  const filterTitleById = useMemo(() => {
    return Object.fromEntries(activeFilters.map((filter) => [filter.id, filter.title]))
  }, [activeFilters])

  const chips = useMemo(() => {
    const result: ChipItem[] = []

    for (const [key, rawValue] of searchParams.entries()) {
      if (key === 'page' || !rawValue.trim()) continue

      if (key === 'minPrice') {
        result.push({ key, label: `${t.common.from}: ${rawValue}` })
        continue
      }

      if (key === 'maxPrice') {
        result.push({ key, label: `${t.common.to}: ${rawValue}` })
        continue
      }

      if (!key.startsWith('info.')) continue

      const filterId = key.replace('info.', '')
      const filterTitle = filterTitleById[filterId] ?? filterId
      const values = rawValue
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

      values.forEach((value) => {
        result.push({
          key,
          value,
          label: `${filterTitle}: ${value}`,
        })
      })
    }

    return result
  }, [searchParams, filterTitleById, t.common.from, t.common.to])

  const updateParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      updater(params)
      params.set('page', '1')
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    },
    [pathname, router, searchParams]
  )

  const removeChip = useCallback(
    (chip: { key: string; value?: string }) => {
      updateParams((params) => {
        if (!chip.key.startsWith('info.') || !chip.value) {
          params.delete(chip.key)
          return
        }

        const current = params.get(chip.key)
        if (!current) return

        const next = current
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
          .filter((value) => value !== chip.value)

        if (next.length) {
          params.set(chip.key, next.join(','))
        } else {
          params.delete(chip.key)
        }
      })
    },
    [updateParams]
  )

  return { chips, removeChip }
}
