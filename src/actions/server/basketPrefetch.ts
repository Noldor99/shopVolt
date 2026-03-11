import { queryClient } from "@/lib/queryClient"

import { QueryBasketParams, apiBasket } from "../client/basketAction"

export const basketPrefetch = async (params: QueryBasketParams) => {
  const key = ["basket", params ?? {}]
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => apiBasket.getOne(params),
  })
}
