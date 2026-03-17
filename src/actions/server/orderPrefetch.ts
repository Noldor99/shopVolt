import { getServerQueryClient } from '@/lib/queryClient'

import { QueryOrderParams, apiOrder } from '../client/orderAction'

export const orderPrefetch = async (params?: QueryOrderParams) => {
  const queryClient = getServerQueryClient()
  const key = ['order', params ?? {}]
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => apiOrder.getAll(params),
  })
}

export const orderByIdPrefetch = async (id: string | number) => {
  const queryClient = getServerQueryClient()
  const key = ['order', id]
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => apiOrder.getOne(id),
  })
}
