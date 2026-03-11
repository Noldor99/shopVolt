'use client'

import { MONITOR_FILTERS, TABLET_FILTERS } from '@/constants/tabletFilters'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { stripLocaleFromPathname } from '@/lib/i18n'
import { localizeInfoLabel } from '@/lib/localize-entities'

import { usePriceFilters } from '@/hooks/use-price-filters'
import { useAccordion } from '@/hooks/useAccordion'
import { IDeviceFiltersResponse } from '@/types/device'
import { FilterConfig } from '@/types/filter'

const MONITOR_SLUGS = new Set(['monitors', 'monitory'])

export const useDeviceFilters = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverFilters, setServerFilters] = useState<IDeviceFiltersResponse | null>(null)

  const { minPrice, maxPrice, minLimit, maxLimit } = usePriceFilters(pathname)
  const categorySlug = useMemo(() => {
    const cleanPathname = stripLocaleFromPathname(pathname)
    return cleanPathname.split('/category/')[1]?.split('/')[0] ?? null
  }, [pathname])
  const isMonitorCategory = useMemo(
    () => Boolean(categorySlug && MONITOR_SLUGS.has(categorySlug)),
    [categorySlug]
  )

  const baseFilters = useMemo(() => {
    return isMonitorCategory ? MONITOR_FILTERS : TABLET_FILTERS
  }, [isMonitorCategory])

  useEffect(() => {
    const loadFilters = async () => {
      if (!categorySlug) {
        setServerFilters(null)
        return
      }

      try {
        const res = await fetch(`/api/devices/filters?categorySlug=${encodeURIComponent(categorySlug)}`)
        if (!res.ok) throw new Error('Failed to load filters')
        const payload = (await res.json()) as IDeviceFiltersResponse
        setServerFilters(payload)
      } catch {
        setServerFilters(null)
      }
    }

    void loadFilters()
  }, [categorySlug])

  const activeFilters = useMemo(() => {
    // Tablets should always show the full static filter set from constants.
    if (!isMonitorCategory) return baseFilters

    if (!serverFilters) return baseFilters

    const infoMap = serverFilters?.info ?? {}
    const brands = serverFilters?.brands?.map((item) => item.name).filter(Boolean) ?? []

    const resolved: FilterConfig[] = baseFilters.map((filter) => {
      if (filter.id === 'brand') {
        return {
          ...filter,
          options: brands.length ? brands : filter.options,
        }
      }

      const keyCandidates = [
        filter.id,
        localizeInfoLabel(filter.id, 'ua'),
        localizeInfoLabel(filter.id, 'en'),
      ]

      const dynamicOptions = keyCandidates.flatMap((key) => infoMap[key] ?? [])
      const uniqueDynamicOptions = [...new Set(dynamicOptions)]

      return {
        ...filter,
        options: uniqueDynamicOptions.length ? uniqueDynamicOptions : [],
      }
    })

    const hasBrandFilter = resolved.some((filter) => filter.id === 'brand')
    const brandFilter: FilterConfig[] =
      !hasBrandFilter && brands.length
        ? [
          {
            id: 'brand',
            title: 'Бренд',
            options: [...new Set(brands)],
          },
        ]
        : []

    return [...brandFilter, ...resolved].filter((filter) => filter.options.length > 0)
  }, [baseFilters, isMonitorCategory, serverFilters])

  const { isSectionOpen, toggleSection } = useAccordion([])

  const getSelectedOptions = useCallback(
    (filterId: string) => {
      const rawValue = searchParams.get(`info.${filterId}`)
      if (!rawValue) return new Set<string>()
      return new Set(
        rawValue
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      )
    },
    [searchParams]
  )

  const hasActiveInfoFilters = useMemo(() => {
    return activeFilters.some((filter) => getSelectedOptions(filter.id).size > 0)
  }, [activeFilters, getSelectedOptions])

  const hasActiveFilters =
    hasActiveInfoFilters || searchParams.has('minPrice') || searchParams.has('maxPrice')

  const updateQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value && value.length > 0) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      params.set('page', '1')
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    },
    [pathname, router, searchParams]
  )

  const onToggleOption = useCallback(
    (filterId: string, option: string) => {
      const key = `info.${filterId}`
      const selected = getSelectedOptions(filterId)

      if (selected.has(option)) {
        selected.delete(option)
      } else {
        selected.add(option)
      }

      updateQueryParams({
        [key]: selected.size > 0 ? [...selected].join(',') : null,
      })
    },
    [getSelectedOptions, updateQueryParams]
  )

  const clearFilters = useCallback(() => {
    const updates: Record<string, string | null> = {
      minPrice: null,
      maxPrice: null,
    }
    for (const filter of activeFilters) {
      updates[`info.${filter.id}`] = null
    }
    updateQueryParams(updates)
  }, [activeFilters, updateQueryParams])

  return {
    activeFilters,
    minPrice,
    maxPrice,
    minLimit,
    maxLimit,
    isSectionOpen,
    toggleSection,
    getSelectedOptions,
    onToggleOption,
    hasActiveFilters,
    updateQueryParams,
    clearFilters,
  }
}
