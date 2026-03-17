import { getServerQueryClient } from '@/lib/queryClient'

import { QueryDeviceFilterParams, QueryDeviceParams, apiDevice } from '../client/deviceAction'

export const devicePrefetch = async (params?: QueryDeviceParams) => {
  const queryClient = getServerQueryClient()
  const key = ['device', params ?? {}]
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => apiDevice.getAll(params),
  })
}

export const deviceByIdPrefetch = async (id: string | number) => {
  const queryClient = getServerQueryClient()
  const key = ['device', id]
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => apiDevice.getOne(id),
  })
}

export const deviceFiltersPrefetch = async (params?: QueryDeviceFilterParams) => {
  const queryClient = getServerQueryClient()
  const key = ['device-filter', params ?? {}]
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => apiDevice.getFilters(params),
  })
}
