'use client'

import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

import { apiDevice } from '@/actions/client/deviceAction'
import { useAccordion } from '@/hooks/useAccordion'
import { getLocaleFromPathname, getMessages } from '@/lib/i18n'
import { FilterConfig } from '@/types/filter'

import { getDeviceFilterParams, getDeviceFilterQueryKey } from './shared'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const parsePriceParam = (value: string | null) => {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const useDeviceFilters = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const locale = useMemo(() => getLocaleFromPathname(pathname), [pathname])
  const t = useMemo(() => getMessages(locale), [locale])
  const filterParams = useMemo(() => getDeviceFilterParams(pathname), [pathname])

  const { data: serverFilters } = useQuery({
    queryKey: getDeviceFilterQueryKey(filterParams),
    queryFn: () => apiDevice.getFilters(filterParams ?? undefined),
    enabled: Boolean(filterParams),
    staleTime: 5 * 60 * 1000,
  })

  const activeFilters = useMemo<FilterConfig[]>(() => {
    const infoMap = serverFilters?.info ?? {}
    const labels = serverFilters?.infoLabels ?? {}

    return Object.entries(infoMap)
      .map(([key, values]) => ({
        id: key,
        title: labels[key] ?? key,
        options: [...new Set(values.map((value) => value.trim()).filter(Boolean))],
      }))
      .filter((filter) => filter.options.length > 0)
  }, [serverFilters])

  const brands = useMemo(
    () => [...new Set((serverFilters?.brands ?? []).map((item) => item.name.trim()).filter(Boolean))],
    [serverFilters]
  )



  const getSelectedOptions = useCallback(
    (filterId: string) => {
      const rawValue = searchParams.get(`info.${filterId}`)
      if (!rawValue) return new Set<string>()

      return new Set(rawValue.split(',').map((value) => value.trim()).filter(Boolean))
    },
    [searchParams]
  )

  const updateQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value.length > 0) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })

      params.set('page', '1')

      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
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

  const hasActiveFilters = useMemo(() => {
    if (searchParams.has('minPrice') || searchParams.has('maxPrice')) {
      return true
    }

    return [...searchParams.keys()].some((key) => key.startsWith('info.'))
  }, [searchParams])

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete('minPrice')
    params.delete('maxPrice')

    for (const key of [...params.keys()]) {
      if (key.startsWith('info.')) {
        params.delete(key)
      }
    }

    params.set('page', '1')

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const priceRange = useMemo(
    () => ({
      min: serverFilters?.priceRange?.min ?? null,
      max: serverFilters?.priceRange?.max ?? null,
    }),
    [serverFilters]
  )

  const minLimit = priceRange.min ?? 0
  const maxLimit = priceRange.max ?? 0
  const hasPriceRange =
    priceRange.min !== null && priceRange.max !== null && priceRange.max >= priceRange.min

  const initialPrices = useMemo(() => {
    if (!hasPriceRange) {
      return { min: 0, max: 0 }
    }

    const urlMin = parsePriceParam(searchParams.get('minPrice'))
    const urlMax = parsePriceParam(searchParams.get('maxPrice'))

    const min = clamp(urlMin ?? minLimit, minLimit, maxLimit)
    const max = clamp(urlMax ?? maxLimit, minLimit, maxLimit)

    return {
      min: Math.min(min, max),
      max: Math.max(min, max),
    }
  }, [hasPriceRange, maxLimit, minLimit, searchParams])

  const handlePriceChange = useCallback(
    ({ minPrice, maxPrice }: { minPrice: number; maxPrice: number }) => {
      if (!hasPriceRange) {
        return
      }

      const params = new URLSearchParams(searchParams.toString())
      const nextMin = clamp(Math.min(minPrice, maxPrice), minLimit, maxLimit)
      const nextMax = clamp(Math.max(minPrice, maxPrice), minLimit, maxLimit)

      if (nextMin <= minLimit) {
        params.delete('minPrice')
      } else {
        params.set('minPrice', String(nextMin))
      }

      if (nextMax >= maxLimit) {
        params.delete('maxPrice')
      } else {
        params.set('maxPrice', String(nextMax))
      }

      params.set('page', '1')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [hasPriceRange, maxLimit, minLimit, pathname, router, searchParams]
  )

  return {
    activeFilters,
    brands,
    getSelectedOptions,
    hasActiveFilters,
    hasPriceRange,
    initialPrices,
    maxLimit,
    minLimit,
    onToggleOption,
    priceRange,
    clearFilters,
    t,
    updateQueryParams,
    handlePriceChange,
  }
}
