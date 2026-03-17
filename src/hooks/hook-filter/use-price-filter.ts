'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiDevice } from '@/actions/client/deviceAction'
import {
  getLocaleFromPathname,
  getMessages,
  stripLocaleFromPathname
} from '@/lib/i18n'

export const usePriceFilter = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const locale = getLocaleFromPathname(pathname)
  const t = getMessages(locale)
  const cleanPathname = stripLocaleFromPathname(pathname)
  const activeCategorySlug = cleanPathname.split('/category/')[1]?.split('/')[0] ?? ''

  const { data: filters } = useQuery({
    queryKey: ['device-filter', { categorySlug: activeCategorySlug, lang: locale }],
    queryFn: () => apiDevice.getFilters({ categorySlug: activeCategorySlug, lang: locale }),
    enabled: Boolean(activeCategorySlug),
  })

  const minLimit = filters?.priceRange?.min ?? 0
  const maxLimit = filters?.priceRange?.max ?? 10000
  const hasPriceRange = Number.isFinite(minLimit) && Number.isFinite(maxLimit) && maxLimit >= minLimit

  const initialPrices = useMemo(() => {
    const s = searchParams
    const urlMin = s.get('minPrice')
    const urlMax = s.get('maxPrice')

    const min = urlMin ? Math.max(Number(urlMin), minLimit) : minLimit
    const max = urlMax ? Math.min(Number(urlMax), maxLimit) : maxLimit

    return { min, max }
  }, [searchParams, minLimit, maxLimit])

  const handleFilterChange = useCallback(
    ({ minPrice, maxPrice }: { minPrice: number; maxPrice: number }) => {
      const params = new URLSearchParams(searchParams.toString())

      params.set('minPrice', String(minPrice))
      params.set('maxPrice', String(maxPrice))
      params.set('page', '1')

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  return {
    t,
    minLimit,
    maxLimit,
    hasPriceRange,
    initialPrices,
    handleFilterChange,
  }
}