import { queryClient } from "@/lib/queryClient"

import { apiFavorite } from "../client/favoriteAction"

export const favoritePrefetch = async (userId: string | number) => {
  const key = ["favorites", userId]
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => apiFavorite.getAll(userId),
  })
}
