'use client'

import { useQuery } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'

import { apiDevice } from '@/actions/client/deviceAction'

import { getDeviceFilterParams, getDeviceFilterQueryKey } from './shared'

export const useCategoryTotal = () => {
  const pathname = usePathname()
  const filterParams = getDeviceFilterParams(pathname)

  const { data } = useQuery({
    queryKey: getDeviceFilterQueryKey(filterParams),
    queryFn: () => apiDevice.getFilters(filterParams ?? undefined),
    enabled: Boolean(filterParams),
    staleTime: 5 * 60 * 1000,
  })

  return data?.total ?? null
}
