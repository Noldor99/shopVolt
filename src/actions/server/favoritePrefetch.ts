import { getServerQueryClient } from '@/lib/queryClient'

import { apiFavorite } from '../client/favoriteAction'

export const favoritePrefetch = async (userId: string | number) => {
  const queryClient = getServerQueryClient()
  const key = ['favorites', userId]
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => apiFavorite.getAll(userId),
  })
}
